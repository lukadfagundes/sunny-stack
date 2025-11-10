'use client';
export const dynamic = 'force-dynamic';

/**
 * Proposals List Page
 *
 * Placeholder for proposals feature (coming in Group 5 - PDF Generation)
 *
 * @module app/admin/proposals/page
 */

import { FileText, Rocket } from 'lucide-react';

export default function ProposalsListPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
        <p className="text-gray-600 mt-2">Generate and manage client proposals</p>
      </div>

      {/* Placeholder Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
          <FileText className="h-8 w-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Proposals Feature Coming Soon
        </h2>

        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          The proposals feature is currently under development and will be available in{' '}
          <span className="font-semibold">Group 5 (PDF Generation)</span>. This will allow you to:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl mb-2">📄</div>
            <h3 className="font-semibold text-gray-900 mb-2">Generate PDFs</h3>
            <p className="text-sm text-gray-600">
              Create professional proposal documents from approved quotes
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl mb-2">✏️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Customize Templates</h3>
            <p className="text-sm text-gray-600">
              Use customizable templates with your branding and content
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl mb-2">📧</div>
            <h3 className="font-semibold text-gray-900 mb-2">Send to Clients</h3>
            <p className="text-sm text-gray-600">
              Email proposals directly to clients with tracking
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
          <Rocket className="h-5 w-5" />
          <span>Phase 3 Implementation</span>
        </div>
      </div>

      {/* Status Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Implementation Status
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs font-bold">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Group 1: Core Infrastructure</p>
              <p className="text-xs text-gray-500">Database, Auth, Components - Complete</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs font-bold">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Group 2: API Endpoints</p>
              <p className="text-xs text-gray-500">Projects, Quotes, Analytics - Complete</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs font-bold">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Group 3: UI Components</p>
              <p className="text-xs text-gray-500">Dashboard, Forms, Charts - Complete</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs font-bold">→</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Group 4: Admin Pages</p>
              <p className="text-xs text-gray-500">Dashboard, Projects, Quotes - In Progress</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-xs font-bold">○</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Group 5: PDF Generation</p>
              <p className="text-xs text-gray-400">Proposals, Templates - Pending</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-xs font-bold">○</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Group 6: Discord Integration</p>
              <p className="text-xs text-gray-400">Webhooks, Notifications - Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
