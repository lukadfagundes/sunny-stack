/**
 * @jest-environment node
 */

// __tests__/unit/lib/pdf/proposal-template.test.ts

// Mock jsPDF
const mockText = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetFont = jest.fn();
const mockSetTextColor = jest.fn();
const mockSetDrawColor = jest.fn();
const mockSetLineWidth = jest.fn();
const mockLine = jest.fn();
const mockGetTextWidth = jest.fn().mockReturnValue(40);
const mockSplitTextToSize = jest
  .fn()
  .mockImplementation((text: string) => [text]);
const mockAddPage = jest.fn();
const mockOutput = jest.fn().mockReturnValue(new ArrayBuffer(100));

jest.mock("jspdf", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      internal: { pageSize: { height: 297, width: 210 } },
      text: mockText,
      setFontSize: mockSetFontSize,
      setFont: mockSetFont,
      setTextColor: mockSetTextColor,
      setDrawColor: mockSetDrawColor,
      setLineWidth: mockSetLineWidth,
      line: mockLine,
      getTextWidth: mockGetTextWidth,
      splitTextToSize: mockSplitTextToSize,
      addPage: mockAddPage,
      output: mockOutput,
    })),
  };
});

import {
  createProposalTemplate,
  ProposalData,
} from "@/lib/pdf/proposal-template";

function makeProposalData(overrides: Partial<ProposalData> = {}): ProposalData {
  return {
    clientName: "John Doe",
    clientEmail: "john@example.com",
    projectTitle: "E-commerce Website",
    projectDescription:
      "Build a modern e-commerce platform with product catalog and checkout.",
    timeline: "3 months",
    budget: {
      items: [
        { description: "Frontend Development", amount: 5000 },
        { description: "Backend Development", amount: 8000 },
      ],
      total: 13000,
    },
    terms: "Payment Terms: 50% upfront, 50% upon completion.",
    validUntil: new Date("2026-04-01"),
    ...overrides,
  };
}

describe("proposal-template", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProposalTemplate", () => {
    test("returns a jsPDF document instance", () => {
      const doc = createProposalTemplate(makeProposalData());
      expect(doc).toBeDefined();
      expect(doc.text).toBeDefined();
      expect(doc.addPage).toBeDefined();
    });

    test("renders SUNNY STACK branding on cover page", () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("SUNNY STACK");
      expect(allTextCalls).toContain("PROJECT PROPOSAL");
    });

    test("renders client name and email", () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("John Doe");
      expect(allTextCalls).toContain("john@example.com");
    });

    test("renders project title", () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("E-commerce Website");
    });

    test('renders "Prepared for:" label', () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("Prepared for:");
    });

    test("renders valid until date", () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      const validLine = allTextCalls.find(
        (t: string) => typeof t === "string" && t.includes("Valid Until:"),
      );
      expect(validLine).toBeDefined();
    });

    test("adds pages for content sections", () => {
      createProposalTemplate(makeProposalData());
      // At least one addPage call for page 2 (project scope)
      expect(mockAddPage).toHaveBeenCalled();
    });

    test("renders project description", () => {
      createProposalTemplate(makeProposalData());

      expect(mockSplitTextToSize).toHaveBeenCalledWith(
        expect.stringContaining("Build a modern e-commerce platform"),
        expect.any(Number),
      );
    });

    test("renders timeline information", () => {
      createProposalTemplate(makeProposalData());

      expect(mockSplitTextToSize).toHaveBeenCalledWith(
        expect.stringContaining("3 months"),
        expect.any(Number),
      );
    });

    test("renders budget items", () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("Frontend Development");
      expect(allTextCalls).toContain("Backend Development");
    });

    test("renders budget total", () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("Total:");
    });

    test("renders terms and conditions", () => {
      createProposalTemplate(makeProposalData());

      expect(mockSplitTextToSize).toHaveBeenCalledWith(
        expect.stringContaining("50% upfront"),
        expect.any(Number),
      );
    });

    test("renders agreement section with signature lines", () => {
      createProposalTemplate(makeProposalData());

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("Client Signature:");
      expect(allTextCalls).toContain("Sunny Stack Representative:");
      expect(allTextCalls).toContain("Name: Luka Fagundes");
    });

    test("renders client name in signature section", () => {
      createProposalTemplate(makeProposalData({ clientName: "Jane Smith" }));

      const allTextCalls = mockText.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(allTextCalls).toContain("Name: Jane Smith");
    });

    test("uses primary color for headings", () => {
      createProposalTemplate(makeProposalData());

      // Primary color is [255, 153, 0] (Sunny Stack orange)
      expect(mockSetTextColor).toHaveBeenCalledWith(255, 153, 0);
    });

    test("draws separator lines", () => {
      createProposalTemplate(makeProposalData());

      expect(mockLine).toHaveBeenCalled();
      expect(mockSetDrawColor).toHaveBeenCalled();
    });
  });
});
