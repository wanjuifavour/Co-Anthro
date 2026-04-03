# Co-Anthro

Internal team tracker for the AI Hackathon · April 2–11, current year.

**Stack:** Next.js 14 App Router · TypeScript · Xata Postgres · IBM Plex Sans/Mono

---

## Pages

| Route | Purpose |
|---|---|
| `/login` | Team password gate |
| `/` | Dashboard — countdown, today's tasks, progress, quick links |
| `/ideation` | Submit ideas, score on 4 criteria, lock the winner |
| `/tasks` | Full 10-day task board with real-time sync |
| `/docs` | 6-tab document editor (Persona, Journey, PRD, Stack, AI Prompt, Competitive) |
| `/notes` | Running team log — append-only, newest first |

---

## 1. Prerequisites

- Node.js 18+
- A [Xata](https://xata.io) account (free tier is enough)

---

## 2. Create the Xata database

1. Go to [app.xata.io](https://app.xata.io) and create a new database called **`hackathon-hub`**.

2. Create these **5 tables** with the columns below.

### Table: `ideas`

| Column name | Type |
|---|---|
| `title` | String |
| `description` | Text |
| `scores` | JSON |
| `problem_statement` | Text |

### Table: `tasks`

| Column name | Type |
|---|---|
| `task_key` | String (unique) |
| `checked` | Boolean |
| `checked_by` | String |
| `checked_at` | DateTime |

### Table: `documents`

| Column name | Type |
|---|---|
| `slug` | String (unique) |
| `content` | Text |
| `updated_by` | String |
| `updated_at` | DateTime |

### Table: `notes`

| Column name | Type |
|---|---|
| `author` | String |
| `content` | Text |
| `created_at` | DateTime |

### Table: `settings`

| Column name | Type |
|---|---|
| `key` | String (unique) |
| `value` | String |

---

## 3. Get your Xata credentials

1. In your Xata workspace, copy the PostgreSQL connection string for your database.
2. It should look like:
   `postgresql://xata:...@<host>.xata.tech/xata?sslmode=require`

---

## 4. Local setup

```bash
# Clone / download the project
cd hackathon-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
XATA_DB_URL=postgresql://xata:...@<host>.xata.tech/xata?sslmode=require
TEAM_PASSWORD=pick-any-team-password
AUTH_SECRET=any-long-random-string-32-chars-minimum
```

```bash
# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 5. Deploy to Vercel (recommended)

```bash
npx vercel
```

Add the same 4 environment variables in your Vercel project settings under **Settings → Environment Variables**.

---

## 6. Share with your team

Send the URL + team password. That's it — no accounts needed.

---

## Real-time sync

The app polls every 5 seconds for tasks and notes, and every 8 seconds for docs. This means:
- A teammate checks a task → everyone sees it within 5 seconds
- A teammate saves a doc → others see it within 8 seconds (after they next type, their local draft takes over)

No websockets or additional infra needed.

---

## What's out of scope (intentionally)

- Pitch deck
- Actual product code/repo
- The presentation itself

Keep this tool simple. It exists to serve the project, not distract from it.
