# React Testing Guide

## Overview

This project uses React for UI/UX with Material-UI (MUI) components and Matter.js for physics. All React components should have proper unit tests using React Testing Library.

## Testing Stack

- **React Testing Library** - Component testing with user-centric queries
- **Vitest** - Fast unit test runner with React support
- **@testing-library/user-event** - Simulate user interactions
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **happy-dom** - Lightweight DOM implementation for testing

## React DevTools Setup

### Development
React DevTools are automatically available in development mode. Open your browser's DevTools to access:

- **Components tab**: Inspect React component tree
- **Profiler tab**: Measure component performance

### Installation
For standalone React DevTools:
```bash
# Chrome/Edge
# Install from: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi

# Firefox
# Install from: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

## Running Tests

### Unit Tests (React Components)
```bash
# Run all tests
pnpm test:unit

# Watch mode
pnpm test:unit:watch

# With UI
pnpm test:unit:ui

# Coverage
pnpm test:coverage
```

### E2E Tests (Full Application)
```bash
# Headless
pnpm test:e2e

# With Playwright MCP (video capture)
PLAYWRIGHT_MCP=true pnpm test:e2e

# Headed mode
pnpm test:e2e:headed
```

## Writing React Component Tests

### Basic Component Test
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

### Testing with Store (Zustand)
```typescript
import { vi } from 'vitest';

vi.mock('@/game/store', () => ({
  useStore: vi.fn(() => ({
    health: 5,
    shards: 0,
    startGame: vi.fn(),
  })),
}));
```

### Testing React Three Fiber Components
```typescript
// WebGL is mocked in tests/setup.ts
import { Canvas } from '@react-three/fiber';

describe('3D Component', () => {
  it('should render in canvas', () => {
    render(
      <Canvas>
        <MyMesh />
      </Canvas>
    );
    // Test 3D component logic
  });
});
```

## Testing Patterns

### 1. User-Centric Queries (Preferred)
```typescript
// ✅ Good - queries based on accessibility
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Welcome')

// ❌ Avoid - implementation details
screen.getByTestId('submit-button')
screen.getByClassName('btn-primary')
```

### 2. Async Interactions
```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### 3. Mock Providers
```typescript
const createWrapper = () => {
  const queryClient = new QueryClient();
  
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

render(<MyComponent />, { wrapper: createWrapper() });
```

## Component Coverage Goals

- **HUD Components**: Health, shards, chapter info
- **Menu Components**: Start menu, pause menu, settings
- **Game State Components**: Game over, victory
- **UI Components**: Buttons, dialogs, tooltips (shadcn/ui)

## Testing Checklist

### Before Committing
- [ ] All new React components have tests
- [ ] Tests use React Testing Library queries
- [ ] User interactions are tested with userEvent
- [ ] Accessibility is verified (roles, labels)
- [ ] Store mocks are properly configured
- [ ] Tests pass locally (`pnpm test:unit`)

### Component Test Requirements
- [ ] Renders without crashing
- [ ] Shows correct initial state
- [ ] Handles user interactions
- [ ] Updates on prop/state changes
- [ ] Calls callbacks correctly
- [ ] Handles edge cases (empty, loading, error)

## React DevTools Features

### Component Inspector
- View component props and state
- Edit props/state in real-time
- See component source location
- Track component updates

### Profiler
- Record component render times
- Identify performance bottlenecks
- Analyze why components re-render
- Compare render phases

### Tips
1. Use React DevTools to debug component hierarchy
2. Check for unnecessary re-renders in Profiler
3. Verify props are passed correctly
4. Inspect Zustand store state
5. Monitor React Three Fiber canvas updates

## Common Issues

### WebGL Warnings
WebGL is mocked in unit tests. For full GPU testing, use E2E tests:
```bash
PLAYWRIGHT_MCP=true pnpm test:e2e
```

### Canvas Not Rendering
React Three Fiber requires WebGL. In unit tests, test component logic, not rendering:
```typescript
// Test mesh properties, not visual output
expect(meshRef.current.position.x).toBe(0);
```

### Store State Not Updating
Mock the store correctly:
```typescript
const mockStore = vi.fn(() => ({ health: 5 }));
vi.mock('@/game/store', () => ({ useStore: mockStore }));

// Update for specific test
mockStore.mockReturnValue({ health: 3 });
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Don't test internal state directly
   - Use accessible queries

2. **Keep Tests Simple**
   - One assertion per test (generally)
   - Clear test names
   - Minimal setup

3. **Use Proper Cleanup**
   - `cleanup()` runs automatically after each test
   - Don't manually reset DOM
   - Let React Testing Library handle it

4. **Mock External Dependencies**
   - API calls
   - Browser APIs (audio, localStorage)
   - Heavy computations

5. **Test Edge Cases**
   - Empty states
   - Loading states
   - Error states
   - Disabled states

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Docs](https://vitest.dev)
- [React DevTools Guide](https://react.dev/learn/react-developer-tools)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event API](https://testing-library.com/docs/user-event/intro)
