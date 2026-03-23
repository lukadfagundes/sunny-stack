import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import CommentThread from "@/components/about/CommentThread";

const mockComments = [
  {
    id: "c1",
    text: "Great photo!",
    username: "user1",
    likeCount: 3,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    replies: [
      {
        id: "r1",
        text: "Thanks!",
        username: "strawhatluka",
        likeCount: 1,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
      },
    ],
  },
  {
    id: "c2",
    text: "Nice shot",
    username: "user2",
    likeCount: 0,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3d ago
    replies: [],
  },
];

describe("CommentThread", () => {
  it("shows loading skeletons when loading", () => {
    render(<CommentThread comments={[]} loading={true} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows 'No comments' when empty and not loading", () => {
    render(<CommentThread comments={[]} loading={false} />);

    expect(screen.getByText("No comments")).toBeInTheDocument();
  });

  it("renders comments with username and text", () => {
    render(<CommentThread comments={mockComments} loading={false} />);

    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("Great photo!")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
    expect(screen.getByText("Nice shot")).toBeInTheDocument();
  });

  it("renders threaded replies under parent comment", () => {
    render(<CommentThread comments={mockComments} loading={false} />);

    expect(screen.getByText("strawhatluka")).toBeInTheDocument();
    expect(screen.getByText("Thanks!")).toBeInTheDocument();

    // Reply should be indented (ml-8 class)
    const replyText = screen.getByText("Thanks!");
    const replyContainer = replyText.closest(".ml-8");
    expect(replyContainer).toBeInTheDocument();
  });

  it("displays like count when greater than zero", () => {
    render(<CommentThread comments={mockComments} loading={false} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("displays relative timestamps", () => {
    render(<CommentThread comments={mockComments} loading={false} />);

    expect(screen.getByText("2h")).toBeInTheDocument();
    expect(screen.getByText("3d")).toBeInTheDocument();
  });
});
