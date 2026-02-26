/**
 * @jest-environment node
 */

// __tests__/unit/lib/pdf/proposal-email.test.ts

// Mock prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    proposal: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Resend
jest.mock("resend", () => {
  const sendFn = jest.fn();
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: sendFn,
      },
    })),
    __mockEmailsSend: sendFn,
  };
});

import {
  sendProposalEmail,
  resendProposalEmail,
} from "@/lib/pdf/proposal-email";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

// Retrieve mock references created inside the factories
const { prisma: mockPrisma } = jest.requireMock("@/lib/db/prisma") as {
  prisma: {
    proposal: { findUnique: jest.Mock; update: jest.Mock };
  };
};
const mockProposalFindUnique = mockPrisma.proposal.findUnique;
const mockProposalUpdate = mockPrisma.proposal.update;
const { __mockEmailsSend: mockEmailsSend } = jest.requireMock("resend") as {
  __mockEmailsSend: jest.Mock;
};

describe("proposal-email", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, RESEND_API_KEY: "test-resend-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockProposal = {
    id: "proposal-1",
    quoteId: "quote-1",
    projectId: "project-1",
    pdfUrl: "data:application/pdf;base64,dGVzdC1wZGYtY29udGVudA==",
    sentAt: null,
    quote: {
      id: "quote-1",
      name: "John Doe",
      email: "john@example.com",
      projectType: "webapp",
    },
  };

  // =====================================================================
  // sendProposalEmail
  // =====================================================================
  describe("sendProposalEmail", () => {
    test("sends email with PDF attachment via Resend", async () => {
      mockProposalFindUnique.mockResolvedValue(mockProposal);
      mockEmailsSend.mockResolvedValue({
        data: { id: "email-123" },
        error: null,
      });
      mockProposalUpdate.mockResolvedValue({
        ...mockProposal,
        sentAt: new Date(),
      });

      await sendProposalEmail("proposal-1", "john@example.com");

      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining("Sunny Stack"),
          to: "john@example.com",
          subject: expect.stringContaining("Proposal"),
          html: expect.any(String),
          text: expect.any(String),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: "proposal-proposal-1.pdf",
              content: expect.any(String),
            }),
          ]),
        }),
      );
    });

    test("updates sentAt timestamp after successful send", async () => {
      mockProposalFindUnique.mockResolvedValue(mockProposal);
      mockEmailsSend.mockResolvedValue({
        data: { id: "email-1" },
        error: null,
      });
      mockProposalUpdate.mockResolvedValue({});

      await sendProposalEmail("proposal-1", "john@example.com");

      expect(mockProposalUpdate).toHaveBeenCalledWith({
        where: { id: "proposal-1" },
        data: { sentAt: expect.any(Date) },
      });
    });

    test("throws ValidationError when RESEND_API_KEY is missing", async () => {
      delete process.env.RESEND_API_KEY;

      await expect(
        sendProposalEmail("proposal-1", "john@example.com"),
      ).rejects.toThrow(ValidationError);
    });

    test("throws NotFoundError when proposal does not exist", async () => {
      mockProposalFindUnique.mockResolvedValue(null);

      await expect(
        sendProposalEmail("nonexistent", "john@example.com"),
      ).rejects.toThrow(NotFoundError);
    });

    test("throws ValidationError when proposal has no associated quote", async () => {
      mockProposalFindUnique.mockResolvedValue({
        ...mockProposal,
        quote: null,
      });

      await expect(
        sendProposalEmail("proposal-1", "john@example.com"),
      ).rejects.toThrow(ValidationError);
    });

    test("throws ValidationError for invalid PDF data URL", async () => {
      mockProposalFindUnique.mockResolvedValue({
        ...mockProposal,
        pdfUrl: "not-a-data-url",
      });

      await expect(
        sendProposalEmail("proposal-1", "john@example.com"),
      ).rejects.toThrow(ValidationError);
    });

    test("throws when Resend API returns an error", async () => {
      mockProposalFindUnique.mockResolvedValue(mockProposal);
      mockEmailsSend.mockResolvedValue({
        data: null,
        error: { message: "Rate limit exceeded" },
      });

      await expect(
        sendProposalEmail("proposal-1", "john@example.com"),
      ).rejects.toThrow("Resend API error");
    });

    test("email HTML contains client name and project title", async () => {
      mockProposalFindUnique.mockResolvedValue(mockProposal);
      mockEmailsSend.mockResolvedValue({
        data: { id: "email-1" },
        error: null,
      });
      mockProposalUpdate.mockResolvedValue({});

      await sendProposalEmail("proposal-1", "john@example.com");

      const sendCall = mockEmailsSend.mock.calls[0][0];
      expect(sendCall.html).toContain("John Doe");
      expect(sendCall.html).toContain("webapp");
      expect(sendCall.text).toContain("John Doe");
    });

    test("email includes replyTo address", async () => {
      mockProposalFindUnique.mockResolvedValue(mockProposal);
      mockEmailsSend.mockResolvedValue({
        data: { id: "email-1" },
        error: null,
      });
      mockProposalUpdate.mockResolvedValue({});

      await sendProposalEmail("proposal-1", "john@example.com");

      const sendCall = mockEmailsSend.mock.calls[0][0];
      expect(sendCall.replyTo).toBe("luka@sunny-stack.com");
    });
  });

  // =====================================================================
  // resendProposalEmail
  // =====================================================================
  describe("resendProposalEmail", () => {
    test("sends to provided recipient email", async () => {
      mockProposalFindUnique.mockResolvedValue(mockProposal);
      mockEmailsSend.mockResolvedValue({
        data: { id: "email-2" },
        error: null,
      });
      mockProposalUpdate.mockResolvedValue({});

      await resendProposalEmail("proposal-1", "alt@example.com");

      const sendCall = mockEmailsSend.mock.calls[0][0];
      expect(sendCall.to).toBe("alt@example.com");
    });

    test("falls back to quote email when no recipient specified", async () => {
      // First call for resendProposalEmail lookup
      mockProposalFindUnique
        .mockResolvedValueOnce(mockProposal)
        // Second call for sendProposalEmail
        .mockResolvedValueOnce(mockProposal);
      mockEmailsSend.mockResolvedValue({
        data: { id: "email-3" },
        error: null,
      });
      mockProposalUpdate.mockResolvedValue({});

      await resendProposalEmail("proposal-1");

      const sendCall = mockEmailsSend.mock.calls[0][0];
      expect(sendCall.to).toBe("john@example.com");
    });

    test("throws NotFoundError when proposal has no quote", async () => {
      mockProposalFindUnique.mockResolvedValue({
        ...mockProposal,
        quote: null,
      });

      await expect(resendProposalEmail("proposal-1")).rejects.toThrow(
        NotFoundError,
      );
    });

    test("throws NotFoundError when proposal does not exist", async () => {
      mockProposalFindUnique.mockResolvedValue(null);

      await expect(resendProposalEmail("nonexistent")).rejects.toThrow();
    });
  });
});
