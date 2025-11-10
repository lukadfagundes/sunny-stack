'use client';
export const dynamic = 'force-dynamic';

/**
 * Project Edit Page
 *
 * Edit existing project using ProjectForm component
 *
 * @module app/admin/projects/[id]/edit/page
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { ArrowLeft } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  description: string | null;
  status: string;
  budget: number | null;
  deadline: string | null;
}

export default function ProjectEditPage() {
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

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update project');
      }

      // Redirect to project detail page
      router.push(`/admin/projects/${projectId}`);
    } catch (err) {
      console.error('Error updating project:', err);
      alert(err instanceof Error ? err.message : 'Failed to update project');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/projects/${projectId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Project
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-600 mt-2">Update project details</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <ProjectForm
          initialData={{
            title: project.title,
            clientName: project.clientName,
            clientEmail: project.clientEmail,
            description: project.description || '',
            status: project.status,
            budget: project.budget?.toString() || '',
            deadline: project.deadline
              ? new Date(project.deadline).toISOString().split('T')[0]
              : '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Update Project"
        />
      </div>
    </div>
  );
}
