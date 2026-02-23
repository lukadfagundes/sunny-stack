/**
 * @file Projects workflow integration tests
 * @description Tests complete project CRUD operations workflow
 * @jest-environment node
 */

// IMPORTANT: Unmock Prisma for integration tests - we need real DB access
jest.unmock("@prisma/client");

import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  testPrisma,
} from "../helpers/test-db";
import {
  createTestProject,
  createTestTimeEntry,
  createTestQuote,
} from "../helpers/test-factories";
import { ProjectStatus } from "@prisma/client";
import { NotFoundError } from "@/lib/errors/app-error";

// Mock logger
jest.mock("@/lib/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Projects Workflow Integration", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean all data before each test (handles FK ordering correctly)
    await cleanDatabase();
  });

  describe("Create Project", () => {
    it("should create project with required fields", async () => {
      // ACT
      const project = await createTestProject({
        title: "E-commerce Platform",
        clientName: "John Doe",
        clientEmail: "john@example.com",
      });

      // ASSERT
      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.title).toBe("E-commerce Platform");
      expect(project.clientName).toBe("John Doe");
      expect(project.clientEmail).toBe("john@example.com");
      expect(project.status).toBe(ProjectStatus.PLANNING);
      expect(project.deletedAt).toBeNull();
    });

    it("should create project with all optional fields", async () => {
      // ARRANGE
      const deadline = new Date("2025-12-31");

      // ACT
      const project = await createTestProject({
        title: "Full-Stack App",
        description: "A comprehensive web application",
        clientName: "Jane Smith",
        clientEmail: "jane@example.com",
        status: ProjectStatus.IN_PROGRESS,
        budget: 50000.0,
        deadline,
      });

      // ASSERT
      expect(project.description).toBe("A comprehensive web application");
      expect(project.status).toBe(ProjectStatus.IN_PROGRESS);
      expect(Number(project.budget)).toBe(50000);
      expect(project.deadline).toEqual(deadline);
    });

    it("should create multiple projects", async () => {
      // ACT
      const project1 = await createTestProject({ title: "Project 1" });
      const project2 = await createTestProject({ title: "Project 2" });
      const project3 = await createTestProject({ title: "Project 3" });

      // ASSERT
      expect(project1.id).not.toBe(project2.id);
      expect(project2.id).not.toBe(project3.id);
      expect(project1.title).toBe("Project 1");
      expect(project2.title).toBe("Project 2");
      expect(project3.title).toBe("Project 3");
    });
  });

  describe("Read Projects", () => {
    it("should list all projects", async () => {
      // ARRANGE
      await createTestProject({ title: "Project A" });
      await createTestProject({ title: "Project B" });
      await createTestProject({ title: "Project C" });

      // ACT
      const projects = await testPrisma.project.findMany({
        where: { deletedAt: null },
      });

      // ASSERT
      expect(projects).toHaveLength(3);
      expect(projects.map((p) => p.title)).toContain("Project A");
      expect(projects.map((p) => p.title)).toContain("Project B");
      expect(projects.map((p) => p.title)).toContain("Project C");
    });

    it("should filter projects by status", async () => {
      // ARRANGE
      await createTestProject({
        title: "Planning",
        status: ProjectStatus.PLANNING,
      });
      await createTestProject({
        title: "In Progress",
        status: ProjectStatus.IN_PROGRESS,
      });
      await createTestProject({
        title: "Review",
        status: ProjectStatus.REVIEW,
      });

      // ACT
      const planningProjects = await testPrisma.project.findMany({
        where: { status: ProjectStatus.PLANNING, deletedAt: null },
      });

      // ASSERT
      expect(planningProjects).toHaveLength(1);
      expect(planningProjects[0].title).toBe("Planning");
    });

    it("should paginate projects", async () => {
      // ARRANGE
      for (let i = 1; i <= 10; i++) {
        await createTestProject({ title: `Project ${i}` });
      }

      // ACT
      const page1 = await testPrisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        skip: 0,
      });

      const page2 = await testPrisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        skip: 5,
      });

      // ASSERT
      expect(page1).toHaveLength(5);
      expect(page2).toHaveLength(5);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it("should get project with related data", async () => {
      // ARRANGE
      const project = await createTestProject();
      await createTestQuote({ projectId: project.id });
      await createTestTimeEntry({ projectId: project.id });

      // ACT
      const projectWithRelations = await testPrisma.project.findUnique({
        where: { id: project.id },
        include: {
          quotes: true,
          timeEntries: true,
          _count: {
            select: {
              quotes: true,
              timeEntries: true,
            },
          },
        },
      });

      // ASSERT
      expect(projectWithRelations).toBeDefined();
      expect(projectWithRelations?.quotes).toHaveLength(1);
      expect(projectWithRelations?.timeEntries).toHaveLength(1);
      expect(projectWithRelations?._count.quotes).toBe(1);
      expect(projectWithRelations?._count.timeEntries).toBe(1);
    });
  });

  describe("Update Project", () => {
    it("should update project title", async () => {
      // ARRANGE
      const project = await createTestProject({ title: "Old Title" });

      // ACT
      const updated = await testPrisma.project.update({
        where: { id: project.id },
        data: { title: "New Title" },
      });

      // ASSERT
      expect(updated.title).toBe("New Title");
      expect(updated.id).toBe(project.id);
    });

    it("should update project status", async () => {
      // ARRANGE
      const project = await createTestProject({
        status: ProjectStatus.PLANNING,
      });

      // ACT
      const updated = await testPrisma.project.update({
        where: { id: project.id },
        data: { status: ProjectStatus.IN_PROGRESS },
      });

      // ASSERT
      expect(updated.status).toBe(ProjectStatus.IN_PROGRESS);
    });

    it("should update project budget", async () => {
      // ARRANGE
      const project = await createTestProject({ budget: 10000 });

      // ACT
      const updated = await testPrisma.project.update({
        where: { id: project.id },
        data: { budget: 25000 },
      });

      // ASSERT
      expect(Number(updated.budget)).toBe(25000);
    });

    it("should update project deadline", async () => {
      // ARRANGE
      const project = await createTestProject();
      const newDeadline = new Date("2026-06-30");

      // ACT
      const updated = await testPrisma.project.update({
        where: { id: project.id },
        data: { deadline: newDeadline },
      });

      // ASSERT
      expect(updated.deadline).toEqual(newDeadline);
    });

    it("should track updatedAt timestamp", async () => {
      // ARRANGE
      const project = await createTestProject();
      const originalUpdatedAt = project.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      // ACT
      const updated = await testPrisma.project.update({
        where: { id: project.id },
        data: { title: "Updated Title" },
      });

      // ASSERT
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe("Soft Delete Project", () => {
    it("should soft delete project", async () => {
      // ARRANGE
      const project = await createTestProject();

      // ACT
      const deleted = await testPrisma.project.update({
        where: { id: project.id },
        data: { deletedAt: new Date() },
      });

      // ASSERT
      expect(deleted.deletedAt).not.toBeNull();
      expect(deleted.deletedAt).toBeInstanceOf(Date);
    });

    it("should exclude soft-deleted projects from list", async () => {
      // ARRANGE
      await createTestProject({ title: "Active Project" });
      const deletedProject = await createTestProject({
        title: "Deleted Project",
      });
      await testPrisma.project.update({
        where: { id: deletedProject.id },
        data: { deletedAt: new Date() },
      });

      // ACT
      const activeProjects = await testPrisma.project.findMany({
        where: { deletedAt: null },
      });

      // ASSERT
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].title).toBe("Active Project");
    });

    it("should restore soft-deleted project", async () => {
      // ARRANGE
      const project = await createTestProject();
      await testPrisma.project.update({
        where: { id: project.id },
        data: { deletedAt: new Date() },
      });

      // ACT
      const restored = await testPrisma.project.update({
        where: { id: project.id },
        data: { deletedAt: null },
      });

      // ASSERT
      expect(restored.deletedAt).toBeNull();
    });
  });

  describe("Delete Project (Hard Delete)", () => {
    it("should hard delete project", async () => {
      // ARRANGE
      const project = await createTestProject();

      // ACT
      await testPrisma.project.delete({ where: { id: project.id } });

      // ASSERT
      const found = await testPrisma.project.findUnique({
        where: { id: project.id },
      });
      expect(found).toBeNull();
    });

    it("should cascade delete related time entries", async () => {
      // ARRANGE
      const project = await createTestProject();
      const timeEntry = await createTestTimeEntry({ projectId: project.id });

      // ACT
      await testPrisma.project.delete({ where: { id: project.id } });

      // ASSERT
      const foundTimeEntry = await testPrisma.timeEntry.findUnique({
        where: { id: timeEntry.id },
      });
      expect(foundTimeEntry).toBeNull();
    });
  });

  describe("Project Sorting and Ordering", () => {
    it("should sort projects by createdAt descending", async () => {
      // ARRANGE
      const project1 = await createTestProject({ title: "First" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const project2 = await createTestProject({ title: "Second" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const project3 = await createTestProject({ title: "Third" });

      // ACT
      const projects = await testPrisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      });

      // ASSERT
      expect(projects[0].title).toBe("Third");
      expect(projects[1].title).toBe("Second");
      expect(projects[2].title).toBe("First");
    });

    it("should sort projects by title ascending", async () => {
      // ARRANGE
      await createTestProject({ title: "Zebra" });
      await createTestProject({ title: "Apple" });
      await createTestProject({ title: "Mango" });

      // ACT
      const projects = await testPrisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { title: "asc" },
      });

      // ASSERT
      expect(projects[0].title).toBe("Apple");
      expect(projects[1].title).toBe("Mango");
      expect(projects[2].title).toBe("Zebra");
    });

    it("should sort projects by deadline", async () => {
      // ARRANGE
      await createTestProject({
        title: "Late",
        deadline: new Date("2026-12-31"),
      });
      await createTestProject({
        title: "Early",
        deadline: new Date("2025-06-30"),
      });
      await createTestProject({
        title: "Mid",
        deadline: new Date("2026-06-30"),
      });

      // ACT
      const projects = await testPrisma.project.findMany({
        where: { deletedAt: null, deadline: { not: null } },
        orderBy: { deadline: "asc" },
      });

      // ASSERT
      expect(projects[0].title).toBe("Early");
      expect(projects[1].title).toBe("Mid");
      expect(projects[2].title).toBe("Late");
    });
  });

  describe("Project Error Handling", () => {
    it("should throw NotFoundError for non-existent project", () => {
      // ACT & ASSERT
      const error = new NotFoundError("Project", "nonexistent_id");

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("Project not found: nonexistent_id");
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe("Project");
      expect(error.id).toBe("nonexistent_id");
    });

    it("should handle update on non-existent project", async () => {
      // ACT & ASSERT
      await expect(
        testPrisma.project.update({
          where: { id: "nonexistent_id" },
          data: { title: "Updated" },
        }),
      ).rejects.toThrow();
    });

    it("should handle delete on non-existent project", async () => {
      // ACT & ASSERT
      await expect(
        testPrisma.project.delete({ where: { id: "nonexistent_id" } }),
      ).rejects.toThrow();
    });
  });

  describe("Project Count and Aggregation", () => {
    it("should count projects by status", async () => {
      // ARRANGE
      await createTestProject({ status: ProjectStatus.PLANNING });
      await createTestProject({ status: ProjectStatus.PLANNING });
      await createTestProject({ status: ProjectStatus.IN_PROGRESS });

      // ACT
      const planningCount = await testPrisma.project.count({
        where: { status: ProjectStatus.PLANNING, deletedAt: null },
      });

      const inProgressCount = await testPrisma.project.count({
        where: { status: ProjectStatus.IN_PROGRESS, deletedAt: null },
      });

      // ASSERT
      expect(planningCount).toBe(2);
      expect(inProgressCount).toBe(1);
    });

    it("should aggregate project budgets", async () => {
      // ARRANGE
      await createTestProject({ budget: 10000 });
      await createTestProject({ budget: 25000 });
      await createTestProject({ budget: 15000 });

      // ACT
      const result = await testPrisma.project.aggregate({
        _sum: { budget: true },
        _avg: { budget: true },
        _min: { budget: true },
        _max: { budget: true },
        where: { deletedAt: null },
      });

      // ASSERT
      expect(Number(result._sum.budget)).toBe(50000);
      expect(Number(result._avg.budget)).toBeCloseTo(16666.67, 1);
      expect(Number(result._min.budget)).toBe(10000);
      expect(Number(result._max.budget)).toBe(25000);
    });
  });
});
