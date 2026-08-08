# Task Manager — Complete Step-by-Step Hosting Setup

**Goal:** get the full app live on the internet for free.

The app has **3 parts**, each hosted separately:

| Part | Tech | Hosted on | Free? |
|---|---|---|---|
| Database | MongoDB Atlas (cloud) | Atlas | Yes (M0 Shared) |
| Backend API | Node.js + Express + Socket.io | Render | Yes |
| Frontend | React + Vite | Netlify | Yes |

> Netlify is static hosting only — it **cannot** run the backend. That's why the two parts deploy separately.

---

## What's already done (in the repo)

The repository is already committed and pushed with these production fixes:

- `netlify.toml` — Netlify build settings (now tracked in git)
- `backend/config/db.js` — requires `MONGO_URI` in production (never silently falls back to a temporary in-memory DB that wipes data)
- `backend/server.js` — CORS restricted to `CLIENT_URL`
- `backend/package-lock.json` + `frontend/package-lock.json` — locked dependency versions for reproducible builds
- `.env.example` files — templates of exactly what to put into each hosting dashboard
- `engines: node >=18` in `backend/package.json`

You don't need to redo any of that. Start below.

---

# STEP 1 — Create the database (MongoDB Atlas)

Open **https://www.mongodb.com/cloud/atlas** in your browser.

### 1.1 Sign up
1. Click **Try Free** / **Start Free**
2. Sign up with email or Google
3. Answer the quick survey → **Finish**

### 1.2 Create the free cluster
1. Click **Build a Database**
2. Choose **M0 Shared** (FREE — no credit card required) → **Create**
3. Leave the default region, or pick one near you → **Create Deployment**
4. Wait 1–2 minutes until the cluster shows **Active** (green)

### 1.3 Create a database user (SAVE THE PASSWORD)
1. Left menu: **Database Access** (under Security)
2. **Add New Database User**
3. Authentication Method: **Password**
4. Username: `taskmanager`
5. Password: click **Autogenerate Secure Password** → copy it → **save it in a safe place** (used again in Step 2 and Step 3)
6. Database User Privileges: **Built-in Role** → **Read and write to any database**
7. Click **Add User**

### 1.4 Allow access from anywhere
1. Left menu: **Network Access**
2. **Add IP Address**
3. Click **Allow Access from Anywhere** → it fills in `0.0.0.0/0` → **Confirm**

### 1.5 Copy your connection string
1. Left menu: **Database**
2. On your cluster click **Connect**
3. Choose **Drivers**
4. Select **Node.js** → version **5.x or later**
5. Copy the connection string:
   ```
   mongodb+srv://taskmanager:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 1.6 Fix the string format
Atlas appends `?retryWrites=true&w=majority`. For this app:
1. Replace `<db_password>` with the real password from 1.3
2. **URL-encode special characters** in the password (`@` → `%40`, `!` → `%21`, `#` → `%23`, `$` → `%24`, `:` → `%3A`, `/` → `%2F`)
3. Change the end so it reads `...mongodb.net/taskmanager` (keep or drop the query part — both work):
   ```
   mongodb+srv://taskmanager:MyRealPassword123@cluster0.xxxxx.mongodb.net/taskmanager
   ```

✅ Atlas is done. Keep the final string — it's used in the next two steps.

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
cd backend && npm run dev      # terminal 1 → should print "MongoDB Connected"
cd frontend && npm run dev     # terminal 2 → opens on localhost:3000
```
Register, log in, create a task. Your data now lives in Atlas.

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
| `MONGO_URI` | the final Atlas string from Step 1.6 |
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

> ⚠️ If the service crashes instead: open the **Logs** tab — it means `MONGO_URI` is wrong (bad password, missing `/taskmanager`, or special characters not URL-encoded). Fix the variable → the service auto-redeploys.

> 💡 Free Render **sleeps after 15 minutes** of no traffic. The first request after idle takes ~1 min (it wakes up). This is normal.

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

| Problem | Fix |
|---|---|
| Netlify shows "Site not found" / failed deploy | `netlify.toml` missing from GitHub. Commit & push it, redeploy. |
| Backend crashes on Render | Logs will say `MongoDB Connection Error`. Fix `MONGO_URI`: correct password, URL-encoded special characters, ends with `/taskmanager`, network access allows `0.0.0.0/0`. |
| Frontend loads but login/register fails | First request after Render sleep takes ~1 min. If it keeps failing, check `VITE_API_URL` on Netlify. |
| `Network Error` in browser console | Netlify env vars missing → add `VITE_API_URL` / `VITE_SOCKET_URL` → **Deploys → Trigger deploy** (env changes need a rebuild). |
| CORS error in browser | `CLIENT_URL` on Render ≠ your exact Netlify URL (no trailing slash). |
| Tasks disappear after redeploy | Was on in-memory DB. Fix `MONGO_URI` (app now crashes instead of silently losing data — that's by design). |
| Real-time updates don't work | Check `VITE_SOCKET_URL` on Netlify. Socket.io already uses polling + websocket (works on free Render). |
| Render build fails at `npm install` | Root Directory must be `backend` (not the repo root). |

---

# QUICK FILE MAP

| Path | What it does |
|---|---|
| `netlify.toml` | Netlify build + SPA redirect config |
| `backend/server.js` | Express + Socket.io server, CORS via `CLIENT_URL` |
| `backend/config/db.js` | DB connection: Atlas if `MONGO_URI` set, local dev fallback otherwise |
| `backend/.env` | Local secrets (gitignored — never pushed) |
| `frontend/.env.local` | Local frontend env (gitignored — never pushed) |
| `backend/.env.example` | Template for Render env vars |
| `frontend/.env.example` | Template for Netlify env vars |
| `frontend/src/services/api.js` | API base URL from `VITE_API_URL` |
| `frontend/src/services/socket.js` | Socket URL from `VITE_SOCKET_URL` |
| `.gitignore` | Keeps `.env`, `node_modules`, `dist` out of git |
