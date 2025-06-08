import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireSubscription(level: 'monthly' | 'annual') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = req.user as any;
    
    if (user.subscription_status !== 'active') {
      return res.status(403).json({ 
        error: 'Active subscription required',
        required_level: level
      });
    }

    // Check subscription level for annual-only features
    if (level === 'annual') {
      // This would need to be implemented based on your subscription plan logic
      // For now, we'll assume all active subscriptions are valid
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = req.user as any;
  
  // This would need to be implemented based on your user role system
  // For now, we'll check if user has admin role (you'll need to add this to your schema)
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

