import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import PostCard from "@/components/about/PostCard";

const mockPost = {
  id: "1",
  imageUrl: "https://cdn.instagram.com/photo1.jpg",
  caption: "Beach day",
  timestamp: "2026-03-20T12:00:00+0000",
  permalink: "https://instagram.com/p/abc",
  likeCount: 42,
  commentsCount: 3,
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("PostCard", () => {
  it("renders image with correct src", () => {
    render(<PostCard post={mockPost} />);

    const img = document.querySelector("img");
    expect(img).toHaveAttribute("src", "https://cdn.instagram.com/photo1.jpg");
  });

  it("displays like count and comment count", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("displays caption text", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("Beach day")).toBeInTheDocument();
  });

  it("links image to Instagram permalink", () => {
    render(<PostCard post={mockPost} />);

    const link = document.querySelector("a");
    expect(link).toHaveAttribute("href", "https://instagram.com/p/abc");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
