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

- The backend stores bookings in MySQL. Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` on the backend service. The database must exist before the API starts; the API creates its tables and indexes on startup.
- On the first startup with an empty MySQL `bookings` table, the backend imports any existing `backend/data/bookings.json` records once. Keep the JSON file as a backup until you confirm the imported bookings in MySQL.
- The frontend is fully static-first (Next.js Cache Components). No database connection from the frontend — all data goes through the backend API.

## Local MySQL setup

1. Install MySQL Server and MySQL Workbench, then start the MySQL service.
2. In Workbench, create the application database:

   ```sql
   CREATE DATABASE jeon_bookings
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```

3. Add the MySQL settings from `backend/.env.example` to `backend/.env`. Use your local MySQL username and password.
4. From the repository root, run `npm run dev`. The API creates the `bookings` and `app_migrations` tables and imports the JSON bookings once.
5. In Workbench, refresh the `jeon_bookings` schema and expand **Tables** to see the tables and booking rows.

If the database already contains booking rows and the JSON file also has records, startup stops rather than risk mixing or duplicating data.
