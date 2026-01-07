# API Integration Examples

Real-world examples for integrating with the Sunny Stack API. These examples demonstrate authentication flows, CRUD operations, error handling, and common integration patterns.

## Table of Contents

- [Authentication Examples](#authentication-examples)
- [CRUD Operation Examples](#crud-operation-examples)
- [Quote System Examples](#quote-system-examples)
- [Time Tracking Examples](#time-tracking-examples)
- [Monitoring Examples](#monitoring-examples)
- [Real-World Integration Scenarios](#real-world-integration-scenarios)
- [Error Handling Patterns](#error-handling-patterns)

---

## Authentication Examples

### Google OAuth Flow (Complete Walkthrough)

**Client-Side Implementation:**

```typescript
// components/LoginButton.tsx
'use client';

export default function LoginButton() {
  const handleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/signin';
  };

  return (
    <button onClick={handleLogin}>
      Sign in with Google
    </button>
  );
}
```

**Session Management:**

```typescript
// lib/auth/get-session.ts
import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";

export async function getSession() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const session = await verifyJWT(sessionToken);
    return session;
  } catch (error) {
    return null;
  }
}
```

**Server Component with Authentication:**

```typescript
// app/admin/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/get-session';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session?.user?.isAdmin) {
    redirect('/login');
  }

  // Admin-only content
  return <div>Welcome, {session.user.name}!</div>;
}
```

**Client Component with Authentication:**

```typescript
// components/admin/ProfileMenu.tsx
'use client';

import { useEffect, useState } from 'react';

interface User {
  email: string;
  name: string;
  avatar?: string;
}

export default function ProfileMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <a href="/api/auth/signin">Sign In</a>;

  return (
    <div className="profile-menu">
      <img src={user.avatar} alt={user.name} />
      <span>{user.name}</span>
      <button onClick={() => fetch('/api/auth/signout', { method: 'POST' })}>
        Sign Out
      </button>
    </div>
  );
}
```

**Protecting API Routes:**

```typescript
// app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin authorization
  if (session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 },
    );
  }

  // Proceed with authenticated request
  const projects = await fetchProjects();
  return NextResponse.json({ projects });
}
```

**Bot API Authentication:**

```typescript
// bot/api-client.ts
export class ApiClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.BOT_API_URL || "http://localhost:3000/api";
    this.apiKey = process.env.BOT_API_KEY || "";
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getProjects() {
    return this.request<{ projects: Project[] }>("/admin/projects");
  }
}
```

---

## CRUD Operation Examples

### Project Management

**1. Create Project with Validation:**

```typescript
// app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

// Input validation schema
const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  clientName: z.string().min(1, "Client name is required").max(100),
  clientEmail: z.string().email("Invalid email format"),
  description: z.string().max(2000).optional(),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  status: z
    .enum(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETE", "ARCHIVED"])
    .default("PLANNING"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication (see authentication examples above)
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    // 3. Create project in database
    const project = await prisma.project.create({
      data: {
        title: validated.title,
        clientName: validated.clientName,
        clientEmail: validated.clientEmail,
        description: validated.description,
        budget: validated.budget,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
        status: validated.status,
      },
    });

    // 4. Return success response
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    // 5. Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    // 6. Handle other errors
    console.error("Project creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Client-Side Usage:**

```typescript
// components/admin/CreateProjectForm.tsx
'use client';

import { useState } from 'react';

export default function CreateProjectForm() {
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    description: '',
    budget: '',
    deadline: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          deadline: formData.deadline || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const { data } = await response.json();
      console.log('Project created:', data);

      // Redirect to project page
      window.location.href = `/admin/projects/${data.id}`;

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="text"
        placeholder="Project Title"
        value={formData.title}
        onChange={e => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <input
        type="text"
        placeholder="Client Name"
        value={formData.clientName}
        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
        required
      />

      <input
        type="email"
        placeholder="Client Email"
        value={formData.clientEmail}
        onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
        required
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
      />

      <input
        type="number"
        placeholder="Budget"
        value={formData.budget}
        onChange={e => setFormData({ ...formData, budget: e.target.value })}
      />

      <input
        type="datetime-local"
        value={formData.deadline}
        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
```

**2. Update Project (Status Changes):**

```typescript
// app/api/admin/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETE", "ARCHIVED"])
    .optional(),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate input
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...validated,
        deadline: validated.deadline ? new Date(validated.deadline) : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Project update failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Client-Side Status Update:**

```typescript
// components/admin/ProjectStatusDropdown.tsx
'use client';

import { useState } from 'react';

const STATUSES = ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETE', 'ARCHIVED'];

export default function ProjectStatusDropdown({
  projectId,
  currentStatus
}: {
  projectId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatus(newStatus);
    } catch (error) {
      alert('Failed to update status');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={updating}
    >
      {STATUSES.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
```

**3. Delete Project (Soft Delete):**

```typescript
// app/api/admin/projects/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Soft delete (set deletedAt timestamp)
    await prisma.project.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project deletion failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Client-Side Delete with Confirmation:**

```typescript
// components/admin/DeleteProjectButton.tsx
'use client';

import { useState } from 'react';

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Redirect to projects list
      window.location.href = '/admin/projects';

    } catch (error) {
      alert('Failed to delete project');
      console.error(error);
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className={confirming ? 'btn-danger' : 'btn-secondary'}
    >
      {deleting ? 'Deleting...' : confirming ? 'Click again to confirm' : 'Delete'}
    </button>
  );
}
```

**4. Fetching Projects with Pagination and Filtering:**

```typescript
// app/api/admin/projects/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    // Fetch projects with pagination
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              quotes: true,
              timeEntries: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Client-Side Pagination:**

```typescript
// components/admin/ProjectsList.tsx
'use client';

import { useState, useEffect } from 'react';

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [status, pagination.page]);

  const fetchProjects = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: '10',
    });

    if (status !== 'all') {
      params.append('status', status);
    }

    try {
      const response = await fetch(`/api/admin/projects?${params}`);
      const data = await response.json();

      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Filter */}
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">All Projects</option>
        <option value="PLANNING">Planning</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="REVIEW">Review</option>
        <option value="COMPLETE">Complete</option>
      </select>

      {/* Projects list */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {projects.map(project => (
            <div key={project.id}>{project.title}</div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div>
        <button
          disabled={pagination.page === 1}
          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.pages}</span>
        <button
          disabled={pagination.page === pagination.pages}
          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Quote System Examples

### Public Quote Submission

**Frontend Form:**

```typescript
// app/quote/page.tsx (Public page)
'use client';

import { useState } from 'react';

export default function QuotePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    budgetRange: '',
    timeline: '',
    description: '',
    requirements: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit quote');
      }

      const { quoteId } = await response.json();
      console.log('Quote submitted:', quoteId);

      setSuccess(true);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        projectType: '',
        budgetRange: '',
        timeline: '',
        description: '',
        requirements: '',
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h2>Quote Request Submitted!</h2>
        <p>Thank you! I'll review your request and get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <h1>Request a Quote</h1>

      <input
        type="text"
        placeholder="Your Name *"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <input
        type="email"
        placeholder="Email Address *"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <input
        type="tel"
        placeholder="Phone Number"
        value={formData.phone}
        onChange={e => setFormData({ ...formData, phone: e.target.value })}
      />

      <input
        type="text"
        placeholder="Company Name"
        value={formData.company}
        onChange={e => setFormData({ ...formData, company: e.target.value })}
      />

      <select
        value={formData.projectType}
        onChange={e => setFormData({ ...formData, projectType: e.target.value })}
        required
      >
        <option value="">Select Project Type *</option>
        <option value="Web Development">Web Development</option>
        <option value="Mobile App">Mobile App</option>
        <option value="E-Commerce">E-Commerce</option>
        <option value="Consulting">Consulting</option>
        <option value="Other">Other</option>
      </select>

      <select
        value={formData.budgetRange}
        onChange={e => setFormData({ ...formData, budgetRange: e.target.value })}
      >
        <option value="">Select Budget Range</option>
        <option value="< $5,000">Less than $5,000</option>
        <option value="$5,000 - $10,000">$5,000 - $10,000</option>
        <option value="$10,000 - $25,000">$10,000 - $25,000</option>
        <option value="> $25,000">More than $25,000</option>
      </select>

      <input
        type="text"
        placeholder="Timeline (e.g., 2-3 months)"
        value={formData.timeline}
        onChange={e => setFormData({ ...formData, timeline: e.target.value })}
      />

      <textarea
        placeholder="Project Description *"
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        rows={5}
        required
      />

      <textarea
        placeholder="Specific Requirements"
        value={formData.requirements}
        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
        rows={3}
      />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Quote Request'}
      </button>
    </form>
  );
}
```

### Quote Status Updates (Admin)

```typescript
// app/api/admin/quotes/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!["PENDING", "APPROVED", "DECLINED", "CONVERTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update quote
    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ data: quote });
  } catch (error) {
    console.error("Quote update failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Converting Quote to Project

```typescript
// app/api/admin/quotes/[id]/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch quote
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Quote already converted" },
        { status: 400 },
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create project from quote
      const project = await tx.project.create({
        data: {
          title: quote.projectType || "Untitled Project",
          clientName: quote.name,
          clientEmail: quote.email,
          description: quote.description,
          status: "PLANNING",
        },
      });

      // Update quote status
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: "CONVERTED",
          projectId: project.id,
          reviewedAt: new Date(),
        },
      });

      return { project, quote };
    });

    return NextResponse.json({
      data: result.project,
      message: "Quote converted to project successfully",
    });
  } catch (error) {
    console.error("Quote conversion failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

---

## Time Tracking Examples

### Manual Time Entry

```typescript
// app/api/admin/time-entries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const createTimeEntrySchema = z.object({
  projectId: z.string().cuid(),
  description: z.string().max(500).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTimeEntrySchema.parse(body);

    // Calculate duration if not provided
    let duration = validated.durationMinutes;
    if (!duration) {
      const start = new Date(validated.startedAt);
      const end = new Date(validated.endedAt);
      duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: validated.projectId, deletedAt: null },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId: validated.projectId,
        description: validated.description,
        startedAt: new Date(validated.startedAt),
        endedAt: new Date(validated.endedAt),
        durationMinutes: duration,
        loggedVia: "admin",
      },
    });

    return NextResponse.json({ data: timeEntry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Time entry creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Discord Time Logging

```typescript
// bot/commands/log-time.ts
import { SlashCommandBuilder } from "discord.js";
import { BaseCommand } from "./base-command";
import { ApiClient } from "../api-client";

export class LogTimeCommand extends BaseCommand {
  constructor() {
    super({
      name: "log-time",
      description: "Log time worked on a project",
      data: new SlashCommandBuilder()
        .setName("log-time")
        .setDescription("Log time worked on a project")
        .addStringOption((option) =>
          option
            .setName("project")
            .setDescription("Project ID or name")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("hours")
            .setDescription("Hours worked")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(24),
        )
        .addIntegerOption((option) =>
          option
            .setName("minutes")
            .setDescription("Minutes worked")
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(59),
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("What did you work on?")
            .setRequired(false),
        ),
    });
  }

  async execute(interaction: any) {
    const projectId = interaction.options.getString("project");
    const hours = interaction.options.getInteger("hours");
    const minutes = interaction.options.getInteger("minutes") || 0;
    const description = interaction.options.getString("description");

    const durationMinutes = hours * 60 + minutes;
    const now = new Date();
    const startedAt = new Date(now.getTime() - durationMinutes * 60 * 1000);

    try {
      const apiClient = new ApiClient();
      const timeEntry = await apiClient.createTimeEntry({
        projectId,
        startedAt: startedAt.toISOString(),
        endedAt: now.toISOString(),
        durationMinutes,
        description,
        loggedVia: "discord",
      });

      await interaction.reply({
        content: `✅ Logged ${hours}h ${minutes}m on project ${projectId}`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: `❌ Failed to log time: ${error.message}`,
        ephemeral: true,
      });
    }
  }

  async autocomplete(interaction: any) {
    // Provide project autocomplete suggestions
    const apiClient = new ApiClient();
    const projects = await apiClient.getProjects();

    const choices = projects.map((p) => ({
      name: p.title,
      value: p.id,
    }));

    await interaction.respond(choices.slice(0, 25));
  }
}
```

### Fetching Time Entries with Aggregation

```typescript
// app/api/admin/time-entries/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (startDate && endDate) {
      where.startedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      orderBy: { startedAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            clientName: true,
          },
        },
      },
    });

    // Calculate totals
    const totalMinutes = timeEntries.reduce(
      (sum, entry) => sum + (entry.durationMinutes || 0),
      0,
    );

    return NextResponse.json({
      timeEntries,
      summary: {
        count: timeEntries.length,
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

---

## Monitoring Examples

### Health Check Usage

```typescript
// components/admin/SystemStatus.tsx
'use client';

import { useState, useEffect } from 'react';

export default function SystemStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/health');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading system status...</div>;

  return (
    <div className="system-status">
      <h3>System Health</h3>
      <div className={`status-badge ${status.status}`}>
        {status.status}
      </div>

      <h4>Database</h4>
      <div>
        Connected: {status.database.connected ? '✅' : '❌'}
        <br />
        Response Time: {status.database.responseTime}ms
      </div>

      <h4>External Services</h4>
      <ul>
        <li>Vercel: {status.services.vercel}</li>
        <li>Discord: {status.services.discord}</li>
        <li>GitHub: {status.services.github}</li>
      </ul>
    </div>
  );
}
```

### GitHub Status Integration

```typescript
// app/api/admin/monitoring/github/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_API_TOKEN,
    });

    // Fetch GitHub status
    const { data: status } = await octokit.request(
      "GET https://www.githubstatus.com/api/v2/status.json",
    );

    // Fetch recent incidents
    const { data: incidents } = await octokit.request(
      "GET https://www.githubstatus.com/api/v2/incidents.json",
    );

    return NextResponse.json({
      status: status.status,
      description: status.description,
      recentIncidents: incidents.incidents.slice(0, 5),
    });
  } catch (error) {
    console.error("Failed to fetch GitHub status:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub status" },
      { status: 500 },
    );
  }
}
```

---

## Real-World Integration Scenarios

### Scenario 1: Building an Admin Dashboard Feature

Complete example: Time tracking dashboard with filters and export.

```typescript
// app/admin/time-tracking/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function TimeTrackingDashboard() {
  const [timeEntries, setTimeEntries] = useState([]);
  const [summary, setSummary] = useState({ count: 0, totalHours: 0 });
  const [filters, setFilters] = useState({
    projectId: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeEntries();
  }, [filters]);

  const fetchTimeEntries = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    try {
      const response = await fetch(`/api/admin/time-entries?${params}`);
      const data = await response.json();

      setTimeEntries(data.timeEntries);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Project', 'Description', 'Duration (hours)'];
    const rows = timeEntries.map(entry => [
      new Date(entry.startedAt).toLocaleDateString(),
      entry.project.title,
      entry.description || '',
      (entry.durationMinutes / 60).toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracking-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div>
      <h1>Time Tracking Dashboard</h1>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.projectId}
          onChange={e => setFilters({ ...filters, projectId: e.target.value })}
        >
          <option value="">All Projects</option>
          {/* Project options */}
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={e => setFilters({ ...filters, startDate: e.target.value })}
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={e => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      {/* Summary */}
      <div className="summary">
        <div>Total Entries: {summary.count}</div>
        <div>Total Hours: {summary.totalHours}</div>
        <button onClick={exportToCSV}>Export to CSV</button>
      </div>

      {/* Time entries table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Description</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.map(entry => (
              <tr key={entry.id}>
                <td>{new Date(entry.startedAt).toLocaleDateString()}</td>
                <td>{entry.project.title}</td>
                <td>{entry.description}</td>
                <td>{(entry.durationMinutes / 60).toFixed(2)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Scenario 2: Discord Bot Integration

Complete Discord bot command that interacts with API.

```typescript
// bot/commands/project-status.ts
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { BaseCommand } from "./base-command";
import { ApiClient } from "../api-client";

export class ProjectStatusCommand extends BaseCommand {
  constructor() {
    super({
      name: "project-status",
      description: "Get project status overview",
      data: new SlashCommandBuilder()
        .setName("project-status")
        .setDescription("Get project status overview"),
    });
  }

  async execute(interaction: any) {
    await interaction.deferReply();

    try {
      const apiClient = new ApiClient();
      const { projects } = await apiClient.getProjects();

      // Group projects by status
      const grouped = projects.reduce(
        (acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle("📊 Project Status Overview")
        .setColor(0x0099ff)
        .addFields(
          {
            name: "📋 Planning",
            value: `${grouped.PLANNING || 0}`,
            inline: true,
          },
          {
            name: "🚀 In Progress",
            value: `${grouped.IN_PROGRESS || 0}`,
            inline: true,
          },
          { name: "👀 Review", value: `${grouped.REVIEW || 0}`, inline: true },
          {
            name: "✅ Complete",
            value: `${grouped.COMPLETE || 0}`,
            inline: true,
          },
          {
            name: "📦 Archived",
            value: `${grouped.ARCHIVED || 0}`,
            inline: true,
          },
          { name: "📈 Total", value: `${projects.length}`, inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: `❌ Failed to fetch project status: ${error.message}`,
      });
    }
  }
}
```

---

## Error Handling Patterns

### Centralized Error Handler

```typescript
// lib/errors/api-error-handler.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 },
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Resource already exists" },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }
  }

  // Default error
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

**Usage:**

```typescript
// app/api/admin/projects/route.ts
import { handleApiError } from "@/lib/errors/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    // API logic
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Client-Side Error Handling

```typescript
// lib/api-client.ts
export class ApiClient {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`/api${endpoint}`, options);

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(
          error.error || "Request failed",
          response.status,
          error.details,
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Network error", 0);
    }
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

**Usage:**

```typescript
try {
  const project = await apiClient.createProject(data);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      // Handle validation error
      console.log(error.details);
    } else if (error.status === 401) {
      // Handle auth error
      window.location.href = "/login";
    }
  }
}
```

---

## Related Documentation

- **[API Reference](README.md)** - Complete API endpoint documentation
- **[Authentication Guide](../guides/security.md)** - Security best practices
- **[Database Guide](../guides/database-management.md)** - Prisma query patterns
- **[Discord Bot Guide](../guides/discord-bot-development.md)** - Bot development

---

**Last Updated:** 2026-01-07
**Maintained by:** Sunny Stack Development Team

**Questions?** See [Getting Help](../guides/contributing.md#getting-help) in the Contributing Guide.
