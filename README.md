# Marine Dashboard Frontend

React frontend for the marine monitoring dashboard. This repository contains only the browser application and the static assets it currently uses.

## Included

- React source code in `src/`
- Required ship and engine 3D assets in `public/`
- Nginx deployment configuration in `deploy/`
- Build, Tailwind, and Vercel configuration

The backend service, database files, local environment files, build output, dependencies, temporary files, unused videos, and unused 3D source assets are intentionally excluded.

## Local Development

```bash
npm ci
cp .env.example .env.local
npm start
```

The development server listens on `http://localhost:3000`. In local development, the CRA proxy sends `/api/v1` requests to `http://127.0.0.1:8080`; start the backend separately when API-backed login and data are needed.

## Production Build

```bash
npm run build:deploy
```

The command creates `build/` and removes unreferenced deployment assets. Serve the result through Nginx; see `deploy/nginx-marine-dashboard.conf`.

## Environment

`REACT_APP_API_BASE_URL` defaults to `/api/v1`, suitable for a same-origin Nginx reverse proxy. For a separately hosted API, set it to the full API base URL before building.

Never commit `.env` files containing deployment-specific values.
