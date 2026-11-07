import { defineConfig, devices } from '@playwright/test'

// The Docker stack, the dev server or the deployed site: these only use the UI.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

// Behaviour is the same in every engine, so the journeys run on one. What does
// differ is rendering, and those checks run everywhere.
const EVERYWHERE = /0(1|4|5)-.*\.spec\.ts/

export default defineConfig({
  testDir: './e2e',
  // One at a time: these write to a shared database.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'e2e-report', open: 'never' }]],

  use: {
    baseURL,
    // Every run leaves a trace, not only the failures. That is the evidence.
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: EVERYWHERE },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: EVERYWHERE },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] }, testMatch: EVERYWHERE },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] }, testMatch: EVERYWHERE },
  ],
})
