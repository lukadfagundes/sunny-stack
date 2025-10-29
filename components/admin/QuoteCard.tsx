'use client';

/**
 * @file QuoteCard Component
 * @description Card component displaying quote summary with actions
 * @module components/admin/QuoteCard
 */

import React from 'react';
import Link from 'next/link';
import { Eye, Check, X, FileText } from 'lucide-react';

interface Quote {
  id: string;
  projectType: string;
  status: string;
  createdAt: string;
  contactEmail?: string;
  estimatedBudget?: string;
}

interface QuoteCardProps {
  quote: Quote;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  onConvert?: (id: string) => void;
}

/**
 * QuoteCard Component
 *
 * Displays quote summary in a card with action buttons
 *
 * @param props - Component props
 * @param props.quote - Quote object
 * @param props.onApprove - Optional approve handler
 * @param props.onDecline - Optional decline handler
 * @param props.onConvert - Optional convert to project handler
 * @returns Quote card component
 *
 * @example
 * <QuoteCard
 *   quote={quote}
 *   onApprove={handleApprove}
 *   onDecline={handleDecline}
 *   onConvert={handleConvert}
 * />
 */
export function QuoteCard({
  quote,
  onApprove,
  onDecline,
  onConvert,
}: QuoteCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
      CONVERTED: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {quote.projectType}
          </h3>
          {quote.contactEmail && (
            <p className="text-sm text-gray-600 mt-1">{quote.contactEmail}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            quote.status
          )}`}
        >
          {quote.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {quote.estimatedBudget && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Budget:</span> ${quote.estimatedBudget}
          </p>
        )}
        <p className="text-sm text-gray-600">
          <span className="font-medium">Received:</span>{' '}
          {new Date(quote.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        <Link
          href={`/admin/quotes/${quote.id}`}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Link>

        {quote.status === 'PENDING' && onApprove && (
          <button
            onClick={() => onApprove(quote.id)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </button>
        )}

        {quote.status === 'PENDING' && onDecline && (
          <button
            onClick={() => onDecline(quote.id)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Decline
          </button>
        )}

        {quote.status === 'APPROVED' && onConvert && (
          <button
            onClick={() => onConvert(quote.id)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-1" />
            Convert
          </button>
        )}
      </div>
    </div>
  );
}
