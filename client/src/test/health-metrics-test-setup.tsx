// This file should be imported at the top of health metrics test files
import { vi } from 'vitest';

// Mock the components that are causing issues
vi.mock('@/components/common/sidebar', () => ({
  default: () => null,
}));

vi.mock('@/components/common/mobile-menu', () => ({
  default: () => null,
}));

// Mock the auth hook to provide a fixed user
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    isLoading: false,
    error: null,
    loginMutation: { mutate: vi.fn(), isPending: false },
    registerMutation: { mutate: vi.fn(), isPending: false },
    logoutMutation: { mutate: vi.fn(), isPending: false },
  }),
}));