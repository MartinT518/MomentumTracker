import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryClient, apiRequest, getQueryFn } from './queryClient';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('queryClient utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    localStorage.clear();
  });

  describe('apiRequest', () => {
    it('should make GET requests correctly', async () => {
      // Mock the fetch response
      const mockData = { id: 1, name: 'Test Data' };
      server.use(
        http.get('/api/test', () => {
          return HttpResponse.json(mockData, { status: 200 });
        })
      );

      const response = await apiRequest('GET', '/api/test');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockData);
    });

    it('should make POST requests with data correctly', async () => {
      const postData = { name: 'New Item' };
      const mockResponse = { id: 1, ...postData };

      // Mock the fetch response
      server.use(
        http.post('/api/test', async ({ request }) => {
          const body = await request.json();
          // Check if the request body contains the data we sent
          if (body.name === postData.name) {
            return HttpResponse.json(mockResponse, { status: 201 });
          }
          return HttpResponse.json({ error: 'Invalid data' }, { status: 400 });
        })
      );

      const response = await apiRequest('POST', '/api/test', postData);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockResponse);
    });

    it('should handle error responses', async () => {
      // Mock a 400 error response
      server.use(
        http.get('/api/error', () => {
          return HttpResponse.json({ message: 'Bad Request' }, { status: 400 });
        })
      );

      try {
        await apiRequest('GET', '/api/error');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('HTTP error');
      }
    });

    it('should handle 401 unauthorized errors', async () => {
      // Mock a 401 error response
      server.use(
        http.get('/api/unauthorized', () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        })
      );

      try {
        await apiRequest('GET', '/api/unauthorized');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Unauthorized');
      }
    });
  });

  describe('getQueryFn', () => {
    it('should return a function that calls apiRequest', async () => {
      const mockData = { id: 1, name: 'Test Data' };
      server.use(
        http.get('/api/test-query', () => {
          return HttpResponse.json(mockData, { status: 200 });
        })
      );

      const queryFn = getQueryFn();
      const result = await queryFn({ queryKey: ['/api/test-query'] });

      expect(result).toEqual(mockData);
    });

    it('should handle 401 errors according to the on401 option', async () => {
      // Mock a 401 error response
      server.use(
        http.get('/api/test-401', () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        })
      );

      // With 'throw' option (default)
      const queryFnThrow = getQueryFn();
      try {
        await queryFnThrow({ queryKey: ['/api/test-401'] });
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Unauthorized');
      }

      // With 'returnNull' option
      const queryFnReturnNull = getQueryFn({ on401: 'returnNull' });
      const result = await queryFnReturnNull({ queryKey: ['/api/test-401'] });
      expect(result).toBeUndefined();
    });
  });
});