// User Role Definitions and Permissions System

export type UserRole = 'user' | 'coach' | 'admin';

export interface Permission {
  resource: string;
  action: string;
  scope?: string;
}

// Define base permissions for regular users
const USER_PERMISSIONS: Permission[] = [
  // Personal data management
  { resource: 'profile', action: 'read', scope: 'own' },
  { resource: 'profile', action: 'update', scope: 'own' },
  { resource: 'activities', action: 'create', scope: 'own' },
  { resource: 'activities', action: 'read', scope: 'own' },
  { resource: 'activities', action: 'update', scope: 'own' },
  { resource: 'activities', action: 'delete', scope: 'own' },
  
  // Goals and training
  { resource: 'goals', action: 'create', scope: 'own' },
  { resource: 'goals', action: 'read', scope: 'own' },
  { resource: 'goals', action: 'update', scope: 'own' },
  { resource: 'goals', action: 'delete', scope: 'own' },
  { resource: 'training-plans', action: 'create', scope: 'own' },
  { resource: 'training-plans', action: 'read', scope: 'own' },
  { resource: 'training-plans', action: 'update', scope: 'own' },
  
  // Health metrics
  { resource: 'health-metrics', action: 'create', scope: 'own' },
  { resource: 'health-metrics', action: 'read', scope: 'own' },
  { resource: 'health-metrics', action: 'update', scope: 'own' },
  
  // Coaching (premium feature)
  { resource: 'coaching-sessions', action: 'create', scope: 'own' },
  { resource: 'coaching-sessions', action: 'read', scope: 'own' },
  { resource: 'coaches', action: 'read', scope: 'public' },
  
  // Subscriptions
  { resource: 'subscription', action: 'read', scope: 'own' },
  { resource: 'subscription', action: 'update', scope: 'own' },
  
  // Integrations
  { resource: 'integrations', action: 'create', scope: 'own' },
  { resource: 'integrations', action: 'read', scope: 'own' },
  { resource: 'integrations', action: 'update', scope: 'own' },
  { resource: 'integrations', action: 'delete', scope: 'own' },
  
  // Community features
  { resource: 'achievements', action: 'read', scope: 'own' },
  { resource: 'challenges', action: 'read', scope: 'public' },
  { resource: 'challenges', action: 'join', scope: 'public' },
];

// Additional permissions for coaches
const COACH_ADDITIONAL_PERMISSIONS: Permission[] = [
  // Coach profile management
  { resource: 'coach-profile', action: 'read', scope: 'own' },
  { resource: 'coach-profile', action: 'update', scope: 'own' },
  { resource: 'coach-availability', action: 'update', scope: 'own' },
  
  // Client management
  { resource: 'clients', action: 'read', scope: 'assigned' },
  { resource: 'client-activities', action: 'read', scope: 'assigned' },
  { resource: 'client-goals', action: 'read', scope: 'assigned' },
  { resource: 'client-health-metrics', action: 'read', scope: 'assigned' },
  
  // Coaching sessions
  { resource: 'coaching-sessions', action: 'read', scope: 'assigned' },
  { resource: 'coaching-sessions', action: 'update', scope: 'assigned' },
  { resource: 'coaching-chat', action: 'create', scope: 'assigned' },
  { resource: 'coaching-chat', action: 'read', scope: 'assigned' },
  
  // Training plan recommendations
  { resource: 'training-recommendations', action: 'create', scope: 'assigned' },
  { resource: 'training-adjustments', action: 'create', scope: 'assigned' },
  
  // Coach analytics
  { resource: 'coach-analytics', action: 'read', scope: 'own' },
  { resource: 'session-history', action: 'read', scope: 'own' },
  { resource: 'client-progress', action: 'read', scope: 'assigned' },
  
  // Earnings and payments
  { resource: 'earnings', action: 'read', scope: 'own' },
  { resource: 'payment-history', action: 'read', scope: 'own' },
];

// Additional permissions for admins
const ADMIN_ADDITIONAL_PERMISSIONS: Permission[] = [
  // User management
  { resource: 'users', action: 'create', scope: 'all' },
  { resource: 'users', action: 'read', scope: 'all' },
  { resource: 'users', action: 'update', scope: 'all' },
  { resource: 'users', action: 'delete', scope: 'all' },
  { resource: 'user-roles', action: 'update', scope: 'all' },
  { resource: 'user-permissions', action: 'update', scope: 'all' },
  
  // Coach management
  { resource: 'coaches', action: 'create', scope: 'all' },
  { resource: 'coaches', action: 'update', scope: 'all' },
  { resource: 'coaches', action: 'delete', scope: 'all' },
  { resource: 'coach-verification', action: 'update', scope: 'all' },
  { resource: 'coach-assignments', action: 'create', scope: 'all' },
  { resource: 'coach-assignments', action: 'update', scope: 'all' },
  
  // System administration
  { resource: 'system-settings', action: 'read', scope: 'all' },
  { resource: 'system-settings', action: 'update', scope: 'all' },
  { resource: 'integrations', action: 'read', scope: 'all' },
  { resource: 'integrations', action: 'update', scope: 'all' },
  
  // Analytics and reporting
  { resource: 'platform-analytics', action: 'read', scope: 'all' },
  { resource: 'user-analytics', action: 'read', scope: 'all' },
  { resource: 'coach-analytics', action: 'read', scope: 'all' },
  { resource: 'revenue-analytics', action: 'read', scope: 'all' },
  
  // Content management
  { resource: 'challenges', action: 'create', scope: 'all' },
  { resource: 'challenges', action: 'update', scope: 'all' },
  { resource: 'challenges', action: 'delete', scope: 'all' },
  { resource: 'achievements', action: 'create', scope: 'all' },
  { resource: 'achievements', action: 'update', scope: 'all' },
  
  // Financial management
  { resource: 'payments', action: 'read', scope: 'all' },
  { resource: 'subscriptions', action: 'read', scope: 'all' },
  { resource: 'subscriptions', action: 'update', scope: 'all' },
  { resource: 'refunds', action: 'create', scope: 'all' },
  
  // Support and moderation
  { resource: 'support-tickets', action: 'read', scope: 'all' },
  { resource: 'support-tickets', action: 'update', scope: 'all' },
  { resource: 'user-reports', action: 'read', scope: 'all' },
  { resource: 'content-moderation', action: 'update', scope: 'all' },
];

// Combine permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: USER_PERMISSIONS,
  coach: [...USER_PERMISSIONS, ...COACH_ADDITIONAL_PERMISSIONS],
  admin: [...USER_PERMISSIONS, ...COACH_ADDITIONAL_PERMISSIONS, ...ADMIN_ADDITIONAL_PERMISSIONS],
};

// User Role Descriptions and Key Functions
export const USER_ROLE_DESCRIPTIONS = {
  user: {
    name: 'Regular User',
    description: 'Athletes and runners who use the platform for personal training',
    keyFunctions: [
      'Create and track personal running goals',
      'Log and monitor training activities',
      'Generate AI-powered training plans',
      'Track health metrics (weight, heart rate, etc.)',
      'Connect fitness devices and apps (Strava, Garmin, etc.)',
      'Access premium coaching services (with subscription)',
      'Participate in community challenges',
      'Earn achievements and track progress',
      'Manage subscription and payment settings',
      'Access nutrition planning and meal suggestions',
    ],
    restrictions: [
      'Cannot access other users\' private data',
      'Cannot modify coach profiles or assignments',
      'Cannot access admin panel or system settings',
      'Premium features require active subscription',
    ],
  },

  coach: {
    name: 'Coach User',
    description: 'Certified running coaches who provide personalized training guidance',
    keyFunctions: [
      'All regular user functions',
      'Manage coach profile and certifications',
      'Set availability and hourly rates',
      'View assigned client profiles and training data',
      'Conduct real-time coaching sessions via chat',
      'Create personalized training recommendations',
      'Adjust and modify client training plans',
      'Track client progress and performance',
      'Access client health metrics and activity history',
      'Manage coaching session scheduling',
      'View earnings and payment history',
      'Receive notifications for new client assignments',
    ],
    restrictions: [
      'Can only access data for assigned clients',
      'Cannot modify other coaches\' profiles',
      'Cannot access admin functions or user management',
      'Cannot view platform-wide analytics',
      'Must maintain active coach certification',
    ],
  },

  admin: {
    name: 'Admin User',
    description: 'Platform administrators with full system access',
    keyFunctions: [
      'All coach and user functions',
      'Manage all user accounts and profiles',
      'Create, update, and deactivate user accounts',
      'Assign and modify user roles and permissions',
      'Manage coach verification and certification',
      'Create and assign coach-client relationships',
      'Access platform-wide analytics and reporting',
      'Monitor system performance and usage',
      'Manage integration settings and API keys',
      'Create and manage community challenges',
      'Moderate user content and handle reports',
      'Process refunds and subscription changes',
      'Access financial reporting and revenue analytics',
      'Manage system settings and configuration',
      'Handle customer support escalations',
    ],
    restrictions: [
      'Must follow data privacy regulations',
      'Actions are logged for audit purposes',
      'Cannot access user payment information directly',
      'Must have proper authorization for sensitive operations',
    ],
  },
};

// Helper function to check if a user has a specific permission
export function hasPermission(
  userRole: UserRole, 
  resource: string, 
  action: string, 
  scope?: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.some(permission => 
    permission.resource === resource && 
    permission.action === action &&
    (!scope || !permission.scope || permission.scope === scope || permission.scope === 'all')
  );
}

// Helper function to get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Helper function to check if user can access a resource
export function canAccessResource(userRole: UserRole, resource: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.some(permission => permission.resource === resource);
}