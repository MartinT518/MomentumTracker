import { beforeAll, afterAll } from 'vitest';

// Set up test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-session-secret';
  
  // Use test database if available, otherwise use the existing DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set for integration tests. Tests may fail.');
  }
});

afterAll(() => {
  // Clean up any test-specific environment variables if needed
});