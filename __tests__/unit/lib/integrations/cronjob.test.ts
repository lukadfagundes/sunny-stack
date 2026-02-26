/**
 * @jest-environment node
 */
/**
 * @file cron-job.org API Integration Unit Tests
 * @description Tests for cron-job.org API client: authentication, job listing,
 * execution history, failed execution filtering, and status summary.
 */

jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.CRONJOB_API_KEY = "test-cronjob-key";
  (global.fetch as jest.Mock) = jest.fn();
});

afterAll(() => {
  process.env = originalEnv;
});

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    json: jest.fn().mockResolvedValue(data),
  };
}

function mockErrorResponse(status = 403, statusText = "Forbidden") {
  return {
    ok: false,
    status,
    statusText,
    text: jest.fn().mockResolvedValue("Forbidden"),
    json: jest.fn(),
  };
}

const recentDate = new Date(Date.now() - 1000).toISOString();
const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

const sampleJobs = [
  {
    jobId: 1,
    title: "Health Check",
    url: "https://example.com/health",
    enabled: true,
    schedule: {
      timezone: "UTC",
      hours: [0],
      mdays: [-1],
      minutes: [0],
      months: [-1],
      wdays: [-1],
    },
    lastExecution: {
      date: recentDate,
      duration: 150,
      httpStatus: 200,
      status: "OK",
    },
    nextExecution: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    jobId: 2,
    title: "Backup Job",
    url: "https://example.com/backup",
    enabled: true,
    schedule: {
      timezone: "UTC",
      hours: [3],
      mdays: [-1],
      minutes: [0],
      months: [-1],
      wdays: [-1],
    },
    lastExecution: {
      date: recentDate,
      duration: 5000,
      httpStatus: 500,
      status: "FAILED",
    },
    nextExecution: new Date(Date.now() + 7200000).toISOString(),
  },
  {
    jobId: 3,
    title: "Disabled Job",
    url: "https://example.com/disabled",
    enabled: false,
    schedule: {
      timezone: "UTC",
      hours: [0],
      mdays: [-1],
      minutes: [0],
      months: [-1],
      wdays: [-1],
    },
    lastExecution: null,
    nextExecution: null,
  },
];

const sampleExecutionsJob1 = [
  {
    executionId: 101,
    jobId: 1,
    date: recentDate,
    duration: 150,
    httpStatus: 200,
    status: "OK",
    statusText: "OK",
  },
];

const sampleExecutionsJob2 = [
  {
    executionId: 201,
    jobId: 2,
    date: recentDate,
    duration: 5000,
    httpStatus: 500,
    status: "FAILED",
    statusText: "Internal Server Error",
  },
  {
    executionId: 202,
    jobId: 2,
    date: oldDate,
    duration: 4500,
    httpStatus: 500,
    status: "FAILED",
    statusText: "Internal Server Error",
  },
];

describe("CronJob Integration", () => {
  describe("cronjobRequest (via exported functions)", () => {
    it("should throw when CRONJOB_API_KEY is not set", async () => {
      delete process.env.CRONJOB_API_KEY;
      const { getCronJobHealth } = await import("@/lib/integrations/cronjob");
      await expect(getCronJobHealth()).rejects.toThrow(
        "CRONJOB_API_KEY not configured",
      );
    });

    it("should call fetch with correct Bearer auth header", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ email: "test@example.com" }),
      );
      const { getCronJobHealth } = await import("@/lib/integrations/cronjob");
      await getCronJobHealth();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.cron-job.org/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-cronjob-key",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should throw on non-ok HTTP response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockErrorResponse(401, "Unauthorized"),
      );
      const { getCronJobHealth } = await import("@/lib/integrations/cronjob");
      await expect(getCronJobHealth()).rejects.toThrow(
        "cron-job.org API error: 401 Unauthorized",
      );
    });
  });

  describe("getCronJobHealth", () => {
    it("should return authenticated status and email", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ email: "admin@example.com" }),
      );
      const { getCronJobHealth } = await import("@/lib/integrations/cronjob");
      const result = await getCronJobHealth();
      expect(result).toEqual({
        authenticated: true,
        email: "admin@example.com",
      });
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Health error"));
      const { getCronJobHealth } = await import("@/lib/integrations/cronjob");
      const logger = (await import("@/lib/logger")).default;
      await expect(getCronJobHealth()).rejects.toThrow("Health error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to get cron-job.org health:",
        expect.any(Error),
      );
    });
  });

  describe("getCronJobs", () => {
    it("should return jobs array", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ jobs: sampleJobs }),
      );
      const { getCronJobs } = await import("@/lib/integrations/cronjob");
      expect(await getCronJobs()).toEqual(sampleJobs);
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Jobs error"));
      const { getCronJobs } = await import("@/lib/integrations/cronjob");
      await expect(getCronJobs()).rejects.toThrow("Jobs error");
    });
  });

  describe("getJobExecutions", () => {
    it("should return execution history for a specific job", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ history: sampleExecutionsJob1 }),
      );
      const { getJobExecutions } = await import("@/lib/integrations/cronjob");
      const result = await getJobExecutions(1, 5);
      expect(result).toEqual(sampleExecutionsJob1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.cron-job.org/jobs/1/history?limit=5",
        expect.any(Object),
      );
    });

    it("should use default limit of 10", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ history: [] }),
      );
      const { getJobExecutions } = await import("@/lib/integrations/cronjob");
      await getJobExecutions(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.any(Object),
      );
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Executions error"),
      );
      const { getJobExecutions } = await import("@/lib/integrations/cronjob");
      await expect(getJobExecutions(1)).rejects.toThrow("Executions error");
    });
  });

  describe("getFailedJobExecutions", () => {
    it("should return only FAILED executions from last 24 hours with job context", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse({ jobs: sampleJobs }))
        .mockResolvedValueOnce(
          mockJsonResponse({ history: sampleExecutionsJob1 }),
        )
        .mockResolvedValueOnce(
          mockJsonResponse({ history: sampleExecutionsJob2 }),
        )
        .mockResolvedValueOnce(mockJsonResponse({ history: [] }));

      const { getFailedJobExecutions } =
        await import("@/lib/integrations/cronjob");
      const result = await getFailedJobExecutions();
      // Only the recent FAILED execution from job 2 (executionId: 201)
      expect(result).toHaveLength(1);
      expect(result[0].executionId).toBe(201);
      expect(result[0].job.title).toBe("Backup Job");
    });

    it("should return empty array when no failures exist", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse({ jobs: [sampleJobs[0]] }))
        .mockResolvedValueOnce(
          mockJsonResponse({ history: sampleExecutionsJob1 }),
        );

      const { getFailedJobExecutions } =
        await import("@/lib/integrations/cronjob");
      expect(await getFailedJobExecutions()).toEqual([]);
    });

    it("should handle execution fetch failure for individual jobs gracefully", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse({ jobs: sampleJobs }))
        .mockResolvedValueOnce(mockErrorResponse(500, "Server Error"))
        .mockResolvedValueOnce(
          mockJsonResponse({ history: sampleExecutionsJob2 }),
        )
        .mockResolvedValueOnce(mockJsonResponse({ history: [] }));

      const { getFailedJobExecutions } =
        await import("@/lib/integrations/cronjob");
      const result = await getFailedJobExecutions();
      expect(result).toHaveLength(1);
      expect(result[0].executionId).toBe(201);
    });

    it("should log and rethrow on top-level error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Failed execs error"),
      );
      const { getFailedJobExecutions } =
        await import("@/lib/integrations/cronjob");
      await expect(getFailedJobExecutions()).rejects.toThrow(
        "Failed execs error",
      );
    });
  });

  describe("getCronJobStatusSummary", () => {
    it("should aggregate health, jobs, and failed executions", async () => {
      (global.fetch as jest.Mock)
        // getCronJobHealth -> /user
        .mockResolvedValueOnce(mockJsonResponse({ email: "admin@example.com" }))
        // getCronJobs -> /jobs
        .mockResolvedValueOnce(mockJsonResponse({ jobs: sampleJobs }))
        // getFailedJobExecutions -> getCronJobs -> /jobs
        .mockResolvedValueOnce(mockJsonResponse({ jobs: sampleJobs }))
        // getFailedJobExecutions -> getJobExecutions for job 1
        .mockResolvedValueOnce(
          mockJsonResponse({ history: sampleExecutionsJob1 }),
        )
        // getFailedJobExecutions -> getJobExecutions for job 2
        .mockResolvedValueOnce(
          mockJsonResponse({ history: sampleExecutionsJob2 }),
        )
        // getFailedJobExecutions -> getJobExecutions for job 3
        .mockResolvedValueOnce(mockJsonResponse({ history: [] }));

      const { getCronJobStatusSummary } =
        await import("@/lib/integrations/cronjob");
      const result = await getCronJobStatusSummary();

      expect(result.health).toEqual({
        authenticated: true,
        email: "admin@example.com",
      });
      expect(result.jobs.total).toBe(3);
      expect(result.jobs.enabled).toBe(2);
      expect(result.jobs.disabled).toBe(1);
      expect(result.jobs.recentlyFailed).toBe(1);
      expect(result.jobs.failedExecutions).toBe(1);
      expect(result.jobs.jobList).toHaveLength(3);
      expect(result.jobs.failedList).toHaveLength(1);
      expect(result.jobs.failedList[0].jobTitle).toBe("Backup Job");
    });

    it("should include job details in jobList", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse({ email: "admin@example.com" }))
        .mockResolvedValueOnce(mockJsonResponse({ jobs: [sampleJobs[0]] }))
        .mockResolvedValueOnce(mockJsonResponse({ jobs: [sampleJobs[0]] }))
        .mockResolvedValueOnce(
          mockJsonResponse({ history: sampleExecutionsJob1 }),
        );

      const { getCronJobStatusSummary } =
        await import("@/lib/integrations/cronjob");
      const result = await getCronJobStatusSummary();
      const job = result.jobs.jobList[0];
      expect(job.id).toBe(1);
      expect(job.title).toBe("Health Check");
      expect(job.url).toBe("https://example.com/health");
      expect(job.enabled).toBe(true);
      expect(job.lastExecution).toEqual({
        date: recentDate,
        status: "OK",
        httpStatus: 200,
        duration: 150,
      });
      expect(job.nextExecution).toBeDefined();
    });

    it("should handle jobs with no lastExecution", async () => {
      const jobsWithoutExec = [sampleJobs[2]];
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse({ email: "admin@example.com" }))
        .mockResolvedValueOnce(mockJsonResponse({ jobs: jobsWithoutExec }))
        .mockResolvedValueOnce(mockJsonResponse({ jobs: jobsWithoutExec }))
        .mockResolvedValueOnce(mockJsonResponse({ history: [] }));

      const { getCronJobStatusSummary } =
        await import("@/lib/integrations/cronjob");
      const result = await getCronJobStatusSummary();
      expect(result.jobs.recentlyFailed).toBe(0);
      expect(result.jobs.jobList[0].lastExecution).toBeNull();
    });

    it("should log and rethrow on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Summary error"));
      const { getCronJobStatusSummary } =
        await import("@/lib/integrations/cronjob");
      const logger = (await import("@/lib/logger")).default;
      await expect(getCronJobStatusSummary()).rejects.toThrow("Summary error");
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
