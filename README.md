# orbit-demo-app

A tiny Vite + React app for demoing [Orbit](../../README.md):

- `VITE_MESSAGE` (set it in Orbit's Environment Variables) is shown on the page.
- `ORBIT_ENV`, `ORBIT_GIT_COMMIT_SHA`, `ORBIT_GIT_COMMIT_REF` are injected by Orbit at build time.
- `/about` is a client-side route (exercises the SPA fallback).
- `api/hello.js` is a serverless function served at `/api/hello`.
- `vercel.json` adds routing rules that Orbit applies at the edge:
  - `/old-about` permanently redirects (308) to `/about`
  - `/hello/<name>` is rewritten to the function, so `/hello/sagar` returns `/api/hello?name=sagar` with the URL unchanged
  - every response gets `X-Frame-Options: DENY` and `X-Powered-By: Orbit`

Push this folder to your own public GitHub repo, then import it in Orbit.
