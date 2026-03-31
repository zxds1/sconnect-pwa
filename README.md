# SConnect PWA

SConnect is a software system with a customer-facing web application and a separate admin panel. This repository contains the PWA side of that system.

## Apps in this repo

- Root app: the main SConnect web experience for customers and sellers.
- `admin-panel/`: a standalone Vite app for admin and operations workflows.

## Main PWA

### Scripts

From `PWA/`:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

### Environment

Create `PWA/.env.local` from `PWA/.env.example` and set:

- `VITE_API_BASE_URL` required, usually your Kong or API gateway URL.
- `VITE_GUEST_TENANT_ID` for guest and public flows in local development.
- `VITE_TENANT_ID`, `VITE_USER_ID`, `VITE_AUTH_TOKEN`, and `VITE_ROLE` for optional session overrides.

For the local backend stack, `VITE_API_BASE_URL=http://localhost:8000` and `VITE_GUEST_TENANT_ID=tenant_001` are the usual defaults.

### Local Docker

Run only the PWA container and connect it to a backend already running on the host:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

The app will be available at `http://localhost:3000`.

### Netlify

The checked-in `netlify.toml` builds the root app with `npm run build` and publishes `dist/`.

## Admin Panel

The admin panel is a separate Vite app located in `PWA/admin-panel/`.

### Scripts

From `PWA/admin-panel/`:

```bash
npm install
npm run dev
npm run build
npm run preview
```

### Notes

- The admin panel is intentionally separate from the main PWA so it can be deployed and scaled independently.
- Point its API client at the backend gateway used by your environment.

## Project Structure

- `src/` main PWA source code.
- `admin-panel/src/` admin panel source code.
- `Dockerfile.local` local container image for the PWA.
- `docker-compose.local.yml` local container setup for the PWA.
- `netlify.toml` production build configuration for the root app.
