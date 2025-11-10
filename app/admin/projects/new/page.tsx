'use client';
export const dynamic = 'force-dynamic';

/**
 * New Project Page
 *
 * Create a new project using ProjectForm component
 *
 * @module app/admin/projects/new/page
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { ArrowLeft } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const data = await response.json();

      // Redirect to the new project's detail page
      router.push(`/admin/projects/${data.project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      alert(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  };

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

        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
          <p className="text-gray-600 mt-2">Create a new client project</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <ProjectForm
          initialData={{
            title: '',
            clientName: '',
            clientEmail: '',
            description: '',
            status: 'PLANNING',
            budget: '',
            deadline: '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Create Project"
        />
      </div>
    </div>
  );
}
