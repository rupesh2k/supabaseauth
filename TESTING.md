# Testing Guide

## Running Tests

```bash
# Run tests once
npm test -- --run

# Run tests in watch mode
npm test

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npm test LoginPage.test.tsx
```

## Test Structure

### Unit Tests for Components

All component tests are located in `__tests__` directories next to the components they test.

```
src/features/auth/components/
├── LoginPage.tsx
└── __tests__/
    └── LoginPage.test.tsx
```

### Test Setup

Tests use:
- **Vitest** - Fast test runner
- **React Testing Library** - Component testing utilities
- **jsdom** - Browser environment simulation
- **MemoryRouter** - In-memory routing for tests (no real browser needed)

### Key Testing Principles

#### 1. Use MemoryRouter in Tests

```tsx
// ✅ GOOD - Use MemoryRouter
import { MemoryRouter } from 'react-router-dom';

render(
  <MemoryRouter>
    <AuthProvider adapter={mockAdapter}>
      <LoginPage />
    </AuthProvider>
  </MemoryRouter>
);

// ❌ BAD - Don't use BrowserRouter in tests
import { BrowserRouter } from 'react-router-dom';
```

**Why?** `MemoryRouter` doesn't require a real browser URL and works in test environments.

#### 2. Wait for Async Operations

```tsx
// ✅ GOOD - Wait for component to load
await waitFor(() => {
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

// ❌ BAD - Don't query immediately
const button = screen.getByRole('button'); // Might not exist yet
```

#### 3. Use MockAuthAdapter for Isolation

```tsx
import { MockAuthAdapter } from '../../adapters/__tests__/MockAuthAdapter';

const mockAdapter = new MockAuthAdapter();
mockAdapter.shouldFailLogin = true; // Configure test behavior

render(
  <AuthProvider adapter={mockAdapter}>
    <LoginPage />
  </AuthProvider>
);
```

**Benefits:**
- No real API calls
- Fast execution
- Predictable behavior
- Easy to simulate errors

## Common Test Patterns

### Testing Login Success

```tsx
it('should login successfully', async () => {
  const mockAdapter = new MockAuthAdapter();

  render(
    <MemoryRouter>
      <AuthProvider adapter={mockAdapter}>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );

  // Wait for page to load
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  // Fill in form
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' },
  });

  // Submit
  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  // Verify success
  await waitFor(async () => {
    const token = await mockAdapter.getAccessToken();
    expect(token).toBe('mock-access-token');
  });
});
```

### Testing Login Failure

```tsx
it('should show error on failed login', async () => {
  const mockAdapter = new MockAuthAdapter();
  mockAdapter.shouldFailLogin = true; // Configure to fail

  render(
    <MemoryRouter>
      <AuthProvider adapter={mockAdapter}>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'wrongpassword' },
  });

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  // Wait for error message
  await waitFor(() => {
    expect(screen.getByText(/mock login failed/i)).toBeInTheDocument();
  });
});
```

### Testing Protected Routes

```tsx
it('should redirect to login when not authenticated', () => {
  const mockAdapter = new MockAuthAdapter();
  // mockAdapter has no user by default

  const { container } = render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider adapter={mockAdapter}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  // Should redirect to login
  expect(screen.getByText('Login Page')).toBeInTheDocument();
});
```

### Testing useAuth Hook

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../AuthContext';
import { MockAuthAdapter } from '../../adapters/__tests__/MockAuthAdapter';

it('should login via useAuth hook', async () => {
  const mockAdapter = new MockAuthAdapter();

  const wrapper = ({ children }) => (
    <AuthProvider adapter={mockAdapter}>{children}</AuthProvider>
  );

  const { result } = renderHook(() => useAuth(), { wrapper });

  // Wait for initialization
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  // Call login
  await result.current.login({
    email: 'test@example.com',
    password: 'password123',
  });

  // Verify authenticated
  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user?.email).toBe('test@example.com');
});
```

## MockAuthAdapter Configuration

The `MockAuthAdapter` supports various test scenarios:

```tsx
const mockAdapter = new MockAuthAdapter();

// Simulate failed login
mockAdapter.shouldFailLogin = true;

// Simulate failed signup
mockAdapter.shouldFailSignup = true;

// Pre-populate user (simulate already logged in)
await mockAdapter.login({ email: 'test@example.com', password: 'pass' });

// Verify state
const token = await mockAdapter.getAccessToken();
const user = await mockAdapter.getCurrentUser();
```

## Testing API Integration

### Testing API Calls with JWT

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../features/auth/context/useAuth';
import apiClient from '../lib/api/apiClient';
import { setAuthTokenGetter } from '../lib/api/apiClient';

it('should include JWT in API requests', async () => {
  const mockAdapter = new MockAuthAdapter();
  await mockAdapter.login({ email: 'test@example.com', password: 'pass' });

  // Register token getter
  setAuthTokenGetter(() => mockAdapter.getAccessToken());

  // Mock axios
  const mockGet = vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { id: '123', email: 'test@example.com' },
  });

  // Make API call
  await apiClient.get('/users/me');

  // Verify Authorization header was set
  expect(mockGet).toHaveBeenCalledWith('/users/me');
  // Check interceptor added the token (you might need to spy on the interceptor)
});
```

## Common Issues & Solutions

### Issue: "Unable to find element"

**Problem:** Test runs before component finishes rendering.

**Solution:** Use `waitFor`:

```tsx
// ❌ BAD
const button = screen.getByRole('button');

// ✅ GOOD
await waitFor(() => {
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Issue: "Warning: An update to AuthProvider inside a test was not wrapped in act(...)"

**Problem:** Async state updates happening outside of React's awareness.

**Solution:** Properly use `waitFor` for all async operations:

```tsx
// ✅ GOOD
await waitFor(async () => {
  const token = await mockAdapter.getAccessToken();
  expect(token).toBe('mock-access-token');
});
```

### Issue: "Cannot read property 'navigate' of undefined"

**Problem:** Component uses `useNavigate` but no router is provided.

**Solution:** Wrap in `MemoryRouter`:

```tsx
render(
  <MemoryRouter>
    <ComponentThatUsesNavigate />
  </MemoryRouter>
);
```

### Issue: Tests pass individually but fail together

**Problem:** Shared state between tests.

**Solution:** Create fresh mock adapter for each test:

```tsx
describe('LoginPage', () => {
  let mockAdapter: MockAuthAdapter;

  beforeEach(() => {
    mockAdapter = new MockAuthAdapter(); // Fresh instance
  });

  it('test 1', () => {
    // Use mockAdapter
  });

  it('test 2', () => {
    // Use mockAdapter (new instance)
  });
});
```

## Integration Testing

For integration tests with real Supabase:

```tsx
// Create a test-specific config
const testConfig = {
  provider: 'supabase' as const,
  supabase: {
    url: process.env.TEST_SUPABASE_URL!,
    anonKey: process.env.TEST_SUPABASE_ANON_KEY!,
  },
};

const testAdapter = createAuthAdapter(testConfig);

// Run tests against real Supabase
it('should actually login to Supabase', async () => {
  const result = await testAdapter.login({
    email: 'test@example.com',
    password: 'testpassword123',
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.user.email).toBe('test@example.com');
  }
});
```

**Note:** Integration tests require a test Supabase project and should be kept separate from unit tests.

## Test Coverage

Check test coverage:

```bash
npm test -- --coverage
```

Aim for:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

Focus coverage on:
- ✅ Auth adapters
- ✅ AuthContext logic
- ✅ Component behavior
- ✅ Route protection

Don't worry about coverage for:
- ❌ Type definitions
- ❌ Configuration files
- ❌ Test utilities

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Check coverage
        run: npm test -- --coverage --run
```

## Best Practices

1. **Test behavior, not implementation**
   - Test what the user sees and does
   - Don't test internal component state directly

2. **Use semantic queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Keep tests isolated**
   - Each test should be independent
   - Use fresh mocks for each test

4. **Test error states**
   - Always test both success and failure paths
   - Test edge cases (empty inputs, network errors, etc.)

5. **Avoid testing library internals**
   - Don't test React Router internals
   - Don't test axios internals
   - Focus on your code's behavior

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
