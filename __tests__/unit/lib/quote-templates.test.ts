// __tests__/unit/lib/quote-templates.test.ts
import {
  generateTechnicalDocument,
  formatGuidedEmailHtml,
  formatTechnicalEmailHtml,
  getTimelineLabel,
  getBudgetLabel,
  getProjectTypeLabel,
  downloadMarkdownFile,
  downloadTechnicalTemplate,
} from "@/lib/quote-templates";
import type { GuidedFormData, TechnicalFormData } from "@/lib/quote-types";

function makeGuidedFormData(
  overrides: Partial<GuidedFormData> = {},
): GuidedFormData {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "555-123-4567",
    company: "Acme Corp",
    projectType: "webapp",
    projectDescription: "Build an admin dashboard",
    features: ["Authentication", "Dashboard", "Reports"],
    timeline: "3months",
    budget: "10k-25k",
    hasDesign: "yes",
    needsBackend: "yes",
    needsAuth: "yes",
    integrations: "Stripe",
    specialRequirements: "HIPAA",
    ...overrides,
  };
}

function makeTechnicalFormData(
  overrides: Partial<TechnicalFormData> = {},
): TechnicalFormData {
  return {
    contactName: "John Smith",
    contactEmail: "john@example.com",
    contactPhone: "555-987-6543",
    companyName: "TechCo",
    projectName: "Project Phoenix",
    projectType: "webapp",
    projectDescription: "A complex SaaS platform",
    targetAudience: "Enterprise users",
    primaryGoals: "Increase productivity",
    techStack: "React, Node.js, PostgreSQL",
    hostingPreference: "AWS",
    budget: "25k+",
    timeline: "flexible",
    features: "Real-time updates, Search, Analytics",
    integrations: "Salesforce, HubSpot",
    designStatus: "Design completed",
    additionalNotes: "Need WCAG 2.1 compliance",
    ...overrides,
  };
}

describe("quote-templates", () => {
  describe("generateTechnicalDocument", () => {
    test("returns a non-empty markdown string", () => {
      const result = generateTechnicalDocument();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("contains expected section headers", () => {
      const doc = generateTechnicalDocument();
      expect(doc).toContain("# Technical Requirements Document");
      expect(doc).toContain("## 1. Contact Information");
      expect(doc).toContain("## 2. Project Overview");
      expect(doc).toContain("## 3. Technical Requirements");
      expect(doc).toContain("## 4. Design & User Experience");
      expect(doc).toContain("## 5. Infrastructure & Deployment");
      expect(doc).toContain("## 6. Project Logistics");
      expect(doc).toContain("## 7. Additional Information");
    });

    test("includes Sunny Stack contact details", () => {
      const doc = generateTechnicalDocument();
      expect(doc).toContain("luka@sunny-stack.com");
      expect(doc).toContain("sunny-stack.com");
      expect(doc).toContain("Luka Fagundes");
    });

    test("includes submission next steps", () => {
      const doc = generateTechnicalDocument();
      expect(doc).toContain("Send to luka@sunny-stack.com");
      expect(doc).toContain("Schedule a consultation call");
    });
  });

  describe("formatGuidedEmailHtml", () => {
    test("includes contact information fields", () => {
      const html = formatGuidedEmailHtml(makeGuidedFormData());
      expect(html).toContain("Jane Doe");
      expect(html).toContain("jane@example.com");
      expect(html).toContain("Acme Corp");
    });

    test("includes project details", () => {
      const html = formatGuidedEmailHtml(makeGuidedFormData());
      expect(html).toContain("webapp");
      expect(html).toContain("Build an admin dashboard");
    });

    test("renders features as list items", () => {
      const html = formatGuidedEmailHtml(makeGuidedFormData());
      expect(html).toContain("<li>Authentication</li>");
      expect(html).toContain("<li>Dashboard</li>");
      expect(html).toContain("<li>Reports</li>");
    });

    test("includes timeline and budget", () => {
      const html = formatGuidedEmailHtml(makeGuidedFormData());
      expect(html).toContain("3months");
      expect(html).toContain("10k-25k");
    });

    test('shows "Not provided" when company is empty', () => {
      const html = formatGuidedEmailHtml(makeGuidedFormData({ company: "" }));
      expect(html).toContain("Not provided");
    });

    test("contains guided form attribution", () => {
      const html = formatGuidedEmailHtml(makeGuidedFormData());
      expect(html).toContain("guided form on sunny-stack.com");
    });

    test("handles empty features array", () => {
      const html = formatGuidedEmailHtml(makeGuidedFormData({ features: [] }));
      expect(html).toContain("<ul>");
      expect(html).not.toContain("<li>");
    });
  });

  describe("formatTechnicalEmailHtml", () => {
    test("includes contact information", () => {
      const html = formatTechnicalEmailHtml(makeTechnicalFormData());
      expect(html).toContain("John Smith");
      expect(html).toContain("john@example.com");
      expect(html).toContain("TechCo");
    });

    test("includes project overview", () => {
      const html = formatTechnicalEmailHtml(makeTechnicalFormData());
      expect(html).toContain("Project Phoenix");
      expect(html).toContain("A complex SaaS platform");
      expect(html).toContain("Enterprise users");
    });

    test("includes technical requirements", () => {
      const html = formatTechnicalEmailHtml(makeTechnicalFormData());
      expect(html).toContain("React, Node.js, PostgreSQL");
      expect(html).toContain("Real-time updates, Search, Analytics");
      expect(html).toContain("Salesforce, HubSpot");
      expect(html).toContain("AWS");
    });

    test("includes project logistics", () => {
      const html = formatTechnicalEmailHtml(makeTechnicalFormData());
      expect(html).toContain("flexible");
      expect(html).toContain("25k+");
      expect(html).toContain("Design completed");
    });

    test("shows default text for empty optional fields", () => {
      const html = formatTechnicalEmailHtml(
        makeTechnicalFormData({
          companyName: "",
          targetAudience: "",
          techStack: "",
          integrations: "",
          hostingPreference: "",
          designStatus: "",
          additionalNotes: "",
        }),
      );
      expect(html).toContain("Not provided");
      expect(html).toContain("Not specified");
      expect(html).toContain("No preference");
      expect(html).toContain("None specified");
      expect(html).toContain("None");
    });

    test("contains technical form attribution", () => {
      const html = formatTechnicalEmailHtml(makeTechnicalFormData());
      expect(html).toContain("technical form on sunny-stack.com");
    });
  });

  describe("getTimelineLabel", () => {
    test("returns correct label for known keys", () => {
      expect(getTimelineLabel("asap")).toBe("ASAP");
      expect(getTimelineLabel("1month")).toBe("Within 1 month");
      expect(getTimelineLabel("3months")).toBe("Within 3 months");
      expect(getTimelineLabel("flexible")).toBe("Flexible timeline");
    });

    test("returns the raw key for unknown values", () => {
      expect(getTimelineLabel("6months")).toBe("6months");
      expect(getTimelineLabel("")).toBe("");
    });
  });

  describe("getBudgetLabel", () => {
    test("returns correct label for known keys", () => {
      expect(getBudgetLabel("under5k")).toBe("Under $5,000");
      expect(getBudgetLabel("5k-10k")).toBe("$5,000 - $10,000");
      expect(getBudgetLabel("10k-25k")).toBe("$10,000 - $25,000");
      expect(getBudgetLabel("25k+")).toBe("$25,000+");
    });

    test("returns the raw key for unknown values", () => {
      expect(getBudgetLabel("50k+")).toBe("50k+");
      expect(getBudgetLabel("")).toBe("");
    });
  });

  describe("getProjectTypeLabel", () => {
    test("returns correct label for known keys", () => {
      expect(getProjectTypeLabel("website")).toBe("Website");
      expect(getProjectTypeLabel("webapp")).toBe("Web Application");
      expect(getProjectTypeLabel("desktop")).toBe("Desktop Application");
      expect(getProjectTypeLabel("mobile")).toBe("Mobile Application");
      expect(getProjectTypeLabel("ecommerce")).toBe("E-Commerce Platform");
      expect(getProjectTypeLabel("other")).toBe("Other");
    });

    test("returns the raw key for unknown values", () => {
      expect(getProjectTypeLabel("api")).toBe("api");
      expect(getProjectTypeLabel("")).toBe("");
    });
  });

  describe("downloadMarkdownFile", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("creates a blob, link, and triggers download", () => {
      const mockClick = jest.fn();
      const mockLink = { href: "", download: "", click: mockClick };
      jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink as unknown as HTMLElement);
      jest.spyOn(document.body, "appendChild").mockImplementation(jest.fn());
      jest.spyOn(document.body, "removeChild").mockImplementation(jest.fn());
      global.URL.createObjectURL = jest.fn().mockReturnValue("blob:mock-url");
      global.URL.revokeObjectURL = jest.fn();

      downloadMarkdownFile("# Hello", "test.md");

      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockLink.href).toBe("blob:mock-url");
      expect(mockLink.download).toBe("test.md");
      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("downloadTechnicalTemplate", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("triggers download with correct filename", () => {
      const mockClick = jest.fn();
      const mockLink = { href: "", download: "", click: mockClick };
      jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink as unknown as HTMLElement);
      jest.spyOn(document.body, "appendChild").mockImplementation(jest.fn());
      jest.spyOn(document.body, "removeChild").mockImplementation(jest.fn());
      global.URL.createObjectURL = jest.fn().mockReturnValue("blob:url");
      global.URL.revokeObjectURL = jest.fn();

      downloadTechnicalTemplate();

      expect(mockLink.download).toBe("sunny-stack-technical-requirements.md");
      expect(mockClick).toHaveBeenCalled();
    });
  });
});
