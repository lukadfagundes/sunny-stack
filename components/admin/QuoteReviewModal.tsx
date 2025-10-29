'use client';

/**
 * @file QuoteReviewModal Component
 * @description Modal for reviewing quote details with approve/decline/convert actions
 * @module components/admin/QuoteReviewModal
 */

import React, { useState } from 'react';
import { X, Check, XCircle, FileText, Loader2 } from 'lucide-react';

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
}

interface QuoteReviewModalProps {
  quote: QuoteDetails;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => Promise<void>;
  onDecline?: (id: string) => Promise<void>;
  onConvert?: (id: string) => Promise<void>;
}

/**
 * QuoteReviewModal Component
 *
 * Modal for reviewing quote details with action buttons
 *
 * @param props - Component props
 * @param props.quote - Quote details object
 * @param props.isOpen - Modal visibility state
 * @param props.onClose - Close handler
 * @param props.onApprove - Optional approve handler (async)
 * @param props.onDecline - Optional decline handler (async)
 * @param props.onConvert - Optional convert handler (async)
 * @returns Quote review modal component
 *
 * @example
 * <QuoteReviewModal
 *   quote={quoteDetails}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onApprove={handleApprove}
 * />
 */
export function QuoteReviewModal({
  quote,
  isOpen,
  onClose,
  onApprove,
  onDecline,
  onConvert,
}: QuoteReviewModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (
    action: ((id: string) => Promise<void>) | undefined
  ) => {
    if (!action) return;

    setLoading(true);
    try {
      await action(quote.id);
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Quote Review
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {quote.projectType}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
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
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </h3>
                <div className="space-y-1 text-sm">
                  {quote.contactName && (
                    <p>
                      <span className="font-medium">Name:</span> {quote.contactName}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Email:</span> {quote.contactEmail}
                  </p>
                  {quote.contactPhone && (
                    <p>
                      <span className="font-medium">Phone:</span> {quote.contactPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {quote.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {quote.description}
                  </p>
                </div>
              )}

              {/* Budget & Timeline */}
              <div className="grid grid-cols-2 gap-4">
                {quote.budget && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      Budget
                    </h3>
                    <p className="text-sm text-gray-600">${quote.budget}</p>
                  </div>
                )}
                {quote.timeline && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      Timeline
                    </h3>
                    <p className="text-sm text-gray-600">{quote.timeline}</p>
                  </div>
                )}
              </div>

              {/* Features */}
              {quote.features && quote.features.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Requested Features
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {quote.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Received Date */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Received
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(quote.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>

              {quote.status === 'PENDING' && onDecline && (
                <button
                  onClick={() => handleAction(onDecline)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Decline
                </button>
              )}

              {quote.status === 'PENDING' && onApprove && (
                <button
                  onClick={() => handleAction(onApprove)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </button>
              )}

              {quote.status === 'APPROVED' && onConvert && (
                <button
                  onClick={() => handleAction(onConvert)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Convert to Project
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
