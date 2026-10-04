# GuessTogether

A five-round anonymous multiplayer guessing game. Room and game state live in a Cloudflare Durable Object; clients synchronize through WebSockets.

## Project layout

- `frontend/` - Vite + React UI, screens, hooks, API client, and Zustand store
- `worker/` - Cloudflare Worker, Durable Object, questions, and Worker configuration
- `shared/` - the room snapshot and WebSocket contract used on both sides
- `shared/constants.ts` - game rules, room limits, and connection timing settings

`npm workspaces` installs package dependencies into the repository-level `node_modules`; `worker/` intentionally does not need a separate `node_modules` directory.

## Run locally

From the repository root, run `npm install`, then `npm run dev`. It builds the frontend and starts the Worker at `http://localhost:8787`, which serves both the built UI and `/api` WebSocket endpoints.

For frontend-only styling work, use `npm run dev:frontend`; it proxies `/api` and WebSockets to the Worker on port 8787.

## Verify and deploy

Run `npm run lint` and `npm run build`. Deploy with `npm run deploy`. The Worker serves the built frontend assets and Durable Object SQLite storage is configured in `worker/wrangler.toml`.
