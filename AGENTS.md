# Repository Guidelines

## Project Structure & Module Organization
- App (Next.js): [`src/app`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/src/app) routes/layout, [`src/components`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/src/components) UI, [`src/hooks`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/src/hooks) client logic, [`src/store`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/src/store) Zustand state, [`src/lib`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/src/lib) utilities, [`src/stm`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/src/stm) STM engines.
- API proxy (Express/tsx): [`api/server.ts`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/api/server.ts) plus middleware (`api/middleware/*`) and feature routes (`api/routes/*`).
- Assets: [`public/`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/public); single-file deploy at [`index.html`](C:/Users/m4xx/Documents/m4xx/AI/G0DM0D3/index.html).

## Build, Test, and Development Commands
- `npm run dev` — Next.js dev server at http://localhost:3000.
- `npm run build` — production build; must pass before PR.
- `npm start` — serve the built app.
- `npm run lint` — Next.js ESLint rules.
- `npx tsc --noEmit` — strict type check.
- `npm run api` / `npm run api:dev` — start the Express proxy (port 7860 default) with/without watch.
- Optional: `docker-compose up` to run nginx reverse proxy + app.

## Coding Style & Naming Conventions
- TypeScript/TSX, 2-space indent, single quotes; group imports libs → aliases → relatives.
- Components in `src/components`; hooks in `src/hooks`; state in `src/store`.
- Styling: Tailwind + `globals.css`; reuse theme tokens over custom CSS.
- Run `npm run lint`; avoid rule disables without justification.

## Testing & Verification Approach
- No formal unit suite; rely on `npm run lint`, `npx tsc --noEmit`, and manual UI/API checks.
- Add `.test.ts(x)` alongside new logic when you introduce tests.
- Debug “source to sink”: follow data from inputs through hooks/state/lib → components → network calls, ensuring props/payloads stay validated.

## Commit & Pull Request Guidelines
- Branch names: `feat/*`, `fix/*`, `docs/*`, `refactor/*`, `ui/*`.
- Commit messages: `type: short description` (e.g., `feat: add Ollama preset`); keep commits atomic.
- PRs: describe What/Why, test steps, and screenshots for UI changes; ensure `npm run build` passes and no new TS errors; link issues when relevant.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; keep `OPENROUTER_API_KEY` and `GODMODE_*` keys out of git.
- Set `CORS_ORIGIN` and `GODMODE_API_KEY(S)` when exposing the proxy; review `api/middleware/*` for rate/tier gates.
- Do not log or persist user API keys; client keeps them locally. Prefer running behind provided nginx config.

## Problem-Solving Loop (Use This)
1. Trace logic end-to-end (inputs → hooks/state/lib → UI/API) so data stays validated.
2. Skim nearby components/routes/env settings before changing behavior.
3. State a short plan, then implement in small steps with checks (`lint`, `tsc`, manual click-path).
