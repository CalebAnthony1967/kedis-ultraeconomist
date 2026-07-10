# KEDIS UltraEconomist — Local Setup with Supabase

## Overview

This guide helps you run the KEDIS UltraEconomist project locally with a **Supabase** database backend. The Supabase integration files live alongside the existing Base44 code — no existing files are modified.

## Prerequisites

- **Node.js** 18+ and npm
- **Git**
- A Supabase account (you already have the project)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for local development

## Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd kedis-ultraeconomist
npm install
```

## Step 2: Install the Supabase JS Client

```bash
npm install @supabase/supabase-js
```

## Step 3: Configure Environment Variables

Copy the example env file and your credentials are already pre-filled:

```bash
cp .env.example .env.local
```

Your `.env.local` should contain:
```
VITE_SUPABASE_URL=https://smkwoszizgbvflrczsge.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XEtgz6amLy8je54dW4qA2w_1my9paxX
```

## Step 4: Apply the Database Schema

Go to your Supabase Dashboard:
1. Open https://supabase.com/dashboard/project/smkwoszizgbvflrczsge
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `supabase/schema.sql` → **Run**
5. Copy the contents of `supabase/security.sql` → **Run**
6. (Optional) Copy `supabase/seed.sql` → **Run** for sample data

## Step 5: Deploy Edge Functions (Optional)

For AI/LLM features and email sending:

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase login
supabase link --project-ref smkwoszizgbvflrczsge

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
supabase secrets set RESEND_API_KEY=re-your-resend-key

# Deploy functions
supabase functions deploy invoke-llm --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
```

## Step 6: Create Your First Admin User

1. Start the app: `npm run dev`
2. Go to the Register page and create an account
3. In Supabase Dashboard → **Table Editor** → `profiles` table, update your user:
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin', portal_role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

## Step 7: Run the Project

```bash
npm run dev
```

Open http://localhost:5173

## File Structure (New Supabase Files)

```
.env.example                          # Environment template
.gitignore                            # Updated with Supabase ignores
src/lib/
  supabaseClient.js                   # Supabase client initialization
  supabaseAuth.js                     # Auth adapter (mirrors Base44 auth)
  supabaseData.js                     # Data access layer (mirrors Base44 entities)
  supabaseStorage.js                  # File storage & Edge Function adapter
supabase/
  config.toml                         # Supabase CLI configuration
  schema.sql                          # Database schema (run first)
  security.sql                        # RLS & security policies (run second)
  seed.sql                            # Sample data (run third)
  functions/
    invoke-llm/index.ts               # LLM Edge Function
    send-email/index.ts               # Email Edge Function
```

## How to Migrate Pages from Base44 to Supabase

Each page currently imports from `@/api/base44Client`. To switch to Supabase:

### Before (Base44):
```jsx
import { base44 } from '@/api/base44Client';

const data = await base44.entities.Indicator.list('-created_date', 20);
await base44.entities.Indicator.create({ name: 'GDP', value: 5.4 });
await base44.auth.me();
await base44.auth.logout();
```

### After (Supabase):
```jsx
import { supabaseEntities } from '@/lib/supabaseData';
import { supabaseAuth } from '@/lib/supabaseAuth';

const data = await supabaseEntities.Indicator.list('-created_date', 20);
await supabaseEntities.Indicator.create({ name: 'GDP', value: 5.4 });
await supabaseAuth.me();
await supabaseAuth.logout();
```

The method signatures are identical — just swap the import.

## Entity Name Mapping

| Base44 Entity      | Supabase Table              |
|--------------------|-----------------------------|
| Indicator          | indicators                  |
| WardData           | ward_data                   |
| DataIngestionJob   | data_ingestion_jobs         |
| DataConnector      | data_connectors             |
| AuditLog           | audit_logs                  |
| SDGTarget          | sdg_targets                 |
| CopilotConversation| copilot_conversations       |
| ReportDraft        | report_drafts               |
| PolicyScenario     | policy_scenarios            |
| CitizenFeedback    | citizen_feedback            |
| User               | profiles                    |

## Security Notes

1. **Never commit `.env.local`** — it contains your keys
2. The anon key is safe for the client (RLS protects your data)
3. The service role key must ONLY be used in Edge Functions
4. RLS policies enforce that public users can only read verified data
5. Audit logs are immutable (append-only)
6. The "Terminate Session" button clears all local storage

## Troubleshooting

### "Missing Supabase environment variables"
Make sure `.env.local` exists and contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart the dev server after creating it.

### "permission denied for table"
RLS policies aren't set up. Re-run `security.sql` in the Supabase SQL Editor.

### Auth redirects not working
Make sure your Supabase project's **Authentication → URL Configuration** has `http://localhost:5173` in the allowed redirect URLs.

### Realtime subscriptions not working
Enable Realtime in Supabase Dashboard → **Database → Replication**. The `supabase` publication should include all tables.