# PanelNG — Setup Guide

## Accounts You Need to Create

### 1. Supabase (Free)
- Go to **https://supabase.com** → Create new project
- Once created, go to **Settings → API**
- Copy:
  - `Project URL` → `SUPABASE_URL`
  - `anon public` key → `SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_KEY` (**keep this private**)
- Go to **SQL Editor** and paste the full content of `supabase/schema.sql`
- Click **Run** to create all tables

### 2. Paystack (Nigerian business)
- Go to **https://paystack.com** → Sign up (you need a Nigerian business/personal account)
- Go to **Settings → API Keys & Webhooks**
- Copy:
  - Secret Key → `PAYSTACK_SECRET_KEY`
  - Public Key → `PAYSTACK_PUBLIC_KEY`
- **Test mode** keys start with `sk_test_` (use these for development)
- **Live mode** keys start with `sk_live_` (use for production after Paystack review)

### 3. JustAnotherPanel (SMM Panel)
- Go to **https://justanotherpanel.com** → Register
- Go to your **API** section in the dashboard
- Copy your API key → `JAP_API_KEY`
- Fund your JAP account with enough balance for orders

### 4. HeroSMS (SMS Verification)
- Go to **https://hero-sms.com** → Register
- Find your API key in account settings
- Copy → `HEROSMS_API_KEY`
- Fund your HeroSMS account balance

---

## Installation Steps

### Step 1: Clone and install dependencies

```bash
cd /Users/mac/panelng

# Backend
cd backend
cp .env.example .env
# Edit .env with your actual keys
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Configure environment variables

Edit `backend/.env` and fill in all values:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
JAP_API_KEY=your_jap_key
JAP_API_URL=https://justanotherpanel.com/api/v2
HEROSMS_API_KEY=your_herosms_key
HEROSMS_API_URL=https://hero-sms.com/api/v1
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
FRONTEND_URL=http://localhost:5173
PORT=5000
JWT_SECRET=make-this-a-long-random-string-at-least-32-chars
```

### Step 3: Set up database

1. Log in to Supabase dashboard
2. Go to SQL Editor
3. Paste contents of `supabase/schema.sql`
4. Click Run

### Step 4: Run the app

**Terminal 1 — Backend:**
```bash
cd /Users/mac/panelng/backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd /Users/mac/panelng/frontend
npm run dev
```

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:3001/api**
- Health check: **http://localhost:3001/api/health**

### Step 5: Create your admin account

1. Register via the app at http://localhost:5173/register
2. Go to Supabase dashboard → Table Editor → users
3. Find your email row, set `role` to `admin`
4. Or run SQL: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

### Step 6: Add your first services

**Option A — Sync from JAP (recommended):**
- Log in as admin → go to Admin → Services Manager
- Click "Sync from JAP" — this imports all services automatically with a 30% markup
- Review and edit prices as needed

**Option B — Manual:**
- In Services Manager, click "Add Service"
- Enter the JAP service ID (find it from JAP's service list), platform, name, and your sell price

---

## Pricing Guide

Services are priced **per 1000 units**. Example:
- Cost price: ₦50/1000 (what JAP charges you)
- Sell price: ₦75/1000 (what your users pay)
- Margin: 50% markup

When a user orders 5,000 followers at ₦75/1000:
- Total charged from wallet: `₦75 × 5000 / 1000 = ₦375`
- Your cost: `₦50 × 5000 / 1000 = ₦250`
- Your profit: **₦125**

---

## Production Deployment

**Backend:** Deploy to Railway, Render, or DigitalOcean
- Set all environment variables on the host
- Change `FRONTEND_URL` to your actual frontend domain

**Frontend:** Deploy to Vercel or Netlify
- No build config needed beyond `npm run build`
- The built files in `dist/` are the static frontend

---

## API Docs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login |
| GET | /api/smm/services | Yes | List SMM services |
| POST | /api/smm/order | Yes | Place SMM order |
| GET | /api/sms/prices/:product | Yes | Get SMS prices |
| POST | /api/sms/buy-number | Yes | Buy SMS number |
| GET | /api/sms/check/:orderId | Yes | Poll for code |
| POST | /api/payment/initialize | Yes | Start Paystack payment |
| GET | /api/payment/verify/:ref | Yes | Verify payment |
| GET | /api/wallet/balance | Yes | Get wallet balance |
| GET | /api/wallet/transactions | Yes | Get transactions |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | All users |
| GET | /api/admin/services | Admin | All services |
| PATCH | /api/admin/services | Admin | Update service |
| POST | /api/admin/sync-services | Admin | Sync from JAP |
