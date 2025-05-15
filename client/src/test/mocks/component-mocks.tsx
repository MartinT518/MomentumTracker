// component-mocks.tsx
// Make this a standalone file that will be imported in our test files

// The vi.mock calls have to be in the top level scope outside of any function
// Do NOT import React here as it will cause issues with the mocking

import { vi } from 'vitest';

// These mocks need to be at the top-level and will be hoisted
vi.mock('@/components/common/sidebar', () => {
  return {
    default: () => {
      const SidebarMock = () => {
        return {
          $$typeof: Symbol.for('react.element'),
          type: 'div',
          props: { 
            'data-testid': 'sidebar-mock',
            children: 'Sidebar Mock' 
          },
          ref: null
        };
      };
      return SidebarMock();
    }
  };
});

vi.mock('@/components/common/mobile-menu', () => {
  return {
    default: () => {
      const MobileMenuMock = () => {
        return {
          $$typeof: Symbol.for('react.element'),
          type: 'div',
          props: { 
            'data-testid': 'mobile-menu-mock',
            children: 'Mobile Menu Mock' 
          },
          ref: null
        };
      };
      return MobileMenuMock();
    }
  };
});