import { Request, Response, NextFunction } from 'express';
import { UserRole, hasPermission } from '@shared/user-roles';

// Extend Express Request type to include user role info
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email?: string;
      role: UserRole;
    }
  }
}

// Middleware to check if user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware to check if user has admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  ensureAuthenticated(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// Middleware to check if user has coach role or higher
export function requireCoach(req: Request, res: Response, next: NextFunction) {
  ensureAuthenticated(req, res, () => {
    if (!['coach', 'admin'].includes(req.user?.role as string)) {
      return res.status(403).json({ error: 'Coach access required' });
    }
    next();
  });
}

// Middleware to check specific permissions
export function requirePermission(resource: string, action: string, scope?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    ensureAuthenticated(req, res, () => {
      const userRole = req.user?.role as UserRole;
      
      if (!hasPermission(userRole, resource, action, scope)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: { resource, action, scope }
        });
      }
      next();
    });
    
    next();
  };
}

// Middleware to check if user can access own resources or has admin privileges
export function requireOwnershipOrAdmin(getUserIdFromRequest: (req: Request) => number) {
  return (req: Request, res: Response, next: NextFunction) => {
    ensureAuthenticated(req, res, () => {
      const requestedUserId = getUserIdFromRequest(req);
      const isOwner = req.user?.id === requestedUserId;
      const isAdmin = req.user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied: can only access own resources' });
      }
      next();
    });
  };
}

// Middleware to check if coach can access assigned client data
export function requireCoachClientAccess(getClientIdFromRequest: (req: Request) => number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    ensureAuthenticated(req, res, () => {
      const clientId = getClientIdFromRequest(req);
      const isAdmin = req.user?.role === 'admin';
      
      if (isAdmin) {
        return next(); // Admins can access all client data
      }
      
      if (req.user?.role !== 'coach') {
        return res.status(403).json({ error: 'Coach access required' });
      }
      
      // TODO: Implement actual check if coach is assigned to this client
      console.log(`[TODO] Coach ${req.user?.id} needs to be verified for client ${clientId}`);
      next();
    });
  };
}

// Middleware to log user actions for audit trail
export function auditLog(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      console.log(`[AUDIT] User ${req.user.id} (${req.user.role}) performed action: ${action}`);
      // TODO: Implement actual storage of audit logs in database
    }
    next();
  };
}