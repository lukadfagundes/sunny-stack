/**
 * @file Send Quote API Route Unit Tests
 * @description Tests for POST /api/send-quote
 */

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !init?.status || (init.status >= 200 && init.status < 300),
    })),
  },
}));

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    quote: {
      create: jest.fn(),
    },
  },
}));

// Mock Resend
const mockSend = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

import { prisma } from "@/lib/db/prisma";

// Set env before importing route
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    RESEND_API_KEY: "test-resend-key",
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import route after mocks
const routeModule = require("@/app/api/send-quote/route");
const POST = routeModule.POST;

// Helper to create a mock Request with a unique IP to avoid rate limiting
function createRequest(
  body: any,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost:3000/api/send-quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `unique-ip-${Math.random()}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function validGuidedData() {
  return {
    formType: "guided",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-1234",
    company: "Test Corp",
    projectType: "web-app",
    projectDescription: "A web application for managing tasks",
    features: ["Authentication", "Dashboard", "Reporting"],
    timeline: "3-6 months",
    budget: "$10,000 - $25,000",
  };
}

function validTechnicalData() {
  return {
    formType: "technical",
    contactName: "Jane Smith",
    contactEmail: "jane@example.com",
    contactPhone: "555-5678",
    companyName: "Tech Inc",
    projectName: "TaskMaster Pro",
    projectType: "SaaS Platform",
    projectDescription: "A comprehensive project management tool",
    targetAudience: "Small businesses",
    techStack: "React, Node.js, PostgreSQL",
    features: "User management, project boards, time tracking, reporting",
    integrations: "Slack, GitHub, Jira",
    hostingPreference: "AWS",
    timeline: "6-12 months",
    budget: "$50,000 - $100,000",
    designStatus: "Wireframes ready",
    additionalNotes: "Need mobile-responsive design",
  };
}

describe("POST /api/send-quote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.quote.create as jest.Mock).mockResolvedValue({
      id: "quote-123",
      name: "John Doe",
      email: "john@example.com",
      status: "PENDING",
    });
    mockSend.mockResolvedValue({
      data: { id: "email-123" },
      error: null,
    });
  });

  describe("Guided Form - Success", () => {
    it("should create quote and send email for valid guided form", async () => {
      const req = createRequest(validGuidedData());
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailId).toBe("email-123");
      expect(data.quoteId).toBe("quote-123");
    });

    it("should save guided form data to database", async () => {
      const req = createRequest(validGuidedData());
      await POST(req);

      expect(prisma.quote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
          projectType: "web-app",
          budgetRange: "$10,000 - $25,000",
          timeline: "3-6 months",
          description: "A web application for managing tasks",
          requirements: "Authentication\nDashboard\nReporting",
          status: "PENDING",
        }),
      });
    });

    it("should send email with correct guided form subject and recipient", async () => {
      const req = createRequest(validGuidedData());
      await POST(req);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining("forms@sunny-stack.com"),
          to: ["luka@sunny-stack.com"],
          subject: "New Project Request from John Doe",
          replyTo: "john@example.com",
        }),
      );
    });

    it("should handle guided form without optional fields", async () => {
      const data: any = validGuidedData();
      delete data.phone;
      delete data.company;

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(prisma.quote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phone: null,
          company: null,
        }),
      });
    });
  });

  describe("Technical Form - Success", () => {
    it("should create quote and send email for valid technical form", async () => {
      const req = createRequest(validTechnicalData());
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.emailId).toBe("email-123");
      expect(data.quoteId).toBe("quote-123");
    });

    it("should save technical form data to database", async () => {
      const req = createRequest(validTechnicalData());
      await POST(req);

      expect(prisma.quote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Jane Smith",
          email: "jane@example.com",
          projectType: "SaaS Platform - TaskMaster Pro",
          budgetRange: "$50,000 - $100,000",
          timeline: "6-12 months",
          description: "A comprehensive project management tool",
          status: "PENDING",
        }),
      });
    });

    it("should send email with technical form subject", async () => {
      const req = createRequest(validTechnicalData());
      await POST(req);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Technical Requirements from Jane Smith",
          replyTo: "jane@example.com",
        }),
      );
    });

    it("should handle technical form without optional fields", async () => {
      const data = {
        formType: "technical",
        contactName: "Jane Smith",
        contactEmail: "jane@example.com",
        projectName: "TaskMaster",
        projectType: "SaaS",
        projectDescription: "A project management tool",
        features: "User management, project boards",
        timeline: "3 months",
        budget: "$10,000",
      };

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 for invalid form type", async () => {
      const req = createRequest({ formType: "invalid", name: "Test" });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid form type");
    });

    it("should return 400 for missing guided form required fields", async () => {
      const data = {
        formType: "guided",
        name: "",
        email: "",
        projectType: "",
        projectDescription: "Some description",
        features: [],
        timeline: "",
        budget: "",
      };

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Validation failed");
      expect(responseData.validationErrors).toBeDefined();
      expect(responseData.validationErrors.length).toBeGreaterThan(0);
    });

    it("should return 400 for invalid email in guided form", async () => {
      const data = validGuidedData();
      data.email = "not-an-email";

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "email" })]),
      );
    });

    it("should return 400 for name exceeding 50 characters", async () => {
      const data = validGuidedData();
      data.name = "A".repeat(51);

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });

    it("should return 400 for description exceeding 1000 characters", async () => {
      const data = validGuidedData();
      data.projectDescription = "A".repeat(1001);

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "projectDescription" }),
        ]),
      );
    });

    it("should return 400 for missing technical form required fields", async () => {
      const data = {
        formType: "technical",
        contactName: "",
        contactEmail: "",
        projectName: "",
        projectType: "",
        projectDescription: "",
        features: "",
        timeline: "",
        budget: "",
      };

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Validation failed");
    });

    it("should return 400 for invalid email in technical form", async () => {
      const data = validTechnicalData();
      data.contactEmail = "bad-email";

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "contactEmail" }),
        ]),
      );
    });

    it("should return 400 for company exceeding 50 chars in guided form", async () => {
      const data = validGuidedData();
      data.company = "A".repeat(51);

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "company" })]),
      );
    });

    it("should return 400 for contactName exceeding 50 chars in technical form", async () => {
      const data = validTechnicalData();
      data.contactName = "A".repeat(51);

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "contactName" }),
        ]),
      );
    });
  });

  describe("HTML Sanitization", () => {
    it("should strip HTML tags from guided form name", async () => {
      const data = validGuidedData();
      data.name = '<script>alert("xss")</script>John';

      const req = createRequest(data);
      await POST(req);

      expect(prisma.quote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'alert("xss")John',
        }),
      });
    });

    it("should strip HTML tags from technical form name", async () => {
      const data = validTechnicalData();
      data.contactName = "<b>Jane</b>";

      const req = createRequest(data);
      await POST(req);

      expect(prisma.quote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Jane",
        }),
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      const uniqueIp = `rate-limit-${Date.now()}`;
      const responses = [];
      for (let i = 0; i < 11; i++) {
        const req = createRequest(validGuidedData(), {
          "x-forwarded-for": uniqueIp,
        });
        responses.push(await POST(req));
      }

      const lastResponse = responses[responses.length - 1];
      const lastData = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(lastData.error).toContain("Too many requests");
    });
  });

  describe("Email Sending Failures", () => {
    it("should return 500 when Resend returns no data", async () => {
      mockSend.mockResolvedValue({ data: null, error: "Send failed" });

      const req = createRequest(validGuidedData());
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to send email");
    });

    it("should return 500 when Resend throws an error", async () => {
      mockSend.mockRejectedValue(new Error("Network error"));

      const req = createRequest(validGuidedData());
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to send email");
    });
  });

  describe("Database Errors", () => {
    it("should return 500 when prisma.quote.create fails", async () => {
      (prisma.quote.create as jest.Mock).mockRejectedValue(
        new Error("Database connection failed"),
      );

      const req = createRequest(validGuidedData());
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to send email");
    });
  });

  describe("Edge Cases", () => {
    it("should handle guided form with empty features array", async () => {
      const data = validGuidedData();
      data.features = [];

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it("should handle name at exact 50-char boundary", async () => {
      const data = validGuidedData();
      data.name = "A".repeat(50);

      const req = createRequest(data);
      const response = await POST(req);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    it("should extract IP from x-real-ip header", async () => {
      const req = new Request("http://localhost:3000/api/send-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": `xrealip-${Date.now()}`,
        },
        body: JSON.stringify(validGuidedData()),
      });
      const response = await POST(req);
      expect(response.status).toBe(200);
    });

    it("should extract IP from cf-connecting-ip header", async () => {
      const req = new Request("http://localhost:3000/api/send-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": `cfip-${Date.now()}`,
        },
        body: JSON.stringify(validGuidedData()),
      });
      const response = await POST(req);
      expect(response.status).toBe(200);
    });
  });
});
