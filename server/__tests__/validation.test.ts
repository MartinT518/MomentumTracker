import { describe, it, expect, vi } from 'vitest';
import { validateRequest, validateQuery, validateParams } from '@/server/middleware/validation';
import { z } from 'zod';

describe('Validation Middleware', () => {
  const mockReq = {
    body: {},
    query: {},
    params: {},
  } as any;

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as any;

  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateRequest', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
    });

    it('should pass validation with valid data', () => {
      mockReq.body = { name: 'John', age: 25 };
      
      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid data', () => {
      mockReq.body = { name: '', age: -1 };
      
      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            path: 'age',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle non-Zod errors', () => {
      const errorSchema = {
        parse: () => {
          throw new Error('Custom error');
        },
      } as any;

      const middleware = validateRequest(errorSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.string().transform(Number).pipe(z.number().int().min(1)),
      limit: z.string().transform(Number).pipe(z.number().int().max(100)),
    });

    it('should pass validation with valid query params', () => {
      mockReq.query = { page: '1', limit: '10' };
      
      const middleware = validateQuery(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail validation with invalid query params', () => {
      mockReq.query = { page: '0', limit: '200' };
      
      const middleware = validateQuery(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Query validation failed',
        details: expect.any(Array),
      });
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().regex(/^\d+$/, 'ID must be numeric'),
    });

    it('should pass validation with valid params', () => {
      mockReq.params = { id: '123' };
      
      const middleware = validateParams(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail validation with invalid params', () => {
      mockReq.params = { id: 'abc' };
      
      const middleware = validateParams(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Parameter validation failed',
        details: expect.any(Array),
      });
    });
  });
});

