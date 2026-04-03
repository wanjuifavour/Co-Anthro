# Xata Bootstrap Guide

Xata does not run raw SQL migrations here, so this file acts as the step-by-step setup guide for the empty database.

## 0. Prerequisites

- Xata database created
- `.env.local` populated with the PostgreSQL `XATA_DB_URL`, `TEAM_PASSWORD`, and `AUTH_SECRET`
- `XATA_DB_URL` must look like `postgresql://xata:...@<host>.xata.tech/xata?sslmode=require`

## 1. Create the tables

Create these tables in Xata in this order.

### `ideas`

| Column | Type | Notes |
|---|---|---|
| `title` | String | required |
| `description` | Text | optional |
| `scores` | JSON | stores per-person voting data |
| `problem_statement` | Text | optional |

### `tasks`

| Column | Type | Notes |
|---|---|---|
| `task_key` | String | unique |
| `checked` | Boolean | default false |
| `checked_by` | String | optional |
| `checked_at` | DateTime | optional |

### `documents`

| Column | Type | Notes |
|---|---|---|
| `slug` | String | unique |
| `content` | Text | optional |
| `updated_by` | String | optional, stores the active editor name (`Christopher`, `Favour`, or `Evans`) |
| `updated_at` | DateTime | optional |

### `notes`

| Column | Type | Notes |
|---|---|---|
| `author` | String | use `A`, `B`, or `C` in the table; the UI shows `Christopher`, `Favour`, and `Evans` |
| `content` | Text | required |
| `created_at` | DateTime | optional |

### `settings`

| Column | Type | Notes |
|---|---|---|
| `key` | String | unique |
| `value` | String | optional |

## 2. Verify unique fields

- `tasks.task_key` must be unique
- `documents.slug` must be unique
- `settings.key` must be unique

## 3. No seed rows required

The app creates its own records as you use it:

- ideas are added from the ideation page
- tasks are created when tasks are toggled
- notes are created from the notes page
- documents are created when docs are edited and are attributed to the selected editor name
- settings is used for the locked winner id

## 4. Quick validation

After the tables exist, run the app and check:

- `/ideation` can add an idea
- `/tasks` can toggle a task and save it in Xata
- `/notes` can post a note
- `/docs` can save a document tab
