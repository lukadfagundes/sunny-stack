/**
 * @file Monitoring System Integration Tests
 * @description Integration tests for monitoring system flow:
 * Service health checker → Database operations → Alert creation
 */

import { prisma } from '@/lib/db/prisma';
import {
  runServiceHealthChecks,
  startServiceHealthMonitoring,
  stopServiceHealthMonitoring,
} from '@/lib/monitoring/service-health-checker';
import { MONITORED_SERVICES } from '@/lib/monitoring/config';

// Mock fetch globally
global.fetch = jest.fn();

// Mock logger
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Mock Prisma
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

describe('Monitoring System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check to Database Flow', () => {
    it('should save all service health checks in one batch', async () => {
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

      // Assert - Verify batch operation was called
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining(
          MONITORED_SERVICES.map((service) =>
            expect.objectContaining({
              serviceName: service.name,
              endpoint: service.endpoint,
              status: 'operational',
            })
          )
        ),
      });
    });

    it('should create alerts in batch when services go down', async () => {
      // Arrange - Services were previously operational
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
      });
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Fly.io',
        status: 'operational',
      });
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });
      (prisma.monitoringAlert.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Should batch create alerts
      expect(prisma.monitoringAlert.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.monitoringAlert.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            severity: 'CRITICAL',
            type: 'ERROR',
            message: expect.stringContaining('operational to down'),
          }),
        ]),
      });
    });

    it('should mark services as degraded with slow responses', async () => {
      // Arrange - Mock slow response (>2 seconds)
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, status: 200 }), 2500);
        })
      );
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Verify degraded status was saved
      const createManyCall = (prisma.serviceHealthCheck.createMany as jest.Mock).mock
        .calls[0][0];
      const hasDegradedService = createManyCall.data.some(
        (service: any) => service.status === 'degraded' && service.responseTime >= 2000
      );
      expect(hasDegradedService).toBe(true);
    }, 15000); // Increase timeout for slow response test

    it('should create INFO alerts when services recover', async () => {
      // Arrange - Services were previously down, now operational
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Vercel',
        status: 'down',
      });
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });
      (prisma.monitoringAlert.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Should create INFO alerts for recovery
      expect(prisma.monitoringAlert.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            severity: 'INFO',
            type: 'UPTIME_CHECK',
            message: expect.stringContaining('down to operational'),
          }),
        ]),
      });
    });
  });

  describe('Component Integration', () => {
    it('should fetch previous statuses in parallel before saving', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Fly.io',
        status: 'operational',
      });
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Should query for previous statuses (one per service) AND save new checks
      expect(prisma.serviceHealthCheck.findFirst).toHaveBeenCalledTimes(
        MONITORED_SERVICES.length
      );
      expect(prisma.serviceHealthCheck.createMany).toHaveBeenCalledTimes(1);

      // Verify each service's previous status was checked
      MONITORED_SERVICES.forEach((service) => {
        expect(prisma.serviceHealthCheck.findFirst).toHaveBeenCalledWith({
          where: { serviceName: service.name },
          orderBy: { lastChecked: 'desc' },
          select: { serviceName: true, status: true },
        });
      });
    });

    it('should not create alerts when status unchanged', async () => {
      // Arrange - Previous status matches new status
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
        serviceName: 'Fly.io',
        status: 'operational', // Same as new status
      });
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Should NOT create any alerts
      expect(prisma.monitoringAlert.createMany).not.toHaveBeenCalled();
    });

    it('should handle mixed service statuses correctly', async () => {
      // Arrange - Different services have different statuses
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({ ok: true, status: 200 })
      );

      // First service was operational, others were down
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockImplementation(
        ({ where }: any) => {
          if (where.serviceName === 'Fly.io') {
            return Promise.resolve({ serviceName: 'Fly.io', status: 'operational' });
          }
          return Promise.resolve({ serviceName: where.serviceName, status: 'down' });
        }
      );

      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });
      (prisma.monitoringAlert.createMany as jest.Mock).mockResolvedValue({
        count: 3, // 3 services recovered
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Should create recovery alerts for services that were down
      expect(prisma.monitoringAlert.createMany).toHaveBeenCalledWith({
        data: expect.any(Array),
      });

      const alertData = (prisma.monitoringAlert.createMany as jest.Mock).mock.calls[0][0]
        .data;
      // Fly.io was already operational, so only 3 others recovered
      expect(alertData.length).toBe(3);
    });

    it('should handle HTTP fetch errors gracefully', async () => {
      // Arrange - Network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.serviceHealthCheck.createMany as jest.Mock).mockResolvedValue({
        count: MONITORED_SERVICES.length,
      });

      // Act
      await runServiceHealthChecks();

      // Assert - Should still save health checks (marked as down)
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
  });

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring cleanly', () => {
      // Arrange
      jest.useFakeTimers();

      // Act
      startServiceHealthMonitoring();
      stopServiceHealthMonitoring();

      // Assert - Should not throw errors
      expect(() => stopServiceHealthMonitoring()).not.toThrow();

      jest.useRealTimers();
    });
  });
});
