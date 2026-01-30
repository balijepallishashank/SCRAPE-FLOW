# 🔴 Fix: Database Connection Error

## The Problem
Your app has these variables pointing to **SQLite** (local file database):
```
DATABASE_URL="file:./prisma/dev.db"
DIRECT_URL="file:./prisma/dev.db"
```

**Vercel doesn't support SQLite.** You need PostgreSQL.

## ✅ Quick Fix: Add Vercel Postgres

### Step 1: Create Database in Vercel Dashboard
1. Go to: https://vercel.com/balijepallishashanks-projects/scrape-flow
2. Click **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name it: `scrape-flow-db`
5. Select region: `iad` (best for US)
6. Click **Create**

### Step 2: Vercel Auto-Adds Environment Variables ✓
Vercel automatically adds to your project:
- `DATABASE_URL` (PostgreSQL connection string)
- `DIRECT_URL` (Direct PostgreSQL URL for migrations)

### Step 3: Redeploy
1. In Vercel Dashboard → **Deployments** tab
2. Click the latest deployment
3. Click **Redeploy**

### Step 4: Run Migrations
```bash
vercel env pull
npx prisma migrate deploy
```

---

## 🔄 Alternative: Use External PostgreSQL

### Option A: Neon (Recommended - Free)
1. Go to: https://neon.tech
2. Sign up
3. Create a project
4. Get **Connection String** → add as `DATABASE_URL` and `DIRECT_URL`

### Option B: Supabase
1. Go to: https://supabase.com
2. Create project
3. Get PostgreSQL connection string
4. Add to Vercel environment variables

### Option C: Railway
1. Go to: https://railway.app
2. Create PostgreSQL database
3. Get connection string
4. Add to Vercel

---

## 📝 Manual Fix (If You Already Have Database)

If you have a PostgreSQL URL, add it to Vercel:

```bash
vercel env add DATABASE_URL
# Paste: postgresql://user:password@host:5432/dbname

vercel env add DIRECT_URL
# Paste: postgresql://user:password@host:5432/dbname
```

Then redeploy:
```bash
vercel deploy --prod
```

Run migrations:
```bash
npx prisma migrate deploy
```

---

## ✅ Once Complete

Your app will work! Do this:

1. **Redeploy** in Vercel Dashboard
2. **Run migrations**: `vercel env pull && npx prisma migrate deploy`
3. **Visit**: https://scrape-flow-orcin.vercel.app
4. **Test sign-up** and **create workflow**
