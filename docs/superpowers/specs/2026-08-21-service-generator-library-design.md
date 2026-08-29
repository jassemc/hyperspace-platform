# `@hscowork/service-generator` — Design

**Date:** 2026-08-21
**Status:** Proposed (written non-interactively; assumptions in §1 should be confirmed)

## 0. Problem

`tools/generators/service-api/generator.ts` wraps `swagger-typescript-api` with 18
custom EJS templates and produces `lib/service/{HsService,api,index,_meta}.ts`.
Three apps talk to the same HS backend (`hscowork-backend-platform`), whose single
swagger document at `/_docs/json` covers both the authenticated API and the
`/api/v1/public/*` endpoints:

| App | How it calls the API today | Auth | Endpoints used |
|---|---|---|---|
| `hyperspace-platform` | generated `HsService` + `lib/shared/HttpClient.ts` | Supabase session bearer token (`lib/auth/session.ts#requestSecurityWorker`) | everything non-public |
| `public-booking-page` | hand-written `lib/api/client.ts` (`get`/`post` + hand-typed DTOs in `lib/api/types.ts`) | `X-Api-Key: $HS_API_KEY` | `public/{resources,resource-types,plans,resources/:id/availability,booking-requests,plan-requests}` |
| `hscowork-landingpage` | hand-written `fetch` in `lib/plans.ts` and `app/api/booking/route.ts` | `X-Api-Key: $HS_API_KEY` | `public/{plans,plan-categories,contact-requests}` |

All three already use `HS_API_BASE_URL`; the two public apps also use `HS_API_KEY`.
Only the platform has typed clients, and its generator is bound to one repo,
accepts a file only, hard-codes import paths and Next.js directives in its
templates, is untested, and has two known output bugs (`checkOut` missing from
`index.ts`; `ResponseErrorDto | ResponseErrorDto` unions — `docs/backend-api-issues.md` §4, §6).

## 1. Assumptions (override any of these)

| # | Assumption | Why |
|---|---|---|
| A1 | New repo `github.com/hscowork/service-generator`, published as `@hscowork/service-generator`. | GitHub Packages scope must equal the org; independent release cadence. |
| A2 | Node ≥ 20, ESM-only, TypeScript, `tsup`, `vitest`. | Stable global `fetch`; `swagger-typescript-api@13` is ESM-only. |
| A3 | `swagger-typescript-api` pinned at `13.0.28`; upgrading is a separate change. | Templates depend on its internal `it` shape. |
| A4 | The HTTP runtime (`HttpClient`, errors, types) ships **inside this package** as the `./runtime` subpath. | Two more consumers would otherwise copy `HttpClient.ts`; generated code is useless without it. |
| A5 | `HS_API_BASE_URL` stays the conventional default for `baseUrl`, `HS_API_KEY` for the built-in API-key worker. Both overridable; the runtime never *requires* env vars. | All three apps already use those names. |
| A6 | Publishing is triggered by a `v*` tag; CI checks tag == `package.json#version`. | Mirrors `deploy.yml`'s `GITHUB_TOKEN` + `packages: write`. |
| A7 | All three apps migrate in this effort, each as its own PR in its own repo, in the order platform → booking page → landing page. Behaviour (caching, timeouts, fallbacks, error mapping) is preserved exactly. | Platform is a like-for-like swap; the public apps validate the API-key path and the route filter. |
| A8 | The public apps deploy on Vercel (no `.github/workflows`, README points at Vercel). | They need the GitHub Packages token as a Vercel env var, not an Actions secret. |

## 2. Goals / Non-goals

**Goals**
1. CLI + programmatic API reproducing today's output.
2. Spec input: file, HTTP(S) URL (with headers), or in-memory object.
3. Everything repo-specific is configuration; public apps can **filter routes** by tag/path so they only generate `public/*`.
4. `@hscowork/service-generator/runtime`: `HttpClient`, `HttpError`, `ProblemError`, request/response types, `apiKeySecurityWorker`, `bearerTokenSecurityWorker`.
5. Fix the two known template bugs.
6. GitHub Actions: CI on PR, publish to GitHub Packages on tag.
7. Migrate all three apps; delete the platform's `tools/generators` and `lib/shared/{HttpClient,HttpError,ProblemError,types}.ts`, the booking page's `lib/api/client.ts`, the landing page's hand-rolled fetches.

**Non-goals**
- Axios or non-fetch clients; YAML specs; client-side (browser) usage.
- Filtering *DTOs* (only routes are filtered; unused types are harmless).

## 3. Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | One package, two entry points: `.` (generator, dev-time) and `./runtime` (prod-time, zero deps). | One version; `swagger-typescript-api` only loads through `.`, so it never reaches an app bundle. |
| B | Two packages (`service-generator` + `service-runtime`). | Cleaner split, two releases to coordinate for ~300 lines. Can be split later without changing the runtime API. |
| C | Generator only; each app keeps its own `HttpClient`. | Three copies of the same class. Rejected. |
| D | npm workspace inside `hyperspace-platform`. | Mixes app CI with publishing; other apps still install from GitHub Packages. Rejected. |

## 4. Package design

### 4.1 Layout

```
service-generator/
├── src/
│   ├── index.ts              # generateService, defineConfig, option types, errors
│   ├── cli.ts                # bin: service-generator
│   ├── config.ts             # GeneratorOptions, defaults, resolveOptions()
│   ├── input.ts              # loadSpec(): file | url | object
│   ├── load-config.ts        # service-generator.config.{mjs,js,json}
│   ├── generate.ts           # swagger-typescript-api wrapper, route filter, writes files
│   └── runtime/
│       ├── index.ts          # public runtime surface
│       ├── http-client.ts    # HttpClient (from lib/shared/HttpClient.ts)
│       ├── errors.ts         # HttpError, ProblemError
│       ├── types.ts          # ApiConfig, RequestParams, ContentType, Problem, …
│       └── security.ts       # apiKeySecurityWorker, bearerTokenSecurityWorker
├── templates/*.ejs           # 17 files (http-client-original.ejs dropped)
├── test/
│   ├── fixtures/{minimal,platform}.swagger.json
│   ├── config.test.ts  input.test.ts  generate.test.ts  platform-snapshot.test.ts  cli.test.ts
│   └── runtime/{http-client,security}.test.ts
├── .github/workflows/{ci.yml,publish.yml}
└── package.json  tsconfig.json  tsup.config.ts  vitest.config.ts  README.md  .npmrc
```

`package.json#exports`:
```json
{
  ".":         { "types": "./dist/index.d.ts",         "import": "./dist/index.js" },
  "./runtime": { "types": "./dist/runtime/index.d.ts", "import": "./dist/runtime/index.js" }
}
```

### 4.2 Runtime (`@hscowork/service-generator/runtime`)

`lib/shared/{HttpClient,HttpError,ProblemError,types}.ts` move over with behaviour unchanged except the coupling points:

```ts
export type SecurityWorker<S = unknown> = (data: S | null) => Promise<RequestParams | void> | RequestParams | void

export interface ApiConfig<S = unknown> {
  /** Default: process.env.HS_API_BASE_URL; throws HttpClientConfigError on first request when neither is set. Trailing slashes stripped. */
  baseUrl?: string
  baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>
  /** Called for every request with `secure: true`. Default: none (was: hard-wired Supabase worker). */
  securityWorker?: SecurityWorker<S>
  customFetch?: typeof fetch
  /** Default: console.warn("API error response", err). Pass () => {} to silence. */
  onError?: (error: HttpError) => void
}
export class HttpClient<S = unknown> { constructor(config?: ApiConfig<S>); request<T, E>(params: FullRequestParams): Promise<T>; setSecurityData; abortRequest }

/** X-Api-Key header. Default key: process.env.HS_API_KEY; throws HttpClientConfigError at call time if empty. */
export function apiKeySecurityWorker(opts?: { apiKey?: string; header?: string }): SecurityWorker
/** Authorization: Bearer <token>, resolved per request; no header when token is null/undefined. */
export function bearerTokenSecurityWorker(getToken: () => Promise<string | null | undefined> | string | null | undefined): SecurityWorker
```

- `process.env` is read behind `typeof process !== 'undefined'`; no `server-only` in the runtime (generated files keep that directive, configurable).
- `RequestParams` extends `RequestInit`, so Next.js options (`next: { revalidate }`, `cache`, `signal: AbortSignal.timeout(…)`) pass straight through the generated method's trailing `params` argument — this is how the public apps keep their caching/timeouts.
- `HttpError` exposes `status` and `error: Problem` (RFC 9457 body). The public apps' `ApiError.problem` maps onto `HttpError.error`.

### 4.3 Generator options

```ts
export interface GeneratorOptions {
  input: { path: string } | { url: string; headers?: Record<string, string> } | { spec: Record<string, unknown> }
  output: string                     // directory, created if missing
  serviceName?: string               // class + file name. Default "ApiService"
  /** Module exporting a configured `httpClient` instance. Default "./http-client.js" (relative to output; the `.js` suffix is required for Node ESM resolution and works with Next.js bundler resolution). */
  httpClientImport?: string
  /** Module providing `HttpClient` type, `ContentType`, `RequestParams`. Default "@hscowork/service-generator/runtime". */
  runtimeImport?: string
  serverOnly?: boolean               // emit `import 'server-only'` / `'use server'`. Default true
  emit?: { api?: boolean; index?: boolean; meta?: boolean }   // default all true
  /** Keep only routes matching ANY listed tag or path prefix. Default: keep all. */
  include?: { tags?: string[]; pathPrefixes?: string[] }
  templatesDir?: string              // per-file overrides of built-in templates
  saveSpecTo?: string                // url input only: write raw body here
  swaggerTypescriptApi?: Record<string, unknown>   // escape hatch, merged last
}
```

The consumer owns **one** hand-written file, the client instance at `httpClientImport`:

```ts
// platform: lib/service/http-client.ts
import { HttpClient, bearerTokenSecurityWorker } from '@hscowork/service-generator/runtime'
import { getAccessToken } from '../auth/session'
export const httpClient = new HttpClient({ securityWorker: bearerTokenSecurityWorker(getAccessToken) })

// public apps: lib/service/http-client.ts
import { HttpClient, apiKeySecurityWorker } from '@hscowork/service-generator/runtime'
export const httpClient = new HttpClient({ securityWorker: apiKeySecurityWorker() })
```

`include` is implemented with `swagger-typescript-api`'s `hooks.onCreateRoute`
(return `false` to drop a route). `resolveOptions` fills defaults and validates
(`output` required; exactly one input kind; http(s) URL; `serviceName` an
identifier) and throws `GeneratorConfigError`.

### 4.4 CLI and config file

`service-generator [flags]` — flags override `service-generator.config.{mjs,js,json}` (auto-discovered in cwd, or `-c <file>`):

| Flag | Option |
|---|---|
| `-i, --input <pathOrUrl>` | `input.path` / `input.url` (detected by `^https?://`) |
| `-o, --output <dir>` | `output` |
| `-n, --name <ServiceName>` | `serviceName` |
| `--header <k=v>` (repeatable) | `input.headers` |
| `--save-spec <file>` | `saveSpecTo` |
| `--no-server-only` | `serverOnly: false` |
| `--http-client-import <spec>` / `--runtime-import <spec>` | import paths |
| `--include-tag <tag>` / `--include-path <prefix>` (repeatable) | `include` |
| `--templates <dir>` | `templatesDir` |
| `-c, --config <file>` | config file |

Failures: exit 1, one line `service-generator: <message>`; stack only with `DEBUG=service-generator`. `defineConfig()` is a typed identity helper.

### 4.5 Spec loading

- `path` → `readFile` + `JSON.parse`; errors name the path.
- `url` → `fetch(url, { headers })`; non-2xx → `SpecLoadError` with URL and status; body parsed as JSON regardless of `content-type`; `saveSpecTo` writes the raw body (mkdir -p).
- `spec` → as-is. The object is passed to `swagger-typescript-api` as `spec`.

### 4.6 Template changes

1. Moved verbatim, then parameterised via `config.hs.{httpClientImport,runtimeImport,serverOnly}`:
   - `custom-api.ejs`: `import { httpClient } from '<httpClientImport>'` (no longer constructs a client); `server-only` conditional.
   - `api.ejs`: `import type { HttpClient }` and `{ ContentType, RequestParams }` from `<runtimeImport>`; `server-only` conditional.
   - `index-entry-file.ejs`: `'use server'`/`server-only` conditional; `RequestParams` from `<runtimeImport>`.
2. **Missing wrapper bug**: `index-entry-file.ejs` and `custom-meta.ejs` iterate only `routes.combined`; routes landing in `routes.outOfModule` are never emitted. Iterate both. Test: every `functionName` in `_meta.ts` has an `export async function` in `index.ts`.
3. **Duplicate error unions**: dedupe `errorType` parts in `procedure-call.ejs` and `route-type(s).ejs`.
4. `http-client-original.ejs` deleted.

### 4.7 Output contract

For `serviceName: "HsService"`: `HsService.ts`, `api.ts`, `index.ts`, `_meta.ts`. A
snapshot test on `platform.swagger.json` (fresh download from the live backend,
not the stale 10-path file in the repo) locks them. The diff against the current
`lib/service/*` must consist only of import-path lines, collapsed unions, and the
added `checkOut` wrapper.

## 5. CI / CD

**`ci.yml`** (PR + push to `main`): `setup-node@v4` (20, npm cache) → `npm ci` → `lint` → `test` → `build` → `npm pack --dry-run`.

**`publish.yml`** (tags `v*`): `permissions: {contents: read, packages: write}`; `setup-node` with `registry-url: https://npm.pkg.github.com`, `scope: @hscowork`; guard `"v$(node -p require('./package.json').version)" == $GITHUB_REF_NAME`; `npm ci && npm test && npm run build && npm publish` with `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`. `package.json` carries `publishConfig.registry` and `repository`. After the first publish, grant `hyperspace-platform`, `public-booking-page`, `hscowork-landingpage` read access in the package settings.

Consumers (`.npmrc`, committed):
```
@hscowork:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_GITHUB_TOKEN}
```
- Local: `NPM_GITHUB_TOKEN` = PAT with `read:packages`.
- Platform Docker build: BuildKit secret mounted as `/root/.npmrc` during `npm ci` (never an `ARG`/`ENV`).
- Vercel (public apps): `NPM_GITHUB_TOKEN` environment variable — Vercel expands it when reading `.npmrc`.

## 6. Migrations

### 6.1 `hyperspace-platform`
1. `.npmrc`; `npm i -D @hscowork/service-generator`; `npm rm swagger-typescript-api`.
2. `service-generator.config.mjs`:
   ```js
   import { defineConfig } from '@hscowork/service-generator'
   export default defineConfig({
     input: { url: process.env.HS_SWAGGER_URL ?? 'http://localhost:8080/_docs/json' },
     saveSpecTo: './swagger.json',
     output: './lib/service',
     serviceName: 'HsService',
   })
   ```
3. `lib/service/http-client.ts` (hand-written, §4.3). `lib/auth/session.ts`: add `getAccessToken()` (Supabase session → token or null); remove `requestSecurityWorker`.
4. `"generate": "service-generator"`. Delete `tools/generators`, `lib/shared/{HttpClient,HttpError,ProblemError,types}.ts`; repoint `lib/service-supplement.ts` (the only importer outside `lib/service`) to the runtime.
5. Regenerate; verify the diff per §4.7; drop the `checkOut` workaround in `lib/service-supplement.ts` if redundant.
6. README "Generators" rewritten; `deploy/docker/Dockerfile` + `deploy.yml` pass the npm token as a BuildKit secret.

### 6.2 `public-booking-page`
1. `.npmrc`; `npm i -D @hscowork/service-generator`; Vercel env `NPM_GITHUB_TOKEN`.
2. `service-generator.config.mjs`: same input; `output: './lib/service'`, `serviceName: 'HsPublicService'`, `include: { pathPrefixes: ['/api/v1/public'] }`.
3. `lib/service/http-client.ts` with `apiKeySecurityWorker()`.
4. Rewrite `lib/api/client.ts` as a thin façade with the **same exported function names and signatures** (`getResourceTypes`, `getResources`, `getResource`, `getAvailability`, `getPlans`, `createPlanRequest`, `createBookingRequest`) delegating to `hsPublicService.public.*` and passing `{ next: { revalidate } }` / `{ cache: 'no-store' }` via the trailing `params` arg. Keep `deriveResourceTypes` 404 fallback by catching `HttpError` with `status === 404`. Keep `ApiError` as a subclass-free wrapper: the façade catches `HttpError` and rethrows `new ApiError(toProblem(err))` so the three route handlers are untouched.
5. `lib/api/types.ts`: replace hand-typed DTOs with `export type { PublicResourceDto as PublicResource, … } from '@/lib/service/HsPublicService'` re-exports where the generated names exist; keep `ApiError`, `ProblemDetails`, and any local-only types. Components keep importing from `@/lib/api/types`.
6. `npm run build`; smoke the three route handlers and the catalog page against the hosted backend.

### 6.3 `hscowork-landingpage`
1. `.npmrc`; install; Vercel env.
2. Same config as 6.2 (`serviceName: 'HsPublicService'`, public prefix filter).
3. `lib/service/http-client.ts` with `apiKeySecurityWorker()`.
4. `lib/plans.ts`: `fetchPublic` becomes a call to `hsPublicService.public.listPublicPlans(...)` / `listPublicPlanCategories()` with `{ next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) }`; **preserve** the "return `null` when env is unset, on any error, or on empty array" contract (check `process.env.HS_API_BASE_URL && HS_API_KEY` before calling, wrap in try/catch). `PublicPlan`/`PublicPlanCategory` become re-exports of the generated DTOs.
5. `app/api/booking/route.ts#deliverToBackend`: call `hsPublicService.public.createContactRequest(payload, { signal: AbortSignal.timeout(5000) })`; map `HttpError.status === 422` → `validation`, anything else → `unavailable` (502) exactly as today.
6. `npm run build`; submit the contact form against the hosted backend.

## 7. Testing

- Unit: `resolveOptions`; `loadSpec` (file, url via injected `fetchImpl`, 404, bad JSON, `saveSpecTo`); runtime `HttpClient` (query encoding, JSON body, 201-without-format → `null`, 204, Problem JSON → `HttpError`, `secure` invokes worker, `onError`, base URL default from `HS_API_BASE_URL`, `RequestInit` pass-through incl. `next`), `apiKeySecurityWorker`, `bearerTokenSecurityWorker`.
- Integration: `generateService` on `minimal.swagger.json` (file set, every route exported, no duplicate unions, options honoured, `emit`, `include` filter).
- Snapshot: `platform.swagger.json`.
- CLI: spawn `dist/cli.js` (flags, config discovery + override, exit codes).
- Per-app migration: `npm run build` + `npm run lint` green, generated diff reviewed, manual smoke against the hosted backend.

## 8. Follow-ups (out of scope)

- Split `/runtime` into its own package if cadences diverge.
- Upgrade `swagger-typescript-api`.
- Filter DTOs to those reachable from included routes.
