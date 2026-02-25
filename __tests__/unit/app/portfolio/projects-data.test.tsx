/**
 * Unit Tests for Portfolio Projects Data
 *
 * Validates all project entries have required fields, correct structure,
 * unique IDs, and valid URLs.
 */

import {
  personalProjects,
  professionalProjects,
} from "@/app/portfolio/projects-data";
import { ProjectData } from "@/components/portfolio/ProjectModal";

const allProjects = [...personalProjects, ...professionalProjects];

describe("Portfolio Projects Data", () => {
  describe("Array Exports", () => {
    test("personalProjects is a non-empty array", () => {
      expect(Array.isArray(personalProjects)).toBe(true);
      expect(personalProjects.length).toBeGreaterThan(0);
    });

    test("professionalProjects is a non-empty array", () => {
      expect(Array.isArray(professionalProjects)).toBe(true);
      expect(professionalProjects.length).toBeGreaterThan(0);
    });
  });

  describe("Required Fields", () => {
    test.each(allProjects.map((p) => [p.id, p]))(
      "%s has required fields",
      (_id, project) => {
        const p = project as ProjectData;
        expect(p.id).toBeTruthy();
        expect(typeof p.id).toBe("string");
        expect(p.title).toBeTruthy();
        expect(typeof p.title).toBe("string");
        expect(p.description).toBeTruthy();
        expect(typeof p.description).toBe("string");
        expect(p.icon).toBeDefined();
      },
    );
  });

  describe("Unique IDs", () => {
    test("all project IDs are unique across both arrays", () => {
      const ids = allProjects.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Key Features Structure", () => {
    const projectsWithFeatures = allProjects.filter((p) => p.keyFeatures);

    test.each(projectsWithFeatures.map((p) => [p.id, p]))(
      "%s has valid keyFeatures structure",
      (_id, project) => {
        const p = project as ProjectData;
        expect(p.keyFeatures!.title).toBeTruthy();
        expect(Array.isArray(p.keyFeatures!.items)).toBe(true);
        expect(p.keyFeatures!.items.length).toBeGreaterThan(0);

        p.keyFeatures!.items.forEach((item) => {
          expect(item.label).toBeTruthy();
          expect(item.description).toBeTruthy();
        });
      },
    );
  });

  describe("Call to Action Structure", () => {
    const projectsWithCTA = allProjects.filter((p) => p.callToAction);

    test.each(projectsWithCTA.map((p) => [p.id, p]))(
      "%s has valid callToAction structure",
      (_id, project) => {
        const p = project as ProjectData;
        expect(p.callToAction!.title).toBeTruthy();
        expect(p.callToAction!.description).toBeTruthy();
        expect(Array.isArray(p.callToAction!.techStack)).toBe(true);
        expect(p.callToAction!.techStack.length).toBeGreaterThan(0);
        expect(Array.isArray(p.callToAction!.links)).toBe(true);
      },
    );
  });

  describe("Link URLs", () => {
    const urlPattern = /^https?:\/\/.+/;

    test.each(allProjects.map((p) => [p.id, p]))(
      "%s has valid link URLs",
      (_id, project) => {
        const p = project as ProjectData;

        if (p.callToAction?.links) {
          p.callToAction.links.forEach((link) => {
            expect(link.label).toBeTruthy();
            expect(link.url).toMatch(urlPattern);
          });
        }

        if (p.externalLinks) {
          p.externalLinks.forEach((link) => {
            expect(link.label).toBeTruthy();
            expect(link.url).toMatch(urlPattern);
          });
        }
      },
    );
  });

  describe("Trinity Method SDK Entry", () => {
    const trinitySdk = professionalProjects.find((p) => p.id === "trinity-sdk");

    test("exists in professional projects", () => {
      expect(trinitySdk).toBeDefined();
    });

    test("mentions 18 agents in description", () => {
      expect(trinitySdk!.description).toContain("18");
    });

    test("has NPM link", () => {
      const npmLink = trinitySdk!.callToAction!.links.find((l) =>
        l.url.includes("npmjs.com"),
      );
      expect(npmLink).toBeDefined();
      expect(npmLink!.url).toBe(
        "https://www.npmjs.com/package/trinity-method-sdk",
      );
    });

    test("has GitHub link", () => {
      const ghLink = trinitySdk!.callToAction!.links.find((l) =>
        l.url.includes("github.com"),
      );
      expect(ghLink).toBeDefined();
    });

    test("footer has correct CLI command", () => {
      expect(trinitySdk!.footer).toContain("npx trinity-method-sdk deploy");
    });
  });

  describe("Cola Records Entry", () => {
    const colaRecords = professionalProjects.find(
      (p) => p.id === "cola-records",
    );

    test("exists in professional projects", () => {
      expect(colaRecords).toBeDefined();
    });

    test("has GitHub and Download links", () => {
      const links = colaRecords!.callToAction!.links;
      expect(
        links.some((l) =>
          l.url.includes("github.com/lukadfagundes/cola-records"),
        ),
      ).toBe(true);
      expect(links.some((l) => l.url.includes("/releases"))).toBe(true);
    });
  });

  describe("Hytale Server Manager Entry", () => {
    const hytale = personalProjects.find(
      (p) => p.id === "hytale-server-manager",
    );

    test("exists in personal projects", () => {
      expect(hytale).toBeDefined();
    });

    test("has GitHub and Download links", () => {
      const links = hytale!.callToAction!.links;
      expect(
        links.some((l) =>
          l.url.includes("github.com/lukadfagundes/hytale-server-manager"),
        ),
      ).toBe(true);
      expect(links.some((l) => l.url.includes("/releases"))).toBe(true);
    });
  });
});
