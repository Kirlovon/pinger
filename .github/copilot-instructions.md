# Pinger - AI Coding Instructions

## Architecture Overview

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes), Prisma 7, SQLite (Better-SQLite3 adapter), Tailwind CSS 4, Vitest

**Core Flow:** Server-side interval (`hooks.server.ts`) → Periodic ping execution (`pinger.ts`) → Real-time updates via SSE (`events.ts`) → Client reactivity (Svelte 5 runes)

The app monitors URLs by pinging them periodically and displaying results in real-time. The pinger runs server-side on an interval set in `hooks.server.ts` via `setupInterval()`. Results are broadcast to all connected clients using Server-Sent Events (SSE).

## Key Architectural Patterns

### Server-Side State Management
- **Global Interval:** Pinger uses `globalThis.pingerInterval` to persist across HMR reloads ([pinger.ts](../src/lib/server/pinger.ts))
- **Exported State:** `lastPingAt` and `nextPingAt` are exported from `pinger.ts` and imported by API routes for SSE broadcasting
- **Concurrency Control:** Uses `p-limit` (max 10 concurrent) for URL pings to prevent overwhelming the server

### Real-Time Communication
- **SSE Pattern:** Client connects to `/api/events` → Server pushes updates via `emitEvent()` → Client updates state via `$state()` runes
- **Serialization:** Uses `devalue` (not JSON) for type-safe serialization between server and client
- **Event Types:** `ServerEvent` union type in `events.ts` defines all possible events (`connected`, `url_pinged`, `interval_status`)

### Svelte 5 Runes (Not Options API)
```svelte
<!-- Use $state(), $props(), $effect() - NO export let -->
let urls = $state(data.urls);
const { data }: { data: PageData } = $props();
$effect(() => { /* side effects */ });
```

### Prisma Configuration
- **Custom Generator:** Uses Prisma 7 with custom output directory (`prisma/generated/`) for type-safe client
- **Config File:** `prisma.config.ts` (not `.env` alone) defines schema path and datasource
- **Relations:** `Url.lastPing` is a 1:1 relation to `PingRequest` via `@unique` on `urlId`

## Development Workflow

### Essential Commands
```bash
npm run dev              # Vite dev server (port 5173)
npm test                 # Vitest watch mode
npm run test:run         # Single test run
npx prisma studio        # Visual DB browser
npx prisma migrate dev   # Create & apply migration
```

### Environment Setup
Create `.env` before first run:
```env
DATABASE_URL="file:./data/data.db"
ACCESS_USERNAME=""       # Optional HTTP Basic Auth
ACCESS_PASSWORD=""
```

### Testing Conventions
- **Location:** `tests/` directory mirrors `src/lib/` structure
- **Mocking:** Mock `$lib/*` imports, not relative paths. Example: `vi.mock('$lib/server/prisma')`
- **Vitest Config:** `vitest.config.ts` sets up jsdom environment and `$lib` alias

## Project-Specific Conventions

### Validation & Types
- **Zod Schemas:** All input validation uses Zod with custom types (`z.nanoid()`, `z.url()`) in `schema.ts`
- **Prisma Types:** Import types from `$lib/server/prisma` (re-exports from generated client), not direct from `@prisma/client`

### API Routes
- **SvelteKit Convention:** `+server.ts` files export `GET`, `POST`, etc. as named `RequestHandler` functions
- **Error Handling:** Return `json()` responses with appropriate HTTP status codes, not thrown errors
- **SSE Endpoints:** Use `ReadableStream` with `text/event-stream` content type

### Configuration
- **Runtime Config:** `src/lib/config.ts` for user-adjustable values (`PING_INTERVAL`, `REQUEST_TIMEOUT`)
- **Auth Logic:** `src/lib/server/auth.ts` handles HTTP Basic Auth, checked in `hooks.server.ts` middleware

## Docker Deployment

- **Compose First:** `docker-compose.yml` is primary deployment method
- **Volume Mount:** `./data:/app/data` persists SQLite database across container restarts
- **Migration Timing:** Dockerfile runs `prisma migrate deploy` during build, not at runtime
- **Environment:** Pass `ACCESS_USERNAME` and `ACCESS_PASSWORD` via compose environment or `.env` file

## Critical Integration Points

1. **Prisma → Events:** `pinger.ts` calls `emitEvent()` after upserting ping results
2. **Events → SSE:** `events.ts` maintains a `Set<ReadableStreamDefaultController>` for broadcasting
3. **SSE → Client:** `sseClient.ts` wraps EventSource with `onMount`/cleanup for Svelte lifecycle
4. **Client → API:** `UrlMonitor.svelte` posts to `/api/urls` for CRUD, then calls `invalidateAll()` to refresh

## Common Pitfalls

- **Don't** use `export let` in Svelte components - use `$props()` rune
- **Don't** import Prisma types directly - use `$lib/server/prisma` re-exports
- **Don't** forget to call `invalidateAll()` after mutations to refresh server data
- **Don't** use JSON for SSE - use `devalue` for `stringify`/`parse` to handle Date objects
