// Import the extensions to enhance Vitest
import '@testing-library/jest-dom';

// Create a setup for Jest DOM to work with Vitest
// This allows matchers like toBeInTheDocument() to work properly
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Jest DOM matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});