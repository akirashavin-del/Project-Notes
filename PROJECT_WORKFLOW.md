# Project Notebook: Simple Agentic Workflow

This is the implementation blueprint for the phone-first AI project notebook.

```text
Idea → Discover → Define → Build → UI → Notes → LaTeX/PPT → Export/Git
```

## Product rule

The app is one continuous notebook. The user explains the project once. Every stage uses the same `ProjectContext`.

Agents are small workflow workers, not independent brains:

```text
Workflow Orchestrator
        ↓
ProjectContext
 ├─ Source Collector          deterministic
 ├─ Document/Code Extractor   deterministic
 ├─ Toolchain Worker          compiler/runtime
 ├─ Compatibility Scorer      deterministic
 ├─ Build/Test Worker         deterministic
 ├─ Artifact Worker           templates
 └─ Human Text Worker         limited LLM use
```

## LLM boundary

Do not use an LLM for scraping, metadata, checksums, compiler versions, syntax, types, dependencies, formatting, compilation, tests, scores, file structure, LaTeX structure, Git operations, or command success.

Use an LLM only for natural-language work:

- interpreting the user’s idea;
- summarising a paper or official documentation from extracted evidence;
- explaining selected code and normalised compiler errors;
- proposing a user-requested code patch;
- writing simple notes, README prose, and slide prose.

Every LLM output is validated, marked `aiGenerated: true`, and linked to source spans or code locations. Missing evidence is written as `Not stated in the source`.

## Workflow state

```text
START → INTERPRET_IDEA → COLLECT_RESEARCH → SELECT_SOURCES
→ DEFINE_PROJECT → BUILD_AND_TEST → GENERATE_UI → GENERATE_NOTES
→ GENERATE_PRESENTATION → PACKAGE_EXPORT → PUBLISH_GIT
```

Each stage saves its output, exposes a `nextAction`, and can be retried by job ID without repeating completed work.

```ts
Job {
  id: string
  projectId: string
  type: string
  status: "queued" | "running" | "succeeded" | "failed"
  inputHash: string
  outputRef?: string
  error?: string
}
```

## Shared project state

```ts
ProjectContext {
  id, stage, nextAction, userProfile, projectParameters,
  originalIdea, interpretedIdea,
  sources[], selectedProblems[], selectedPapers[], researchNotes[],
  compatibilityResults[], projectDefinition, architecture,
  toolchains[], files[], codeBlocks[], annotations[], runs[], errors[],
  uiDefinition, notes, presentation, exports
}
```

Original ideas and original code are immutable snapshots. Interpretations, patches, and generated artifacts are new versions.

## Research workflow

```text
Research request
 → approved source API/registry
 → fetch with timeout, rate limit, and robots policy
 → raw snapshot + URL + date + checksum
 → deterministic metadata/text extraction
 → deduplicate
 → deterministic compatibility score
 → limited LLM summary with citations
 → saved source card
```

Source types: research papers, official language/compiler documentation, standards, package/repository metadata, datasets, and approved technical articles. Do not scrape arbitrary sites by default.

Source summaries contain: problem, approach, what they did, result, why it matters, limitations, source spans, and confidence. The LLM never invents results.

Compatibility is calculated in application code:

```text
30% problem alignment
25% language/technology fit
20% architecture fit
15% feasibility
10% novelty relationship
```

## Compiler and build workflow

Use a `ToolchainRegistry`, not LLM compiler guesses:

```ts
Toolchain {
  language, compilerCommand, versionCommand,
  formatterCommand?, testCommand, packageManager?, supported
}
```

The toolchain worker detects the language, checks the installed/containerised compiler, records its version, formats/parses code, compiles, runs tests in a sandbox, and returns a structured `RunResult`.

Start with one or two languages. Add Scala, C++, and others through registry entries and isolated runners.

```text
User request
 → small context packet
 → LLM explanation or patch
 → schema validation
 → visible diff
 → format / parse / compile / test
 → saved run result
 → normalised error and optional LLM explanation
 → user accepts or rejects
```

Generated code never silently overwrites user code.

## Prompting

Use versioned, task-specific prompts with JSON schemas:

```text
SYSTEM: You are the notebook’s {task} writer.
RULES: Use only supplied facts and source spans. Do not invent.
OUTPUT: Return only the requested JSON schema.
CONTEXT: relevant project facts + evidence + user level
TASK: small explicit task
```

Prompt names: `interpret-idea-v1`, `summarise-source-v1`, `explain-code-v1`, `explain-error-v1`, `suggest-patch-v1`, `write-notes-v1`, and `write-slides-v1`. Cache identical requests by `inputHash`.

## Notes, LaTeX, and export

Use verified facts and deterministic templates first. The LLM only improves short human wording.

```text
ProjectContext
 → verified facts, sources, code summaries, run results
 → notes/README/slide templates
 → limited LLM prose pass
 → citation/result validation
 → Markdown + LaTeX Beamer
 → isolated LaTeX compile
 → PDF/ZIP/export manifest
```

Only successful recorded runs may appear as results. Otherwise use `Planned evaluation`.

```text
project/
  src/
  ui/
  research/
  notes/
  presentation/
  README.md
  project-context.json
```

Git operations are deterministic and require user confirmation before repository creation or push. WhatsApp sharing is a later integration; first export a ZIP and shareable link.

## Backend modules

Use one modular backend application:

```text
projects       context, versions, autosave
research       fetch, extract, cache, rank
toolchains     compilers, runtimes, sandboxed runs
ai             validated small prompt tasks
builds         patch, format, compile, test, diagnostics
artifacts      notes, README, LaTeX, PDF, ZIP
integrations   GitHub first; messaging later
```

Use a database for metadata, object storage for snapshots/artifacts, and a queue for research, compilation, and exports.

## Implementation status — 2026-08-27

- Implemented the nine-stage workflow in React.
- Added durable local `ProjectContext` persistence and stage progress.
- Added the shared notebook shell and next-action flow.
- Added Define, UI, Notes, and Export stages.
- Added project-context JSON download.
- Removed invented presentation metrics; results wait for verified runs.
- Replaced the previous dark shell with the visual system from `ai-engineering-notebook.html`.
- Verified the shell at desktop size and a 390px phone viewport.

Visual source files: `src/notebook.css` and `src/components/ReferenceNotebook.jsx`.

Implemented next layer: server-side agent routing, online research providers, online compiler execution, Supabase persistence contracts and migration, Firebase web-push adapter, and confirmed GitHub publishing endpoint. The supplied Supabase project and GitHub repository are configured in ignored `.env.local`; credentials are not committed.

## 15. Discover stage behavior

The Discover stage now uses the reference two-column notebook layout:

- left column: filterable new/novel problem statements;
- right column: related research cards with a plain “What they did” summary;
- filters: subject, difficulty, novelty, and language;
- each paper shows compatibility with the current idea at the bottom;
- each paper has a sticky-note control for project-specific notes;
- problems and papers can be added independently to a match;
- live project-fit score updates as selections change;
- the final card renders a simpler project direction from the selected combination;
- the rendered combination is saved into `ProjectContext` and handed to Define.

## 16. Real integration layer

The first production backend is deliberately small and has one boundary:

```text
React app
  ├─ /api/agents/run       → semantic AI tasks only
  ├─ /api/toolchains/*     → allowlisted online compiler adapter
  └─ /api/github/publish   → server-only GitHub token

Supabase  → authenticated project state, agent runs, artifacts, RLS
Firebase  → browser push notifications only
GitHub    → confirmed export repository and file publishing
```

Files added:

- `server/index.mjs`: small HTTP API with request limits and explicit routes.
- `server/env.mjs`: loads local `.env.local` for the Node process without adding a dependency.
- `server/agentOrchestrator.mjs`: task allowlist; `compile_code` is deterministic and semantic tasks go to Gemini ADK.
- `server/agents/notebook_agent/agent.py`: retained as an optional development reference; production semantic calls do not require a local ADK download.
- `server/adkBridge.mjs`: calls the online Gemini API with a bounded timeout and strict JSON output.
- `server/toolchains.mjs`: calls a configured online compiler for Python, C, and Java with bounded compile/run limits.
- `server/research.mjs`: searches OpenAlex, Semantic Scholar, Crossref, Europe PMC, and arXiv, deduplicates metadata, and leaves Google Scholar as a compliant search link.
- `server/github.mjs`: sequential file writes using a server-only token. It targets `GITHUB_REPOSITORY_URL` when configured and updates existing files with their SHA; otherwise it creates a private repository.
- `src/integrations/supabaseClient.js`: REST persistence adapter using the signed-in user token; local storage remains the offline fallback.
- `src/integrations/firebaseClient.js` and `public/firebase-messaging-sw.js`: optional FCM web push adapter loaded only when configured and served from HTTPS/localhost.
- `supabase/migrations/0001_project_notebook.sql`: projects, agent runs, artifacts, timestamps, and owner-only RLS policies.
- `.env.example`: safe configuration checklist. Copy it to `.env.local`; never commit real values.
- `.env.local`: local Supabase project, Gemini key/model, and `Project-Notes` target configured from the supplied values. Firebase remains unconfigured.

Run the two local processes during development:

```text
npm run server   # localhost:8787
npm run dev      # Vite proxies /api to localhost:8787
```

The server has no fake success path. Without `GOOGLE_API_KEY` or `GEMINI_API_KEY`, AI calls show a clear configuration error. Without an online compiler URL/key, compiler requests show the provider error. Without a GitHub token, publishing is rejected. This keeps generated prose separate from verified compiler facts.

The current UI now exposes two real actions: Build → `Verify with compiler` and `Ask AI teacher`; Export → `Publish to GitHub`. Publishing is an explicit user click and sends only the generated export files to the backend.

## 17. Resource and dependency note

The project uses browser-native `fetch` for Supabase and server APIs, keeping the core build small. Firebase modules are loaded only when push is requested. The production agent is a real Google ADK API server deployed from GitHub to Cloud Run; direct Gemini REST is only the development fallback until `ADK_SERVICE_URL` is configured. GitHub remains the versioned export target, while Supabase remains live application storage.

## 18. Current credential and integration status

Validated without printing secrets:

- Gemini API key: model discovery succeeds and `gemini-3.5-flash-lite` returns a valid JSON response.
- GitHub fine-grained token: can read `akirashavin-del/Project-Notes`; the repository reports push permission and uses the `main` branch.
- Supabase: corrected project URL and anon JWT now match; the project is reachable and `public.projects` is available after the migration.
- Firebase: not configured yet.
- Online compiler probe: Python, C, and Java are available through the configured Judge0-compatible endpoint. The public Piston endpoint is no longer used because it is whitelist-only.

## 19. What the product team must provide

1. Supabase Dashboard → open SQL Editor, run `supabase/migrations/0001_project_notebook.sql`, and choose the first sign-in method. Email magic link is the simplest. The app needs a signed-in user before RLS-protected sync can work.
2. Google AI Studio → keep the Gemini key server-side and decide the usage budget/free-tier limit. The code uses Flash Lite and only calls Gemini for human-language tasks.
3. GitHub → keep the fine-grained token limited to this repository with Contents read/write, rotate it after sharing it in chat, and later replace the personal token with a GitHub App or OAuth installation for production.
4. Firebase Console → create a web app, provide the public Firebase config and Web Push VAPID key, then enable Cloud Messaging. Firebase is only for phone notifications; Supabase remains the data source.
5. Deployment → choose one HTTPS host for the React app and one worker host for Node/Python. Production needs HTTPS, environment secrets, a custom domain, logs, and a managed process/queue.
6. Product decisions → confirm the first supported language pair, approved research sources/APIs, whether LaTeX/PDF compilation runs on the server, and the later WhatsApp provider. These choices affect cost and security.

## 20. Remaining build work for a full product

```text
Supabase Auth UI + exact URL
  → authenticated autosave/load + agent-run records
  → research source adapters and background jobs
  → isolated compiler containers and test runs
  → verified artifact generator (Markdown, LaTeX, PDF, ZIP)
  → Firebase token registration and job notifications
  → GitHub export manifest, commit history, and retry handling
  → mobile PWA install/offline queue + production deployment
```

The current build is a real vertical slice, not a finished hosted product: a project can be edited locally, a supported file can be compiler-checked, a selected code block can be sent to Gemini, and an explicit export can update the configured GitHub repository. Authenticated autosave/load, live research ingestion, production sandboxing, PDF generation, Firebase delivery, session refresh/sign-out, and deployment still need to be completed.

## 21. Authentication slice

The app now starts with a Supabase email/password sign-up screen matching the notebook visual system. Sign-up stores the returned session locally and opens the notebook; if Supabase email confirmation is enabled, the user is asked to confirm before signing in. Sign-in is available on the same page for returning users.

`ProjectProvider` receives the authenticated session, so `syncProjectToSupabase()` can use the current user by default. The next auth step is session refresh/sign-out UI and then calling this sync method after the local autosave debounce. The public publishable/anon key is safe for browser use; server secrets remain server-only.

The corrected Supabase URL is reachable and the `projects` table is now available after the migration was applied.

## 23. First research and compiler scope

The first supported research scope is Google Scholar discovery plus OpenAlex, Semantic Scholar, Crossref, Europe PMC, and arXiv metadata, with Python, C, and Java as the first compiler languages.

- OpenAlex, Crossref, Europe PMC, and arXiv are configured as the no-cost initial research adapters; Semantic Scholar accepts an optional server-only key for higher limits.
- Google Scholar is exposed through a generated search link. The app does not scrape Scholar because it has no supported public search API; paper metadata must come from an approved API or source.
- The backend compiler allowlist now contains Python, C, and Java through the configured online compiler.
- The research UI can search the current project question, add real provider results to the research graph, derive review-first problem statements from returned provider abstracts, and open the equivalent Google Scholar query.
- The online compiler contract was verified against Judge0 for Python, C, and Java. The semantic Gemini path was verified through the online API without starting the local Python ADK worker.

## 24. GitHub-first artifact storage and future cloud cutover

The Gemini key is present only in ignored `.env.local` under the server environment. It is not exposed through `VITE_` variables and is not committed.

GitHub is the current artifact store through the explicit export publisher. The publisher now returns the repository, branch, and latest commit SHA so an export can be recorded as a revision. Supabase remains the live database for project state and metadata.

Migration `supabase/migrations/0002_storage_abstraction_github_first.sql` adds:

- `storage_objects` for provider-neutral object metadata and hashes.
- Storage fields on `project_artifacts`.
- `project_revisions` for immutable project manifests and commit references.
- `project_exports` for queued/succeeded/failed export history.
- Owner-only RLS policies and indexes.

The future move is a controlled copy-and-verify process: copy GitHub files to Supabase Storage or S3-compatible storage, update object references and hashes, verify manifests, then retain GitHub for rollback before switching the default provider.

## 25. Remote Google ADK integration

The ADK agent is packaged under `server/agents/notebook_agent/` with a real `root_agent`, ADK requirements, a container image, and a Render deployment definition. The main Node API calls the deployed ADK REST contract (`POST /run` and the session endpoint) when `ADK_SERVICE_URL` is set. This keeps the agent source in Git and the runtime online rather than on the developer machine.

Set `REQUIRE_REMOTE_ADK=true` in production. If `ADK_SERVICE_URL` is missing in development, the server uses the direct online Gemini API fallback; production never silently falls back to a local worker.

Activation checklist:

- Push `server/agents/notebook_agent/`, `render.yaml`, `.github/workflows/deploy-render.yml`, and this workflow document to the `Project-Notes` GitHub repository.
- Create two Render web services from `render.yaml`: `project-notebook-adk` and `project-notebook-api`, both on the Free plan.
- Add Render secrets: `GOOGLE_API_KEY` and a new random `ADK_SERVICE_TOKEN` on the ADK service; the same `ADK_SERVICE_TOKEN`, `ADK_SERVICE_URL`, `APP_ORIGIN`, Supabase values, and GitHub token on the API service.
- Set `REQUIRE_REMOTE_ADK=true` and `NODE_ENV=production` on the API. Set `ADK_SERVICE_URL` to the ADK service's public HTTPS URL plus no extra path.
- Add GitHub Actions secrets `RENDER_API_KEY`, `RENDER_ADK_SERVICE_ID`, and `RENDER_API_SERVICE_ID`. The workflow triggers both Render deploys after a push.

The previously designed Cloud Run workflows were removed because Cloud Run, Cloud Build, Artifact Registry, and Google service-account deployment require the unavailable billing setup. The existing GCP Secret Manager entries are not directly readable from Render without introducing a Google service-account credential; copy their values into Render's encrypted environment-secret fields instead. Never commit them to `render.yaml` or Git.

Git is the source/version and export store for the ADK package, not a live session database. The current API keeps ADK session IDs stable per project; durable multi-instance session history should be moved to an ADK-supported database/session service in a later migration, while project data and artifacts remain in Supabase/GitHub.

## 26. Live research and small compiler workspace fixes

The Discover stage no longer presents seeded papers or problem statements as real scraped results. A fresh project starts empty and only displays provider records returned by the live OpenAlex, Semantic Scholar, Crossref, Europe PMC, and arXiv adapters. Paper summaries are requested from the semantic agent when a paper is opened; the provider abstract remains the verified fallback and is not presented as an AI summary.

The Build stage now uses a small file stack (`main.py`, `main.c`, `Main.java`, and the optional JavaScript file), keeps the source editable, selects the exact line from the editor, accepts optional standard input, and shows separate program output and compiler diagnostics from the online compiler. The compiler/editor and LaTeX code view use a white surface with red selection/highlighter styling.

The Presentation stage now exposes an editable LaTeX source textarea and keeps slide navigation and copy actions connected to that source. PDF compilation still belongs in the isolated TeX worker described in the deployment architecture; the browser does not execute LaTeX.

The browser client now preserves the backend's actual non-JSON error text instead of replacing it with a generic invalid-response message. This makes missing API deployment, blocked provider networking, and remote ADK failures diagnosable during production setup.

The compiler adapter now submits asynchronously to Judge0, retries transient 429/502/503/504 gateway failures, and polls for the finished result. A compiler smoke test confirmed that a first 502 is retried and the accepted stdout is returned. The Build stage persists a real file stack, lets the agent replace it with a bounded 2-5 file generation result, and exports those exact paths to GitHub.

The UI stage now requests a grounded phone-first screen plan from the agent and renders the returned screens, fields, actions, and flow. The agent only receives project facts and file metadata; it is instructed not to invent unrelated features or dependencies.

## 22. Authenticated persistence slice completed

The next foundation slice is implemented:

- Auth sessions now restore on reload, validate against Supabase, refresh near expiry, and clear safely on invalid sessions.
- The notebook now has a sign-out action that revokes the Supabase session and clears the local session copy.
- A signed-in project loads from `public.projects` when the notebook opens.
- Project edits continue to save locally immediately and are debounced to Supabase after hydration. If cloud save fails, local data remains available and the UI reports the cloud error.
- Agent API requests now include the Supabase bearer token.
- Successful and failed semantic agent calls are recorded in `public.agent_runs` with the project, task, input, output, and error.

The next product slice is live research ingestion and background job status. Before production, the local session storage should be replaced or hardened with a full Supabase browser client, and project selection should support multiple projects per user instead of the current single-project workspace.

## 27. 502 diagnosis and production API deployment

The model configuration was verified against the supplied Gemini key. This key rejects `gemini-2.5-flash-lite` for new users and instructs the client to use `gemini-3.5-flash-lite`, so `.env.local` and `.env.example` use `gemini-3.5-flash-lite`. The model remains configurable through `GEMINI_MODEL`. Model errors are now surfaced with their provider message instead of being hidden behind an unexplained invalid-response error.

Remote ADK is the required production path. The local direct Gemini fallback is only a development safety path; it is not used when `NODE_ENV=production` or `REQUIRE_REMOTE_ADK=true`. The remote environment is created through the Render Blueprint and `.github/workflows/deploy-render.yml`.

The no-billing deployment target is Render. Its official free tier supports web services and environment secrets but explicitly sleeps idle services and is not recommended for production applications; it is therefore suitable for the current hosted build while a paid or always-on platform remains a later production hardening step. Render supports GitHub-linked auto-deploys and a deploy API used by `.github/workflows/deploy-render.yml`.

The remote ADK environment still requires one manual Render setup action: create/sync the Blueprint and enter the secrets in the Render Dashboard. This workspace cannot create that external account or service without the user's Render login and service identifiers.

## 29. Firebase Hosting deployment

The repository contains `firebase-hosting-merge.yml`, `firebase-hosting-pull-request.yml`, `firebase.json`, and `.firebaserc`. `.firebaserc` targets Firebase project `project-notes-62970`, and `firebase.json` deploys the Vite `dist` directory with SPA fallback routing.

The new workflows use Firebase CLI with the legacy `FIREBASE_TOKEN` secret instead of the broken generated service-account workflow. This avoids the missing `github-action-...@...iam.gserviceaccount.com` lookup and does not require creating a Google service-account key. The merge workflow deploys the live Hosting channel; the pull-request workflow deploys a seven-day preview channel.

Required GitHub repository secrets:

- `FIREBASE_TOKEN`, created once with `firebase login:ci` on a trusted machine.
- `VITE_AGENT_API_URL`, set to the deployed Render API URL plus `/api`.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and optionally `VITE_SUPABASE_ANON_KEY`.
- The `VITE_FIREBASE_*` values and `VITE_FIREBASE_VAPID_KEY` if browser notifications are enabled.

Firebase's current CLI documentation labels `FIREBASE_TOKEN` as legacy and recommends Application Default Credentials for CI. It remains the no-service-account-key fallback for this billing-constrained setup; if Google Cloud identity becomes available later, replace it with the recommended identity-based authentication. Do not put `FIREBASE_TOKEN`, Gemini keys, or GitHub tokens in the Vite bundle.

The browser uses `VITE_AGENT_API_URL=/api`, and Vite proxies that path to `http://localhost:8787`. Therefore a local 502 means the Node API is running but an upstream service failed; a browser message saying the backend is unreachable means the Node API is not running or the proxy is not configured. Check `GET /api/health` first. It reports the active agent mode, compiler endpoint, research adapters, and whether API auth is required.

The compiler adapter no longer makes the optional Judge0 language catalog a hard dependency. It caches a successful catalog for five minutes and uses Judge0 CE fallback ids for Python 71, C/GCC 50, and Java 62 when the catalog endpoint returns a transient gateway error. Submissions still pass through the configured online compiler, and transient compiler gateway responses are retried.

The root `Dockerfile`, `render.yaml`, and `.github/workflows/deploy-render.yml` provide the production-shaped Node API and online ADK deployment. The API is public at the network layer so the browser can reach it; `REQUIRE_API_AUTH=true` and Supabase bearer validation protect every non-health route. The deployed Firebase/React build must set `VITE_AGENT_API_URL` to the Render API URL plus `/api`, and the API must set `APP_ORIGIN` to the exact Firebase hosting origin.

Required Render setup:

- Create/sync the two services from `render.yaml` and choose the Free plan.
- Add `GOOGLE_API_KEY` and `ADK_SERVICE_TOKEN` to the ADK service.
- Add the same `ADK_SERVICE_TOKEN`, the ADK public URL, `APP_ORIGIN`, Supabase values, and GitHub token to the API service.
- Add GitHub Actions secrets `RENDER_API_KEY`, `RENDER_ADK_SERVICE_ID`, and `RENDER_API_SERVICE_ID`.

Do not put Gemini or GitHub tokens in `VITE_` variables. Any token previously pasted into chat should be revoked and replaced before production.

## 28. GitHub handoff status

The complete workspace is committed locally on branch `main` at commit `e01d490` (`Merge completed production notebook into main`). `.env.local` remains ignored and is not included. The remote `main` branch still points to its original README-only commit because GitHub rejected the supplied fine-grained token with `403 Resource not accessible by personal access token` for both Git HTTPS and Git Data API writes. The token authenticates as `akirashavin-del`, but GitHub must issue a replacement token with repository `Contents: Read and write` access for `akirashavin-del/Project-Notes` before the commit can be pushed.
