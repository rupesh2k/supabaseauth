# Deployment Guide

This guide covers deploying your vendor-neutral authentication app to free container hosting providers.

## Table of Contents

1. [Local Docker Testing](#local-docker-testing)
2. [Railway.app (Recommended)](#railwayapp-recommended)
3. [Render.com](#rendercom)
4. [Fly.io](#flyio)
5. [GitHub Container Registry](#github-container-registry)
6. [Environment Variables](#environment-variables)
7. [CI/CD Pipeline](#cicd-pipeline)

---

## Local Docker Testing

### Build and run locally:

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your values

# Build the image
docker build -t supabaseauth:local \
  --build-arg VITE_AUTH_PROVIDER=supabase \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg VITE_API_BASE_URL=https://your-api.com \
  .

# Run the container
docker run -p 8080:8080 supabaseauth:local

# Or use docker-compose
docker-compose up
```

Visit: `http://localhost:8080`

### Test health check:

```bash
curl http://localhost:8080/health
# Should return: healthy
```

---

## Railway.app (Recommended)

**Free Tier:** 500 hours/month, 512 MB RAM, 1 GB Disk

### Setup:

1. **Sign up at [railway.app](https://railway.app)**
   - Login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `rupesh2k/supabaseauth`

3. **Configure Environment Variables**

   In Railway dashboard → Variables, add:
   ```
   VITE_AUTH_PROVIDER=supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-api.com
   ```

4. **Deploy**
   - Railway auto-detects `Dockerfile`
   - Builds and deploys automatically
   - Provides a `.railway.app` domain

### Auto-Deployment:

Railway automatically redeploys on every push to `main` branch.

### Custom Domain (Optional):

1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS with provided records

---

## Render.com

**Free Tier:** 750 hours/month, auto-sleep after 15 min inactivity

### Setup:

1. **Sign up at [render.com](https://render.com)**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `rupesh2k/supabaseauth`
   - Select branch: `main`

3. **Configure Service**
   - Name: `supabaseauth`
   - Environment: `Docker`
   - Region: Choose closest to your users
   - Branch: `main`
   - Dockerfile Path: `./Dockerfile`
   - Plan: `Free`

4. **Add Environment Variables**
   ```
   VITE_AUTH_PROVIDER=supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-api.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render builds and deploys
   - Get `.onrender.com` URL

### Alternative: Use render.yaml

```bash
# Render auto-detects render.yaml in repo root
git push origin main
```

Render will automatically configure from `render.yaml`.

---

## Fly.io

**Free Tier:** 3 shared-cpu VMs with 256MB RAM each

### Setup:

1. **Install Fly CLI**
   ```bash
   # macOS
   brew install flyctl

   # Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login**
   ```bash
   flyctl auth login
   ```

3. **Create App**
   ```bash
   flyctl apps create supabaseauth
   ```

4. **Set Secrets (Environment Variables)**
   ```bash
   flyctl secrets set \
     VITE_AUTH_PROVIDER=supabase \
     VITE_SUPABASE_URL=https://your-project.supabase.co \
     VITE_SUPABASE_ANON_KEY=your-anon-key \
     VITE_API_BASE_URL=https://your-api.com
   ```

5. **Deploy**
   ```bash
   flyctl deploy
   ```

6. **Open App**
   ```bash
   flyctl open
   ```

### Auto-Deployment with GitHub Actions:

Already configured in `.github/workflows/deploy.yml`

Add Fly.io token to GitHub secrets:
```bash
# Get token
flyctl auth token

# Add to GitHub:
# Settings → Secrets → Actions → New secret
# Name: FLY_API_TOKEN
# Value: <your-token>
```

---

## GitHub Container Registry

Your CI/CD pipeline automatically publishes Docker images to GitHub Container Registry (GHCR).

### Access the image:

```bash
docker pull ghcr.io/rupesh2k/supabaseauth:latest
```

### Run the published image:

```bash
docker run -p 8080:8080 \
  -e VITE_AUTH_PROVIDER=supabase \
  -e VITE_SUPABASE_URL=https://your-project.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=your-anon-key \
  -e VITE_API_BASE_URL=https://your-api.com \
  ghcr.io/rupesh2k/supabaseauth:latest
```

**Note:** Images are built with environment variables baked in at build time. For different environments, rebuild with different build args.

---

## Environment Variables

### Required Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_AUTH_PROVIDER` | Auth provider name | `supabase` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGc...` |
| `VITE_API_BASE_URL` | Backend API URL | `https://api.yourapp.com` |

### Security Notes:

⚠️ **IMPORTANT:**
- These are build-time variables, NOT runtime secrets
- They are embedded in the client-side JavaScript bundle
- The Supabase anon key is safe to expose (it's public by design)
- Never put sensitive secrets here (database passwords, private keys, etc.)

### For Different Environments:

**Development:**
```env
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-key
VITE_API_BASE_URL=http://localhost:5000/api
```

**Production:**
```env
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key
VITE_API_BASE_URL=https://api.production.com
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Located at `.github/workflows/deploy.yml`

### Pipeline Stages:

```
┌─────────────┐
│   Push to   │
│    main     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Run Tests  │  ← npm test
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Build &   │  ← Docker build
│    Push      │  → GHCR
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Security   │  ← Trivy scan
│    Scan     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Deploy    │  ← Auto-deploy
│  (Platform) │     to hosting
└─────────────┘
```

### Required GitHub Secrets:

Add these in **Settings → Secrets → Actions**:

```
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-api.com
```

Optional (for specific platforms):
```
RAILWAY_TOKEN=<your-railway-token>
FLY_API_TOKEN=<your-fly-token>
```

### What Happens on Push:

1. ✅ **Tests run** - All unit tests must pass
2. ✅ **Type check** - TypeScript validation
3. ✅ **Docker build** - Multi-stage build with nginx
4. ✅ **Push to GHCR** - Image published to GitHub Container Registry
5. ✅ **Security scan** - Trivy vulnerability scanning
6. ✅ **Auto-deploy** - Platform automatically deploys new image

### Manual Deployment:

Trigger manually from GitHub:
- Go to **Actions** tab
- Select "Build and Deploy" workflow
- Click "Run workflow"

---

## Platform Comparison

| Feature | Railway | Render | Fly.io |
|---------|---------|--------|--------|
| **Free Hours** | 500/mo | 750/mo | Always on |
| **RAM** | 512 MB | 512 MB | 256 MB |
| **Sleep** | No | Yes (15min) | Yes |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free |
| **Auto-deploy** | ✅ | ✅ | Via GH Actions |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Speed** | Fast | Medium | Fast |

### Recommendation:

- **Railway** - Best for simplicity and free tier limits
- **Render** - Good alternative, but sleeps after inactivity
- **Fly.io** - Most control, best for scaling later

---

## Monitoring & Logs

### Railway:
```
Dashboard → Deployments → View Logs
```

### Render:
```
Dashboard → Logs (real-time)
```

### Fly.io:
```bash
flyctl logs
```

### Health Check:

All platforms support the `/health` endpoint:
```bash
curl https://your-app.com/health
# Should return: healthy
```

---

## Troubleshooting

### Build Fails:

**Check environment variables are set:**
```bash
# Railway/Render dashboard → Variables
# Fly.io:
flyctl secrets list
```

**Check build logs:**
- Railway: Deployments → Build Logs
- Render: Logs tab
- Fly.io: `flyctl logs`

### App Won't Start:

**Check health endpoint:**
```bash
curl https://your-app.com/health
```

**Check nginx logs (Docker):**
```bash
docker logs <container-id>
```

### Environment Variables Not Working:

**Remember:** Vite env vars are **build-time**, not runtime.

If you change env vars, you must rebuild:
```bash
# Railway/Render: Auto-rebuilds on env change
# Fly.io: Manual redeploy
flyctl deploy --build-arg VITE_API_BASE_URL=new-url
```

### CORS Issues:

If frontend can't reach API, configure CORS in your .NET API:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://your-app.railway.app")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

---

## Production Checklist

Before going live:

- [ ] Environment variables configured for production
- [ ] Custom domain set up (optional)
- [ ] HTTPS enabled (automatic on all platforms)
- [ ] Health check responding
- [ ] CORS configured in backend API
- [ ] Error monitoring set up (Sentry, LogRocket, etc.)
- [ ] Analytics configured (Google Analytics, Plausible, etc.)
- [ ] Performance monitoring (Web Vitals)
- [ ] Supabase email confirmation enabled
- [ ] Rate limiting configured (in Supabase dashboard)

---

## Cost Considerations

### Free Tier Limits:

**Railway:**
- 500 execution hours/month
- $5 credit/month
- No credit card required

**Render:**
- 750 hours/month per service
- Sleeps after 15 minutes of inactivity
- No credit card required

**Fly.io:**
- 3 shared VMs (256MB RAM)
- 160GB outbound data transfer
- Credit card required (but not charged if under limits)

### When You'll Need to Pay:

- **Traffic:** >100k monthly visitors
- **Uptime:** Need 24/7 availability (upgrade to prevent sleep)
- **Performance:** Need more RAM/CPU
- **Storage:** Need persistent volumes

All platforms have affordable paid tiers ($5-10/month).

---

## Next Steps

1. Choose a hosting platform
2. Set up environment variables
3. Push to trigger deployment
4. Configure custom domain (optional)
5. Set up monitoring and analytics

Your app is now live and automatically deploys on every push to `main`!
