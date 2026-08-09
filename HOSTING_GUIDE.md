# Task Manager — Complete Step-by-Step Hosting Setup

**Goal:** get the full app live on the internet for free.

The app has **3 parts**, each hosted separately:

| Part | Tech | Hosted on | Free? |
|---|---|---|---|
| Database | PostgreSQL | Supabase | Yes |
| Backend API | Node.js + Express + Socket.io | Render | Yes |
| Frontend | React + Vite | Netlify | Yes |

> Netlify is static hosting only — it **cannot** run the backend. That's why the two parts deploy separately.

---

## What's already done (in the repo)

The repository is already committed and pushed with all production fixes:

- **Supabase conversion complete** — backend now uses Postgres via Prisma (`backend/prisma/schema.prisma`); Mongoose/MongoDB removed; Socket.io, JWT, bcrypt unchanged; frontend uses `task.id` / `user.id`
- `netlify.toml` — Netlify build settings (tracked in git)
- `backend/config/db.js` — requires `DATABASE_URL` in production (never silently falls back to a temp DB that wipes data)
- `backend/server.js` — CORS restricted to `CLIENT_URL`
- `backend/package-lock.json` + `frontend/package-lock.json` — locked dependency versions
- `.env.example` files — templates of exactly what to put into each hosting dashboard
- `engines: node >=18` in `backend/package.json`

You don't need to redo any of that. Start below.

---

# STEP 1 — Create the database (Supabase)

Open **https://supabase.com** → **Start your project** → sign up (GitHub or email).

### 1.1 Create the project
1. Click **New project**
2. **Organization:** create one if needed (free)
3. **Project name:** `taskmanager`
4. **Database Password:** type a strong one and **save it** (used in Step 1.3)
5. **Region:** pick one near you (e.g. `ap-south-1` for India)
6. Click **Create new project** → wait ~2 minutes for it to provision

### 1.2 Get your connection string
1. Left sidebar: **Project Settings** (gear icon) → **Database**
2. Scroll to **Connection string** (under "Connection pooling" there's also a block for session pooler / direct connection)
3. Click **URI** → select **General** (or "Session pooler")
4. Copy the string — it looks like:
   ```
   postgresql://postgres.abcdefghijklmnop:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### 1.3 Fix the string format
1. Replace `YOUR_PASSWORD` (the part between `:` and `@`) with the real database password from 1.1
2. **URL-encode special characters** in the password (`@` → `%40`, `#` → `%23`, `$` → `%24`, `!` → `%21`, `/` → `%2F`, `:` → `%3A`)
3. Final example:
   ```
   postgresql://postgres.abcdefghijklass:MyRealPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

> Use the **Direct connection** style (host `db.<ref>.supabase.co`, port `5432`) if the pooler (port `6543`) gives you connection trouble with Prisma.

### 1.4 Create the tables
In your terminal run (needs the string in `backend/.env` first — see Step 2):
```bash
cd backend
npm run db:push
```
This creates the `User` and `Task` tables from `backend/prisma/schema.prisma`. You can verify them later in Supabase dashboard: **Table Editor**.

✅ Database done. Keep the final string — it's used in the next two steps.

---

# STEP 2 — Set up your computer (local `.env` files)

Before deploying, make the app work locally against the real cloud DB. This also catches mistakes early.

### 2.1 Backend `.env` → `backend/.env`
Edit the file `backend/.env` (already created in the repo, gitignored):

```env
MONGO_URI=mongodb+srv://taskmanager:MyRealPassword123@cluster0.xxxxx.mongodb.net/taskmanager
JWT_SECRET=<any long random string — one is already filled in>
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
PORT=5000
```

### 2.2 Frontend `.env.local` → `frontend/.env.local`
Already created in the repo (gitignored):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2.3 Run locally (optional but recommended)
```bash
cd backend && npm run dev      # terminal 1 → should print "Database Connected"
cd frontend && npm run dev     # terminal 2 → opens on localhost:3000
```
Register, log in, create a task. Your data now lives in Supabase.

---

# STEP 3 — Host the backend (Render)

Open **https://render.com** → **Get Started** → free account (GitHub or email).

### 3.1 Create the Web Service
1. Dashboard → **New** (top right) → **Web Service**
2. Connect your **GitHub** account (if asked)
3. Select the repository: **yuvraj080907/TASKMANAGER**

### 3.2 Configure (copy these EXACT values)

| Setting | Value |
|---|---|
| Name | `taskmanager-api` |
| Region | any near you |
| Branch | `main` |
| Runtime | **Node** |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Instance Type | **Free** |

### 3.3 Add environment variables
Expand **Advanced** (or the Environment section) → **Add Environment Variable**, one by one:

| Key | Value |
|---|---|
| `DATABASE_URL` | the final Supabase string from Step 1.3 |
| `JWT_SECRET` | same value as `backend/.env` |
| `JWT_EXPIRE` | `30d` |
| `CLIENT_URL` | your Netlify URL from Step 4 (e.g. `https://yuvraj-taskmanager.netlify.app`) — no trailing slash |
| `PORT` | `5000` (Render overrides it; harmless) |

### 3.4 Deploy
1. Click **Create Web Service**
2. Wait 1–3 minutes for the build + deploy (watch the log tab)
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

> ⚠️ If the service crashes instead: open the **Logs** tab — it means `DATABASE_URL` is wrong (bad password or special characters not URL-encoded). Fix the variable → the service auto-redeploys.

> 💡 Free Render **sleeps after 15 minutes** of no traffic. The first request after idle takes ~1 min (it wakes up). This is normal.

> 📋 On first deploy, the tables may not exist yet — connect the backend once, then run `npm run db:push` locally (from `backend/` with `DATABASE_URL` in `.env`), or run the same command once from a Render shell. After that, tables exist permanently.

✅ Backend done. Copy the `https://taskmanager-api.onrender.com` URL — needed in Step 4.

---

# STEP 4 — Host the frontend (Netlify)

Open **https://www.netlify.com** → **Sign up** → with **GitHub**.

### 4.1 Import the project
1. **Add new site** → **Import an existing project**
2. Click **GitHub** → connect GitHub if asked
3. Select the repository: **yuvraj080907/TASKMANAGER**

### 4.2 Build settings (automatic)
Netlify reads `netlify.toml` from the repo — you don't have to type anything:
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

### 4.3 Site name
1. Click **Site settings** (or configure now)
2. Site name: `yuvraj-taskmanager`
3. Your URL becomes: `https://yuvraj-taskmanager.netlify.app`

### 4.4 Add environment variables (IMPORTANT)
1. Go to **Site configuration** (Site settings) → **Environment variables**
2. Click **Add a variable** → add these two:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://taskmanager-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://taskmanager-api.onrender.com` |

> These get baked into the frontend build — the site cannot talk to the backend without them.

### 4.5 Deploy
1. **Deploy site** (top right)
2. Wait ~1–2 min for the build
3. Check the **Deploys** tab → should show **Published**

✅ Frontend deployed.

---

# STEP 5 — Link backend & frontend + final checks

### 5.1 Make sure `CLIENT_URL` is right on Render
On Render (backend env vars), `CLIENT_URL` must be **exactly**:
```
https://yuvraj-taskmanager.netlify.app
```
No trailing slash, no `http://`. If you changed it after creating the service, edit the variable — Render redeploys automatically.

### 5.2 Full test
1. Open `https://yuvraj-taskmanager.netlify.app`
2. **Register** a new account → log out → **log in**
3. Create a task, edit it, delete it
4. Open dev tools (F12) → **Network** tab → requests should go to `api.onrender.com` with **no red CORS errors**

### 5.3 Restart-proof test (proves you're on Atlas)
1. On Render → **Manual Deploy** → **Deploy latest commit** (or just wait for the sleep cycle)
2. Reload the site → log in again → **your tasks are still there**
   - If they're gone → you were on an in-memory DB → `MONGO_URI` was wrong. Check Render logs.

---

# TROUBLESHOOTING

### 5.3 Restart-proof test (proves you're on Supabase)
1. On Render → **Manual Deploy** → **Deploy latest commit** (or just wait for the sleep cycle)
2. Reload the site → log in again → **your tasks are still there**
   - If they're gone → the backend was using a temp DB. Check `DATABASE_URL` in Render

<｜DSML｜tool_calls>
<｜DSML｜invoke name="edit">
<｜DSML｜parameter name="filePath" string="true">E:\youraj project\TASKMANAGER\Hontend loads but login/register fails | First request after Render sleep takes ~1 min. If it keeps failing, check `VITE_API_URL` on Netlify. |
| `Network Error` in browser console | Netlify env vars missing → add `VITE_API_URL` / `VITE_SOCKET_URL` → **Deploys → Trigger deploy** (env changes need a rebuild). |
| CORS error in browser | `CLIENT_URL` on Render ≠ your exact Netlify URL (no trailing slash). |
| Real-time updates don't work | Check `VITE_SOCKET_URL` on Netlify. Socket.io already uses polling + websocket (works on free Render). |
| Render build fails at `npm install` | Root Directory must be `backend` (not the repo root). |
| Real-time updates don't work | Check `VITE_SOCKET_URL` on Netlify. Socket.io already uses polling + websocket (works on free Render). |
| Render build fails at `npm install` | Root Directory must be `backend` (not the repo root). |

---

# QUICK FILE MAP

| Path | What it does |
|---|---|
| `netlify.toml` | Netlify build + SPA redirect config |
| `backend/server.js` | Express + Socket.io server, CORS via `CLIENT_URL` |
| `backend/config/db.js` | DB connection: Supabase if `DATABASE_URL` set (via Prisma) |
| `backend/prisma/schema.prisma` | Postgres schema (User + Task tables) |
| `backend/config/prisma.js` | Prisma client singleton |
| `backend/.env` | Local secrets (gitignored — never pushed) |
| `frontend/.env.local` | Local frontend env (gitignored — never pushed) |
| `backend/.env.example` | Template for Render env vars |
| `frontend/.env.example` | Template for Netlify env vars |
| `frontend/src/services/api.js` | API base URL from `VITE_API_URL` |
| `frontend/src/services/socket.js` | Socket URL from `VITE_SOCKET_URL` |
| `.gitignore` | Keeps `.env`, `node_modules`, `dist` out of git |
