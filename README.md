# Vendor-Neutral Authentication Architecture

A production-ready React + TypeScript frontend with provider-agnostic authentication. Supports Supabase initially, but designed to be easily switchable to Auth0, Cognito, or any other provider.

## Key Features

- **Zero Vendor Lock-in**: Auth provider is isolated behind an adapter interface
- **JWT-Based**: Standard access token flow compatible with any backend
- **Easy Provider Swap**: Change one environment variable to switch providers
- **Production Ready**: Includes error handling, token refresh, protected routes
- **Fully Testable**: Mock adapters for isolated unit testing

## Architecture

```
src/
├── features/auth/
│   ├── adapters/           # Provider implementations
│   │   ├── AuthAdapter.interface.ts
│   │   ├── SupabaseAuthAdapter.ts   ⬅️ ONLY file importing @supabase/supabase-js
│   │   └── index.ts
│   ├── context/            # React context + hooks
│   ├── components/         # Login, ProtectedRoute
│   ├── types/              # Shared auth types
│   └── utils/              # Token storage
├── lib/api/
│   └── apiClient.ts        # Axios with JWT injection
└── config/
    └── auth.config.ts      # Auth configuration
```

## Installation

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js axios react-router-dom
npm install -D @types/react-router-dom
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-dotnet-api.com/api
```

### 3. Setup Supabase

In your Supabase dashboard:

1. Go to **Authentication** → **Providers** → **Email**
2. Enable email authentication
3. Disable email confirmation (for development) or configure SMTP
4. Copy your project URL and anon key to `.env`

## Usage

### Basic Login

```tsx
import { useAuth } from './features/auth/context/useAuth';

function MyComponent() {
  const { login, user, isLoading } = useAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password123'
    });

    if (result.success) {
      console.log('Logged in!');
    } else {
      console.error(result.error);
    }
  };

  return <div>{user?.email}</div>;
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

### API Calls with JWT

```tsx
import apiClient from './lib/api/apiClient';

// JWT is automatically injected
const response = await apiClient.get('/users/me');
```

## How This Avoids Vendor Lock-in

### 1. Single Integration Point
- **Only** `SupabaseAuthAdapter.ts` imports from `@supabase/supabase-js`
- All other code depends on the `AuthAdapter` interface
- Swap providers by implementing a new adapter

### 2. Provider Factory
```typescript
// Change this in .env:
VITE_AUTH_PROVIDER=auth0

// Factory automatically instantiates correct adapter
const adapter = createAuthAdapter(authConfig);
```

### 3. Standard Types
```typescript
// Provider-agnostic user type
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  metadata?: Record<string, unknown>;
}
```

### 4. Mapping Layer
Provider-specific data structures are mapped to standard types:

```typescript
// Inside SupabaseAuthAdapter.ts
private mapUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    emailVerified: supabaseUser.email_confirmed_at !== null,
    metadata: supabaseUser.user_metadata,
  };
}
```

## Switching to Auth0

### Step 1: Implement Auth0 Adapter

```typescript
// features/auth/adapters/Auth0Adapter.ts
import { Auth0Client } from '@auth0/auth0-spa-js';
import { AuthAdapter } from './AuthAdapter.interface';

export class Auth0Adapter implements AuthAdapter {
  private client: Auth0Client;

  constructor(domain: string, clientId: string) {
    this.client = new Auth0Client({ domain, clientId });
  }

  // Implement all AuthAdapter methods...
}
```

### Step 2: Update Factory

```typescript
// features/auth/adapters/index.ts
case 'auth0':
  if (!config.auth0) throw new Error('Auth0 config required');
  return new Auth0Adapter(config.auth0.domain, config.auth0.clientId);
```

### Step 3: Update Environment

```bash
VITE_AUTH_PROVIDER=auth0
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

**That's it!** Zero changes to UI components.

## Testing

### Unit Tests with Mock Adapter

```tsx
import { MockAuthAdapter } from './features/auth/adapters/__tests__/MockAuthAdapter';

test('login flow', async () => {
  const mockAdapter = new MockAuthAdapter();

  render(
    <AuthProvider adapter={mockAdapter}>
      <LoginPage />
    </AuthProvider>
  );

  // Test login without hitting real auth provider
});
```

### Run Tests

```bash
npm test
```

## Backend Integration

Your .NET API should validate JWTs using standard claims:

```csharp
// Configure JWT validation
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://your-project.supabase.co/auth/v1";
        options.Audience = "authenticated";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true
        };
    });
```

Extract user ID from standard JWT claims:

```csharp
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
// or
var userId = User.FindFirst("sub")?.Value;
```

## What NOT to Use

This architecture intentionally avoids:

- ❌ Supabase Database
- ❌ Supabase RLS (Row Level Security)
- ❌ Supabase Edge Functions
- ❌ Supabase-specific JWT claims
- ❌ Direct Supabase client usage in components

**Only use Supabase Auth** → Everything else is .NET API.

## Project Structure Best Practices

- **Adapters**: One file per provider, implements `AuthAdapter` interface
- **Context**: Single source of truth for auth state
- **Components**: No provider imports, only use `useAuth()` hook
- **Config**: Single place to configure provider selection

## License

MIT
