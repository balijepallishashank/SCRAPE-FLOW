# Vercel Deployment Checklist

## ✅ Configuration Ready

### Changes Made:
- ✅ Updated Prisma schema to PostgreSQL
- ✅ Created `vercel.json` configuration
- ✅ Updated `.env.example` with correct variable names
- ✅ Build tested and verified working

## 📋 Pre-Deployment Checklist

### 1. Prepare Your Database
- [ ] Create PostgreSQL database (Vercel Postgres, Neon, Supabase, or AWS RDS)
- [ ] Get DATABASE_URL and DIRECT_URL connection strings
- [ ] Test connection locally first

### 2. Get API Credentials
- [ ] Clerk: Get `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- [ ] Stripe: Get `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Stripe: Get webhook secret for `STRIPE_WEBHOOK_SECRET`
- [ ] Sentry (optional): Get DSN keys if using error tracking

### 3. Push Code to Git
```bash
git add .
git commit -m "Prepare for Vercel deployment - PostgreSQL setup"
git push
```

### 4. Deploy to Vercel
```bash
# Option A: Using Vercel CLI
npm i -g vercel
vercel

# Option B: Through GitHub
# 1. Go to https://vercel.com
# 2. Click "New Project"
# 3. Import your GitHub repository
# 4. Vercel auto-detects Next.js configuration
```

### 5. Set Environment Variables in Vercel Dashboard
In Project Settings → Environment Variables, add all from `.env.example`:
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [ ] CLERK_SECRET_KEY
- [ ] DATABASE_URL (PostgreSQL)
- [ ] DIRECT_URL (PostgreSQL direct connection)
- [ ] NEXT_PUBLIC_APP_URL (your Vercel domain)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] SENTRY_DSN
- [ ] NEXT_PUBLIC_SENTRY_DSN
- [ ] BROWSER_POOL_SIZE (5 for free, adjust as needed)
- [ ] WEBHOOK_TIMEOUT_MS
- [ ] WEBHOOK_RETRIES
- [ ] WEBHOOK_BACKOFF_MS

### 6. Run Database Migrations
After deployment succeeds:
```bash
vercel env pull
npx prisma migrate deploy
```

Or use Vercel dashboard to view build logs and manually run:
```bash
npx prisma db push
```

### 7. Update External Services
- [ ] Clerk: Add Vercel domain to allowed URLs
- [ ] Stripe: Update webhook endpoint to `https://yourdomain.vercel.app/api/billing/webhook`
- [ ] Update any other callback URLs

### 8. Verify Deployment
- [ ] Visit your deployed URL
- [ ] Test authentication (Clerk sign-in)
- [ ] Test credentials validation
- [ ] Create a test workflow
- [ ] Execute a workflow to verify browser automation works

## 🚀 Post-Deployment

### Monitor Logs
```bash
vercel logs --tail
```

### Troubleshooting
- Check [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for common issues
- Review build logs in Vercel dashboard
- Ensure all environment variables are set correctly

### Performance Tuning
- Monitor serverless function execution time
- Adjust BROWSER_POOL_SIZE based on plan
- Set up error tracking in Sentry dashboard

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/other/troubleshooting-orm/vercel)
- [Puppeteer on Vercel](https://vercel.com/docs/functions/serverless-functions/libraries/puppeteer)
