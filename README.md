# AI Engineering Notebook

Phone-first project workspace for moving from an idea to a verified build, notes, LaTeX, and a GitHub export.

Read the implementation contract in [PROJECT_WORKFLOW.md](./PROJECT_WORKFLOW.md).

## Run locally

```text
npm install
copy .env.example .env.local
python -m pip install -r server/requirements.txt
npm run server   # terminal 1: localhost:8787
npm run dev      # terminal 2: Vite app; /api is proxied to the server
```

The app works offline with local project state. Add Supabase, Firebase, and GitHub values to `.env.local` only when those integrations are ready. Firebase AI Logic uses the public Firebase web configuration and App Check; it never needs a Gemini key in the browser. `GOOGLE_API_KEY` is server-only; never expose it with the `VITE_` prefix.

The production server uses the remote Google ADK service. For local development, if `ADK_SERVICE_URL` is empty, it uses the direct Gemini API fallback; set `REQUIRE_REMOTE_ADK=true` to catch a missing remote ADK configuration early.

The no-billing deployment layer is Render: `render.yaml` defines the ADK and Node API web services, and `.github/workflows/deploy-render.yml` triggers both service deploys from GitHub. Render's free tier sleeps when idle, so it is a production-shaped deployment path but not a production-SLA environment.

Firebase AI Logic setup: enable AI Logic for the registered `Project Notebook Web` app in Firebase Console → AI Services → AI Logic. Register a production App Check provider and set `VITE_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_SITE_KEY`. `VITE_AI_PROVIDER=auto` uses the agent API first and Firebase AI Logic as a validated fallback; set it to `firebase` to use Firebase AI Logic directly.

Apply `supabase/migrations/0001_project_notebook.sql` in the Supabase SQL Editor before enabling authenticated sync.

The configured GitHub target is `Project-Notes`. Add a GitHub token with repository contents write permission to `GITHUB_TOKEN`; the token is not stored in the frontend.

## Checks

```text
npm run build
npm run lint
```

Project-Notes: for making projects on phone.
