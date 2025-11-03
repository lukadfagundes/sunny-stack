/**
 * @file Services Endpoint Unit Tests
 * @description Tests for GET /api/admin/monitor/services
 */

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { MONITORED_SERVICES } from '@/lib/monitoring/config';

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !init?.status || (init.status >= 200 && init.status < 300),
    })),
  },
}));

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    serviceHealthCheck: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('@/lib/middleware/auth', () => ({
  withBotAuth: (handler: any) => handler,
  withRateLimit: (handler: any) => handler,
}));

// Import route handler after mocks
const routeModule = require('@/app/api/admin/monitor/services/route');
const GET = routeModule.GET;

describe('GET /api/admin/monitor/services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all services with latest health checks', async () => {
    // Arrange - Mock health checks for all services
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockImplementation(
      ({ where }: any) => {
        const serviceName = where.serviceName;
        const service = MONITORED_SERVICES.find((s) => s.name === serviceName);
        if (!service) return Promise.resolve(null);

        return Promise.resolve({
          serviceName: service.name,
          endpoint: service.endpoint,
          status: 'operational',
          responseTime: 150,
          statusCode: 200,
          lastChecked: new Date('2025-01-01T12:00:00Z'),
        });
      }
    );

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.services).toHaveLength(MONITORED_SERVICES.length);
    expect(data.summary).toEqual({
      total: MONITORED_SERVICES.length,
      operational: MONITORED_SERVICES.length,
      degraded: 0,
      down: 0,
    });
  });

  it('should return correct service format', async () => {
    // Arrange
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
      serviceName: 'Fly.io',
      endpoint: 'https://status.flycdn.net/api/v2/status.json',
      status: 'operational',
      responseTime: 150,
      statusCode: 200,
      lastChecked: new Date('2025-01-01T12:00:00Z'),
    });

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    const flyService = data.services.find((s: any) => s.name === 'Fly.io');
    expect(flyService).toEqual({
      name: 'Fly.io',
      endpoint: 'https://status.flycdn.net/api/v2/status.json',
      status: 'operational',
      responseTime: 150,
      lastChecked: '2025-01-01T12:00:00.000Z',
    });
  });

  it('should mark service as operational with fast response', async () => {
    // Arrange - Mock all services with operational status
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockImplementation(
      ({ where }: any) => {
        const serviceName = where.serviceName;
        const service = MONITORED_SERVICES.find((s) => s.name === serviceName);
        if (!service) return Promise.resolve(null);

        return Promise.resolve({
          serviceName: service.name,
          endpoint: service.endpoint,
          status: 'operational',
          responseTime: 500,
          statusCode: 200,
          lastChecked: new Date(),
        });
      }
    );

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.summary.operational).toBe(MONITORED_SERVICES.length);
    expect(data.summary.degraded).toBe(0);
    expect(data.summary.down).toBe(0);
  });

  it('should mark service as degraded with slow response', async () => {
    // Arrange
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
      serviceName: 'Cloudflare',
      endpoint: 'https://www.cloudflarestatus.com/api/v2/status.json',
      status: 'degraded',
      responseTime: 3000,
      statusCode: 200,
      lastChecked: new Date(),
    });

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    const cloudflareService = data.services.find((s: any) => s.name === 'Cloudflare');
    expect(cloudflareService.status).toBe('degraded');
    expect(data.summary.degraded).toBeGreaterThan(0);
  });

  it('should mark service as down on failure', async () => {
    // Arrange
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue({
      serviceName: 'Vercel',
      endpoint: 'https://www.vercel-status.com/api/v2/status.json',
      status: 'down',
      responseTime: null,
      statusCode: null,
      lastChecked: new Date(),
    });

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    const vercelService = data.services.find((s: any) => s.name === 'Vercel');
    expect(vercelService.status).toBe('down');
    expect(vercelService.responseTime).toBeNull();
    expect(data.summary.down).toBeGreaterThan(0);
  });

  it('should handle missing health check data', async () => {
    // Arrange - No health check records exist yet
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockResolvedValue(null);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.services).toHaveLength(0); // Empty array when no checks exist
    expect(data.summary).toEqual({
      total: 0,
      operational: 0,
      degraded: 0,
      down: 0,
    });
    expect(data.message).toBe(
      'No health checks available yet. Background monitoring will start shortly.'
    );
  });

  it('should calculate summary correctly with mixed statuses', async () => {
    // Arrange - Mix of operational, degraded, and down
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockImplementation(
      ({ where }: any) => {
        const serviceName = where.serviceName;
        if (serviceName === 'Fly.io') {
          return Promise.resolve({
            serviceName: 'Fly.io',
            status: 'operational',
            responseTime: 150,
            lastChecked: new Date(),
          });
        }
        if (serviceName === 'Cloudflare') {
          return Promise.resolve({
            serviceName: 'Cloudflare',
            status: 'degraded',
            responseTime: 3000,
            lastChecked: new Date(),
          });
        }
        if (serviceName === 'cron-job.org') {
          return Promise.resolve({
            serviceName: 'cron-job.org',
            status: 'down',
            responseTime: null,
            lastChecked: new Date(),
          });
        }
        return Promise.resolve({
          serviceName,
          status: 'operational',
          responseTime: 200,
          lastChecked: new Date(),
        });
      }
    );

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.summary).toEqual({
      total: MONITORED_SERVICES.length,
      operational: 2, // Fly.io and Vercel
      degraded: 1, // Cloudflare
      down: 1, // cron-job.org
    });
  });

  it('should return 500 on database error', async () => {
    // Arrange
    (prisma.serviceHealthCheck.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch service status');
    expect(logger.error).toHaveBeenCalledWith(
      'Monitor services error:',
      expect.any(Error)
    );
  });
});
