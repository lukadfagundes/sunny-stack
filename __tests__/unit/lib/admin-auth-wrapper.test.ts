/**
 * Unit Tests for Admin Auth Wrapper
 *
 * Tests the withAdminAuth() HOC that protects admin pages.
 *
 * RED Phase: These tests will fail until implementation is complete.
 *
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock NextAuth server functions
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

import { withAdminAuth } from '@/lib/admin/auth-wrapper';

describe('withAdminAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear ADMIN_EMAIL environment variable
    delete process.env.ADMIN_EMAIL;
  });

  it('should allow authenticated admin user to access handler', async () => {
    // ARRANGE
    process.env.ADMIN_EMAIL = 'luka@sunny-stack.com';
    const mockSession = {
      user: {
        email: 'luka@sunny-stack.com',
        name: 'Luka'
      }
    };

    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue(mockSession);

    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    const req = new NextRequest('http://localhost:3000/api/admin/test');

    // ACT
    const wrappedHandler = withAdminAuth(mockHandler);
    const response = await wrappedHandler(req);

    // ASSERT
    expect(mockHandler).toHaveBeenCalledWith(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true });
  });

  it('should reject unauthenticated user with 401', async () => {
    // ARRANGE
    process.env.ADMIN_EMAIL = 'luka@sunny-stack.com';
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue(null);

    const mockHandler = jest.fn();
    const req = new NextRequest('http://localhost:3000/api/admin/test');

    // ACT
    const wrappedHandler = withAdminAuth(mockHandler);
    const response = await wrappedHandler(req);

    // ASSERT
    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('should reject non-admin user with 403', async () => {
    // ARRANGE
    process.env.ADMIN_EMAIL = 'luka@sunny-stack.com';
    const mockSession = {
      user: {
        email: 'hacker@example.com', // NOT the ADMIN_EMAIL
        name: 'Hacker'
      }
    };

    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue(mockSession);

    const mockHandler = jest.fn();
    const req = new NextRequest('http://localhost:3000/api/admin/test');

    // ACT
    const wrappedHandler = withAdminAuth(mockHandler);
    const response = await wrappedHandler(req);

    // ASSERT
    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('Forbidden');
  });

  it('should handle session retrieval errors gracefully', async () => {
    // ARRANGE
    process.env.ADMIN_EMAIL = 'luka@sunny-stack.com';
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockRejectedValue(
      new Error('Session service unavailable')
    );

    const mockHandler = jest.fn();
    const req = new NextRequest('http://localhost:3000/api/admin/test');

    // ACT
    const wrappedHandler = withAdminAuth(mockHandler);
    const response = await wrappedHandler(req);

    // ASSERT
    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Authentication failed');
  });

  it('should accept custom admin emails via config', async () => {
    // ARRANGE
    const mockSession = {
      user: {
        email: 'custom-admin@example.com',
        name: 'Custom Admin'
      }
    };

    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue(mockSession);

    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    const req = new NextRequest('http://localhost:3000/api/admin/test');

    // ACT
    const wrappedHandler = withAdminAuth(mockHandler, {
      adminEmails: ['custom-admin@example.com']
    });
    const response = await wrappedHandler(req);

    // ASSERT
    expect(mockHandler).toHaveBeenCalledWith(req);
    expect(response.status).toBe(200);
  });
});
