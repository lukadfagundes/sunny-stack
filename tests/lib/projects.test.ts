import {
  getAllProjects,
  getProjectsByCategory,
  getProjectById,
} from "@/lib/data/projects";

describe("getAllProjects", () => {
  it("returns all projects", () => {
    const projects = getAllProjects();
    expect(projects.length).toBeGreaterThan(0);
  });

  it("every project has required fields", () => {
    const projects = getAllProjects();
    for (const p of projects) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(["professional", "personal", "contribution"]).toContain(p.category);
      expect(Array.isArray(p.techStack)).toBe(true);
      expect(p.techStack.length).toBeGreaterThan(0);
      expect(Array.isArray(p.features)).toBe(true);
      expect(Array.isArray(p.links)).toBe(true);
      expect(["active", "archived", "proprietary"]).toContain(p.status);
    }
  });

  it("all projects have unique IDs", () => {
    const projects = getAllProjects();
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getProjectsByCategory", () => {
  it("returns only professional projects", () => {
    const projects = getProjectsByCategory("professional");
    expect(projects.length).toBeGreaterThan(0);
    projects.forEach((p) => expect(p.category).toBe("professional"));
  });

  it("returns only personal projects", () => {
    const projects = getProjectsByCategory("personal");
    expect(projects.length).toBeGreaterThan(0);
    projects.forEach((p) => expect(p.category).toBe("personal"));
  });

  it("returns only contribution projects", () => {
    const projects = getProjectsByCategory("contribution");
    expect(projects.length).toBeGreaterThan(0);
    projects.forEach((p) => expect(p.category).toBe("contribution"));
  });
});

describe("getProjectById", () => {
  it("returns a project for a valid ID", () => {
    const project = getProjectById("trinity-sdk");
    expect(project).toBeDefined();
    expect(project!.title).toBe("Trinity Method SDK");
  });

  it("returns undefined for an invalid ID", () => {
    const project = getProjectById("nonexistent-id");
    expect(project).toBeUndefined();
  });
});
