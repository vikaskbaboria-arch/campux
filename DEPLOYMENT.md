# Deploy Campux

The app is split into a Vercel frontend and a Render API. Keep credentials in the provider dashboards; do not commit `.env` files.

## Render API

The root `render.yaml` configures a Node web service rooted at `backend`, with `npm ci`, `npm start`, and `/api/v1/healthcheck` as its health check. You can deploy it as a Render Blueprint. If you already have a Render service, apply the same root directory, build command, start command, and health check in that service's settings instead of creating a second service.

Set these environment variables on Render:

- `MONGODB_URI`
- `CORS_ORIGIN`: the exact Vercel production origin, such as `https://campux.vercel.app`. Add preview or custom domains as comma-separated origins with no spaces.
- `NODE_ENV=production` when configuring an existing Render service manually (the Blueprint sets this automatically).
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for image uploads.

The Blueprint supplies `NODE_ENV=production` and token lifetimes. Render supplies `PORT` automatically.

After deployment, `https://<render-service>.onrender.com/api/v1/healthcheck` should return a successful JSON response.

## Vercel frontend

Set the Vercel project's Root Directory to `frontend`. Use `npm run build` as the build command and `dist` as the output directory. Set this Production environment variable to the Render service origin, without a path or trailing slash:

```text
VITE_API_URL=https://<render-service>.onrender.com
```

`VITE_SOCKET_URL` is optional and defaults to `VITE_API_URL`. Redeploy after changing either Vercel environment variable; Vite embeds these values into the built frontend.

`frontend/vercel.json` rewrites client-side routes to `index.html`, so refreshing a route such as `/offers` does not return a Vercel 404.
