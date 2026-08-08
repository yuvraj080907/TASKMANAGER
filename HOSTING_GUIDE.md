# Task Manager – Complete Hosting Guide

Deploy the full app: **MongoDB Atlas** (database) + **Render** (backend) + **Netlify** (frontend).

The app has 3 parts — each gets hosted separately:

| Part | Tech | Hosted on | Free? |
|---|---|---|---|
| Database | MongoDB Atlas | cloud | Yes (M0) |
| Backend API | Node.js + Express + Socket.io | Render | Yes |
| Frontend | React + Vite | Netlify | Yes |

> ⚠️ Netlify is static hosting only — it cannot run the backend. That's why backend and frontend are deployed separately.

---

## Step 0 – Commit & push the fixes (do this FIRST)

The repo currently has uncommitted fixes and `netlify.toml`. **Nothing works until these are pushed.**

```bash
git add .
git commit -m "fix: production DB fallback, CORS, lockfiles, deploy config"
git push
```

Files that must be in the repo (confirm with `git ls-files | grep -E "netlify.toml|package-lock|env.example"`):

| File | Why it matters |
|---|---|
| `netlify.toml` | Netlify's build settings — only read from the repo |
| `backend/package-lock.json` | exact backend dependency versions |
| `frontend/package-lock.json` | exact frontend dependency versions |
| `backend/.env.example`, `frontend/.env.example` | templates for what to type into each dashboard |

> `.env` / `.env.local` files with real secrets are gitignored — they stay on your computer. Hosting providers get the values via their dashboards, not the repo.

---

## Step 1 – Create the database (MongoDB Atlas)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → sign up / log in.
2. **Build a Database** → **M0 Free** tier → pick a region → **Create**.
3. **Security > Database Access > Add New Database User**:
   - Username: `taskmanager`
   - Password: strong one, **save it — you'll need it twice** (local + Render)
   - Role: **Read and write to any database**
4. **Network Access > Add IP Address > Allow access from anywhere** (`0.0.0.0/0`).
5. **Database > Connect > Drivers** → copy the connection string:
   ```
   mongodb+srv://taskmanager:<password>@cluster0.xxxxx.mongodb.net/taskmanager
   ```
   Replace `<password>` with the real one and make sure it ends with `/taskmanager`.

### Test it locally (optional but recommended)

Paste the string into `backend/.env` → `MONGO_URI=...`, then run `cd backend && npm run dev`. The console should print `MongoDB Connected` — the app now uses the cloud DB.

---

## Step 2 – Host the backend on Render

1. [render.com](https://render.com) → free account → **New > Web Service** → connect GitHub → select the `TASKMANAGER` repo.
2. Settings:

   | Setting | Value |
   |---|---|
   | Name | `taskmanager-api` |
   | Runtime | Node |
   | Root Directory | `backend` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Instance Type | Free |

3. **Environment Variables** (values from Step 1):

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas string from Step 1 |
   | `JWT_SECRET` | any long random string |
   | `JWT_EXPIRE` | `30d` |
   | `CLIENT_URL` | your Netlify URL from Step 3 (no trailing slash) — e.g. `https://yuvraj-taskmanager.netlify.app` |
   | `PORT` | `5000` (Render overrides it, harmless) |

4. **Create Web Service** → wait 1–3 min → you get a URL like:
   ```
   https://taskmanager-api.onrender.com
   ```
5. Verify: open `https://taskmanager-api.onrender.com/api/health` → should show `{ "status": "OK", ... }`.

> 💡 The free Render service **sleeps** after 15 min without traffic — the first request after idle takes ~1 min to wake up. Normal.

> ⚠️ The backend now **refuses to start without a valid `MONGO_URI`** (fails fast, never silently uses
> a temporary in-memory DB that wipes your data on redeploys). If it crashes, fix `MONGO_URI` — data could
> never be lost this way.

---

## Step 3 – Host the frontend on Netlify

1. [netlify.com](https://netlify.com) → **Add new site > Import an existing project** → GitHub → select `TASKMANAGER`.
2. Netlify reads `netlify.toml` automatically (base `frontend`, build `npm run build`, publish `dist`, plus the SPA redirect). No config needed.
3. Subdomain: e.g. `yuvraj-taskmanager` → your URL:
   ```
   https://yuvraj-taskmanager.netlify.app
   ```
4. **Site configuration > Environment variables > Add variable** (backend URL from Step 2):

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://taskmanager-api.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://taskmanager-api.onrender.com` |

5. **Deploys > Trigger deploy > Deploy site** (rebuilds with the new variables).

> Don't forget the Render `CLIENT_URL` value = this exact Netlify URL.

---

## Step 4 – Verify the whole app

1. Open `https://yuvraj-taskmanager.netlify.app`
2. Register a new account → log in → create a task.
3. Open dev tools (F12) → Network tab → API calls should hit `api.onrender.com` with no CORS errors.
4. **Restart-proof test:** redeploy Render or wait for its sleep cycle → your tasks are still there  (proves you're on Atlas, not in-memory).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Netlify "Site not found" / build failed | `netlify.toml` not pushed. Commit & push, then redeploy. |
| Backend keeps crashing on Render | Check Render logs. Usually a bad `MONGO_URI` (wrong password, missing `/taskmanager`, or Atlas IP rules). |
| `Network Error` in browser console | `VITE_API_URL` missing/wrong on Netlify — set it and trigger a redeploy. |
| CORS error in the browser | `CLIENT_URL` on Render must exactly match your Netlify URL (no trailing slash). |
| Data disappears after redeploy | Wrong `MONGO_URI` — the app never touches in-memory DB in production anymore, so it crashes instead of silently losing data. Fix the string using your logs. |
| First load after idle is slow | Render free tier sleeps after 15 min. Wait ~1 min and retry. |
| Real-time updates not working | Check `VITE_SOCKET_URL` on Netlify. Socket.io uses polling + websocket (already configured). |

---

## File map

| Path | What it does |
|---|---|
| `netlify.toml` | Netlify build + SPA redirect config |
| `backend/server.js` | Express + Socket.io server, CORS via `CLIENT_URL` |
| `backend/config/db.js` | DB connection — Atlas if `MONGO_URI` set, local dev fallback otherwise |
| `backend/.env.example` | Template for Render env vars |
| `frontend/.env.example` | Template for Netlify env vars |
| `frontend/src/services/api.js` | API base URL from `VITE_API_URL` |
| `frontend/src/services/socket.js` | Socket URL from `VITE_SOCKET_URL` |
| `.gitignore` | Keeps `.env`, `node_modules`, `dist` out of the repo |