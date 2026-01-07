# Advanced Database Seeding Strategies

Comprehensive guide for advanced database seeding strategies in Sunny Stack Portfolio. This document extends the basic seeding covered in [Database Management Guide](database-management.md#database-seeding).

## Table of Contents

- [Seed Data Strategy](#seed-data-strategy)
- [Environment-Specific Seeding](#environment-specific-seeding)
- [Idempotent Seed Scripts](#idempotent-seed-scripts)
- [Seed Data Generation](#seed-data-generation)
- [Complex Relationships](#complex-relationships)
- [Resetting and Reseeding](#resetting-and-reseeding)
- [CI/CD Integration](#cicd-integration)

---

## Seed Data Strategy

### Overview

Database seeding serves different purposes across environments:

| Environment     | Purpose                 | Data Volume | Data Type             |
| --------------- | ----------------------- | ----------- | --------------------- |
| **Production**  | Essential system data   | Minimal     | Real admin, config    |
| **Staging**     | Production-like testing | Medium      | Anonymized realistic  |
| **Development** | Feature development     | Rich        | Diverse test cases    |
| **Testing**     | Automated tests         | Minimal     | Predictable, isolated |

### Strategy Breakdown

**Production Environment:**

- Admin user(s) only
- System configuration
- Essential lookup data
- **Never** seed client/project data in production

**Staging Environment:**

- Production essentials PLUS
- Anonymized sample projects
- Realistic quote data
- Historical time entries
- Purpose: Integration testing, client demos

**Development Environment:**

- All statuses represented
- Edge cases covered
- Diverse data for UI testing
- Enough data to test pagination
- Purpose: Feature development, debugging

**Testing Environment:**

- Minimal predictable data
- Isolated per test suite
- Deterministic values
- Purpose: Automated testing only

---

## Environment-Specific Seeding

### Complete Seed Script Example

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const environment = process.env.NODE_ENV || "development";

  console.log(`🌱 Seeding database for ${environment} environment...`);

  switch (environment) {
    case "production":
      await seedProduction();
      break;
    case "staging":
      await seedStaging();
      break;
    case "test":
      await seedTest();
      break;
    default:
      await seedDevelopment();
  }

  console.log("✅ Seeding completed!");
}

// ============================================================================
// PRODUCTION SEEDING (Minimal Essentials)
// ============================================================================

async function seedProduction() {
  console.log("🔒 Production seeding: Essential data only");

  // Create admin user if not exists (idempotent)
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@sunny-stack.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@sunny-stack.com",
      name: "Admin User",
    },
  });

  console.log("✅ Admin user ready:", admin.email);

  // Create essential system configuration
  await prisma.systemConfig.upsert({
    where: { key: "app_version" },
    update: { value: "2.0.2" },
    create: {
      key: "app_version",
      value: "2.0.2",
      description: "Current application version",
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "maintenance_mode" },
    update: {},
    create: {
      key: "maintenance_mode",
      value: "false",
      description: "System maintenance mode flag",
    },
  });

  console.log("✅ System configuration ready");
}

// ============================================================================
// STAGING SEEDING (Production-like Data)
// ============================================================================

async function seedStaging() {
  console.log("🚀 Staging seeding: Production-like dataset");

  // Include production essentials
  await seedProduction();

  // Create sample projects (realistic but anonymized)
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        title: "Corporate Website Redesign",
        clientName: "Acme Corporation",
        clientEmail: "staging-client-1@example.com",
        description: "Complete website overhaul with modern design system",
        status: "IN_PROGRESS",
        budget: 15000,
        deadline: addDays(new Date(), 60), // 60 days from now
      },
    }),
    prisma.project.create({
      data: {
        title: "E-commerce Platform Development",
        clientName: "Shop Inc",
        clientEmail: "staging-client-2@example.com",
        description: "Custom e-commerce solution with payment integration",
        status: "PLANNING",
        budget: 50000,
        deadline: addDays(new Date(), 120), // 120 days from now
      },
    }),
    prisma.project.create({
      data: {
        title: "Mobile App Development",
        clientName: "Tech Startup LLC",
        clientEmail: "staging-client-3@example.com",
        description: "iOS and Android mobile application",
        status: "REVIEW",
        budget: 75000,
        deadline: addDays(new Date(), 30), // 30 days from now
      },
    }),
  ]);

  console.log("✅ Created projects:", projects.length);

  // Create sample quotes
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        name: "John Staging",
        email: "staging-quote-1@example.com",
        phone: "+15555550101",
        company: "StartupCo",
        projectType: "Web Development",
        budgetRange: "$10,000 - $25,000",
        timeline: "3-4 months",
        description: "Need a professional website for my business",
        requirements: "SEO optimized, mobile responsive, CMS integration",
        status: "PENDING",
      },
    }),
    prisma.quote.create({
      data: {
        name: "Jane Staging",
        email: "staging-quote-2@example.com",
        projectType: "Mobile App",
        budgetRange: "$25,000 - $50,000",
        timeline: "4-6 months",
        description: "Looking for mobile app development services",
        status: "APPROVED",
        reviewedAt: addDays(new Date(), -2),
      },
    }),
  ]);

  console.log("✅ Created quotes:", quotes.length);

  // Create realistic time entries for each project
  for (const project of projects) {
    await prisma.timeEntry.createMany({
      data: [
        {
          projectId: project.id,
          description: "Initial planning meeting with client",
          startedAt: addDays(new Date(), -7),
          endedAt: addHours(addDays(new Date(), -7), 2),
          durationMinutes: 120,
          loggedVia: "admin",
        },
        {
          projectId: project.id,
          description: "Requirements analysis and documentation",
          startedAt: addDays(new Date(), -5),
          endedAt: addHours(addDays(new Date(), -5), 3),
          durationMinutes: 180,
          loggedVia: "admin",
        },
        {
          projectId: project.id,
          description: "Design mockups and wireframes",
          startedAt: addDays(new Date(), -3),
          endedAt: addHours(addDays(new Date(), -3), 4),
          durationMinutes: 240,
          loggedVia: "discord",
        },
      ],
    });
  }

  console.log("✅ Created time entries");
}

// ============================================================================
// DEVELOPMENT SEEDING (Rich Dataset)
// ============================================================================

async function seedDevelopment() {
  console.log("🛠️  Development seeding: Rich dataset");

  // Include production essentials
  await seedProduction();

  // Create development admin
  const devAdmin = await prisma.user.upsert({
    where: { email: "dev@sunny-stack.com" },
    update: {},
    create: {
      email: "dev@sunny-stack.com",
      name: "Dev Admin",
      googleId: "dev-google-id-123",
      avatar: "https://via.placeholder.com/150",
    },
  });

  console.log("✅ Created dev admin:", devAdmin.email);

  // Create diverse projects covering ALL statuses
  const projects = await Promise.all([
    // PLANNING status
    prisma.project.create({
      data: {
        title: "New SaaS Platform",
        clientName: "StartupCo",
        clientEmail: "contact@startupc.dev",
        description: "Building a SaaS platform for project management",
        status: "PLANNING",
        budget: 80000,
        deadline: new Date("2026-09-01"),
      },
    }),
    // IN_PROGRESS status
    prisma.project.create({
      data: {
        title: "Portfolio Website Redesign",
        clientName: "Acme Corp",
        clientEmail: "contact@acme.dev",
        description: "Complete redesign of company portfolio website",
        status: "IN_PROGRESS",
        budget: 15000,
        deadline: new Date("2026-03-15"),
      },
    }),
    prisma.project.create({
      data: {
        title: "CRM System Integration",
        clientName: "Sales Force Ltd",
        clientEmail: "it@salesforce.dev",
        description: "Integrate CRM with existing systems",
        status: "IN_PROGRESS",
        budget: 35000,
        deadline: new Date("2026-05-01"),
      },
    }),
    // REVIEW status
    prisma.project.create({
      data: {
        title: "Mobile Banking App",
        clientName: "FinTech Solutions",
        clientEmail: "info@fintech.dev",
        description: "Secure mobile banking application",
        status: "REVIEW",
        budget: 120000,
        deadline: new Date("2026-04-30"),
      },
    }),
    // COMPLETE status
    prisma.project.create({
      data: {
        title: "E-commerce Store",
        clientName: "Shop Inc",
        clientEmail: "info@shopinc.dev",
        description: "Custom e-commerce platform with Stripe",
        status: "COMPLETE",
        budget: 50000,
        deadline: new Date("2026-02-01"),
      },
    }),
    prisma.project.create({
      data: {
        title: "Blog Platform",
        clientName: "Content Creators Co",
        clientEmail: "blog@creators.dev",
        description: "Custom blogging platform with CMS",
        status: "COMPLETE",
        budget: 12000,
        deadline: new Date("2025-12-15"),
      },
    }),
    // ARCHIVED status
    prisma.project.create({
      data: {
        title: "Legacy System Migration",
        clientName: "Enterprise Co",
        clientEmail: "it@enterprise.dev",
        description: "Migrating legacy system to modern stack",
        status: "ARCHIVED",
        budget: 200000,
        deadline: new Date("2025-12-31"),
      },
    }),
  ]);

  console.log("✅ Created projects:", projects.length);

  // Create quotes with ALL statuses
  const quotes = await Promise.all([
    // PENDING quotes (multiple)
    prisma.quote.create({
      data: {
        name: "Alex Johnson",
        email: "alex@example.dev",
        phone: "+15555550101",
        company: "Tech Innovations",
        projectType: "Web Development",
        budgetRange: "$10,000 - $25,000",
        timeline: "3-4 months",
        description: "Need a modern web application for our services",
        requirements: "Mobile responsive, SEO optimized, Admin dashboard",
        status: "PENDING",
      },
    }),
    prisma.quote.create({
      data: {
        name: "Sarah Martinez",
        email: "sarah@example.dev",
        projectType: "Mobile App",
        budgetRange: "$25,000 - $50,000",
        timeline: "4-6 months",
        description: "iOS and Android app for fitness tracking",
        status: "PENDING",
      },
    }),
    prisma.quote.create({
      data: {
        name: "Robert Lee",
        email: "robert@example.dev",
        company: "Retail Chain Inc",
        projectType: "E-Commerce",
        budgetRange: "> $25,000",
        description: "Multi-store e-commerce platform",
        status: "PENDING",
      },
    }),
    // APPROVED quote
    prisma.quote.create({
      data: {
        name: "Michael Chen",
        email: "michael@example.dev",
        phone: "+15555550102",
        projectType: "E-Commerce",
        budgetRange: "$15,000 - $25,000",
        description: "E-commerce website with payment integration",
        status: "APPROVED",
        reviewedAt: addDays(new Date(), -2),
      },
    }),
    // DECLINED quote
    prisma.quote.create({
      data: {
        name: "Emily Taylor",
        email: "emily@example.dev",
        projectType: "Consulting",
        budgetRange: "< $5,000",
        description: "Technical consulting for system architecture",
        status: "DECLINED",
        reviewedAt: addDays(new Date(), -5),
      },
    }),
    // CONVERTED quote (linked to project)
    prisma.quote.create({
      data: {
        name: "David Wilson",
        email: "david@example.dev",
        phone: "+15555550103",
        projectType: "Web Development",
        budgetRange: "$10,000 - $25,000",
        description: "Portfolio website for freelance designer",
        requirements: "Portfolio showcase, contact form, blog",
        status: "CONVERTED",
        projectId: projects[1].id, // Link to IN_PROGRESS project
        reviewedAt: addDays(new Date(), -10),
      },
    }),
  ]);

  console.log("✅ Created quotes:", quotes.length);

  // Create comprehensive time entries
  for (const project of projects) {
    const entries = [];
    const daysAgo = [14, 12, 10, 7, 5, 3, 1];

    for (const day of daysAgo) {
      const startedAt = addDays(new Date(), -day);
      const durationMinutes = 120 + Math.floor(Math.random() * 180); // 2-5 hours
      const endedAt = addHours(startedAt, durationMinutes / 60);

      entries.push({
        projectId: project.id,
        description: getRandomDescription(),
        startedAt,
        endedAt,
        durationMinutes,
        loggedVia: day % 2 === 0 ? "discord" : "admin",
      });
    }

    await prisma.timeEntry.createMany({ data: entries });
  }

  console.log("✅ Created time entries");

  // Create monitoring events
  await prisma.monitoringEvent.createMany({
    data: [
      {
        type: "SERVICE_HEALTH",
        severity: "INFO",
        source: "vercel",
        message: "Vercel deployment successful",
        metadata: { deploymentId: "dpl_abc123", duration: 45 },
        timestamp: addHours(new Date(), -1),
      },
      {
        type: "SERVICE_HEALTH",
        severity: "WARNING",
        source: "github",
        message: "GitHub API rate limit approaching",
        metadata: { remaining: 150, limit: 5000 },
        timestamp: addHours(new Date(), -2),
      },
      {
        type: "DATABASE",
        severity: "INFO",
        source: "postgres",
        message: "Database backup completed",
        metadata: { size: "125MB", duration: 12 },
        timestamp: addHours(new Date(), -6),
      },
      {
        type: "API_ERROR",
        severity: "ERROR",
        source: "api/admin/projects",
        message: "Failed to create project: Validation error",
        metadata: { statusCode: 400, endpoint: "/api/admin/projects" },
        timestamp: addHours(new Date(), -12),
      },
    ],
  });

  console.log("✅ Created monitoring events");

  // Create Discord messages (audit log)
  await prisma.discordMessage.createMany({
    data: [
      {
        projectId: projects[0].id,
        messageId: "discord-msg-1",
        channelId: process.env.DISCORD_CHANNEL_ACTIVE_PROJECTS || "channel-123",
        content: `New project created: ${projects[0].title}`,
        timestamp: addDays(new Date(), -7),
      },
      {
        projectId: projects[1].id,
        messageId: "discord-msg-2",
        channelId: process.env.DISCORD_CHANNEL_ACTIVE_PROJECTS || "channel-123",
        content: `Project status updated to IN_PROGRESS: ${projects[1].title}`,
        timestamp: addDays(new Date(), -5),
      },
    ],
  });

  console.log("✅ Created Discord messages");
}

// ============================================================================
// TEST SEEDING (Minimal Predictable Data)
// ============================================================================

async function seedTest() {
  console.log("🧪 Test seeding: Minimal predictable data");

  // Create single test user
  await prisma.user.create({
    data: {
      id: "test-user-id-123",
      email: "test@example.com",
      name: "Test User",
      googleId: "test-google-id",
    },
  });

  // Create single test project
  await prisma.project.create({
    data: {
      id: "test-project-id-123",
      title: "Test Project",
      clientName: "Test Client",
      clientEmail: "client@test.com",
      status: "PLANNING",
      budget: 10000,
    },
  });

  // Create single test quote
  await prisma.quote.create({
    data: {
      id: "test-quote-id-123",
      name: "Test Quote",
      email: "quote@test.com",
      projectType: "Web Development",
      description: "Test quote description",
      status: "PENDING",
    },
  });

  console.log("✅ Created test data");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function getRandomDescription(): string {
  const descriptions = [
    "Development work on core features",
    "Code review and testing",
    "Client meeting and requirements gathering",
    "Bug fixes and optimizations",
    "Documentation and deployment",
    "UI/UX improvements",
    "Database schema design",
    "API endpoint development",
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Environment-Specific Seeds

```bash
# Development (rich dataset)
NODE_ENV=development npx prisma db seed

# Staging (production-like)
NODE_ENV=staging npx prisma db seed

# Production (essentials only)
NODE_ENV=production npx prisma db seed

# Test (isolated)
NODE_ENV=test npx prisma db seed

# Default (development)
npx prisma db seed
```

---

## Idempotent Seed Scripts

Idempotent seeds can be run multiple times safely without creating duplicates.

### Using `upsert`

```typescript
// Create OR update (safe to run multiple times)
const admin = await prisma.user.upsert({
  where: { email: "admin@example.com" },
  update: {
    name: "Admin User", // Update if exists
  },
  create: {
    email: "admin@example.com",
    name: "Admin User",
  },
});
```

### Check Before Creating

```typescript
// Only create if doesn't exist
const existingProject = await prisma.project.findFirst({
  where: { title: "Sample Project" },
});

if (!existingProject) {
  await prisma.project.create({
    data: {
      title: "Sample Project",
      clientName: "Sample Client",
      clientEmail: "client@example.com",
      status: "PLANNING",
    },
  });
}
```

### Using `createMany` with `skipDuplicates`

```typescript
// Batch create, skip duplicates based on unique constraints
await prisma.user.createMany({
  data: [
    { email: "admin@example.com", name: "Admin" },
    { email: "dev@example.com", name: "Developer" },
  ],
  skipDuplicates: true, // Skip if email already exists
});
```

---

## Seed Data Generation

### Using Faker for Realistic Data

```bash
# Install faker
npm install --save-dev @faker-js/faker
```

```typescript
// prisma/seed-helpers.ts
import { faker } from "@faker-js/faker";
import { ProjectStatus } from "@prisma/client";

export function generateProject() {
  return {
    title: faker.company.catchPhrase(),
    clientName: faker.company.name(),
    clientEmail: faker.internet.email(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement<ProjectStatus>([
      "PLANNING",
      "IN_PROGRESS",
      "REVIEW",
      "COMPLETE",
      "ARCHIVED",
    ]),
    budget: faker.number.int({ min: 5000, max: 100000 }),
    deadline: faker.date.future(),
  };
}

export function generateQuote() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    projectType: faker.helpers.arrayElement([
      "Web Development",
      "Mobile App",
      "E-Commerce",
      "Consulting",
    ]),
    budgetRange: faker.helpers.arrayElement([
      "< $5,000",
      "$5,000 - $10,000",
      "$10,000 - $25,000",
      "> $25,000",
    ]),
    timeline: faker.helpers.arrayElement([
      "1-2 months",
      "2-3 months",
      "3-6 months",
      "6+ months",
    ]),
    description: faker.lorem.paragraph(),
    requirements: faker.lorem.sentences(3),
    status: "PENDING",
  };
}

export function generateTimeEntry(projectId: string) {
  const startedAt = faker.date.past();
  const durationMinutes = faker.number.int({ min: 30, max: 480 });
  const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  return {
    projectId,
    description: faker.lorem.sentence(),
    startedAt,
    endedAt,
    durationMinutes,
    loggedVia: faker.helpers.arrayElement(["admin", "discord", "manual"]),
  };
}
```

### Using Generated Data

```typescript
// prisma/seed.ts
import {
  generateProject,
  generateQuote,
  generateTimeEntry,
} from "./seed-helpers";

// Generate 20 random projects
const projects = await Promise.all(
  Array.from({ length: 20 }, () =>
    prisma.project.create({
      data: generateProject(),
    }),
  ),
);

// Generate 50 random quotes
const quotes = await Promise.all(
  Array.from({ length: 50 }, () =>
    prisma.quote.create({
      data: generateQuote(),
    }),
  ),
);

// Generate time entries for each project
for (const project of projects) {
  const entries = Array.from({ length: 10 }, () =>
    generateTimeEntry(project.id),
  );
  await prisma.timeEntry.createMany({ data: entries });
}
```

---

## Complex Relationships

### Seeding with Foreign Keys

```typescript
// Create project first
const project = await prisma.project.create({
  data: {
    title: "Main Project",
    clientName: "Client Name",
    clientEmail: "client@example.com",
    status: "PLANNING",
  },
});

// Create related quote (references project)
const quote = await prisma.quote.create({
  data: {
    name: "John Doe",
    email: "john@example.com",
    projectType: "Web Development",
    description: "Quote description",
    status: "CONVERTED",
    projectId: project.id, // Foreign key
  },
});

// Create time entries for project
await prisma.timeEntry.createMany({
  data: [
    {
      projectId: project.id,
      description: "Work session 1",
      startedAt: new Date(),
      durationMinutes: 120,
      loggedVia: "admin",
    },
    {
      projectId: project.id,
      description: "Work session 2",
      startedAt: new Date(),
      durationMinutes: 180,
      loggedVia: "discord",
    },
  ],
});
```

### Nested Creates

```typescript
// Create project with nested relationships
const project = await prisma.project.create({
  data: {
    title: "E-commerce Platform",
    clientName: "Shop Inc",
    clientEmail: "shop@example.com",
    status: "IN_PROGRESS",
    // Nested creates
    quotes: {
      create: [
        {
          name: "Jane Doe",
          email: "jane@example.com",
          projectType: "E-Commerce",
          description: "Initial quote request",
          status: "CONVERTED",
        },
      ],
    },
    timeEntries: {
      create: [
        {
          description: "Initial setup",
          startedAt: new Date(),
          durationMinutes: 60,
          loggedVia: "admin",
        },
      ],
    },
  },
});
```

---

## Resetting and Reseeding

### Complete Database Reset (Development Only)

```bash
# WARNING: This deletes ALL data
npx prisma migrate reset

# This automatically:
# 1. Drops database
# 2. Creates database
# 3. Runs all migrations
# 4. Runs seed script
```

### Production-Safe Data Clearing

```bash
# 1. Backup first (ALWAYS)
docker compose exec postgres pg_dump -U sunnystack sunnystack > backup-before-clear.sql

# 2. Clear data only (keep schema)
docker compose exec postgres psql -U sunnystack sunnystack -c "
  TRUNCATE TABLE time_entries CASCADE;
  TRUNCATE TABLE proposals CASCADE;
  TRUNCATE TABLE quotes CASCADE;
  TRUNCATE TABLE projects CASCADE;
  TRUNCATE TABLE discord_messages CASCADE;
  TRUNCATE TABLE monitoring_events CASCADE;
  TRUNCATE TABLE users CASCADE;
"

# 3. Run seed
npx prisma db seed
```

### Selective Clearing

```typescript
// prisma/clear-db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");

  // Delete in reverse order of dependencies
  await prisma.timeEntry.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.project.deleteMany();
  await prisma.discordMessage.deleteMany();
  await prisma.monitoringEvent.deleteMany();
  await prisma.monitoringAlert.deleteMany();
  await prisma.serviceHealthCheck.deleteMany();

  // Keep users and system config
  // await prisma.user.deleteMany();
  // await prisma.systemConfig.deleteMany();

  console.log("✅ Database cleared");
}

clearDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Usage:**

```bash
# Clear all data except users/config
npx tsx prisma/clear-db.ts

# Then reseed
npx prisma db seed
```

### Clear and Reseed Script

```typescript
// prisma/seed.ts (enhanced)
async function main() {
  // Optional: Clear before seeding
  if (process.env.CLEAR_DB === "true") {
    console.log("🗑️  Clearing existing data...");
    await prisma.timeEntry.deleteMany();
    await prisma.proposal.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.project.deleteMany();
    await prisma.discordMessage.deleteMany();
    await prisma.monitoringEvent.deleteMany();
    console.log("✅ Database cleared");
  }

  // Continue with seeding...
  const environment = process.env.NODE_ENV || "development";
  // ...
}
```

**Usage:**

```bash
# Clear and reseed
CLEAR_DB=true npx prisma db seed
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/staging-deploy.yml
name: Deploy to Staging

on:
  push:
    branches: [dev]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Vercel
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      - name: Seed staging database
        run: NODE_ENV=staging npx prisma db seed
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
```

### Automated Seed on Pull Request

```yaml
# .github/workflows/pr-preview.yml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm ci

      - name: Create preview database
        run: |
          npx prisma migrate deploy
          NODE_ENV=development npx prisma db seed
        env:
          DATABASE_URL: ${{ secrets.PR_DATABASE_URL }}

      - name: Deploy preview
        run: vercel deploy
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Related Documentation

- **[Database Management Guide](database-management.md)** - Core database operations
- **[Testing Guide](testing.md)** - Test data strategies
- **[Pi Deployment](../deployment/PI-DEPLOYMENT.md)** - Production seeding

---

**Last Updated:** 2026-01-07
**Maintained by:** Sunny Stack Development Team
