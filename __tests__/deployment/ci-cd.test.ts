/**
 * CI/CD Deployment Tests
 *
 * Tests CI/CD workflow configuration, build process validation,
 * and deployment automation for GitHub Actions.
 *
 * These tests verify:
 * - GitHub Actions workflow exists and is syntactically valid
 * - Validation scripts run in CI context
 * - Build process executes correctly
 * - Deployment steps are properly configured
 * - Environment variables are validated before deployment
 *
 * @see .github/workflows/ci.yml for CI configuration
 * @see ADR-004: Runtime Environment Validation
 * @see DEPLOYMENT.md for deployment workflow
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { load } from 'js-yaml';

describe('CI/CD Pipeline', () => {
  const rootDir = resolve(__dirname, '../..');
  const ciWorkflowPath = resolve(rootDir, '.github/workflows/ci.yml');
  const packageJsonPath = resolve(rootDir, 'package.json');

  describe('GitHub Actions Workflow', () => {
    it('should have CI workflow file', () => {
      expect(existsSync(ciWorkflowPath)).toBe(true);
    });

    it('should have valid YAML syntax', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Attempt to parse YAML - will throw if invalid
      expect(() => load(ciWorkflow)).not.toThrow();
    });

    it('should trigger on push to main/dev branches', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check trigger configuration
      expect(workflow.on).toBeDefined();
      expect(workflow.on.push).toBeDefined();
      expect(workflow.on.push.branches).toContain('main');
    });

    it('should trigger on pull requests', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check PR trigger
      expect(workflow.on.pull_request).toBeDefined();
    });

    it('should support manual workflow dispatch', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check workflow_dispatch
      expect(workflow.on.workflow_dispatch).toBeDefined();
    });

    it('should use Node.js 18 or higher', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check Node version in env or job steps
      const nodeVersion = workflow.env?.NODE_VERSION;
      expect(nodeVersion).toBeDefined();
      expect(parseInt(nodeVersion, 10)).toBeGreaterThanOrEqual(18);
    });

    it('should have jobs defined', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check for jobs
      expect(workflow.jobs).toBeDefined();
      expect(Object.keys(workflow.jobs).length).toBeGreaterThan(0);
    });
  });

  describe('CI Build Steps', () => {
    it('should checkout code', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for checkout action
      expect(ciWorkflow).toMatch(/actions\/checkout/);
    });

    it('should setup Node.js', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for Node setup action
      expect(ciWorkflow).toMatch(/actions\/setup-node/);
    });

    it('should cache node modules', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for cache action
      expect(ciWorkflow).toMatch(/actions\/cache/);
      expect(ciWorkflow).toMatch(/\.npm/);
    });

    it('should install dependencies', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for dependency installation
      expect(ciWorkflow).toMatch(/npm ci|npm install/);
    });

    it('should run linting', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for linting step
      expect(ciWorkflow).toMatch(/lint|eslint/i);
    });

    it('should run tests', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for test execution
      expect(ciWorkflow).toMatch(/npm test/);
    });

    it('should run security audit', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for security audit
      expect(ciWorkflow).toMatch(/npm audit/);
    });
  });

  describe('Validation Integration', () => {
    it('should have environment validation scripts available', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Check for validation scripts
      expect(scripts['validate:env:pi']).toBeDefined();
      expect(scripts['validate:env:vercel']).toBeDefined();
      expect(scripts['validate:prerequisites']).toBeDefined();
    });

    it('should have validation scripts that use tsx runner', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Validate script implementation
      expect(scripts['validate:env:pi']).toContain('tsx');
      expect(scripts['validate:env:pi']).toContain('validate-env.ts');
    });

    it('should have validate-env.ts script in scripts/', () => {
      const validateEnvPath = resolve(rootDir, 'scripts/validate-env.ts');
      expect(existsSync(validateEnvPath)).toBe(true);
    });

    it('should have validate-prerequisites.sh script in scripts/', () => {
      const validatePrereqPath = resolve(rootDir, 'scripts/validate-prerequisites.sh');
      expect(existsSync(validatePrereqPath)).toBe(true);
    });

    it('should validate environment variables support mode parameter', () => {
      const validateEnvPath = resolve(rootDir, 'scripts/validate-env.ts');
      const validateEnv = readFileSync(validateEnvPath, 'utf-8');

      // Check for mode parameter support
      expect(validateEnv).toMatch(/--mode=/);
      expect(validateEnv).toMatch(/pi|vercel/);
    });

    it('should export validation functions for testing', () => {
      const validateEnvPath = resolve(rootDir, 'scripts/validate-env.ts');
      const validateEnv = readFileSync(validateEnvPath, 'utf-8');

      // Check for exported functions
      expect(validateEnv).toMatch(/export.*validateEnvironment/);
      expect(validateEnv).toMatch(/export.*ValidationResult/);
    });
  });

  describe('Bot Build in CI', () => {
    it('should have bot build script', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Check for bot build script
      expect(scripts['build:bot']).toBeDefined();
    });

    it('should build bot with TypeScript compiler', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Validate bot build uses tsc
      expect(scripts['build:bot']).toContain('tsc');
      expect(scripts['build:bot']).toContain('tsconfig.bot.json');
    });

    it('should have bot type checking script', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Check for type check script
      expect(scripts['build:bot:check']).toBeDefined();
      expect(scripts['build:bot:check']).toContain('--noEmit');
    });
  });

  describe('Artifact Management', () => {
    it('should upload coverage artifacts', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for artifact upload
      expect(ciWorkflow).toMatch(/actions\/upload-artifact/);
      expect(ciWorkflow).toMatch(/coverage/);
    });

    it('should upload security reports', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for security report upload
      expect(ciWorkflow).toMatch(/security-reports|audit/);
    });

    it('should run artifact steps even if tests fail', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Find upload artifact steps
      const jobs = workflow.jobs || {};
      const nodeJob = jobs['node-ci'];

      if (nodeJob && nodeJob.steps) {
        const uploadSteps = nodeJob.steps.filter((step: any) =>
          step.uses?.includes('upload-artifact')
        );

        // Check if any upload step has if: always()
        const hasAlwaysCondition = uploadSteps.some(
          (step: any) => step.if === 'always()'
        );
        expect(hasAlwaysCondition).toBe(true);
      }
    });
  });

  describe('Permissions and Security', () => {
    it('should define workflow permissions', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check for permissions definition
      expect(workflow.permissions).toBeDefined();
    });

    it('should have read-only contents permission', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check contents permission
      expect(workflow.permissions?.contents).toBe('read');
    });

    it('should use specific action versions (not @latest)', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check that actions use specific versions, not @latest
      const actionMatches = ciWorkflow.match(/uses: [^\n]+@[^\n]+/g) || [];

      actionMatches.forEach((match) => {
        expect(match).not.toContain('@latest');
        expect(match).not.toContain('@master');
        expect(match).not.toContain('@main');
      });
    });
  });

  describe('CI Summary Job', () => {
    it('should have CI summary job', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check for summary job
      const jobs = workflow.jobs || {};
      const summaryJob = jobs['ci-summary'];

      expect(summaryJob).toBeDefined();
    });

    it('should run summary job always (even if tests fail)', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check summary job condition
      const jobs = workflow.jobs || {};
      const summaryJob = jobs['ci-summary'];

      if (summaryJob) {
        expect(summaryJob.if).toBe('always()');
      }
    });

    it('should depend on main CI job', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check job dependencies
      const jobs = workflow.jobs || {};
      const summaryJob = jobs['ci-summary'];

      if (summaryJob) {
        expect(summaryJob.needs).toBeDefined();
        expect(summaryJob.needs).toContain('node-ci');
      }
    });

    it('should generate GitHub step summary', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');

      // Check for GITHUB_STEP_SUMMARY usage
      expect(ciWorkflow).toMatch(/GITHUB_STEP_SUMMARY/);
    });
  });

  describe('Environment Variables', () => {
    it('should define NODE_VERSION environment variable', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check for NODE_VERSION in env
      expect(workflow.env?.NODE_VERSION).toBeDefined();
    });

    it('should have cache version for dependency caching', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Check for cache version
      expect(workflow.env?.CACHE_VERSION).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should allow tests to fail without stopping workflow', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Find test steps
      const jobs = workflow.jobs || {};
      const nodeJob = jobs['node-ci'];

      if (nodeJob && nodeJob.steps) {
        const testStep = nodeJob.steps.find((step: any) =>
          step.name?.includes('Test')
        );

        // Check if test step has continue-on-error
        if (testStep) {
          expect(testStep['continue-on-error']).toBe(true);
        }
      }
    });

    it('should allow security audit to fail without stopping workflow', () => {
      const ciWorkflow = readFileSync(ciWorkflowPath, 'utf-8');
      const workflow = load(ciWorkflow) as any;

      // Find security audit step
      const jobs = workflow.jobs || {};
      const nodeJob = jobs['node-ci'];

      if (nodeJob && nodeJob.steps) {
        const auditStep = nodeJob.steps.find((step: any) =>
          step.name?.includes('Security')
        );

        // Check if audit step has continue-on-error
        if (auditStep) {
          expect(auditStep['continue-on-error']).toBe(true);
        }
      }
    });
  });
});
