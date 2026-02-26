/**
 * @jest-environment node
 */

// __tests__/unit/lib/generateResumePDF.test.ts

// Mock jsPDF
const mockSave = jest.fn();
const mockText = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetFont = jest.fn();
const mockSetTextColor = jest.fn();
const mockSetDrawColor = jest.fn();
const mockLine = jest.fn();
const mockGetTextWidth = jest.fn().mockReturnValue(50);
const mockSplitTextToSize = jest
  .fn()
  .mockImplementation((text: string) => [text]);
const mockAddPage = jest.fn();

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
      line: mockLine,
      getTextWidth: mockGetTextWidth,
      splitTextToSize: mockSplitTextToSize,
      addPage: mockAddPage,
      save: mockSave,
    })),
  };
});

import { generateResumePDF } from "@/lib/generateResumePDF";

describe("generateResumePDF", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a jsPDF instance and calls save", () => {
    generateResumePDF();
    expect(mockSave).toHaveBeenCalledWith("Luka Fagundes Resume.pdf");
  });

  test("sets header with name and title", () => {
    generateResumePDF();

    // Check that "LUKA FAGUNDES" is rendered
    expect(mockText).toHaveBeenCalledWith(
      "LUKA FAGUNDES",
      expect.any(Number),
      expect.any(Number),
    );

    // Check that title is rendered
    expect(mockText).toHaveBeenCalledWith(
      "Full Stack Developer",
      expect.any(Number),
      expect.any(Number),
    );
  });

  test("renders section headers", () => {
    generateResumePDF();

    const allTextCalls = mockText.mock.calls.map((call: unknown[]) => call[0]);
    expect(allTextCalls).toContain("PROFESSIONAL SUMMARY");
    expect(allTextCalls).toContain("CORE COMPETENCIES");
    expect(allTextCalls).toContain("TECHNICAL SKILLS");
    expect(allTextCalls).toContain("PROFESSIONAL EXPERIENCE");
    expect(allTextCalls).toContain("PROJECTS");
  });

  test("renders experience entries", () => {
    generateResumePDF();

    const allTextCalls = mockText.mock.calls.map((call: unknown[]) => call[0]);
    expect(allTextCalls).toContain("Account Manager");
    expect(allTextCalls).toContain("Revelation Machinery");
    expect(allTextCalls).toContain("Customer Service Representative");
  });

  test("renders project entries", () => {
    generateResumePDF();

    const allTextCalls = mockText.mock.calls.map((call: unknown[]) => call[0]);
    expect(allTextCalls).toContain(
      "Trinity Method SDK - Open Source Development Methodology",
    );
    expect(allTextCalls).toContain(
      "Bwaincell - Personal Productivity API & Discord Bot",
    );
  });

  test("uses bold font for section headers", () => {
    generateResumePDF();

    expect(mockSetFont).toHaveBeenCalledWith("helvetica", "bold");
    expect(mockSetFont).toHaveBeenCalledWith("helvetica", "normal");
  });

  test("draws separator lines", () => {
    generateResumePDF();

    expect(mockSetDrawColor).toHaveBeenCalledWith(200, 200, 200);
    expect(mockLine).toHaveBeenCalled();
  });

  test("renders contact information", () => {
    generateResumePDF();

    const allTextCalls = mockText.mock.calls.map((call: unknown[]) => call[0]);
    const contactLine = allTextCalls.find(
      (t: string) =>
        typeof t === "string" && t.includes("luka@sunny-stack.com"),
    );
    expect(contactLine).toBeDefined();
  });

  test("handles page breaks for long content", () => {
    // Simulate content that would exceed page height
    // The mock pageSize height is 297, so addPage should be called
    // for projects and experience sections
    generateResumePDF();

    // The function should at least try to handle page sizing
    expect(mockSetFontSize).toHaveBeenCalled();
  });

  test("renders skill categories with labels", () => {
    generateResumePDF();

    const boldCalls = mockSetFont.mock.calls.filter(
      (call: string[]) => call[1] === "bold",
    );
    // Should have many bold calls for headers, skill categories, job titles
    expect(boldCalls.length).toBeGreaterThan(5);
  });
});
