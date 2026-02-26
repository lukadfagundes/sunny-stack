/**
 * @file Admin Proposals API Route Unit Tests
 * @description Tests for POST, GET, PUT /api/admin/proposals
 */

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

jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    quote: {
      findUnique: jest.fn(),
    },
    proposal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("@/lib/middleware/admin-auth", () => ({
  adminRouteProtection: jest.fn((handler: any) => handler),
}));

jest.mock("@/lib/middleware/auth", () => ({
  withAuth: jest.fn((handler: any) => handler),
}));

const mockGenerateAndSaveProposal = jest.fn();
jest.mock("@/lib/pdf/pdf-generator", () => ({
  generateAndSaveProposal: mockGenerateAndSaveProposal,
}));

const mockSendProposalEmail = jest.fn();
const mockResendProposalEmail = jest.fn();
jest.mock("@/lib/pdf/proposal-email", () => ({
  sendProposalEmail: mockSendProposalEmail,
  resendProposalEmail: mockResendProposalEmail,
}));

jest.mock("@/lib/errors/handler", () => ({
  handleErrorResponse: jest.fn((error: any) => {
    const statusCode = error.statusCode || 500;
    return {
      status: statusCode,
      body: {
        success: false,
        error: {
          message: error.message || "An unexpected error occurred",
          statusCode,
          name: error.name || "Error",
        },
      },
    };
  }),
}));

import { prisma } from "@/lib/db/prisma";

const routeModule = require("@/app/api/admin/proposals/route");
const POST = routeModule.POST;
const GET = routeModule.GET;
const PUT = routeModule.PUT;

function createPostRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

function createGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/proposals");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return { url: url.toString() } as any;
}

function createPutRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

describe("POST /api/admin/proposals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate proposal without sending email", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      projectId: "proj-1",
      email: "client@example.com",
      name: "Client",
    });
    mockGenerateAndSaveProposal.mockResolvedValue({
      id: "prop-1",
      quoteId: "q-1",
      projectId: "proj-1",
    });

    const req = createPostRequest({ quoteId: "q-1" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.proposal.id).toBe("prop-1");
    expect(data.emailSent).toBe(false);
    expect(mockSendProposalEmail).not.toHaveBeenCalled();
  });

  it("should generate proposal and send email when sendEmail is true", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      projectId: "proj-1",
      email: "client@example.com",
      name: "Client",
    });
    mockGenerateAndSaveProposal.mockResolvedValue({
      id: "prop-1",
      quoteId: "q-1",
      projectId: "proj-1",
    });
    mockSendProposalEmail.mockResolvedValue(undefined);

    const req = createPostRequest({ quoteId: "q-1", sendEmail: true });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(true);
    expect(mockSendProposalEmail).toHaveBeenCalledWith(
      "prop-1",
      "client@example.com",
    );
  });

  it("should return partial success when email fails", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      projectId: "proj-1",
      email: "client@example.com",
      name: "Client",
    });
    mockGenerateAndSaveProposal.mockResolvedValue({
      id: "prop-1",
      quoteId: "q-1",
    });
    mockSendProposalEmail.mockRejectedValue(new Error("SMTP error"));

    const req = createPostRequest({ quoteId: "q-1", sendEmail: true });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(false);
    expect(data.emailError).toBe("SMTP error");
  });

  it("should return error when quoteId is missing", async () => {
    const req = createPostRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should return error when quoteId is not a string", async () => {
    const req = createPostRequest({ quoteId: 123 });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should return 404 when quote not found", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createPostRequest({ quoteId: "nonexistent" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it("should return 400 when quote has no project", async () => {
    (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
      id: "q-1",
      projectId: null,
      email: "client@example.com",
      name: "Client",
    });

    const req = createPostRequest({ quoteId: "q-1" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

describe("GET /api/admin/proposals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return proposals for a quote", async () => {
    const mockProposals = [
      {
        id: "prop-1",
        quoteId: "q-1",
        projectId: "proj-1",
        sentAt: null,
        createdAt: new Date(),
      },
    ];
    (prisma.proposal.findMany as jest.Mock).mockResolvedValue(mockProposals);

    const req = createGetRequest({ quoteId: "q-1" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.proposals).toHaveLength(1);
  });

  it("should return error when quoteId is missing", async () => {
    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should return 500 on database error", async () => {
    (prisma.proposal.findMany as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const req = createGetRequest({ quoteId: "q-1" });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe("PUT /api/admin/proposals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should resend proposal email", async () => {
    (prisma.proposal.findUnique as jest.Mock).mockResolvedValue({
      id: "prop-1",
      quote: { email: "client@example.com" },
    });
    mockResendProposalEmail.mockResolvedValue(undefined);

    const req = createPutRequest({ proposalId: "prop-1" });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Proposal email resent successfully");
  });

  it("should return error when proposalId is missing", async () => {
    const req = createPutRequest({});
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("should return 404 when proposal not found", async () => {
    (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createPutRequest({ proposalId: "nonexistent" });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it("should return 500 when resend fails", async () => {
    (prisma.proposal.findUnique as jest.Mock).mockResolvedValue({
      id: "prop-1",
      quote: { email: "client@example.com" },
    });
    mockResendProposalEmail.mockRejectedValue(new Error("SMTP error"));

    const req = createPutRequest({ proposalId: "prop-1" });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
