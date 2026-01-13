# Architecture Overview

## Design Principles

### 1. Adapter Pattern for Vendor Neutrality
The core design uses the **Adapter Pattern** to isolate auth provider implementation details behind a common interface.

```
┌─────────────────────────────────────────┐
│         React Components                │
│    (Login, Dashboard, etc.)             │
└──────────────┬──────────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────────┐
│         useAuth() Hook                  │
│    (Provider-agnostic API)              │
└──────────────┬──────────────────────────┘
               │ calls
               ▼
┌─────────────────────────────────────────┐
│         AuthContext                     │
│    (State management)                   │
└──────────────┬──────────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────────┐
│      AuthAdapter Interface              │
│  (login, signup, logout, etc.)          │
└──────────────┬──────────────────────────┘
               │ implemented by
               ▼
┌─────────────────────────────────────────┐
│    SupabaseAuthAdapter                  │
│  (Supabase-specific implementation)     │
│  ⬅️ ONLY file importing @supabase      │
└─────────────────────────────────────────┘
```

### 2. Single Point of Integration
**Critical Isolation**: Only `SupabaseAuthAdapter.ts` imports from `@supabase/supabase-js`

```typescript
// ✅ GOOD: All app code
import { useAuth } from './features/auth/context/useAuth';

// ❌ BAD: Never do this outside adapter
import { createClient } from '@supabase/supabase-js';
```

### 3. Result Type Pattern
Instead of throwing exceptions, all adapter methods return a discriminated union:

```typescript
type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

// Usage
const result = await adapter.login(credentials);
if (result.success) {
  // TypeScript knows result.data exists
  console.log(result.data.user);
} else {
  // TypeScript knows result.error exists
  console.error(result.error.message);
}
```

**Benefits**:
- Explicit error handling
- Type-safe error paths
- No try-catch boilerplate

### 4. Mapping Layer
Provider-specific data structures are mapped to standard types:

```typescript
// Supabase returns this:
{
  id: "uuid",
  email: "user@example.com",
  email_confirmed_at: "2024-01-01T00:00:00Z",
  user_metadata: { ... }
}

// We map it to our standard User type:
{
  id: "uuid",
  email: "user@example.com",
  emailVerified: true,
  metadata: { ... }
}
```

**Benefits**:
- UI code never depends on provider-specific fields
- Easy to swap providers without breaking changes
- Consistent API across all providers

## Key Files Explained

### `AuthAdapter.interface.ts`
The contract that all providers must implement. Contains 10 core methods:
- `initialize()` - Restore session from storage
- `login()` - Email/password login
- `signup()` - User registration
- `logout()` - Sign out
- `getCurrentUser()` - Get user info
- `getAccessToken()` - Get JWT for API calls
- `refreshToken()` - Refresh expired token
- `requestPasswordReset()` - Send reset email
- `updatePassword()` - Change password
- `onAuthStateChange()` - Listen to auth events

### `SupabaseAuthAdapter.ts`
Implements `AuthAdapter` for Supabase. Key responsibilities:
- Call Supabase client methods
- Map Supabase responses to standard types
- Handle Supabase-specific errors
- Manage session persistence

**Isolation guarantee**: This is the only file in the entire codebase that imports `@supabase/supabase-js`.

### `auth.config.ts`
Configuration file that determines which provider to use:

```typescript
{
  provider: 'supabase', // ⬅️ Change this to switch providers
  supabase: { ... },
  auth0: { ... },      // Future
  cognito: { ... }     // Future
}
```

### `AuthContext.tsx`
React Context that provides auth state and methods to the app:
- Manages loading states
- Handles auth state persistence
- Provides callbacks for login/logout
- Registers token getter for API client

### `apiClient.ts`
Axios instance with JWT injection:

```typescript
// Automatically adds Authorization header
config.headers.Authorization = `Bearer ${token}`;
```

Registered in App.tsx:
```typescript
setAuthTokenGetter(getAccessToken);
```

### `ProtectedRoute.tsx`
Route guard component:
- Checks `isAuthenticated` from context
- Shows loading spinner while checking
- Redirects to login if not authenticated
- Preserves attempted URL for post-login redirect

## Data Flow

### Login Flow
```
1. User enters credentials in LoginPage
   ↓
2. LoginPage calls useAuth().login()
   ↓
3. AuthContext calls adapter.login()
   ↓
4. SupabaseAuthAdapter calls Supabase API
   ↓
5. SupabaseAuthAdapter maps response to User type
   ↓
6. AuthContext updates state (user, tokens, isAuthenticated)
   ↓
7. All components using useAuth() get updated state
   ↓
8. LoginPage navigates to dashboard
```

### API Request Flow
```
1. Component calls apiClient.get('/users/me')
   ↓
2. Axios request interceptor runs
   ↓
3. Interceptor calls authTokenGetter()
   ↓
4. authTokenGetter calls adapter.getAccessToken()
   ↓
5. SupabaseAuthAdapter returns current JWT
   ↓
6. Interceptor adds Authorization header
   ↓
7. Request sent to backend with JWT
```

### Token Refresh Flow
```
1. Supabase client detects token expiration
   ↓
2. Automatically refreshes token (if refresh token valid)
   ↓
3. onAuthStateChange callback fires
   ↓
4. AuthContext updates tokens in state
   ↓
5. Next API call uses new token
```

## Provider Swap Strategy

### Current State (Supabase)
```typescript
// SupabaseAuthAdapter.ts
export class SupabaseAuthAdapter implements AuthAdapter {
  private client: SupabaseClient;
  // ... implementation
}
```

### Future State (Auth0)
```typescript
// Auth0Adapter.ts
export class Auth0Adapter implements AuthAdapter {
  private client: Auth0Client;
  // ... implementation with same method signatures
}
```

### Switching Process
1. Implement new adapter (e.g., `Auth0Adapter.ts`)
2. Update factory in `adapters/index.ts`:
   ```typescript
   case 'auth0':
     return new Auth0Adapter(config.auth0);
   ```
3. Update `.env`:
   ```bash
   VITE_AUTH_PROVIDER=auth0
   ```
4. **Done!** No UI changes needed.

## Security Considerations

### Token Storage
- Supabase handles its own storage (localStorage by default)
- For other providers, use `tokenStorage.ts` utility
- Consider httpOnly cookies for production

### JWT Validation
- Backend MUST validate JWT signature
- Backend MUST check expiration (`exp` claim)
- Backend MUST verify issuer (`iss` claim)
- Backend MUST verify audience (`aud` claim)

### HTTPS Requirements
- Always use HTTPS in production
- Tokens are sensitive - never log them
- Refresh tokens are more sensitive than access tokens

### CORS Configuration
```csharp
// .NET API
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("https://your-frontend.com")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});
```

## Testing Strategy

### Unit Tests (Components)
```typescript
// Use MockAuthAdapter to test without real auth provider
const mockAdapter = new MockAuthAdapter();
render(
  <AuthProvider adapter={mockAdapter}>
    <LoginPage />
  </AuthProvider>
);
```

### Integration Tests
Test the full flow with a real Supabase test project:
```typescript
// Use actual SupabaseAuthAdapter with test credentials
const testAdapter = new SupabaseAuthAdapter(
  TEST_SUPABASE_URL,
  TEST_SUPABASE_KEY
);
```

### E2E Tests
Use tools like Cypress or Playwright to test complete user journeys:
- User registration
- Login/logout
- Protected route access
- Token refresh

## Extension Points

### Adding OAuth Providers
To add Google/GitHub OAuth:

```typescript
// In AuthAdapter.interface.ts
interface AuthAdapter {
  // ... existing methods
  loginWithOAuth(provider: 'google' | 'github'): Promise<AuthResult<void>>;
}

// In SupabaseAuthAdapter.ts
async loginWithOAuth(provider: 'google' | 'github') {
  const { error } = await this.client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  // ... handle response
}
```

### Adding MFA (Multi-Factor Auth)
```typescript
interface AuthAdapter {
  // ... existing methods
  enableMFA(): Promise<AuthResult<{ secret: string; qrCode: string }>>;
  verifyMFA(code: string): Promise<AuthResult<void>>;
}
```

### Adding Custom Claims
If your backend needs custom JWT claims:

```typescript
// Backend adds claims after validating token
var claims = new List<Claim>
{
    new Claim("sub", userId),
    new Claim("role", userRole),
    new Claim("tenant", tenantId)
};
```

Frontend reads them from the JWT (decode without verifying):
```typescript
import { jwtDecode } from 'jwt-decode';

const token = await getAccessToken();
const claims = jwtDecode(token);
console.log(claims.role); // "admin"
```

## Performance Considerations

### Token Refresh
- Supabase auto-refreshes 60 seconds before expiry
- Other providers may require manual refresh
- Implement retry logic for failed refreshes

### Session Restoration
- On app load, check for existing session
- Show loading state while checking
- Avoid flickering login page

### API Client Optimization
```typescript
// Only get token once per request, not multiple times
let tokenPromise: Promise<string | null> | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  authTokenGetter = async () => {
    if (!tokenPromise) {
      tokenPromise = getter();
    }
    const token = await tokenPromise;
    tokenPromise = null;
    return token;
  };
};
```

## Monitoring & Observability

### Auth Events to Track
- Login success/failure
- Signup success/failure
- Token refresh success/failure
- Logout events
- Session expiration

### Error Tracking
```typescript
// In adapters, log errors to monitoring service
private handleError(error: unknown) {
  // Log to Sentry, DataDog, etc.
  console.error('[Auth Error]', error);

  return {
    success: false,
    error: this.normalizeError(error)
  };
}
```

## Production Checklist

- [ ] Environment variables configured for production
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Email confirmation enabled (Supabase)
- [ ] Password strength requirements enforced
- [ ] Rate limiting configured (prevent brute force)
- [ ] Error monitoring setup
- [ ] Analytics events tracked
- [ ] Token expiration times configured
- [ ] Refresh token rotation enabled
- [ ] Backend JWT validation implemented
- [ ] Session timeout configured
- [ ] Password reset flow tested
- [ ] Account lockout policy configured

## Common Pitfalls to Avoid

### ❌ DON'T: Import Supabase outside adapter
```typescript
// ❌ BAD
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);
```

### ✅ DO: Use the adapter
```typescript
// ✅ GOOD
const { login } = useAuth();
await login(credentials);
```

### ❌ DON'T: Store tokens manually with Supabase
```typescript
// ❌ BAD - Supabase handles this
localStorage.setItem('token', accessToken);
```

### ✅ DO: Let adapter handle storage
```typescript
// ✅ GOOD - Adapter manages storage
const token = await getAccessToken();
```

### ❌ DON'T: Use Supabase-specific claims in UI
```typescript
// ❌ BAD
if (user.app_metadata.provider === 'email') { ... }
```

### ✅ DO: Use standard fields
```typescript
// ✅ GOOD
if (user.emailVerified) { ... }
```

## Further Reading

- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Spec](https://oauth.net/2/)
- [React Context Best Practices](https://react.dev/reference/react/useContext)
