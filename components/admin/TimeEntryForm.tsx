'use client';

/**
 * @file TimeEntryForm Component
 * @description Form for logging time entries with validation
 * @module components/admin/TimeEntryForm
 */

import React, { useState, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

interface TimeEntryFormData {
  projectId: string;
  description: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: string;
}

interface TimeEntryFormProps {
  projectId?: string;
  onSubmit: (data: TimeEntryFormData) => Promise<void>;
  onCancel?: () => void;
}

/**
 * TimeEntryForm Component
 *
 * Form for logging time entries with duration calculation
 *
 * @param props - Component props
 * @param props.projectId - Optional pre-selected project ID
 * @param props.onSubmit - Submit handler (async)
 * @param props.onCancel - Optional cancel handler
 * @returns Time entry form component
 *
 * @example
 * <TimeEntryForm
 *   projectId="project-123"
 *   onSubmit={handleSubmit}
 *   onCancel={() => setShowForm(false)}
 * />
 */
export function TimeEntryForm({
  projectId: initialProjectId,
  onSubmit,
  onCancel,
}: TimeEntryFormProps) {
  const [formData, setFormData] = useState<TimeEntryFormData>({
    projectId: initialProjectId || '',
    description: '',
    startedAt: '',
    endedAt: '',
    durationMinutes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TimeEntryFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TimeEntryFormData, string>> = {};

    if (!formData.projectId.trim()) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startedAt) {
      newErrors.startedAt = 'Start time is required';
    }

    // Either endedAt OR durationMinutes must be provided
    if (!formData.endedAt && !formData.durationMinutes) {
      newErrors.endedAt = 'End time or duration is required';
      newErrors.durationMinutes = 'End time or duration is required';
    }

    // If durationMinutes provided, validate it
    if (formData.durationMinutes) {
      const duration = parseInt(formData.durationMinutes, 10);
      if (isNaN(duration) || duration <= 0) {
        newErrors.durationMinutes = 'Duration must be a positive number';
      }
    }

    // If both times provided, validate startedAt < endedAt
    if (formData.startedAt && formData.endedAt) {
      const start = new Date(formData.startedAt);
      const end = new Date(formData.endedAt);
      if (end <= start) {
        newErrors.endedAt = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Calculate duration if not provided
      const finalData = { ...formData };
      if (!formData.durationMinutes && formData.startedAt && formData.endedAt) {
        const start = new Date(formData.startedAt);
        const end = new Date(formData.endedAt);
        const durationMs = end.getTime() - start.getTime();
        const durationMin = Math.round(durationMs / 60000);
        finalData.durationMinutes = durationMin.toString();
      }

      await onSubmit(finalData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof TimeEntryFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project ID (if not pre-filled) */}
      {!initialProjectId && (
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
            Project ID *
          </label>
          <input
            type="text"
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.projectId
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            disabled={loading}
          />
          {errors.projectId && (
            <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.description
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          disabled={loading}
          placeholder="What did you work on?"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Start Time */}
      <div>
        <label htmlFor="startedAt" className="block text-sm font-medium text-gray-700">
          Start Time *
        </label>
        <input
          type="datetime-local"
          id="startedAt"
          name="startedAt"
          value={formData.startedAt}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.startedAt
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          disabled={loading}
        />
        {errors.startedAt && (
          <p className="mt-1 text-sm text-red-600">{errors.startedAt}</p>
        )}
      </div>

      {/* End Time */}
      <div>
        <label htmlFor="endedAt" className="block text-sm font-medium text-gray-700">
          End Time
        </label>
        <input
          type="datetime-local"
          id="endedAt"
          name="endedAt"
          value={formData.endedAt}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.endedAt
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          disabled={loading}
        />
        {errors.endedAt && (
          <p className="mt-1 text-sm text-red-600">{errors.endedAt}</p>
        )}
      </div>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>

      {/* Duration Minutes */}
      <div>
        <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700">
          Duration (minutes)
        </label>
        <input
          type="number"
          id="durationMinutes"
          name="durationMinutes"
          value={formData.durationMinutes}
          onChange={handleChange}
          min="1"
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.durationMinutes
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          disabled={loading}
          placeholder="e.g., 60"
        />
        {errors.durationMinutes && (
          <p className="mt-1 text-sm text-red-600">{errors.durationMinutes}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
          Log Time
        </button>
      </div>
    </form>
  );
}
