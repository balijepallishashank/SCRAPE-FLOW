# ✅ Vercel Deployment - Next Steps

## 🎉 Your App is Live!
**URL:** https://scrape-flow-orcin.vercel.app

## ⚠️ Important: Add Environment Variables

Your app needs environment variables to work properly. Follow these steps:

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/balijepallishashanks-projects/scrape-flow
2. Click **Settings** → **Environment Variables**
3. Add these variables one by one:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_ZmFjdHVhbC1kb2xwaGluLTU3LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY = sk_test_Lh4Qw6bhPLk4GUMoaPUGnRPHgoLFJj8Ya6vBZ2RosB

DATABASE_URL = postgresql://username:password@host:port/database
DIRECT_URL = postgresql://username:password@host:port/database

NEXT_PUBLIC_APP_URL = https://scrape-flow-orcin.vercel.app

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = (Get from Stripe Dashboard)
STRIPE_SECRET_KEY = (Get from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET = (Get from Stripe Webhooks)

BROWSER_POOL_SIZE = 5
WEBHOOK_TIMEOUT_MS = 10000
WEBHOOK_RETRIES = 2
WEBHOOK_BACKOFF_MS = 500
```

4. After adding all variables, click **Redeploy** on the Deployments tab

### Method 2: Via Vercel CLI

```bash
# Link project
vercel link

# Add variables interactively
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Then paste the value when prompted

# Repeat for each variable...

# Redeploy
vercel deploy --prod
```

## 📊 Next: Set Up PostgreSQL Database

You need a PostgreSQL database for production. Choose one:

### Option A: Vercel Postgres (Free, Recommended)
1. In Vercel Dashboard → **Storage** tab
2. Click **Create Database** → **Postgres**
3. Vercel will auto-add DATABASE_URL and DIRECT_URL

### Option B: External Database
- **Neon**: https://neon.tech (free PostgreSQL)
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **AWS RDS**: https://aws.amazon.com/rds/

Get connection string and add as DATABASE_URL and DIRECT_URL in Vercel.

## 🔧 Run Database Migrations

After database is set up:

```bash
vercel env pull
npx prisma migrate deploy
```

Or push schema:
```bash
npx prisma db push
```

## 💳 Set Up Stripe (Payment Processing)

1. Go to https://dashboard.stripe.com
2. Under **Developers** → **API Keys**, copy:
   - Publishable Key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret Key → `STRIPE_SECRET_KEY`
3. Go to **Webhooks**:
   - Add Endpoint: `https://scrape-flow-orcin.vercel.app/api/billing/webhook`
   - Select events: `payment_intent.succeeded`, `checkout.session.completed`
   - Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

## 🔐 Update Clerk Allowed URLs

1. Go to https://dashboard.clerk.com
2. Under **Domains** → **Add domain**:
   - Add: `https://scrape-flow-orcin.vercel.app`

## ✅ Verify Deployment

After adding all variables and running migrations:

1. Visit https://scrape-flow-orcin.vercel.app
2. Test **Sign Up** (Clerk)
3. Create a **workflow**
4. Validate **credentials**
5. Execute a **workflow**

## 📈 Monitor Your Deployment

```bash
# View live logs
vercel logs --tail

# Check deployment status
vercel status

# View specific deployment
vercel inspect
```

## 🆘 Troubleshooting

### Build fails on Vercel
- Check logs: `vercel logs --tail`
- Verify all environment variables are set
- Ensure DATABASE_URL is correct

### App shows blank page
- Open browser DevTools → Console
- Check for errors
- Verify Clerk keys are correct

### Can't sign in
- Verify CLERK_SECRET_KEY in Vercel env
- Check Clerk dashboard for allowed URLs
- Ensure domain is added in Clerk

### Workflows don't execute
- Check STRIPE_SECRET_KEY is real key (not dummy)
- Verify DATABASE_URL is PostgreSQL
- Check serverless function timeout in Vercel logs

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Clerk Docs: https://clerk.com/docs
