'use client';
export const dynamic = 'force-dynamic';

/**
 * Quote Detail Page
 *
 * Displays full quote details with QuoteReviewModal for actions
 *
 * @module app/admin/quotes/[id]/page
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuoteReviewModal } from '@/components/admin/QuoteReviewModal';
import { ArrowLeft, Check, X, FileText } from 'lucide-react';

interface QuoteDetails {
  id: string;
  projectType: string;
  status: string;
  contactName?: string;
  contactEmail: string;
  contactPhone?: string;
  description?: string;
  budget?: string;
  timeline?: string;
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const data = await response.json();
      setQuote(data.quote);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quote');
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

      // Refresh quote data
      await fetchQuote();
    } catch (err) {
      console.error('Error approving quote:', err);
      throw err;
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

      // Refresh quote data
      await fetchQuote();
    } catch (err) {
      console.error('Error declining quote:', err);
      throw err;
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
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/quotes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Quotes
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error || 'Quote not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/quotes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Quotes
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quote.projectType}</h1>
            <p className="text-gray-600 mt-2">Quote Details</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Review Quote
            </button>
            {quote.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleApprove(quote.id)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => handleDecline(quote.id)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </button>
              </>
            )}
            {quote.status === 'APPROVED' && (
              <button
                onClick={() => handleConvert(quote.id)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-1" />
                Convert to Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quote Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quote Information
            </h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      quote.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : quote.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : quote.status === 'DECLINED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {quote.status}
                  </span>
                </dd>
              </div>

              {quote.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {quote.description}
                  </dd>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {quote.budget && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Budget</dt>
                    <dd className="mt-1 text-sm text-gray-900">${quote.budget}</dd>
                  </div>
                )}
                {quote.timeline && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                    <dd className="mt-1 text-sm text-gray-900">{quote.timeline}</dd>
                  </div>
                )}
              </div>

              {quote.features && quote.features.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Requested Features
                  </dt>
                  <dd className="mt-1">
                    <ul className="list-disc list-inside text-sm text-gray-900 space-y-1">
                      {quote.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <dl className="space-y-3">
              {quote.contactName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{quote.contactName}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a
                    href={`mailto:${quote.contactEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {quote.contactEmail}
                  </a>
                </dd>
              </div>
              {quote.contactPhone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{quote.contactPhone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Received</dt>
                <dd className="text-gray-900">
                  {new Date(quote.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">
                  {new Date(quote.updatedAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Quote ID</dt>
                <dd className="text-gray-900 font-mono text-xs">{quote.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <QuoteReviewModal
        quote={quote}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={quote.status === 'PENDING' ? handleApprove : undefined}
        onDecline={quote.status === 'PENDING' ? handleDecline : undefined}
        onConvert={quote.status === 'APPROVED' ? handleConvert : undefined}
      />
    </div>
  );
}
