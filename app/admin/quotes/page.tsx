'use client';
export const dynamic = 'force-dynamic';

/**
 * Quotes List Page
 *
 * Displays all quotes in a grid with filtering by status
 *
 * @module app/admin/quotes/page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuoteCard } from '@/components/admin/QuoteCard';
import { ListSkeleton } from '@/components/admin/Skeletons';

interface Quote {
  id: string;
  projectType: string;
  status: string;
  createdAt: string;
  contactEmail?: string;
  estimatedBudget?: string;
}

export default function QuotesListPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/admin/quotes');
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve quote');
      }

      // Update local state
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: 'APPROVED' } : q))
      );
    } catch (err) {
      console.error('Error approving quote:', err);
      alert('Failed to approve quote');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DECLINED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline quote');
      }

      // Update local state
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: 'DECLINED' } : q))
      );
    } catch (err) {
      console.error('Error declining quote:', err);
      alert('Failed to decline quote');
    }
  };

  const handleConvert = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${id}/convert`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to convert quote');
      }

      const data = await response.json();
      const projectId = data.project?.id;

      if (projectId) {
        router.push(`/admin/projects/${projectId}`);
      }
    } catch (err) {
      console.error('Error converting quote:', err);
      alert('Failed to convert quote to project');
    }
  };

  const filteredQuotes =
    statusFilter === 'all'
      ? quotes
      : quotes.filter((q) => q.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-600 mt-2">Manage incoming quote requests</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === 'PENDING'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === 'APPROVED'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('DECLINED')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === 'DECLINED'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Declined
        </button>
        <button
          onClick={() => setStatusFilter('CONVERTED')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            statusFilter === 'CONVERTED'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Converted
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchQuotes}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <ListSkeleton items={6} />}

      {/* Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onApprove={handleApprove}
              onDecline={handleDecline}
              onConvert={handleConvert}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredQuotes.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">
            {statusFilter === 'all'
              ? 'No quotes yet'
              : `No ${statusFilter.toLowerCase()} quotes`}
          </p>
        </div>
      )}
    </div>
  );
}
