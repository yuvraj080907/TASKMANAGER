# Task Manager — Step-by-Step Hosting Guide

**Goal:** get the full app live on the internet for free.

The app has **3 parts**, each hosted separately:

| Part | Tech | Hosted on | Free? |
|---|---|---|---|
| Database | PostgreSQL (Supabase) | Supabase | Yes |
| Backend API | Node.js + Express + Socket.io | Render | Yes |
| Frontend | React + Vite | Netlify | Yes |

> Netlify is static hosting only — it **cannot** run the backend. That's why the frontend and backend deploy separately.

**Order matters:** follow the steps in order. Step 1 (Database) must be done first because Steps 3 and 4 need the connection string from it.

---

## What's already done (in the repo)

- Prisma schema (`backend/prisma/schema.prisma`) with `User` + `Task` models
- Supabase migration SQL at `backend/supabase/migrations/20260811144958_remote_commit.sql`
- `netlify.toml` — Netlify build settings (base dir `frontend`, build `npm run build`, publish `dist`)
- `.env.example` — templates of exactly what to put in each hosting dashboard
- CORS restricted to `CLIENT_URL` in `backend/server.js`
- `engines: node >=18` in `backend/package.json`

You don't need to redo any of that. Start below.

---

# STEP 1 — Database (Supabase) — DONE

**Your Supabase project already exists and tables are created.**

- Project ref: `lcwcgdgbsgsvpeazubyh`
- Tables `User` and `Task` are already created in the cloud database.

If you ever need to recreate the tables from scratch:

```bash
cd backend
npm run db:push        # creates User + Task from prisma/schema.prisma
```

Verify in the Supabase dashboard → **Table Editor** → both tables should exist.

✅ Database done. You only need the **connection string** from it (Step 3).

---

# STEP 2 — Local `.env` files (done on this machine, repeat for another computer)

### 2.1 Backend → `backend/.env`

Already created in the repo (gitignored — never committed/pushed):

```env
DATABASE_URL=postgresql://postgres.lcwcgdgbsgsvpeazubyh:YOUR_DB_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true
JWT_SECRET=taskmanager_secret_key_2024_change_in_production
CLIENT_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

> **Connection string format notes (very important):**
> - Use the **transaction pooler** port `5432` (NOT `6543` session pooler — Prisma fails with `prepared statement "s0" already exists`).
> - The username is `postgres.<PROJECT_REF>`, not `postgres`.
> - Always append `?sslmode=require&pgbouncer=true`.
> - **URL-encode special characters in the password** (`@` → `%40`, `#` → `%23`, `$` → `%24`, `!` → `%21`, `/` → `%2F`, `:` → `%3A`).

### 2.2 Frontend → `frontend/.env.local`

Already created in the repo (gitignored):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2.3 Test locally (optional but recommended)

```bash
# Terminal 1 — backend
cd backend && npm run dev        # prints "Database Connected: Supabase Postgres"

# Terminal 2 — frontend (port 3000)
cd frontend && npm run dev
```

Open http://localhost:3000 → register → log in → create a task. Data now lives in Supabase.

---

# STEP 3 — Host the backend (Render)

Create a free account at https://render.com (GitHub login).

### 3.1 Create the Web Service

1. Dashboard → **New** (top right) → **Web Service**
2. Connect your **GitHub** account
3. Select the repository: **yuvraj080907/TASKMANAGER**

### 3.2 Configure (copy these EXACT values)

| Setting | Value |
|---|---|
| Name | `taskmanager-api` |
| Region | any near you (e.g. Singapore) |
| Branch | `main` |
| Runtime | **Node** |
| Root Directory | `backend` |
| Build Command | `npm install` (auto-runs `prisma generate` via postinstall) |
| Start Command | `node server.js` |
| Instance Type | **Free** |

### 3.3 Add environment variables

In the **Environment** section, add one by one:

| Key | Value |
|---|---|
| `DATABASE_URL` | your working Supabase string from Step 2.1 (same as `backend/.env`) |
| `JWT_SECRET` | same value as `backend/.env` |
| `JWT_EXPIRE` | `30d` |
| `CLIENT_URL` | your Netlify URL from Step 4, e.g. `https://yuvraj-taskmanager.netlify.app` — **no trailing slash** |
| `PORT` | `5000` (Render overrides it; harmless) |

> **Wait:** if you already created the Render service before Netlify, set `CLIENT_URL` to a placeholder now (`https://example.com`), then update it to the real Netlify URL in Step 5. Render auto-redeploys when env vars change.

### 3.4 Deploy

1. Click **Create Web Service**
2. Wait 1–3 minutes for build + deploy (watch the **Logs** tab)
3. You get a URL like: `https://taskmanager-api.onrender.com`

### 3.5 Verify the API

Open in your browser:

```
https://taskmanager-api.onrender.com/api/health
```

Expected:

```json
{ "status": "OK", "message": "Task Manager API is running smoothly", "timestamp": "..." }
```

> ⚠️ **If the service crashes**: open the **Logs** tab. It usually means `DATABASE_URL` is wrong (bad password, unencoded special character, or wrong pooler port). Fix the variable → Render redeploys automatically.
>
> 💡 **Free Render sleeps after 15 min** of no traffic. The first request after idle takes ~1 min to wake up. This is normal.

✅ Backend done. Copy `https://taskmanager-api.onrender.com` — needed in Step 4.

---

# STEP 4 — Host the frontend (Netlify)

Create a free account at https://www.netlify.com (GitHub login).

### 4.1 Import the project

1. **Add new site** → **Import an existing project**
2. Click **GitHub** → select the repo: **yuvraj080907/TASKMANAGER**

### 4.2 Build settings (automatic)

Netlify reads `netlify.toml` from the repo — no typing needed:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

### 4.3 Site name

1. **Site configuration** → **General** → **Change site name**
2. Set it to e.g. `yuvraj-taskmanager`
3. Your URL becomes: `https://yuvraj-taskmanager.netlify.app`

### 4.4 Add environment variables (IMPORTANT)

1. **Site configuration** → **Environment variables**
2. **Add a variable** → add these two:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://taskmanager-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://taskmanager-api.onrender.com` |

> These get **baked into the build** — the site cannot talk to the backend without them. Env changes require a **redeploy** (Netlify does this automatically after saving).

### 4.5 Deploy

1. **Deploy site** (top right)
2. Wait ~1–2 min for the build
3. **Deploys** tab → should show **Published**

✅ Frontend deployed.

---

# STEP 5 — Link backend & frontend + final checks

### 5.1 Make sure `CLIENT_URL` is right on Render

On Render (backend env vars), `CLIENT_URL` must be **exactly**:

```
https://yuvraj-taskmanager.netlify.app
```

No trailing slash, no `http://`. If you set a placeholder earlier, edit the variable now — Render redeploys automatically.

### 5.2 Full test

1. Open `https://yuvraj-taskmanager.netlify.app`
2. **Register** a new account → log out → **log in**
3. Create a task, edit it, delete it
4. Open dev tools (F12) → **Network** tab → requests should go to `api.onrender.com` with **no CORS errors**

### 5.3 Restart-proof test (proves you're on Supabase)

1. On Render → **Manual Deploy** → **Deploy latest commit** (or just wait for a sleep cycle)
2. Reload the site → log in again → **your tasks are still there**
   - If they're gone → the backend was using the wrong DB. Check `DATABASE_URL` in Render env vars.

---

# TROUBLESHOOTING

| Problem | Fix |
|---|---|
| Login/register fail in browser but work via curl | CORS → check `CLIENT_URL` on Render matches the Netlify URL exactly (no trailing slash), then redeploy |
| `Network Error` in browser console | Netlify env vars missing → add `VITE_API_URL` / `VITE_SOCKET_URL` → redeploy (env changes need a rebuild) |
| CORS error in browser | `CLIENT_URL` on Render ≠ your exact Netlify URL |
| Real-time updates don't work | Check `VITE_SOCKET_URL` on Netlify. Socket.io uses polling + websocket (works on free Render) |
| Render build fails at `npm install` | Root Directory must be `backend` (not the repo root) |
| Render crash: `prepared statement "s0" already exists` | `DATABASE_URL` must use pooler port `5432` + `&pgbouncer=true` (not port 6543) |
| Render crash: `FATAL: no tenant identifier provided` | Username must be `postgres.<PROJECT_REF>` (not `postgres`) |
| First request after idle takes ~1 min | Normal — free Render sleeps after 15 min idle |
| Prisma tables missing in production | Run `npm run db:push` locally from `backend/`, or once from a Render shell |

---

# QUICK FILE MAP

| Path | What it does |
|---|---|
| `netlify.toml` | Netlify build + SPA redirect config |
| `backend/server.js` | Express + Socket.io server, CORS via `CLIENT_URL` |
| `backend/config/db.js` | DB connection via Prisma |
| `backend/prisma/schema.prisma` | Postgres schema (User + Task tables) |
| `backend/config/prisma.js` | Prisma client singleton |
| `backend/supabase/migrations/*.sql` | SQL schema definition (tracked in git) |
| `backend/.env` | Local secrets (gitignored — never pushed) |
| `frontend/.env.local` | Local frontend env (gitignored — never pushed) |
| `backend/.env.example` | Template for Render env vars |
| `frontend/.env.example` | Template for Netlify env vars |
| `frontend/src/services/api.js` | API base URL from `VITE_API_URL` |
| `frontend/src/services/socket.js` | Socket URL from `VITE_SOCKET_URL` |
| `.gitignore` | Keeps `.env`, `node_modules`, `dist` out of git |