# Copilot Instructions for Pinger

## Project Overview
Pinger is a SvelteKit 2 application that periodically pings URLs and tracks their response times and status codes. Built with Svelte 5 (runes API), Prisma, SQLite, and Tailwind CSS 4.

## Architecture

### Core Services
- **Pinger Service** (`src/lib/server/pinger.ts`): Background interval that fetches all URLs from DB and sends HTTP requests every 5 seconds (configured in `src/lib/config.ts`). Uses `globalThis.interval` for persistent timer across HMR. Initialized in `hooks.server.ts` on server startup.
- **SSE Events** (`src/lib/server/events.ts`): Shared event emitter managing all active SSE client connections. Use `emitEvent(event, data)` to broadcast to all connected clients. Endpoint at `src/routes/api/events/+server.ts`.
- **Auth** (`src/lib/server/auth.ts`): Optional HTTP Basic Auth via `ACCESS_USERNAME` and `ACCESS_PASSWORD` env vars. Applied globally in `hooks.server.ts`.

### Data Flow
1. User adds URL via form → POST `/api/urls` → validated with Zod → saved to SQLite
2. Background interval fetches URLs → sends requests with 500ms timeout → upserts `PingRequest` with status/responseTime
3. Frontend uses SSR (initial load) + `invalidateAll()` for updates (not SSE currently, despite endpoint existing)

### Database (Prisma)
- **Custom output path**: Prisma client generates to `src/lib/server/prisma/` (not default `node_modules/.prisma`)
- **Import from**: `$lib/server/prisma` (aliased in `tsconfig.json`)
- **Schema**: `Url` (1) ↔ (0-1) `PingRequest` via `urlId` unique constraint. Last ping overwrites previous (upsert pattern).
- **Migrations**: Run `npx prisma migrate dev` after schema changes

## Development Commands
```bash
npm run dev              # Start dev server (Vite HMR)
npm run build            # Production build
npx prisma studio        # Visual DB browser
npx prisma migrate dev   # Create and apply migrations
```

## Key Conventions

### Svelte 5 Runes (Required)
- Use `$state`, `$derived`, `$effect`, `$props` instead of old reactive declarations
- Example: `let count = $state(0)` not `let count = 0` with `$:` reactivity
- Props: `const { data }: { data: PageData } = $props()`

### SvelteKit Patterns
- **Route Exports**: Only export `prerender`, `trailingSlash`, `config`, `entries`, HTTP methods (`GET`, `POST`, etc.), `fallback`, or `_prefixed` functions. No other named exports allowed in `+server.ts` files.
- **Data Loading**: Use `+page.server.ts` for SSR data with `PageServerLoad`. Return plain objects; they're automatically serialized.
- **API Routes**: Define in `src/routes/api/` with `+server.ts`. Use `json()` helper from `@sveltejs/kit` for responses.

### Validation
- All user input validated with Zod schemas in `src/lib/schema.ts`
- Use `.safeParse()` pattern, return 400 errors with `.error.message`
- Example: localhost URLs explicitly blocked in `POST /api/urls`

### Styling
- Tailwind 4 via Vite plugin (`@tailwindcss/vite`)
- No `tailwind.config.js` needed with v4
- Utility-first approach; minimal custom CSS

### Server-Side Utilities
- **Logging**: Use `signale` library for structured logs (`.info`, `.success`, `.warn`, `.error`)
- **Global State**: Use `globalThis` for server-side singletons (e.g., `globalThis.interval` for pinger timer)

## Critical Files
- `src/hooks.server.ts`: Server initialization (auth, pinger interval setup)
- `src/lib/server/pinger.ts`: Core ping logic with timeout handling
- `src/lib/server/events.ts`: SSE event broadcasting (currently unused by frontend)
- `prisma/schema.prisma`: Database schema (custom output path to `src/lib/server/prisma/`)

## Common Tasks

### Adding a new URL field
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Update Zod schema in `src/lib/schema.ts`
4. Update UI in `src/routes/+page.svelte`

### Changing ping behavior
- Modify interval/timeout in `src/lib/config.ts`
- Update logic in `src/lib/server/pinger.ts` → `sendRequest()` function
- Restart dev server (interval initialized once in `hooks.server.ts`)

### Adding SSE real-time updates
Currently `emitEvent()` exists but isn't consumed. To use:
1. Connect EventSource in `+page.svelte`: `new EventSource('/api/events')`
2. Call `emitEvent('update', data)` from `pinger.ts` after DB writes
3. Handle events client-side instead of `invalidateAll()`

## Gotchas
- Prisma client is NOT in `node_modules`—always import from `$lib/server/prisma`
- SvelteKit route files have strict export rules—move helper functions to separate modules
- Background interval persists via `globalThis`—must manually clear/reset on changes
- Tailwind 4 syntax differs from v3 (no config file, direct imports)
- Svelte 5 runes are mandatory—no legacy reactive syntax
