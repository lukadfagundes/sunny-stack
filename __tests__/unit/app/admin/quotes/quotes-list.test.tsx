/**
 * @file QuotesListPage Unit Tests
 * @description Tests for the admin quotes list page component
 *
 * Covers: loading state, data rendering, error handling, retry,
 * status filtering, empty state, approve/decline/convert actions.
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// Override the global next/navigation mock from jest.setup.js to capture router.push calls
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    reload: jest.fn(),
    pathname: "/admin/quotes",
    query: {},
    asPath: "/admin/quotes",
  }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => "/admin/quotes",
}));

jest.mock("@/components/admin/QuoteCard", () => ({
  QuoteCard: ({ quote, onApprove, onDecline, onConvert }: any) => (
    <div data-testid={`quote-${quote.id}`}>
      <span>{quote.projectType}</span>
      <span data-testid={`status-${quote.id}`}>{quote.status}</span>
      <button onClick={() => onApprove?.(quote.id)}>approve</button>
      <button onClick={() => onDecline?.(quote.id)}>decline</button>
      <button onClick={() => onConvert?.(quote.id)}>convert</button>
    </div>
  ),
}));

jest.mock("@/components/admin/Skeletons", () => ({
  ListSkeleton: () => <div data-testid="list-skeleton" />,
}));

import QuotesListPage from "@/app/admin/quotes/page";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockQuotes = [
  {
    id: "q1",
    projectType: "Web App",
    status: "PENDING",
    createdAt: "2026-01-01",
  },
  {
    id: "q2",
    projectType: "Mobile App",
    status: "APPROVED",
    createdAt: "2026-01-02",
  },
  {
    id: "q3",
    projectType: "API Service",
    status: "DECLINED",
    createdAt: "2026-01-03",
  },
  {
    id: "q4",
    projectType: "Dashboard",
    status: "CONVERTED",
    createdAt: "2026-01-04",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchSuccess(data: any) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
}

function mockFetchFailure(message = "Server error") {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: message }),
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("QuotesListPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockPush.mockClear();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  it("shows loading skeleton initially", () => {
    // Fetch never resolves during this assertion
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<QuotesListPage />);

    expect(screen.getByTestId("list-skeleton")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Successful data fetch
  // -----------------------------------------------------------------------

  it("renders quotes after successful fetch", async () => {
    mockFetchSuccess({ quotes: mockQuotes });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
      expect(screen.getByTestId("quote-q2")).toBeInTheDocument();
      expect(screen.getByTestId("quote-q3")).toBeInTheDocument();
      expect(screen.getByTestId("quote-q4")).toBeInTheDocument();
    });

    expect(screen.getByText("Web App")).toBeInTheDocument();
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------

  it("shows error state on fetch failure", async () => {
    mockFetchFailure();

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Retry
  // -----------------------------------------------------------------------

  it("retry button re-fetches quotes", async () => {
    // First call fails
    mockFetchFailure();

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    // Second call succeeds
    mockFetchSuccess({ quotes: mockQuotes });

    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });

    // Verify fetch was called a second time (retry triggered the re-fetch)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Both calls should target the quotes endpoint
    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/admin/quotes");
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/admin/quotes");
  });

  // -----------------------------------------------------------------------
  // Status filtering
  // -----------------------------------------------------------------------

  it("filters quotes by PENDING status", async () => {
    mockFetchSuccess({ quotes: mockQuotes });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
    });

    // Click the Pending filter button
    fireEvent.click(screen.getByText("Pending"));

    // Only PENDING quote should remain visible
    expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
    expect(screen.queryByTestId("quote-q2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("quote-q3")).not.toBeInTheDocument();
    expect(screen.queryByTestId("quote-q4")).not.toBeInTheDocument();
  });

  it("shows all quotes when All filter is selected", async () => {
    mockFetchSuccess({ quotes: mockQuotes });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
    });

    // Filter to Pending first
    fireEvent.click(screen.getByText("Pending"));
    expect(screen.queryByTestId("quote-q2")).not.toBeInTheDocument();

    // Go back to All
    fireEvent.click(screen.getByText("All"));
    expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
    expect(screen.getByTestId("quote-q2")).toBeInTheDocument();
    expect(screen.getByTestId("quote-q3")).toBeInTheDocument();
    expect(screen.getByTestId("quote-q4")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  it("shows empty state when no quotes exist", async () => {
    mockFetchSuccess({ quotes: [] });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("No quotes yet")).toBeInTheDocument();
    });
  });

  it("shows filtered empty state when no quotes match filter", async () => {
    // Only PENDING quote
    mockFetchSuccess({ quotes: [mockQuotes[0]] });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
    });

    // Filter to APPROVED -- no quotes match
    fireEvent.click(screen.getByText("Approved"));

    expect(screen.getByText("No approved quotes")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // handleApprove
  // -----------------------------------------------------------------------

  it("updates quote status locally on approve", async () => {
    mockFetchSuccess({ quotes: mockQuotes });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
    });

    // Mock the PATCH response for approve
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await act(async () => {
      const approveButtons = screen.getAllByText("approve");
      fireEvent.click(approveButtons[0]); // Approve q1
    });

    await waitFor(() => {
      expect(screen.getByTestId("status-q1")).toHaveTextContent("APPROVED");
    });

    // Verify fetch was called with correct PATCH payload
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/quotes/q1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      }),
    );
  });

  // -----------------------------------------------------------------------
  // handleDecline
  // -----------------------------------------------------------------------

  it("updates quote status locally on decline", async () => {
    mockFetchSuccess({ quotes: mockQuotes });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote-q1")).toBeInTheDocument();
    });

    // Mock the PATCH response for decline
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await act(async () => {
      const declineButtons = screen.getAllByText("decline");
      fireEvent.click(declineButtons[0]); // Decline q1
    });

    await waitFor(() => {
      expect(screen.getByTestId("status-q1")).toHaveTextContent("DECLINED");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/quotes/q1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "DECLINED" }),
      }),
    );
  });

  // -----------------------------------------------------------------------
  // handleConvert
  // -----------------------------------------------------------------------

  it("navigates to project page on successful convert", async () => {
    mockFetchSuccess({ quotes: mockQuotes });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("quote-q2")).toBeInTheDocument();
    });

    // Mock the POST response for convert (returns project with id)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ project: { id: "proj-123" } }),
    });

    await act(async () => {
      const convertButtons = screen.getAllByText("convert");
      fireEvent.click(convertButtons[1]); // Convert q2 (second card's convert button)
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/projects/proj-123");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/quotes/q2/convert",
      expect.objectContaining({ method: "POST" }),
    );
  });

  // -----------------------------------------------------------------------
  // Render header
  // -----------------------------------------------------------------------

  it("renders page heading and description", async () => {
    mockFetchSuccess({ quotes: [] });

    await act(async () => {
      render(<QuotesListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Quotes")).toBeInTheDocument();
      expect(
        screen.getByText("Manage incoming quote requests"),
      ).toBeInTheDocument();
    });
  });
});
