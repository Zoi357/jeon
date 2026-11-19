# Deployment Guide — JEON Engineering Services

The site is two separate apps deployed to two separate hosts.

---

## Frontend → Vercel (free tier)

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your deployed backend URL (from step below)
5. Click **Deploy**. Vercel builds Next.js automatically.
6. You get a public URL like `https://jeon-engineering.vercel.app` — this is the link customers click.

---

## Backend → Render (free tier)

1. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
2. Set **Root Directory** to `backend`.
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Add environment variables:
   - `PORT` = `10000` (Render assigns this automatically; just leave it)
   - `CLIENT_URL` = your Vercel URL (for CORS)
   - `ADMIN_TOKEN` = a long random secret (e.g. generate with `openssl rand -hex 32`)
6. Click **Create Web Service**. You get a URL like `https://jeon-api.onrender.com`.

---

## Wire them together

- In Vercel, update `NEXT_PUBLIC_API_URL` to the Render URL from step above.
- In Render, confirm `CLIENT_URL` matches the Vercel URL exactly (no trailing slash).
- Redeploy the frontend on Vercel after changing the env var.

---

## Notes

- The backend stores bookings in `backend/data/bookings.json`. This file is local to the Render instance. If Render restarts the service (free tier spins down after inactivity), the file persists on the disk — but if the service is redeployed from scratch, it resets. For production, replace the JSON store with a database (see `backend/src/store.ts`).
- The frontend is fully static-first (Next.js Cache Components). No database connection from the frontend — all data goes through the backend API.
