import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  reporters: [["default", { summaryThreshold: 0 }]],
  moduleNameMapper: {
    "^mermaid$": "<rootDir>/tests/helpers/__mocks__/mermaid.ts",
    "^rehype-raw$": "<rootDir>/tests/helpers/__mocks__/rehype-raw.ts",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/types.ts",
    "!src/lib/data/personal.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

export default createJestConfig(config);
