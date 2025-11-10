'use client';
export const dynamic = 'force-dynamic';

/**
 * Project Detail Page
 *
 * Displays full project details, related quotes, and time entries
 *
 * @module app/admin/projects/[id]/page
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2, ArrowLeft, Clock } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  clientName: string;
  clientEmail: string;
  status: string;
  budget: number | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  quotes?: Array<{
    id: string;
    projectType: string;
    status: string;
    createdAt: string;
  }>;
  timeEntries?: Array<{
    id: string;
    description: string;
    durationMinutes: number;
    startedAt: string;
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data.project);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      router.push('/admin/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error || 'Project not found'}</p>
        </div>
      </div>
    );
  }

  const totalHours =
    project.timeEntries?.reduce((sum, entry) => sum + entry.durationMinutes, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600 mt-2">Project Details</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/projects/${project.id}/edit`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Project Information
            </h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      project.status === 'PLANNING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : project.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : project.status === 'COMPLETE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>

              {project.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {project.description}
                  </dd>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Budget</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.budget
                      ? `$${Number(project.budget).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString()
                      : 'Not set'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Time Entries */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
              <div className="text-sm text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Total: {Math.round(totalHours / 60)}h {totalHours % 60}m
              </div>
            </div>
            {project.timeEntries && project.timeEntries.length > 0 ? (
              <div className="space-y-3">
                {project.timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {entry.description}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>
                        {Math.floor(entry.durationMinutes / 60)}h{' '}
                        {entry.durationMinutes % 60}m
                      </span>
                      <span>
                        {new Date(entry.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No time entries yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Client Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{project.clientName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a
                    href={`mailto:${project.clientEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {project.clientEmail}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Related Quotes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Related Quotes
            </h2>
            {project.quotes && project.quotes.length > 0 ? (
              <div className="space-y-2">
                {project.quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/admin/quotes/${quote.id}`}
                    className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {quote.projectType}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {quote.status} •{' '}
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No related quotes</p>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(project.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">
                  {new Date(project.updatedAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Project ID</dt>
                <dd className="text-gray-900 font-mono text-xs">{project.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
