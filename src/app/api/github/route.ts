import { NextResponse } from "next/server";

export interface GitHubProfile {
  avatarUrl: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  lastPushedAt: string | null;
}

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_USERNAME = "strawhatluka";

const QUERY = `
query GitHubProfileCard($username: String!) {
  user(login: $username) {
    avatarUrl(size: 200)
    name
    bio
    location
    repositories(first: 1, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes { pushedAt }
    }
  }
}
`;

export async function GET() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { username: GITHUB_USERNAME },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[github/profile] API responded", res.status);
      return NextResponse.json(null, { status: 200 });
    }

    const json = await res.json();

    if (json.errors) {
      console.error("[github/profile] GraphQL errors:", json.errors);
      return NextResponse.json(null, { status: 200 });
    }

    const user = json.data.user;
    const result: GitHubProfile = {
      avatarUrl: user.avatarUrl ?? "",
      name: user.name ?? null,
      bio: user.bio ?? null,
      location: user.location ?? null,
      lastPushedAt: user.repositories?.nodes?.[0]?.pushedAt ?? null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[github/profile] Fetch failed:", error);
    return NextResponse.json(null, { status: 200 });
  }
}
