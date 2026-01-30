# Vercel Deployment Guide for Scrape-Flow

## Prerequisites
- GitHub/GitLab/Bitbucket account with your repo
- PostgreSQL database (use Vercel Postgres, Neon, or Supabase)
- Stripe, Clerk, and Sentry accounts
- Vercel account

## Step 1: Set Up PostgreSQL Database

Choose one:

### Option A: Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Create/select project
3. Go to Storage → Create Database → Postgres
4. Copy the connection strings

### Option B: External Database (Neon, Supabase, AWS RDS)
- Create a PostgreSQL database
- Get connection string: `postgresql://user:password@host:port/dbname`

## Step 2: Deploy to Vercel

### Method 1: Direct Deployment
```bash
npm i -g vercel
vercel login
vercel
```

### Method 2: GitHub Integration
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Next.js

## Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
DATABASE_URL=postgresql://user:password@host:port/dbname
DIRECT_URL=postgresql://user:password@host:port/dbname
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
BROWSER_POOL_SIZE=5
WEBHOOK_TIMEOUT_MS=10000
WEBHOOK_RETRIES=2
WEBHOOK_BACKOFF_MS=500
```

## Step 4: Database Migration

After environment variables are set, run migrations:

```bash
vercel env pull
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
vercel env pull
pnpm run build
```

## Step 5: Important Configurations

### Clerk Setup
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Add your Vercel domain to Allowed URLs:
   - `https://your-domain.vercel.app`
3. Update redirect URLs in .env

### Stripe Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Update Webhook endpoints to point to:
   - `https://your-domain.vercel.app/api/billing/webhook`

### Build Optimization
- Vercel will automatically run: `prisma generate && next build`
- Turbopack speeds up builds significantly

## Step 6: Monitor Deployment

```bash
vercel logs
vercel status
```

## Troubleshooting

### Database Connection Failed
- Check DATABASE_URL format: `postgresql://user:password@host:port/dbname`
- Ensure database allows remote connections
- Add Vercel IP to database whitelist (if required)

### Prisma Migration Issues
```bash
vercel env pull
npx prisma db push
npx prisma migrate deploy
```

### Build Fails
Check logs:
```bash
vercel logs --tail
```

## Domain Setup

1. Add custom domain in Vercel Project Settings
2. Update in environment variable: `NEXT_PUBLIC_APP_URL`
3. Update Clerk allowed origins to include new domain

## Performance Tips

- Browser pool size depends on Vercel plan (BROWSER_POOL_SIZE=5 for free)
- Increase for Pro plan if needed
- Monitor serverless function timeouts

## Support

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/other/troubleshooting-orm/vercel)
