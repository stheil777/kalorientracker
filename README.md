# Kalorientracker

Mobile-first calorie tracker for two profiles: Stephan and Jen.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Vercel-ready environment variables

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
cp .env.example .env.local
```

3. Add your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. In Supabase, open SQL Editor and run:

```sql
-- see supabase/schema.sql
```

Use the full contents of `supabase/schema.sql`.

5. Start development:

```bash
npm run dev
```

## Supabase setup

Create a Supabase project, enable Email provider under Authentication, then run `supabase/schema.sql`.

The app creates the two default profiles, Stephan and Jen, after the first login for each Supabase user. All data rows include `user_id`, and Row Level Security policies restrict reads and writes to `auth.uid()`.

For Vercel, add the same environment variables in Project Settings -> Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `USDA_API_KEY` (optional — get a free key at api.data.gov; falls back to DEMO_KEY with lower rate limits)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — required for account deletion)

## Features

- Email/password sign-in and account creation
- Profile switcher for Stephan and Jen
- Daily calorie and macro goals
- Meal entries by date and meal type
- Favorite meals with one-tap add
- Daily notes for weight, training, water, sleep, energy, and free text
- Mobile-first UI with large touch targets
