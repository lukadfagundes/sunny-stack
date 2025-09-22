import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
<<<<<<< HEAD
=======
  timeout: 60000, // Increase from 30s to 60s
>>>>>>> dev
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
<<<<<<< HEAD
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
=======
  expect: {
    timeout: 10000, // Increase expect timeout
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 15000, // Increase action timeout
>>>>>>> dev
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})