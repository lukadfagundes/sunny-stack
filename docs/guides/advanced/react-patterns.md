# Advanced React Patterns

This guide covers advanced React patterns used in sunny-stack, with a focus on Next.js 15 App Router, React Server Components, and modern React 19 features.

## Table of Contents

- [Server Components vs Client Components](#server-components-vs-client-components)
- [Streaming and Suspense](#streaming-and-suspense)
- [Server Actions](#server-actions)
- [Optimistic Updates](#optimistic-updates)
- [Error Boundaries](#error-boundaries)
- [State Management Patterns](#state-management-patterns)

---

## Server Components vs Client Components

### Understanding the Difference

**Server Components** (default in App Router):

- Render on the server
- Have direct access to server-side resources (database, filesystem, secrets)
- Can use async/await for data fetching
- Reduce JavaScript bundle size (no client-side hydration)
- Cannot use hooks, event handlers, or browser APIs

**Client Components** (opt-in with `'use client'`):

- Render on both server (SSR) and client (hydration)
- Can use React hooks (useState, useEffect, etc.)
- Can add interactivity (onClick, onChange, etc.)
- Can use browser APIs (localStorage, window, etc.)
- Increase JavaScript bundle size

### When to Use Each

**Use Server Components (default) for:**

- Static content and layouts
- Data fetching from databases or APIs
- SEO-critical content
- Components with no interactivity
- Reducing client-side JavaScript

**Use Client Components for:**

- Interactive UI (forms, buttons with handlers)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, geolocation)
- Event listeners (onClick, onChange)
- Third-party libraries that rely on client-side features

### Pattern: Composing Server and Client Components

**✅ GOOD: Server Component with Client Component Children**

```tsx
// app/(admin)/admin/projects/page.tsx (Server Component)
import { ProjectList } from "@/components/admin/ProjectList"; // Client Component
import { prisma } from "@/lib/db/prisma";

export default async function ProjectsPage() {
  // Fetch data directly in Server Component
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Pass data as props to Client Component
  return (
    <div>
      <h1>Projects</h1>
      <ProjectList initialProjects={projects} />
    </div>
  );
}
```

```tsx
// components/admin/ProjectList.tsx (Client Component)
"use client";

import { useState } from "react";
import type { Project } from "@prisma/client";

interface ProjectListProps {
  initialProjects: Project[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState("all");

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true;
    return project.status === filter;
  });

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="ACTIVE">Active</option>
        <option value="COMPLETED">Completed</option>
      </select>

      <div>
        {filteredProjects.map((project) => (
          <div key={project.id}>{project.title}</div>
        ))}
      </div>
    </div>
  );
}
```

**❌ BAD: Server Component as Child of Client Component**

```tsx
// ❌ This will NOT work - Server Components cannot be children of Client Components
"use client";

import { ServerDataComponent } from "./ServerDataComponent"; // Server Component

export function ClientWrapper() {
  return (
    <div>
      <ServerDataComponent /> {/* ❌ ERROR */}
    </div>
  );
}
```

**✅ SOLUTION: Pass Server Component as Prop (Children Pattern)**

```tsx
// ClientWrapper.tsx
"use client";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrapper">
      {children} {/* ✅ Server Component passed as children */}
    </div>
  );
}

// page.tsx (Server Component)
import { ClientWrapper } from "./ClientWrapper";
import { ServerDataComponent } from "./ServerDataComponent";

export default function Page() {
  return (
    <ClientWrapper>
      <ServerDataComponent /> {/* ✅ Works */}
    </ClientWrapper>
  );
}
```

### Pattern: Minimize Client Boundaries

**✅ GOOD: Only Interactive Parts are Client Components**

```tsx
// app/quotes/page.tsx (Server Component)
import { QuoteForm } from "@/components/forms/QuoteForm"; // Client Component

export default function QuotePage() {
  return (
    <div>
      <h1>Request a Quote</h1>
      <p>Fill out the form below...</p>
      <QuoteForm /> {/* Only the form is a Client Component */}
    </div>
  );
}
```

**❌ BAD: Entire Page is Client Component**

```tsx
// ❌ Don't mark entire page as 'use client' just for one interactive form
"use client";

export default function QuotePage() {
  return (
    <div>
      <h1>Request a Quote</h1>
      <p>Fill out the form below...</p>
      <QuoteForm />
    </div>
  );
}
```

---

## Streaming and Suspense

### Understanding Streaming

Streaming allows parts of the UI to be sent to the client progressively, improving perceived performance by showing content as it becomes available.

### Pattern: Suspense Boundaries for Async Components

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { RecentQuotes } from "@/components/dashboard/RecentQuotes";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Each section loads independently */}
      <Suspense fallback={<ProjectsSkeleton />}>
        <RecentProjects />
      </Suspense>

      <Suspense fallback={<QuotesSkeleton />}>
        <RecentQuotes />
      </Suspense>
    </div>
  );
}
```

```tsx
// components/dashboard/RecentProjects.tsx (Server Component)
import { prisma } from "@/lib/db/prisma";

export async function RecentProjects() {
  // Slow query - but doesn't block the rest of the page
  const projects = await prisma.project.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2>Recent Projects</h2>
      {projects.map((project) => (
        <div key={project.id}>{project.title}</div>
      ))}
    </div>
  );
}
```

### Pattern: Loading States with `loading.tsx`

Next.js automatically wraps pages in Suspense if `loading.tsx` exists:

```tsx
// app/(admin)/admin/projects/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}
```

### Pattern: Parallel Data Fetching

```tsx
// ✅ GOOD: Fetch in parallel with Promise.all
export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch in parallel - both requests start simultaneously
  const [project, timeEntries] = await Promise.all([
    prisma.project.findUnique({ where: { id: params.id } }),
    prisma.timeEntry.findMany({ where: { projectId: params.id } }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div>
      <h1>{project.title}</h1>
      <TimeEntriesList entries={timeEntries} />
    </div>
  );
}
```

```tsx
// ❌ BAD: Sequential fetching (waterfall)
export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  // ❌ Waits for project before fetching time entries
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  const timeEntries = await prisma.timeEntry.findMany({
    where: { projectId: params.id },
  });

  // ...
}
```

---

## Server Actions

### Understanding Server Actions

Server Actions are asynchronous functions that run on the server, callable directly from Client Components. They replace traditional API routes for mutations.

### Pattern: Form Handling with Server Actions

```tsx
// app/actions/quotes.ts
"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const quoteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  projectType: z.string().min(1, "Project type is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export async function submitQuote(formData: FormData) {
  // 1. Validate input
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    projectType: formData.get("projectType"),
    description: formData.get("description"),
  };

  const validatedData = quoteSchema.parse(rawData);

  // 2. Database mutation
  const quote = await prisma.quote.create({
    data: {
      ...validatedData,
      status: "PENDING",
    },
  });

  // 3. Revalidate cache (refresh data on page)
  revalidatePath("/admin/quotes");

  // 4. Return result
  return { success: true, quoteId: quote.id };
}
```

```tsx
// components/forms/QuoteForm.tsx
"use client";

import { useFormStatus } from "react-dom";
import { submitQuote } from "@/app/actions/quotes";

export function QuoteForm() {
  async function handleSubmit(formData: FormData) {
    try {
      const result = await submitQuote(formData);
      console.log("Quote submitted:", result.quoteId);
    } catch (error) {
      console.error("Failed to submit quote:", error);
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <input name="projectType" required />
      <textarea name="description" required />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit Quote"}
    </button>
  );
}
```

### Pattern: Optimistic Updates with Server Actions

See [Optimistic Updates](#optimistic-updates) section below.

### Pattern: Error Handling in Server Actions

```tsx
// app/actions/projects.ts
"use server";

import { prisma } from "@/lib/db/prisma";
import { AppError, ValidationError } from "@/lib/errors/app-error";

export async function updateProjectStatus(projectId: string, status: string) {
  try {
    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Validate status
    const validStatuses = ["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"];
    if (!validStatuses.includes(status)) {
      throw new ValidationError("Invalid status value", "status");
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status },
    });

    return { success: true, project: updatedProject };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

---

## Optimistic Updates

### Understanding Optimistic Updates

Optimistic updates improve perceived performance by updating the UI immediately before the server confirms the change.

### Pattern: Optimistic Update with useOptimistic

```tsx
// components/admin/ProjectStatusToggle.tsx
"use client";

import { useOptimistic } from "react";
import { updateProjectStatus } from "@/app/actions/projects";
import type { Project } from "@prisma/client";

interface ProjectStatusToggleProps {
  project: Project;
}

export function ProjectStatusToggle({ project }: ProjectStatusToggleProps) {
  const [optimisticProject, setOptimisticProject] = useOptimistic(
    project,
    (currentProject, newStatus: string) => ({
      ...currentProject,
      status: newStatus,
    }),
  );

  async function handleStatusChange(newStatus: string) {
    // 1. Update UI optimistically (immediate feedback)
    setOptimisticProject(newStatus);

    // 2. Send to server (async)
    const result = await updateProjectStatus(project.id, newStatus);

    // 3. If failed, UI will automatically revert to server state
    if (!result.success) {
      console.error("Failed to update status:", result.error);
    }
  }

  return (
    <select
      value={optimisticProject.status}
      onChange={(e) => handleStatusChange(e.target.value)}
    >
      <option value="PLANNING">Planning</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="COMPLETED">Completed</option>
      <option value="ON_HOLD">On Hold</option>
    </select>
  );
}
```

### Pattern: Optimistic List Updates

```tsx
// components/admin/ProjectList.tsx
"use client";

import { useOptimistic } from "react";
import { deleteProject } from "@/app/actions/projects";
import type { Project } from "@prisma/client";

interface ProjectListProps {
  initialProjects: Project[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [optimisticProjects, removeOptimisticProject] = useOptimistic(
    initialProjects,
    (currentProjects, projectIdToRemove: string) =>
      currentProjects.filter((p) => p.id !== projectIdToRemove),
  );

  async function handleDelete(projectId: string) {
    // 1. Remove from UI optimistically
    removeOptimisticProject(projectId);

    // 2. Delete on server
    const result = await deleteProject(projectId);

    if (!result.success) {
      alert("Failed to delete project: " + result.error);
      // UI will automatically restore deleted item
    }
  }

  return (
    <div>
      {optimisticProjects.map((project) => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <button onClick={() => handleDelete(project.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Error Boundaries

### Understanding Error Boundaries

Error boundaries catch JavaScript errors anywhere in the component tree and display a fallback UI instead of crashing the entire app.

### Pattern: Page-Level Error Boundary

Next.js automatically creates error boundaries when you export an `error.tsx` file:

```tsx
// app/(admin)/admin/projects/error.tsx
"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Projects page error:", error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Pattern: Custom Error Boundary Component

```tsx
// components/ErrorBoundary.tsx
"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

```tsx
// Usage
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function DashboardWidget() {
  return (
    <ErrorBoundary fallback={<div>Failed to load widget</div>}>
      <ComplexWidget />
    </ErrorBoundary>
  );
}
```

---

## State Management Patterns

### Pattern: Context for Shared State

```tsx
// contexts/ThemeContext.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

```tsx
// Usage in layout.tsx
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

```tsx
// Usage in component
"use client";

import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return <button onClick={toggleTheme}>Current theme: {theme}</button>;
}
```

### Pattern: URL State with useSearchParams

```tsx
// components/admin/ProjectFilters.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";

export function ProjectFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sortBy") || "createdAt";

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div>
      <select
        value={status}
        onChange={(e) => updateFilters("status", e.target.value)}
      >
        <option value="all">All</option>
        <option value="ACTIVE">Active</option>
        <option value="COMPLETED">Completed</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => updateFilters("sortBy", e.target.value)}
      >
        <option value="createdAt">Created Date</option>
        <option value="title">Title</option>
        <option value="deadline">Deadline</option>
      </select>
    </div>
  );
}
```

### Pattern: Local Storage Persistence

```tsx
// hooks/useLocalStorage.ts
"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store the value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error loading localStorage key "${key}":`, error);
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  // Update localStorage when value changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isHydrated] as const;
}
```

```tsx
// Usage
"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";

export function UserPreferences() {
  const [preferences, setPreferences, isHydrated] = useLocalStorage(
    "userPrefs",
    {
      notifications: true,
      compactView: false,
    },
  );

  if (!isHydrated) {
    // Prevent hydration mismatch by showing placeholder
    return <div>Loading preferences...</div>;
  }

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={preferences.notifications}
          onChange={(e) =>
            setPreferences({ ...preferences, notifications: e.target.checked })
          }
        />
        Enable notifications
      </label>
    </div>
  );
}
```

---

## Best Practices Summary

### Server Components

- ✅ Use by default for static content and data fetching
- ✅ Fetch data directly from database
- ✅ Keep components async when fetching data
- ❌ Don't use hooks or browser APIs
- ❌ Don't add event handlers

### Client Components

- ✅ Use only when needed (interactivity, hooks, browser APIs)
- ✅ Mark with `'use client'` at the top
- ✅ Keep as small as possible (minimize client bundle)
- ❌ Don't fetch data directly (use Server Components or Server Actions)

### Performance

- ✅ Use Suspense for progressive rendering
- ✅ Implement loading states (`loading.tsx`)
- ✅ Fetch data in parallel with `Promise.all`
- ✅ Use optimistic updates for immediate feedback
- ❌ Avoid waterfalls (sequential data fetching)

### Error Handling

- ✅ Implement error boundaries (`error.tsx`)
- ✅ Provide meaningful error messages
- ✅ Log errors to monitoring service
- ✅ Offer recovery mechanisms (reset button)

### State Management

- ✅ Use URL state for shareable filters
- ✅ Use Context for global UI state (theme, auth)
- ✅ Use Server Actions for mutations
- ✅ Use localStorage for user preferences
- ❌ Avoid over-complicating with external state libraries

---

## Related Documentation

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

**Last Updated:** 2026-01-07
