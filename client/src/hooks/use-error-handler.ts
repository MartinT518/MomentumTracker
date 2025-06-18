import { useEffect } from 'react';

interface UseAsyncErrorOptions {
  onError?: (error: Error) => void;
}

export function useAsyncError(options: UseAsyncErrorOptions = {}) {
  const throwError = (error: Error) => {
    if (options.onError) {
      options.onError(error);
    } else {
      // This will be caught by the nearest error boundary
      throw error;
    }
  };

  return throwError;
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior
    event.preventDefault();
    
    // You could send this to an error reporting service
    // reportError(event.reason);
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // You could send this to an error reporting service
    // reportError(event.error);
  });
}

// Call this in your main.tsx
export function initializeErrorHandling() {
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandling();
  }
}

