/**
 * @file Alerts Endpoint Unit Tests
 * @description Tests for GET /api/admin/monitor/alerts
 */

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { Severity } from '@prisma/client';

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
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
    monitoringAlert: {
      count: jest.fn(),
      findMany: jest.fn(),
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
const routeModule = require('@/app/api/admin/monitor/alerts/route');
const GET = routeModule.GET;

describe('GET /api/admin/monitor/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated alerts with default parameters', async () => {
    // Arrange
    const mockAlerts = [
      {
        id: '1',
        type: 'ERROR',
        severity: 'CRITICAL',
        source: 'Fly.io',
        message: 'Service down',
        timestamp: new Date('2025-01-01T12:00:00Z'),
        acknowledged: false,
        metadata: {},
      },
    ];

    (prisma.monitoringAlert.count as jest.Mock).mockResolvedValue(1);
    (prisma.monitoringAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

    // Create mock request with default params
    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams() },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.alerts).toHaveLength(1);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 25,
      total: 1,
      totalPages: 1,
    });
  });

  it('should return correct alert format', async () => {
    // Arrange
    const mockAlert = {
      id: 'alert-123',
      type: 'UPTIME_CHECK',
      severity: 'WARNING',
      source: 'Cloudflare',
      message: 'Service degraded',
      timestamp: new Date('2025-01-01T12:00:00Z'),
      acknowledged: false,
      metadata: { previousStatus: 'operational', newStatus: 'degraded' },
    };

    (prisma.monitoringAlert.count as jest.Mock).mockResolvedValue(1);
    (prisma.monitoringAlert.findMany as jest.Mock).mockResolvedValue([mockAlert]);

    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams() },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(data.alerts[0]).toEqual({
      id: 'alert-123',
      type: 'UPTIME_CHECK',
      severity: 'WARNING',
      source: 'Cloudflare',
      message: 'Service degraded',
      timestamp: '2025-01-01T12:00:00.000Z',
      acknowledged: false,
      metadata: { previousStatus: 'operational', newStatus: 'degraded' },
    });
  });

  it('should filter by severity', async () => {
    // Arrange
    const mockAlerts = [
      {
        id: '1',
        type: 'ERROR',
        severity: 'CRITICAL',
        source: 'Fly.io',
        message: 'Critical error',
        timestamp: new Date(),
        acknowledged: false,
        metadata: {},
      },
    ];

    (prisma.monitoringAlert.count as jest.Mock).mockResolvedValue(1);
    (prisma.monitoringAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams('severity=CRITICAL') },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(prisma.monitoringAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          severity: 'CRITICAL',
        }),
      })
    );
    expect(data.alerts).toHaveLength(1);
  });

  it('should filter by source', async () => {
    // Arrange
    const mockAlerts = [
      {
        id: '1',
        type: 'UPTIME_CHECK',
        severity: 'WARNING',
        source: 'Cloudflare',
        message: 'Service degraded',
        timestamp: new Date(),
        acknowledged: false,
        metadata: {},
      },
    ];

    (prisma.monitoringAlert.count as jest.Mock).mockResolvedValue(1);
    (prisma.monitoringAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams('source=Cloudflare') },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(prisma.monitoringAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          source: 'Cloudflare',
        }),
      })
    );
    expect(data.alerts[0].source).toBe('Cloudflare');
  });

  it('should handle pagination correctly', async () => {
    // Arrange
    const mockAlerts = Array.from({ length: 25 }, (_, i) => ({
      id: `alert-${i}`,
      type: 'INFO',
      severity: 'INFO',
      source: 'System',
      message: `Alert ${i}`,
      timestamp: new Date(),
      acknowledged: false,
      metadata: {},
    }));

    (prisma.monitoringAlert.count as jest.Mock).mockResolvedValue(100);
    (prisma.monitoringAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams('page=2') },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(data.pagination).toEqual({
      page: 2,
      limit: 25,
      total: 100,
      totalPages: 4,
    });
    expect(prisma.monitoringAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 25, // Skip first page (25 items)
        take: 25,
      })
    );
  });

  it('should return empty array when no alerts exist', async () => {
    // Arrange
    (prisma.monitoringAlert.count as jest.Mock).mockResolvedValue(0);
    (prisma.monitoringAlert.findMany as jest.Mock).mockResolvedValue([]);

    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams() },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.alerts).toHaveLength(0);
    expect(data.pagination.total).toBe(0);
  });

  it('should handle invalid severity gracefully', async () => {
    // Arrange
    (prisma.monitoringAlert.count as jest.Mock).mockResolvedValue(0);
    (prisma.monitoringAlert.findMany as jest.Mock).mockResolvedValue([]);

    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams('severity=INVALID') },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    // Should ignore invalid severity and not include it in where clause
    expect(prisma.monitoringAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          severity: 'INVALID',
        }),
      })
    );
  });

  it('should return 500 on database error', async () => {
    // Arrange
    (prisma.monitoringAlert.count as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const mockRequest = {
      nextUrl: { searchParams: new URLSearchParams() },
    };

    // Act
    const response = await GET(mockRequest as any);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch alerts');
    expect(logger.error).toHaveBeenCalledWith(
      'Monitor alerts error:',
      expect.any(Error)
    );
  });
});
