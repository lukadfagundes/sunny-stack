/**
 * @file Service Health Checker Unit Tests
 * @description Tests for service health monitoring, batch operations, and alert creation
 */

import { prisma } from '@/lib/db/prisma';
import {
  runServiceHealthChecks,
  startServiceHealthMonitoring,
  stopServiceHealthMonitoring,
} from '@/lib/monitoring/service-health-checker';
import { MONITORED_SERVICES } from '@/lib/monitoring/config';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    serviceHealthCheck: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
    },
    monitoringAlert: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Service Health Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkService (via runServiceHealthChecks)', () => {
    it('should mark service as operational for fast successful response', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            serviceName: expect.any(String),
            status: 'operational',
            responseTime: expect.any(Number),
          }),
        ]),
      });
    });

    it('should mark service as degraded for slow successful response', async () => {
      // Arrange - Mock slow response (>2 seconds)
      // Use real timers for this test to properly simulate delay
      jest.useRealTimers();

      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, status: 200 });
          }, 2500);
        })
      );

      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert
      const createManyCall = (prisma.serviceHealthCheck.createMany as jest.Mock).mock.calls[0][0];
      const hasDegradedService = createManyCall.data.some(
        (service: any) => service.status === 'degraded' && service.responseTime >= 2000
      );
      expect(hasDegradedService).toBe(true);
    });

    it('should mark service as down for failed response', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            status: 'down',
          }),
        ]),
      });
    });

    it('should mark service as down on network error', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            status: 'down',
            responseTime: null,
            statusCode: null,
          }),
        ]),
      });
    });

    it('should handle abort signal for timeout', async () => {
      // Arrange - Mock fetch that rejects with abort error
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert - Should be marked as down when aborted
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            status: 'down',
            responseTime: null,
          }),
        ]),
      });
    });
  });

  describe('Alert Creation', () => {
    it('should create CRITICAL alert when service goes down', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
      });

      // Mock previous status as operational
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Fly.io',
        status: 'operational',
      });

      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });
      (prisma.monitoringAlert.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert
      expect(prisma.monitoringAlert.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            severity: 'CRITICAL',
            type: 'ERROR',
            source: expect.any(String),
            message: expect.stringContaining('changed from operational to down'),
          }),
        ]),
      });
    });

    it('should create WARNING alert when service becomes degraded', async () => {
      // Arrange - Use real timers to properly simulate delay
      jest.useRealTimers();

      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, status: 200 }), 2500);
        })
      );

      // Mock previous status as operational
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Cloudflare',
        status: 'operational',
      });

      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });
      (prisma.monitoringAlert.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      // Act
      await runServiceHealthChecks();

      // Assert
      expect(prisma.monitoringAlert.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            severity: 'WARNING',
            type: 'UPTIME_CHECK',
            message: expect.stringContaining('degraded'),
          }),
        ]),
      });
    });

    it('should create INFO alert when service recovers from down', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      // Mock previous status as down
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Vercel',
        status: 'down',
      });

      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });
      (prisma.monitoringAlert.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert
      expect(prisma.monitoringAlert.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            severity: 'INFO',
            type: 'UPTIME_CHECK',
            message: expect.stringContaining('changed from down to operational'),
          }),
        ]),
      });
    });

    it('should NOT create alert when status unchanged', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      // Mock previous status as operational (same as new status)
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Fly.io',
        status: 'operational',
      });

      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert - Should NOT create any alerts
      expect(prisma.monitoringAlert.createMany).not.toHaveBeenCalled();
    });

    it('should NOT create alert on first check (no previous status)', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      // Mock no previous status (first check)
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert - Should NOT create any alerts on first run
      expect(prisma.monitoringAlert.createMany).not.toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should save all health checks in single createMany call', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Should be exactly ONE createMany call with all services
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining(
          MONITORED_SERVICES.map((service) =>
            expect.objectContaining({
              serviceName: service.name,
              endpoint: service.endpoint,
              status: expect.any(String),
            })
          )
        ),
      });
    });

    it('should fetch previous statuses in parallel', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const findFirstMock = prisma.serviceHealthCheck.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue({ serviceName: 'test', status: 'operational' });

      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      await runServiceHealthChecks();

      // Assert - Should call findFirst for each service
      expect(findFirstMock).toHaveBeenCalledTimes(MONITORED_SERVICES.length);
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start monitoring with 5-minute interval', () => {
      // Arrange
      jest.useFakeTimers();
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      // Act
      startServiceHealthMonitoring();

      // Assert
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000 // 5 minutes
      );

      // Cleanup
      jest.useRealTimers();
    });

    it('should run immediate health check on start', async () => {
      // Arrange
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      startServiceHealthMonitoring();

      // Wait for microtasks to flush (the immediate health check is async)
      await Promise.resolve();

      // Assert - Should have made fetch calls immediately
      expect(global.fetch).toHaveBeenCalled();

      // Cleanup
      stopServiceHealthMonitoring();
      jest.useRealTimers();
    });

    it('should clear existing interval when restarting monitoring', () => {
      // Arrange
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      startServiceHealthMonitoring();

      // Act - Start again
      startServiceHealthMonitoring();

      // Assert - Should clear previous interval
      expect(clearIntervalSpy).toHaveBeenCalled();

      // Cleanup
      jest.useRealTimers();
    });

    it('should stop monitoring and clear interval', () => {
      // Arrange
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      startServiceHealthMonitoring();

      // Act
      stopServiceHealthMonitoring();

      // Assert
      expect(clearIntervalSpy).toHaveBeenCalled();

      // Cleanup
      jest.useRealTimers();
    });

    it('should handle stop when monitoring not running', () => {
      // Act & Assert - Should not throw
      expect(() => stopServiceHealthMonitoring()).not.toThrow();
    });
  });
});
