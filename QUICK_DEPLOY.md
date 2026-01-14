# Quick Deploy Guide

Get your app deployed in 5 minutes! Choose your preferred free hosting provider.

## Prerequisites

✅ GitHub account with this repository
✅ Supabase project with credentials
✅ .NET API endpoint (or use mock for now)

---

## Option 1: Railway.app (Easiest - Recommended)

**Time:** ~3 minutes

### Steps:

1. **Go to [railway.app](https://railway.app)**
   - Click "Login" → Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `rupesh2k/supabaseauth`
   - Railway detects the Dockerfile automatically

3. **Add Environment Variables**

   Click on your service → Variables tab → Add these:

   ```
   VITE_AUTH_PROVIDER=supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_API_BASE_URL=https://your-api.com/api
   ```

   Get Supabase credentials from: [supabase.com/dashboard](https://supabase.com/dashboard) → Settings → API

4. **Deploy**
   - Click "Deploy" (or it auto-deploys)
   - Wait 2-3 minutes for build
   - Railway provides a URL: `https://your-app.railway.app`

5. **Done!** 🎉
   - Visit your URL
   - App automatically redeploys on every GitHub push

---

## Option 2: Render.com

**Time:** ~5 minutes

### Steps:

1. **Go to [render.com](https://render.com)**
   - Sign up with GitHub

2. **New Web Service**
   - Click "New +" → "Web Service"
   - Connect repository: `rupesh2k/supabaseauth`

3. **Configure**
   - **Name:** `supabaseauth`
   - **Environment:** Docker
   - **Region:** Choose closest to you
   - **Branch:** main
   - **Plan:** Free

4. **Environment Variables**

   Add in Advanced → Environment Variables:

   ```
   VITE_AUTH_PROVIDER=supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-api.com/api
   ```

5. **Create Web Service**
   - Wait 3-5 minutes for build
   - Get URL: `https://your-app.onrender.com`

**Note:** Free tier sleeps after 15 minutes of inactivity (first request takes ~30 seconds to wake up).

---

## Option 3: GitHub Actions + GHCR (For CI/CD)

**Time:** ~2 minutes (just setup, deployment is automatic)

### Steps:

1. **Add GitHub Secrets**

   Go to: `github.com/rupesh2k/supabaseauth` → Settings → Secrets and variables → Actions

   Click "New repository secret" for each:

   ```
   Name: VITE_AUTH_PROVIDER
   Value: supabase

   Name: VITE_SUPABASE_URL
   Value: https://your-project.supabase.co

   Name: VITE_SUPABASE_ANON_KEY
   Value: your-anon-key

   Name: VITE_API_BASE_URL
   Value: https://your-api.com/api
   ```

2. **Trigger Workflow**
   - Go to Actions tab
   - Your commit already triggered the workflow!
   - Watch it run: Test → Build → Push to GHCR

3. **Docker Image Published**
   - Available at: `ghcr.io/rupesh2k/supabaseauth:latest`
   - Use this image on any platform that supports containers

---

## Verify Deployment

Once deployed, test your app:

### 1. Health Check
```bash
curl https://your-app-url.com/health
# Should return: healthy
```

### 2. Visit Login Page
```
https://your-app-url.com/login
```

### 3. Test Authentication
- Try logging in with a test user
- Create user in Supabase Dashboard → Authentication → Users

---

## Configure Auto-Deployment

### Railway / Render:
✅ Already configured! Pushes to `main` branch auto-deploy.

### Manual Deploy:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Railway/Render automatically deploys
```

---

## Add Custom Domain (Optional)

### Railway:
1. Settings → Domains
2. Click "Custom Domain"
3. Add your domain (e.g., `app.yourdomain.com`)
4. Add DNS record:
   ```
   Type: CNAME
   Name: app
   Value: <provided-by-railway>
   ```

### Render:
1. Settings → Custom Domain
2. Add domain
3. Follow DNS instructions

---

## Troubleshooting

### ❌ Build Fails

**Check GitHub Actions logs:**
- Go to Actions tab
- Click on failed workflow
- Check error messages

**Common issues:**
- Missing environment variables (check GitHub Secrets)
- TypeScript errors (run `npm run build` locally first)

### ❌ App Shows White Screen

**Check browser console:**
- Right-click → Inspect → Console
- Look for CORS or API connection errors

**Fix CORS in .NET API:**
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

### ❌ Login Doesn't Work

**Check Supabase:**
1. Dashboard → Authentication → URL Configuration
2. Add your deployment URL to "Site URL"
3. Add to "Redirect URLs": `https://your-app.railway.app/**`

---

## What's Deployed

Your deployment includes:

✅ **Production build** of React app
✅ **Nginx server** for static files
✅ **SPA routing** (React Router works)
✅ **GZIP compression** for faster loads
✅ **Security headers** (XSS protection, etc.)
✅ **Health check endpoint** (`/health`)
✅ **Auto-deployment** on git push

---

## Monitoring

### View Logs:

**Railway:**
```
Dashboard → Deployments → View Logs
```

**Render:**
```
Dashboard → Logs (real-time)
```

**GitHub Actions:**
```
Actions tab → Select workflow → View logs
```

---

## Free Tier Limits

| Platform | Hours/Month | RAM | Sleep? | Credit Card? |
|----------|-------------|-----|--------|--------------|
| Railway | 500 | 512MB | No | No |
| Render | 750 | 512MB | Yes (15min) | No |

**Tip:** Railway is recommended for always-on apps on free tier.

---

## Next Steps

1. ✅ Deploy to chosen platform
2. ✅ Test authentication flow
3. ✅ Add custom domain (optional)
4. ✅ Configure Supabase redirect URLs
5. ✅ Set up monitoring/analytics
6. ✅ Share your app!

---

## Need Help?

- **Railway Issues:** [railway.app/help](https://railway.app/help)
- **Render Issues:** [render.com/docs](https://render.com/docs)
- **Supabase Issues:** [supabase.com/docs](https://supabase.com/docs)
- **GitHub Actions:** Check the [Actions tab](https://github.com/rupesh2k/supabaseauth/actions)

Your app is ready to go live! 🚀
