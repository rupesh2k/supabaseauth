# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Supabase

### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be provisioned

### Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. For development, disable "Confirm email" (under Email Auth settings)
4. For production, configure SMTP settings

### Get Your Credentials

1. Go to **Settings** → **API**
2. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy your **anon public** key

## 3. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```bash
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:5000/api
```

## 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 5. Create a Test User

### Option A: Using Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Click "Create user"

### Option B: Using the Signup Page

1. Create a signup page component (similar to LoginPage)
2. Use the `signup` function from `useAuth()`

```tsx
const { signup } = useAuth();

const result = await signup({
  email: 'test@example.com',
  password: 'password123'
});
```

## 6. Test the Login Flow

1. Navigate to `/login`
2. Enter your test user credentials
3. You should be redirected to `/dashboard`
4. The dashboard should show your email

## 7. Making API Calls

```tsx
import apiClient from './lib/api/apiClient';

// JWT is automatically attached
const fetchUserData = async () => {
  try {
    const response = await apiClient.get('/users/me');
    console.log(response.data);
  } catch (error) {
    console.error('API error:', error);
  }
};
```

## 8. Backend Integration (.NET)

Your .NET API should validate the JWT from Supabase:

```bash
# Get your JWT Secret from Supabase Dashboard
# Settings → API → JWT Settings → JWT Secret
```

Configure JWT validation in your .NET API:

```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://your-project.supabase.co/auth/v1";
        options.Audience = "authenticated";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = "https://your-project.supabase.co/auth/v1",
            ValidAudience = "authenticated",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("your-jwt-secret")
            ),
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true
        };
    });
```

Extract user ID in your controllers:

```csharp
[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        // Get user ID from JWT
        var userId = User.FindFirst("sub")?.Value;

        // Your logic here...
        return Ok(new { userId, email = User.Identity.Name });
    }
}
```

## Testing

Run unit tests:

```bash
npm test
```

## Switching to Auth0 (Future)

1. Create `Auth0Adapter.ts` implementing `AuthAdapter` interface
2. Update factory in `features/auth/adapters/index.ts`
3. Change `.env`:
   ```bash
   VITE_AUTH_PROVIDER=auth0
   VITE_AUTH0_DOMAIN=your-tenant.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   ```

**Zero changes to UI components required!**

## Common Issues

### "No session returned" error

- Check that email confirmation is disabled in Supabase (for development)
- Verify your credentials are correct
- Check browser console for detailed errors

### CORS errors when calling backend API

- Configure CORS in your .NET API to allow your frontend origin
- In development: allow `http://localhost:5173`

### JWT validation fails in backend

- Verify you're using the correct JWT secret from Supabase
- Check that the `iss` (issuer) and `aud` (audience) match your config
- Ensure the token hasn't expired

## File Structure Overview

```
src/
├── features/auth/
│   ├── adapters/              # Auth provider implementations
│   │   ├── AuthAdapter.interface.ts
│   │   ├── SupabaseAuthAdapter.ts    ⬅️ ONLY Supabase import
│   │   └── index.ts
│   ├── context/               # React Context + Provider
│   │   ├── AuthContext.tsx
│   │   └── useAuth.ts
│   ├── components/            # UI components
│   │   ├── LoginPage.tsx
│   │   └── ProtectedRoute.tsx
│   ├── types/                 # TypeScript types
│   │   └── auth.types.ts
│   └── utils/                 # Utilities
│       └── tokenStorage.ts
├── lib/api/
│   └── apiClient.ts           # Axios with JWT injection
├── config/
│   └── auth.config.ts         # Auth configuration
└── App.tsx                    # Main app component
```

## Next Steps

1. Create a Signup page component
2. Add password reset functionality
3. Implement user profile page
4. Add role-based authorization
5. Configure production environment variables
6. Set up CI/CD pipeline

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [React Router Docs](https://reactrouter.com)
- [Axios Docs](https://axios-http.com)
- [JWT.io](https://jwt.io) - Debug JWT tokens
