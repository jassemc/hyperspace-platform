# `@hscowork/service-generator` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `tools/generators/service-api` into a published, configurable package `@hscowork/service-generator` (generator + HTTP runtime) that accepts a swagger file or URL, publish it to GitHub Packages from GitHub Actions, and migrate `hyperspace-platform`, `public-booking-page`, and `hscowork-landingpage` to it.

**Architecture:** One ESM package with two entry points. `.`: `loadSpec` (file/url/object) → `resolveOptions` → `generateService` (wrapper over `swagger-typescript-api@13` with our EJS templates, which read import paths/directives from options, plus a route filter). `./runtime`: the former `lib/shared/HttpClient.ts` with injectable `baseUrl`/`securityWorker`/`onError` and two ready-made security workers (API key, bearer token). A `commander` CLI and `defineConfig` sit on top. CI tests on PR; a `v*` tag publishes.

**Tech Stack:** Node 20, TypeScript 5, `swagger-typescript-api@13.0.28`, `commander`, `tsup`, `vitest`, GitHub Actions, GitHub Packages.

**Spec:** `docs/superpowers/specs/2026-08-21-service-generator-library-design.md` (in `hyperspace-platform`)

## Global Constraints

- Package `@hscowork/service-generator`; repo `github.com/hscowork/service-generator`; `"type": "module"`; `engines.node ">=20"`; ESM only.
- `swagger-typescript-api` pinned to exactly `13.0.28`. Runtime entry has zero dependencies and never imports it.
- Defaults: `serviceName "ApiService"`, `httpClientImport "./http-client"`, `runtimeImport "@hscowork/service-generator/runtime"`, `serverOnly true`, `emit {api,index,meta: true}`, `include` unset (keep all).
- Runtime defaults: `baseUrl` ← `process.env.HS_API_BASE_URL` else `http://localhost:8080`; `apiKeySecurityWorker` key ← `process.env.HS_API_KEY`, header `X-Api-Key`.
- Platform output must equal today's `lib/service/*` except: import-path lines, collapsed `A | A` unions, added `checkOut` wrapper.
- Registry `https://npm.pkg.github.com`; consumer `.npmrc` uses `${NPM_GITHUB_TOKEN}`.
- Commit after every task, conventional commit messages. Tasks 1–11: new `service-generator` repo. Tasks 12–14: the three app repos (siblings of `hyperspace-platform` under `~/Workspace/Personal/hs/`).

---

### Task 1: Scaffold the package

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `.gitignore`, `.npmrc`, `eslint.config.js`, `src/index.ts`, `src/cli.ts`, `src/runtime/index.ts`, `test/smoke.test.ts`

**Interfaces:**
- Produces: `npm run build` → `dist/index.js`, `dist/cli.js`, `dist/runtime/index.js` (+ `.d.ts`); `npm test`; `npm run lint`.

- [ ] **Step 1: Create repo and files**

```bash
mkdir service-generator && cd service-generator && git init -b main
```

`package.json`:
```json
{
  "name": "@hscowork/service-generator",
  "version": "0.1.0",
  "description": "Typed fetch service client generator (swagger/OpenAPI JSON file or URL) plus its HTTP runtime",
  "type": "module",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/hscowork/service-generator.git" },
  "publishConfig": { "registry": "https://npm.pkg.github.com" },
  "engines": { "node": ">=20" },
  "bin": { "service-generator": "./dist/cli.js" },
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./runtime": { "types": "./dist/runtime/index.d.ts", "import": "./dist/runtime/index.js" }
  },
  "files": ["dist", "templates", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "lint": "eslint src test && tsc --noEmit",
    "prepack": "npm run build"
  },
  "dependencies": { "commander": "^12.1.0", "swagger-typescript-api": "13.0.28" },
  "devDependencies": {
    "@types/node": "^20", "eslint": "^9", "tsup": "^8", "typescript": "^5",
    "typescript-eslint": "^8", "vitest": "^2"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "lib": ["ES2022", "DOM"],
    "strict": true, "declaration": true, "outDir": "dist", "rootDir": "src", "skipLibCheck": true
  },
  "include": ["src"]
}
```
(`DOM` lib gives `fetch`/`Response`/`FormData`/`Blob` types used by the runtime.)

`tsup.config.ts`:
```ts
import { defineConfig } from 'tsup'
export default defineConfig({
  entry: { index: 'src/index.ts', cli: 'src/cli.ts', 'runtime/index': 'src/runtime/index.ts' },
  format: ['esm'], dts: true, clean: true, target: 'node20', splitting: false,
})
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['test/**/*.test.ts'], testTimeout: 30000 } })
```

`.npmrc`: `@hscowork:registry=https://npm.pkg.github.com`
`.gitignore`: `node_modules\ndist\ncoverage\n`
`eslint.config.js`:
```js
import tseslint from 'typescript-eslint'
export default tseslint.config(...tseslint.configs.recommended, { ignores: ['dist', 'templates'] })
```
`src/index.ts`: `export const VERSION = '0.1.0'`
`src/cli.ts`: `#!/usr/bin/env node\nconsole.log('service-generator')`
`src/runtime/index.ts`: `export const RUNTIME = true`

- [ ] **Step 2: Smoke test**

`test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { VERSION } from '../src/index.js'
describe('package', () => { it('exports a version', () => expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/)) })
```

- [ ] **Step 3: Run** `npm install && npm run lint && npm test && npm run build && ls dist dist/runtime`
Expected: clean lint, 1 test passes, `dist/{index,cli}.js`, `dist/runtime/index.js`, matching `.d.ts`.

- [ ] **Step 4: Commit** `git add -A && git commit -m "chore: scaffold @hscowork/service-generator"`

---

### Task 2: Import templates and fixtures

**Files:**
- Create: `templates/*.ejs` (17 files), `test/fixtures/platform.swagger.json`, `test/fixtures/minimal.swagger.json`

- [ ] **Step 1: Copy templates**
```bash
mkdir templates
cp ../hyperspace-platform/tools/generators/service-api/templates/*.ejs templates/
rm templates/http-client-original.ejs
ls templates | wc -l   # 17
```

- [ ] **Step 2: Fresh platform spec** (the repo's `swagger.json` is stale — 10 paths)
```bash
mkdir -p test/fixtures
curl -fsSL https://platform-api-5wk6.onrender.com/_docs/json -o test/fixtures/platform.swagger.json
node -e "const s=require('./test/fixtures/platform.swagger.json');console.log(Object.keys(s.paths).length,'paths')"   # expect > 40, incl. /api/v1/public/plans and /api/v1/checkins/{id}/checkout
```

- [ ] **Step 3: Minimal fixture** — includes a route whose tag differs from its path (`checkOut`), two error responses to the same DTO, and a `public` path for the filter tests:
```json
{
  "openapi": "3.0.0",
  "info": { "title": "Minimal", "version": "1.0.0" },
  "paths": {
    "/api/v1/locations": {
      "get": { "operationId": "listLocations", "tags": ["Locations"],
        "parameters": [{ "name": "page", "in": "query", "required": false, "schema": { "type": "number" } }],
        "responses": {
          "200": { "description": "", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/LocationDto" } } } } },
          "401": { "description": "", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ResponseErrorDto" } } } },
          "403": { "description": "", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ResponseErrorDto" } } } } } },
      "post": { "operationId": "createLocation", "tags": ["Locations"],
        "requestBody": { "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CreateLocationDto" } } } },
        "responses": { "201": { "description": "", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/LocationDto" } } } } } }
    },
    "/api/v1/locations/{id}": {
      "get": { "operationId": "getLocation", "tags": ["Locations"],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/LocationDto" } } } } } }
    },
    "/api/v1/checkins/{id}/checkout": {
      "post": { "operationId": "checkOut", "tags": ["Attendance"],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CheckinDto" } } } } } }
    },
    "/api/v1/public/plans": {
      "get": { "operationId": "listPublicPlans", "tags": ["Public"],
        "responses": { "200": { "description": "", "content": { "application/json": { "schema": { "type": "array", "items": { "$ref": "#/components/schemas/LocationDto" } } } } } } }
    }
  },
  "components": { "schemas": {
    "LocationDto": { "type": "object", "required": ["id", "name"], "properties": { "id": { "type": "string" }, "name": { "type": "string" } } },
    "CreateLocationDto": { "type": "object", "required": ["name"], "properties": { "name": { "type": "string" } } },
    "CheckinDto": { "type": "object", "required": ["id"], "properties": { "id": { "type": "string" } } },
    "ResponseErrorDto": { "type": "object", "required": ["status", "title"], "properties": { "status": { "type": "number" }, "title": { "type": "string" } } }
  } }
}
```

- [ ] **Step 4: Commit** `git add -A && git commit -m "chore: import templates and spec fixtures"`

---

### Task 3: Runtime — types, errors, HttpClient

**Files:**
- Create: `src/runtime/types.ts`, `src/runtime/errors.ts`, `src/runtime/http-client.ts`, `src/runtime/index.ts` (replace stub), `test/runtime/http-client.test.ts`

**Interfaces:**
- Produces (`@hscowork/service-generator/runtime`): `HttpClient`, `HttpError`, `ProblemError`, `ContentType`, and types `ApiConfig`, `RequestParams`, `FullRequestParams`, `QueryParamsType`, `ResponseFormat`, `HttpResponse`, `FormattedHttpResponse`, `CancelToken`, `Problem`, `SecurityWorker`.

- [ ] **Step 1: Write the failing tests**

`test/runtime/http-client.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { HttpClient, HttpError, ContentType } from '../../src/runtime/index.js'

const json = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function client(fetchImpl: (...a: Parameters<typeof fetch>) => Promise<Response>, extra = {}) {
  const customFetch = vi.fn(fetchImpl)
  return { http: new HttpClient({ baseUrl: 'http://api.test/', customFetch, ...extra }), customFetch }
}

describe('HttpClient', () => {
  afterEach(() => { delete process.env.HS_API_BASE_URL })

  it('defaults baseUrl from HS_API_BASE_URL and strips trailing slashes', () => {
    process.env.HS_API_BASE_URL = 'http://env.test///'
    expect(new HttpClient().baseUrl).toBe('http://env.test')
    delete process.env.HS_API_BASE_URL
    expect(new HttpClient().baseUrl).toBe('http://localhost:8080')
  })

  it('builds url with encoded query and returns json data', async () => {
    const { http, customFetch } = client(async () => json({ ok: 1 }))
    const data = await http.request({ path: '/api/v1/x', method: 'GET', query: { a: 'b c', list: [1, 2], skip: undefined }, format: 'json' })
    expect(data).toEqual({ ok: 1 })
    expect(customFetch.mock.calls[0][0]).toBe('http://api.test/api/v1/x?a=b%20c&list=1&list=2')
  })

  it('serialises json body and sets content-type', async () => {
    const { http, customFetch } = client(async () => json({}, 201))
    await http.request({ path: '/p', method: 'POST', body: { a: 1 }, type: ContentType.Json })
    const init = customFetch.mock.calls[0][1]!
    expect(init.body).toBe('{"a":1}')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('returns null for 201 without format and for 204', async () => {
    expect(await client(async () => json({ a: 1 }, 201)).http.request({ path: '/p', method: 'POST' })).toBeNull()
    expect(await client(async () => json(null, 204)).http.request({ path: '/p', method: 'DELETE' })).toBeNull()
  })

  it('throws HttpError carrying the problem body', async () => {
    const onError = vi.fn()
    const { http } = client(async () => json({ type: 'validation_failed', status: 422, title: 'Unprocessable', detail: 'bad' }, 422), { onError })
    const err = await http.request({ path: '/p', method: 'POST' }).catch((e) => e)
    expect(err).toBeInstanceOf(HttpError)
    expect(err.status).toBe(422)
    expect(err.error.type).toBe('validation_failed')
    expect(err.message).toBe('Status Code 422: bad')
    expect(onError).toHaveBeenCalledWith(err)
  })

  it('calls securityWorker only for secure requests and merges headers', async () => {
    const securityWorker = vi.fn(async () => ({ headers: { 'X-Api-Key': 'k' } }))
    const { http, customFetch } = client(async () => json({}), { securityWorker })
    await http.request({ path: '/a', method: 'GET', format: 'json' })
    expect(securityWorker).not.toHaveBeenCalled()
    await http.request({ path: '/b', method: 'GET', secure: true, format: 'json', headers: { Accept: 'application/json' } })
    expect(securityWorker).toHaveBeenCalledTimes(1)
    expect(customFetch.mock.calls[1][1]!.headers).toMatchObject({ 'X-Api-Key': 'k', Accept: 'application/json' })
  })

  it('passes arbitrary RequestInit fields (e.g. Next.js `next`) through to fetch', async () => {
    const { http, customFetch } = client(async () => json({}))
    await http.request({ path: '/a', method: 'GET', format: 'json', cache: 'no-store', next: { revalidate: 60 } } as never)
    expect(customFetch.mock.calls[0][1]).toMatchObject({ cache: 'no-store', next: { revalidate: 60 } })
  })
})
```

- [ ] **Step 2: Run** `npx vitest run test/runtime` → FAIL (modules missing).

- [ ] **Step 3: Implement**

`src/runtime/types.ts` — copy `hyperspace-platform/lib/shared/types.ts` verbatim, then **replace** the `ApiConfig` interface with:
```ts
export type SecurityWorker<SecurityDataType = unknown> =
  (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void

export interface ApiConfig<SecurityDataType = unknown> {
  /** Defaults to process.env.HS_API_BASE_URL, then "http://localhost:8080". Trailing slashes are stripped. */
  baseUrl?: string
  baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>
  /** Invoked for requests with `secure: true`; its RequestParams are merged into the request. */
  securityWorker?: SecurityWorker<SecurityDataType>
  customFetch?: typeof fetch
  /** Called before a failed response is thrown. Default: console.warn("API error response", error). */
  onError?: (error: import('./errors.js').HttpError) => void
}
```
Also add `[key: string]: unknown` is **not** added — Next.js augments `RequestInit` globally in consumer projects, so `next:` type-checks there; in our tests we cast.

`src/runtime/errors.ts` — `HttpError` and `ProblemError` copied verbatim from `lib/shared/HttpError.ts` / `ProblemError.ts`, importing `Problem`, `FormattedHttpResponse` from `./types.js`.

`src/runtime/http-client.ts` — copy `lib/shared/HttpClient.ts` and make exactly these edits:
1. Imports: `./errors.js`, `./types.js`; **delete** `import { requestSecurityWorker } from "../auth/session"`.
2. Add field `private onError: (error: HttpError) => void = (error) => console.warn("API error response", error);`
3. Constructor body becomes:
   ```ts
   constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
     const { baseUrl, baseApiParams, securityWorker, customFetch, onError } = apiConfig
     if (baseApiParams) this.baseApiParams = { ...this.baseApiParams, ...baseApiParams }
     if (securityWorker) this.securityWorker = securityWorker
     if (customFetch) this.customFetch = customFetch
     if (onError) this.onError = onError
     const env = typeof process !== "undefined" ? process.env?.HS_API_BASE_URL : undefined
     this.baseUrl = (baseUrl ?? env ?? "http://localhost:8080").replace(/\/+$/, "")
   }
   ```
   (The original `Object.assign(this, apiConfig)` silently overwrote private fields; the explicit form is intentional.)
4. In `doRequest`, replace `console.warn("API error response", formattedResponse);` with `if (formattedResponse instanceof HttpError) this.onError(formattedResponse);`.
5. Add `protected` → keep; export the class as named export `HttpClient`.

`src/runtime/index.ts`:
```ts
export { HttpClient } from './http-client.js'
export { HttpError, ProblemError } from './errors.js'
export { ContentType } from './types.js'
export type { ApiConfig, SecurityWorker, RequestParams, FullRequestParams, QueryParamsType, ResponseFormat, HttpResponse, FormattedHttpResponse, CancelToken, Problem } from './types.js'
```

- [ ] **Step 4: Run** `npx vitest run test/runtime && npm run lint` → 7 passed.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(runtime): HttpClient with injectable baseUrl, securityWorker and onError"`

---

### Task 4: Runtime — security workers

**Files:**
- Create: `src/runtime/security.ts`, `test/runtime/security.test.ts`
- Modify: `src/runtime/index.ts`

**Interfaces:**
- Produces: `apiKeySecurityWorker(opts?: { apiKey?: string; header?: string }): SecurityWorker`, `bearerTokenSecurityWorker(getToken: () => Promise<string | null | undefined> | string | null | undefined): SecurityWorker`, `class HttpClientConfigError extends Error`.

- [ ] **Step 1: Failing tests**

`test/runtime/security.test.ts`:
```ts
import { describe, it, expect, afterEach } from 'vitest'
import { apiKeySecurityWorker, bearerTokenSecurityWorker, HttpClientConfigError } from '../../src/runtime/index.js'

describe('apiKeySecurityWorker', () => {
  afterEach(() => { delete process.env.HS_API_KEY })
  it('uses HS_API_KEY by default', async () => {
    process.env.HS_API_KEY = 'env-key'
    expect(await apiKeySecurityWorker()(null)).toEqual({ headers: { 'X-Api-Key': 'env-key' } })
  })
  it('accepts explicit key and header', async () => {
    expect(await apiKeySecurityWorker({ apiKey: 'k', header: 'Api-Key' })(null)).toEqual({ headers: { 'Api-Key': 'k' } })
  })
  it('throws at call time when no key is configured', async () => {
    await expect(async () => apiKeySecurityWorker()(null)).rejects.toThrow(HttpClientConfigError)
  })
})

describe('bearerTokenSecurityWorker', () => {
  it('adds Authorization when a token resolves', async () => {
    expect(await bearerTokenSecurityWorker(async () => 't')(null)).toEqual({ headers: { Authorization: 'Bearer t' } })
  })
  it('adds nothing when token is null', async () => {
    expect(await bearerTokenSecurityWorker(() => null)(null)).toEqual({ headers: {} })
  })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** `src/runtime/security.ts`:
```ts
import type { SecurityWorker } from './types.js'

export class HttpClientConfigError extends Error {
  constructor(message: string) { super(message); this.name = 'HttpClientConfigError' }
}

export function apiKeySecurityWorker(opts: { apiKey?: string; header?: string } = {}): SecurityWorker {
  const header = opts.header ?? 'X-Api-Key'
  return async () => {
    const key = opts.apiKey ?? (typeof process !== 'undefined' ? process.env?.HS_API_KEY : undefined)
    if (!key) throw new HttpClientConfigError('API key missing: set HS_API_KEY or pass { apiKey } to apiKeySecurityWorker')
    return { headers: { [header]: key } }
  }
}

export function bearerTokenSecurityWorker(
  getToken: () => Promise<string | null | undefined> | string | null | undefined,
): SecurityWorker {
  // Plain object, not Headers: mergeRequestParams spreads header objects.
  return async () => {
    const token = await getToken()
    return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  }
}
```
Append to `src/runtime/index.ts`: `export { apiKeySecurityWorker, bearerTokenSecurityWorker, HttpClientConfigError } from './security.js'`.

- [ ] **Step 4: Run → 5 passed.**  **Step 5: Commit** `git commit -am "feat(runtime): apiKey and bearerToken security workers"` (use `git add -A` first).

---

### Task 5: Generator options

**Files:**
- Create: `src/config.ts`, `test/config.test.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export type SpecInput = { path: string } | { url: string; headers?: Record<string,string> } | { spec: Record<string, unknown> }
  export interface IncludeOptions { tags?: string[]; pathPrefixes?: string[] }
  export interface EmitOptions { api?: boolean; index?: boolean; meta?: boolean }
  export interface GeneratorOptions { input: SpecInput; output: string; serviceName?: string; httpClientImport?: string; runtimeImport?: string; serverOnly?: boolean; emit?: EmitOptions; include?: IncludeOptions; templatesDir?: string; saveSpecTo?: string; swaggerTypescriptApi?: Record<string, unknown> }
  export interface ResolvedOptions { input; output; serviceName: string; httpClientImport: string; runtimeImport: string; serverOnly: boolean; emit: Required<EmitOptions>; include?: IncludeOptions; templatesDir?; saveSpecTo?; swaggerTypescriptApi? }
  export class GeneratorConfigError extends Error {}
  export function resolveOptions(o: GeneratorOptions): ResolvedOptions
  export function defineConfig(o: GeneratorOptions): GeneratorOptions
  export const DEFAULTS
  ```

- [ ] **Step 1: Failing tests** `test/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { resolveOptions, GeneratorConfigError, defineConfig } from '../src/config.js'

describe('resolveOptions', () => {
  it('applies defaults', () => {
    const r = resolveOptions({ input: { path: 'x.json' }, output: 'out' })
    expect(r).toMatchObject({
      serviceName: 'ApiService', httpClientImport: './http-client',
      runtimeImport: '@hscowork/service-generator/runtime', serverOnly: true,
      emit: { api: true, index: true, meta: true },
    })
    expect(r.include).toBeUndefined()
  })
  it('merges partial emit', () => {
    expect(resolveOptions({ input: { path: 'x' }, output: 'o', emit: { meta: false } }).emit).toEqual({ api: true, index: true, meta: false })
  })
  it('requires output', () => {
    expect(() => resolveOptions({ input: { path: 'x' } } as never)).toThrow(GeneratorConfigError)
    expect(() => resolveOptions({ input: { path: 'x' } } as never)).toThrow(/output/)
  })
  it('requires exactly one input kind', () => {
    expect(() => resolveOptions({ input: {} as never, output: 'o' })).toThrow(/input/)
    expect(() => resolveOptions({ input: { path: 'a', url: 'http://b' } as never, output: 'o' })).toThrow(/input/)
  })
  it('rejects non-http urls', () => {
    expect(() => resolveOptions({ input: { url: 'ftp://x' }, output: 'o' })).toThrow(/http/)
  })
  it('rejects non-identifier serviceName', () => {
    expect(() => resolveOptions({ input: { path: 'x' }, output: 'o', serviceName: 'my service' })).toThrow(/serviceName/)
  })
  it('rejects empty include', () => {
    expect(() => resolveOptions({ input: { path: 'x' }, output: 'o', include: {} })).toThrow(/include/)
  })
  it('defineConfig is identity', () => { const c = { input: { path: 'x' }, output: 'o' }; expect(defineConfig(c)).toBe(c) })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** `src/config.ts`:
```ts
export type SpecInput =
  | { path: string }
  | { url: string; headers?: Record<string, string> }
  | { spec: Record<string, unknown> }
export interface EmitOptions { api?: boolean; index?: boolean; meta?: boolean }
export interface IncludeOptions { tags?: string[]; pathPrefixes?: string[] }

export interface GeneratorOptions {
  input: SpecInput
  output: string
  serviceName?: string
  httpClientImport?: string
  runtimeImport?: string
  serverOnly?: boolean
  emit?: EmitOptions
  include?: IncludeOptions
  templatesDir?: string
  saveSpecTo?: string
  swaggerTypescriptApi?: Record<string, unknown>
}

export interface ResolvedOptions {
  input: SpecInput
  output: string
  serviceName: string
  httpClientImport: string
  runtimeImport: string
  serverOnly: boolean
  emit: Required<EmitOptions>
  include?: IncludeOptions
  templatesDir?: string
  saveSpecTo?: string
  swaggerTypescriptApi?: Record<string, unknown>
}

export class GeneratorConfigError extends Error {
  constructor(message: string) { super(message); this.name = 'GeneratorConfigError' }
}

export const DEFAULTS = {
  serviceName: 'ApiService',
  httpClientImport: './http-client',
  runtimeImport: '@hscowork/service-generator/runtime',
  serverOnly: true,
  emit: { api: true, index: true, meta: true },
} as const

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

export function resolveOptions(opts: GeneratorOptions): ResolvedOptions {
  if (!opts || typeof opts !== 'object') throw new GeneratorConfigError('options object is required')
  if (!opts.output || typeof opts.output !== 'string') throw new GeneratorConfigError('`output` is required')
  validateInput(opts.input)
  const serviceName = opts.serviceName ?? DEFAULTS.serviceName
  if (!IDENTIFIER.test(serviceName)) throw new GeneratorConfigError(`\`serviceName\` must be a valid identifier, got "${serviceName}"`)
  if (opts.include && !(opts.include.tags?.length || opts.include.pathPrefixes?.length))
    throw new GeneratorConfigError('`include` needs at least one of `tags` or `pathPrefixes`')
  return {
    input: opts.input,
    output: opts.output,
    serviceName,
    httpClientImport: opts.httpClientImport ?? DEFAULTS.httpClientImport,
    runtimeImport: opts.runtimeImport ?? DEFAULTS.runtimeImport,
    serverOnly: opts.serverOnly ?? DEFAULTS.serverOnly,
    emit: { ...DEFAULTS.emit, ...(opts.emit ?? {}) },
    include: opts.include,
    templatesDir: opts.templatesDir,
    saveSpecTo: opts.saveSpecTo,
    swaggerTypescriptApi: opts.swaggerTypescriptApi,
  }
}

function validateInput(input: unknown): asserts input is SpecInput {
  if (!input || typeof input !== 'object') throw new GeneratorConfigError('`input` is required')
  const kinds = (['path', 'url', 'spec'] as const).filter((k) => k in input)
  if (kinds.length !== 1) throw new GeneratorConfigError('`input` must have exactly one of `path`, `url`, `spec`')
  if ('url' in input && !/^https?:\/\//.test(String((input as { url: unknown }).url)))
    throw new GeneratorConfigError('`input.url` must start with http:// or https://')
}

export function defineConfig(opts: GeneratorOptions): GeneratorOptions { return opts }
```
`src/index.ts`:
```ts
export { resolveOptions, defineConfig, GeneratorConfigError, DEFAULTS } from './config.js'
export type { GeneratorOptions, ResolvedOptions, SpecInput, EmitOptions, IncludeOptions } from './config.js'
export const VERSION = '0.1.0'
```

- [ ] **Step 4: Run → 8 passed.**  **Step 5: Commit** `git add -A && git commit -m "feat: generator options with defaults and validation"`

---

### Task 6: Spec loading (file / URL / object)

**Files:**
- Create: `src/input.ts`, `test/input.test.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Produces: `class SpecLoadError extends Error`, `loadSpec(input: SpecInput, opts?: { saveSpecTo?: string; fetchImpl?: typeof fetch }): Promise<Record<string, unknown>>`.

- [ ] **Step 1: Failing tests** `test/input.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadSpec, SpecLoadError } from '../src/input.js'

const okJson = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'text/html' } })) as unknown as typeof fetch

describe('loadSpec', () => {
  it('reads a local json file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-')); const p = join(dir, 's.json')
    await writeFile(p, '{"openapi":"3.0.0"}')
    expect(await loadSpec({ path: p })).toEqual({ openapi: '3.0.0' })
  })
  it('names the path on invalid json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-')); const p = join(dir, 'bad.json')
    await writeFile(p, '{nope')
    await expect(loadSpec({ path: p })).rejects.toThrow(SpecLoadError)
    await expect(loadSpec({ path: p })).rejects.toThrow(p)
  })
  it('fetches a url with headers and ignores content-type', async () => {
    const fetchImpl = okJson({ openapi: '3.0.0' })
    expect(await loadSpec({ url: 'http://x/_docs/json', headers: { Authorization: 'Bearer t' } }, { fetchImpl })).toEqual({ openapi: '3.0.0' })
    expect(fetchImpl).toHaveBeenCalledWith('http://x/_docs/json', { headers: { Authorization: 'Bearer t' } })
  })
  it('throws on non-2xx naming url and status', async () => {
    const p = loadSpec({ url: 'http://x/nope' }, { fetchImpl: okJson({}, 404) })
    await expect(p).rejects.toThrow(SpecLoadError)
    await expect(p).rejects.toThrow(/http:\/\/x\/nope.*404/)
  })
  it('saves the raw body when saveSpecTo is set', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-')); const out = join(dir, 'nested', 'swagger.json')
    await loadSpec({ url: 'http://x' }, { fetchImpl: okJson({ a: 1 }), saveSpecTo: out })
    expect(JSON.parse(await readFile(out, 'utf8'))).toEqual({ a: 1 })
  })
  it('passes through an object', async () => { const spec = { openapi: '3.0.0' }; expect(await loadSpec({ spec })).toBe(spec) })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** `src/input.ts`:
```ts
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { SpecInput } from './config.js'

export class SpecLoadError extends Error {
  constructor(message: string, public readonly cause?: unknown) { super(message); this.name = 'SpecLoadError' }
}
export interface LoadSpecOptions { saveSpecTo?: string; fetchImpl?: typeof fetch }

export async function loadSpec(input: SpecInput, opts: LoadSpecOptions = {}): Promise<Record<string, unknown>> {
  if ('spec' in input) return input.spec
  if ('path' in input) {
    const abs = resolve(input.path)
    let raw: string
    try { raw = await readFile(abs, 'utf8') } catch (e) { throw new SpecLoadError(`Cannot read spec file ${abs}`, e) }
    return parse(raw, abs)
  }
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch
  let res: Response
  try { res = await fetchImpl(input.url, { headers: input.headers ?? {} }) }
  catch (e) { throw new SpecLoadError(`Request to ${input.url} failed: ${(e as Error).message}`, e) }
  if (!res.ok) throw new SpecLoadError(`Request to ${input.url} returned HTTP ${res.status}`)
  const raw = await res.text()
  const spec = parse(raw, input.url)
  if (opts.saveSpecTo) {
    const abs = resolve(opts.saveSpecTo)
    await mkdir(dirname(abs), { recursive: true })
    await writeFile(abs, raw)
  }
  return spec
}

function parse(raw: string, source: string): Record<string, unknown> {
  try { return JSON.parse(raw) as Record<string, unknown> }
  catch (e) { throw new SpecLoadError(`Spec from ${source} is not valid JSON`, e) }
}
```
`src/index.ts` += `export { loadSpec, SpecLoadError } from './input.js'`

- [ ] **Step 4: Run → 6 passed.**  **Step 5: Commit** `git add -A && git commit -m "feat: load spec from file, url or object"`

---

### Task 7: `generateService` wrapper with route filter

**Files:**
- Create: `src/generate.ts`, `test/generate.test.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `resolveOptions`, `loadSpec`.
- Produces: `generateService(opts: GeneratorOptions): Promise<{ files: string[] }>`; templates receive `config.hs = { httpClientImport, runtimeImport, serverOnly }`.

- [ ] **Step 1: Failing tests** `test/generate.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateService } from '../src/generate.js'

const fixture = (n: string) => join(__dirname, 'fixtures', n)
const names = (files: string[]) => files.map((f) => f.split('/').pop()).sort()

describe('generateService (minimal spec, defaults)', () => {
  let dir: string, files: string[]
  const read = (f: string) => readFile(join(dir, f), 'utf8')
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sg-gen-'))
    ;({ files } = await generateService({ input: { path: fixture('minimal.swagger.json') }, output: dir, serviceName: 'HsService' }))
  })
  it('writes the four files', () => expect(names(files)).toEqual(['HsService.ts', '_meta.ts', 'api.ts', 'index.ts']))
  it('uses default imports and directives', async () => {
    expect(await read('api.ts')).toContain('server-only')
    expect(await read('api.ts')).toMatch(/import \{ httpClient \} from ["']\.\/http-client["']/)
    expect(await read('HsService.ts')).toMatch(/from ["']@hscowork\/service-generator\/runtime["']/)
    expect(await read('index.ts')).toContain('use server')
  })
  it('exports a wrapper for every route in _meta', async () => {
    const meta = await read('_meta.ts'), index = await read('index.ts')
    const fns = [...meta.matchAll(/functionName: "(\w+)"/g)].map((m) => m[1])
    expect(fns).toContain('checkOut')
    for (const n of fns) expect(index, `missing ${n}`).toMatch(new RegExp(`export async function ${n}\\(`))
  })
  it('does not emit duplicated error unions', async () => {
    expect(await read('HsService.ts')).not.toMatch(/ResponseErrorDto \| ResponseErrorDto/)
  })
})

describe('generateService (options)', () => {
  it('honours import paths and serverOnly:false', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-opt-'))
    await generateService({ input: { path: fixture('minimal.swagger.json') }, output: dir, serviceName: 'Svc',
      httpClientImport: '@/lib/http', runtimeImport: '@acme/runtime', serverOnly: false })
    const [api, svc, index] = await Promise.all(['api.ts', 'Svc.ts', 'index.ts'].map((f) => readFile(join(dir, f), 'utf8')))
    expect(api).toMatch(/from ["']@\/lib\/http["']/); expect(svc).toMatch(/from ["']@acme\/runtime["']/)
    for (const s of [api, svc, index]) { expect(s).not.toContain('server-only'); expect(s).not.toContain('use server') }
  })
  it('skips files disabled via emit', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-emit-'))
    const r = await generateService({ input: { path: fixture('minimal.swagger.json') }, output: dir, emit: { meta: false, index: false } })
    expect(names(r.files)).toEqual(['ApiService.ts', 'api.ts'])
  })
  it('filters routes by path prefix and by tag', async () => {
    const byPath = await mkdtemp(join(tmpdir(), 'sg-inc-'))
    await generateService({ input: { path: fixture('minimal.swagger.json') }, output: byPath, include: { pathPrefixes: ['/api/v1/public'] } })
    const svc = await readFile(join(byPath, 'ApiService.ts'), 'utf8')
    expect(svc).toContain('listPublicPlans'); expect(svc).not.toContain('listLocations'); expect(svc).not.toContain('checkOut')
    const byTag = await mkdtemp(join(tmpdir(), 'sg-tag-'))
    await generateService({ input: { path: fixture('minimal.swagger.json') }, output: byTag, include: { tags: ['Attendance'] } })
    const svc2 = await readFile(join(byTag, 'ApiService.ts'), 'utf8')
    expect(svc2).toContain('checkOut'); expect(svc2).not.toContain('listLocations')
  })
})
```

- [ ] **Step 2: Run → FAIL** (module missing).

- [ ] **Step 3: Implement** `src/generate.ts`:
```ts
import { generateApi } from 'swagger-typescript-api'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveOptions, type GeneratorOptions, type ResolvedOptions, type IncludeOptions } from './config.js'
import { loadSpec } from './input.js'

export interface GenerateResult { files: string[] }

// dist/generate.js → ../templates ; src/generate.ts → ../templates
const BUILTIN_TEMPLATES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates')

export async function generateService(options: GeneratorOptions): Promise<GenerateResult> {
  const opts = resolveOptions(options)
  const spec = await loadSpec(opts.input, { saveSpecTo: opts.saveSpecTo })
  const output = resolve(opts.output)
  await mkdir(output, { recursive: true })
  const templates = opts.templatesDir ? resolve(opts.templatesDir) : BUILTIN_TEMPLATES

  const extraTemplates = [
    opts.emit.index && { name: 'index', path: templateFile(templates, 'index-entry-file.ejs') },
    opts.emit.api && { name: 'api', path: templateFile(templates, 'custom-api.ejs') },
    opts.emit.meta && { name: '_meta', path: templateFile(templates, 'custom-meta.ejs') },
  ].filter((t): t is { name: string; path: string } => Boolean(t))

  const { files } = await generateApi({
    fileName: opts.serviceName,
    apiClassName: opts.serviceName,
    spec: spec as never,
    output: false,
    httpClientType: 'fetch',
    templates,
    disableThrowOnError: false,
    generateRouteTypes: true,
    generateResponses: true,
    extractRequestParams: true,
    extractRequestBody: true,
    unwrapResponseData: true,
    addReadonly: true,
    generateUnionEnums: true,
    anotherArrayType: true,
    silent: true,
    singleHttpClient: true,
    extraTemplates,
    hooks: {
      onInit: (config: Record<string, unknown>) => ({ ...config, hs: templateContext(opts) }),
      onCreateRoute: (route: { raw: { route: string; tags?: string[] } }) => (routeIncluded(route.raw, opts.include) ? route : false),
    },
    ...(opts.swaggerTypescriptApi ?? {}),
  } as never)

  const written: string[] = []
  for (const { fileName, fileContent, fileExtension } of files) {
    const target = join(output, fileName + fileExtension)
    await writeFile(target, fileContent)
    written.push(target)
  }
  return { files: written }
}

export function templateContext(opts: ResolvedOptions) {
  return { httpClientImport: opts.httpClientImport, runtimeImport: opts.runtimeImport, serverOnly: opts.serverOnly }
}

export function routeIncluded(raw: { route: string; tags?: string[] }, include?: IncludeOptions): boolean {
  if (!include) return true
  const byPath = include.pathPrefixes?.some((p) => raw.route.startsWith(p)) ?? false
  const byTag = include.tags?.some((t) => raw.tags?.includes(t)) ?? false
  return byPath || byTag
}

/** Per-file override: a file missing from the user's dir falls back to the built-in one. */
function templateFile(dir: string, name: string): string {
  const candidate = join(dir, name)
  return existsSync(candidate) ? candidate : join(BUILTIN_TEMPLATES, name)
}
```
Implementer notes: (a) `hooks.onInit` returning a new config object is the documented way to add fields visible to templates as `it.config.hs`; verify by temporarily adding `<%= JSON.stringify(config.hs) %>` to a template. If `onInit` is not honoured in 13.0.28, fall back to passing `hs` as a top-level param (the library spreads unknown params into `config`). (b) `onCreateRoute` receives the parsed route; its `raw.route` is the path string and `raw.tags` the tag list — confirm field names with a `console.log(Object.keys(route.raw))` once. (c) A route filtered out still leaves its DTOs in the output; that is by design.

`src/index.ts` += `export { generateService } from './generate.js'; export type { GenerateResult } from './generate.js'`

- [ ] **Step 4: Run** `npx vitest run test/generate.test.ts`
Expected: "writes the four files" PASS; "skips files disabled via emit" PASS; "filters routes" PASS (tests only inspect `ApiService.ts`); the three import/directive/bug tests **FAIL** until Task 8. Confirm the failures are exactly those.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: generateService wrapper with route filter"`

---

### Task 8: Parameterise templates and fix the two output bugs

**Files:**
- Modify: `templates/custom-api.ejs`, `templates/api.ejs`, `templates/index-entry-file.ejs`, `templates/custom-meta.ejs`, `templates/procedure-call.ejs`, `templates/route-type.ejs`, `templates/route-types.ejs`

- [ ] **Step 1: `custom-api.ejs`** — replace the whole file:
```ejs
<%
const { config, utils } = it;
const { _ } = utils;
const hs = config.hs;
%>
<% if (hs.serverOnly) { %>import 'server-only'
<% } %>import { httpClient } from '<%~ hs.httpClientImport %>'
import { <%~ config.apiClassName %> } from './<%~ config.apiClassName %>'

export const <%~ _.lowerFirst(config.apiClassName) %> = new <%~ config.apiClassName %>(httpClient)
```

- [ ] **Step 2: `api.ejs`** — find the three hard-coded lines (`import "server-only"`, `from "../shared/HttpClient"`, `from "../shared/types"`) and replace with `<% if (config.hs.serverOnly) { %>import "server-only";<% } %>`, `from '<%~ config.hs.runtimeImport %>'` (type import of `HttpClient`), `from '<%~ config.hs.runtimeImport %>'` (`ContentType`, `RequestParams`). Keep everything else.

- [ ] **Step 3: `index-entry-file.ejs`** — replace lines 67–73 (the directives and imports) with:
```ejs
<% const hs = config.hs; %>
<% if (hs.serverOnly) { %>'use server'
import 'server-only'
<% } %>import { <%~ _.lowerFirst(config.apiClassName) %> } from './api'
<% if(getTypesForImport().length) { %>
import type { <%~ getTypesForImport().join(', ') %> } from './<%~ config.apiClassName %>'
<% } %>
import type { RequestParams } from '<%~ hs.runtimeImport %>'
```

- [ ] **Step 4: Missing-wrapper fix** — in `index-entry-file.ejs` top block add:
```ejs
const allGroups = [
  ...(routes.combined ?? []),
  ...((routes.outOfModule && routes.outOfModule.length) ? [{ moduleName: null, routes: routes.outOfModule }] : []),
];
```
Replace every `routes.combined && routes.combined.forEach(` with `allGroups.forEach(` (in `getTypesForImport`, `getAllTypes`, and the main loop). In the main loop's call expression use:
```ejs
return <%~ _.lowerFirst(config.apiClassName) %>.<%~ moduleName ? `${moduleName}.` : '' %><%~ route.routeName.usage %>(<%~ functionCallerArgs %>params)
```
Apply the same `allGroups` change to `custom-meta.ejs` (emit `namespace: <%~ moduleName ? `'${moduleName}'` : 'null' %>`).

Then verify the root cause: run `npx vitest run test/generate.test.ts -t "every route"`. If `checkOut` is still missing, add `<% console.error(JSON.stringify(allGroups.map(g => [g.moduleName, g.routes.map(r => r.routeName.usage)]))) %>` temporarily, compare to `_meta.ts`, and fix whichever name mismatch appears (e.g. `maybeGetUsage` renaming collisions). Remove the debug line.

- [ ] **Step 5: Dedupe error unions** — in `procedure-call.ejs` after line 6 add
```ejs
const dedupeUnion = (t) => _.uniq(String(t).split('|').map((s) => s.trim())).join(' | ');
const errorTypeDeduped = dedupeUnion(errorType);
```
and use `<%~ errorTypeDeduped %>` on line 92. Grep `route-type.ejs` and `route-types.ejs` for `errorType` and apply the same helper.

- [ ] **Step 6: Run** `npx vitest run` → all green. **Commit** `git add -A && git commit -m "feat(templates): configurable imports/directives; fix missing wrapper export and duplicate error unions"`

---

### Task 9: Snapshot lock on the platform spec

**Files:**
- Create: `test/platform-snapshot.test.ts`

- [ ] **Step 1: Test**
```ts
import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateService } from '../src/generate.js'

describe('platform spec snapshot', () => {
  it('matches the locked output', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-snap-'))
    const { files } = await generateService({ input: { path: join(__dirname, 'fixtures', 'platform.swagger.json') }, output: dir, serviceName: 'HsService' })
    for (const f of files.sort()) expect(await readFile(f, 'utf8')).toMatchSnapshot(f.split('/').pop())
  })
})
```

- [ ] **Step 2: Generate snapshots and diff against the platform**
```bash
npx vitest run test/platform-snapshot.test.ts
mkdir -p /tmp/sg-compare && node -e "
import('./dist/index.js').then(m => m.generateService({ input: { path: 'test/fixtures/platform.swagger.json' }, output: '/tmp/sg-compare', serviceName: 'HsService' }))"
diff /tmp/sg-compare/HsService.ts ../hyperspace-platform/lib/service/HsService.ts
diff /tmp/sg-compare/index.ts ../hyperspace-platform/lib/service/index.ts
```
(Run `npm run build` first.) Allowed differences: import lines, `ResponseErrorDto | ResponseErrorDto` collapses, the `checkOut` export, and anything caused by the backend having changed since the platform last regenerated (compare against a fresh `npm run generate` in the platform if in doubt). Anything else is a regression — fix before continuing.

- [ ] **Step 3: Commit** `git add -A && git commit -m "test: snapshot generated output for the platform spec"`

---

### Task 10: CLI and config file

**Files:**
- Create: `src/load-config.ts`, `test/cli.test.ts`
- Modify: `src/cli.ts`

**Interfaces:**
- Produces: `service-generator` bin; `loadConfigFile(explicitPath?: string, cwd?: string): Promise<Partial<GeneratorOptions>>`; `mergeFlags(cfg, flags): GeneratorOptions`.

- [ ] **Step 1: Failing tests** `test/cli.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const run = promisify(execFile)
const ROOT = join(__dirname, '..'), CLI = join(ROOT, 'dist', 'cli.js')
const fixture = join(__dirname, 'fixtures', 'minimal.swagger.json')

describe('cli', () => {
  beforeAll(async () => { await run('npm', ['run', 'build'], { cwd: ROOT }) }, 60000)

  it('generates with flags', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-cli-'))
    await run('node', [CLI, '-i', fixture, '-o', dir, '-n', 'HsService'])
    expect((await readdir(dir)).sort()).toEqual(['HsService.ts', '_meta.ts', 'api.ts', 'index.ts'])
  })
  it('reads service-generator.config.mjs from cwd and lets flags override', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'sg-cfg-'))
    await writeFile(join(cwd, 'service-generator.config.mjs'),
      `export default { input: { path: ${JSON.stringify(fixture)} }, output: './gen', serviceName: 'FromConfig' }`)
    await run('node', [CLI, '-n', 'Overridden'], { cwd })
    expect((await readdir(join(cwd, 'gen'))).sort()).toEqual(['Overridden.ts', '_meta.ts', 'api.ts', 'index.ts'])
  })
  it('applies --include-path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sg-cli-inc-'))
    await run('node', [CLI, '-i', fixture, '-o', dir, '--include-path', '/api/v1/public'])
    const svc = await readFile(join(dir, 'ApiService.ts'), 'utf8')
    expect(svc).toContain('listPublicPlans'); expect(svc).not.toContain('listLocations')
  })
  it('exit 1 with a short message when output is missing', async () => {
    await expect(run('node', [CLI, '-i', fixture])).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('output') })
  })
  it('exit 1 on an unreachable url', async () => {
    await expect(run('node', [CLI, '-i', 'http://127.0.0.1:9/_docs/json', '-o', 'x'])).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('127.0.0.1:9') })
  })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `src/load-config.ts`**
```ts
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { GeneratorOptions } from './config.js'

const CANDIDATES = ['service-generator.config.mjs', 'service-generator.config.js', 'service-generator.config.json']

export async function loadConfigFile(explicitPath?: string, cwd = process.cwd()): Promise<Partial<GeneratorOptions>> {
  const file = explicitPath ? resolve(cwd, explicitPath) : CANDIDATES.map((c) => resolve(cwd, c)).find((p) => existsSync(p))
  if (!file) return {}
  if (!existsSync(file)) throw new Error(`Config file not found: ${file}`)
  const mod = await import(pathToFileURL(file).href)
  return (mod.default ?? mod) as Partial<GeneratorOptions>
}
```

- [ ] **Step 4: `src/cli.ts`**
```ts
#!/usr/bin/env node
import { Command } from 'commander'
import { generateService } from './generate.js'
import { loadConfigFile } from './load-config.js'
import { GeneratorConfigError, type GeneratorOptions } from './config.js'
import { SpecLoadError } from './input.js'
import { VERSION } from './index.js'

const collect = (v: string, acc: string[]) => [...acc, v]

const program = new Command()
  .name('service-generator')
  .description('Generate a typed fetch service client from a swagger/OpenAPI JSON file or URL')
  .version(VERSION)
  .option('-c, --config <file>', 'config file (default: ./service-generator.config.{mjs,js,json})')
  .option('-i, --input <pathOrUrl>', 'swagger.json path or http(s) URL')
  .option('-o, --output <dir>', 'output directory')
  .option('-n, --name <ServiceName>', 'service class/file name')
  .option('--header <k=v>', 'header for URL input (repeatable)', collect, [] as string[])
  .option('--save-spec <file>', 'write the fetched spec to this file')
  .option('--no-server-only', 'omit server-only / use server directives')
  .option('--http-client-import <specifier>', 'module exporting the httpClient instance')
  .option('--runtime-import <specifier>', 'module providing HttpClient/ContentType/RequestParams')
  .option('--include-tag <tag>', 'keep only routes with this tag (repeatable)', collect, [] as string[])
  .option('--include-path <prefix>', 'keep only routes under this path prefix (repeatable)', collect, [] as string[])
  .option('--templates <dir>', 'directory with overriding .ejs templates')

program.action(async (flags) => {
  try {
    const options = mergeFlags(await loadConfigFile(flags.config), flags)
    const { files } = await generateService(options)
    console.log(`Generated ${files.length} file(s) in ${options.output}`)
  } catch (err) {
    const known = err instanceof GeneratorConfigError || err instanceof SpecLoadError
    console.error(`service-generator: ${(err as Error).message}`)
    if (!known && process.env.DEBUG?.includes('service-generator')) console.error(err)
    process.exitCode = 1
  }
})

export function mergeFlags(cfg: Partial<GeneratorOptions>, f: Record<string, unknown>): GeneratorOptions {
  const headerList = (f.header as string[]) ?? []
  const headers = Object.fromEntries(headerList.map((h) => { const i = h.indexOf('='); return [h.slice(0, i), h.slice(i + 1)] }))
  let input = cfg.input
  if (typeof f.input === 'string') {
    input = /^https?:\/\//.test(f.input)
      ? { url: f.input, headers: headerList.length ? headers : undefined }
      : { path: f.input }
  }
  const tags = f.includeTag as string[], pathPrefixes = f.includePath as string[]
  const include = tags?.length || pathPrefixes?.length
    ? { ...(tags?.length ? { tags } : {}), ...(pathPrefixes?.length ? { pathPrefixes } : {}) }
    : cfg.include
  return {
    ...cfg,
    input: input as GeneratorOptions['input'],
    output: (f.output as string | undefined) ?? cfg.output ?? '',
    serviceName: (f.name as string | undefined) ?? cfg.serviceName,
    saveSpecTo: (f.saveSpec as string | undefined) ?? cfg.saveSpecTo,
    serverOnly: f.serverOnly === false ? false : cfg.serverOnly,
    httpClientImport: (f.httpClientImport as string | undefined) ?? cfg.httpClientImport,
    runtimeImport: (f.runtimeImport as string | undefined) ?? cfg.runtimeImport,
    templatesDir: (f.templates as string | undefined) ?? cfg.templatesDir,
    include,
  }
}

program.parseAsync(process.argv)
```
(`output: ''` when absent lets `resolveOptions` raise "`output` is required", which the test asserts.)

- [ ] **Step 5: Run** `npx vitest run && npm run lint` → all green. **Commit** `git add -A && git commit -m "feat: service-generator CLI with config file support"`

---

### Task 11: README, CI, publish

**Files:**
- Create: `README.md`, `.github/workflows/ci.yml`, `.github/workflows/publish.yml`

- [ ] **Step 1: README.md** — sections, in order: **Install** (`.npmrc` two lines with `${NPM_GITHUB_TOKEN}`, PAT scope `read:packages`, `npm i -D @hscowork/service-generator`); **Quick start** (URL example: `npx service-generator -i https://platform-api-5wk6.onrender.com/_docs/json -o lib/service -n HsService --save-spec swagger.json`); **Config file** (the platform example from spec §6.1); **Your one hand-written file** (`lib/service/http-client.ts` examples for bearer and API key); **CLI flags** (table from spec §4.4); **Programmatic API** (`generateService`, `GeneratorOptions` with defaults); **Runtime** (`HttpClient` config, `onError`, passing Next.js `next`/`cache`/`signal` through the trailing `params`, `HttpError.status`/`.error`); **Generated files**; **Template overrides**; **Releasing** (bump version, tag `vX.Y.Z`, push tag).

- [ ] **Step 2: `ci.yml`**
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npm pack --dry-run
```

- [ ] **Step 3: `publish.yml`**
```yaml
name: Publish to GitHub Packages
on:
  push:
    tags: ['v*']
permissions:
  contents: read
  packages: write
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          registry-url: https://npm.pkg.github.com
          scope: '@hscowork'
      - name: Verify tag matches package.json version
        run: |
          PKG="v$(node -p "require('./package.json').version")"
          [ "$PKG" = "$GITHUB_REF_NAME" ] || { echo "Tag $GITHUB_REF_NAME != package.json $PKG"; exit 1; }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 4: Commit, create repo, release**
```bash
git add -A && git commit -m "docs: README; ci: test on PR, publish on tag"
gh repo create hscowork/service-generator --private --source=. --push
git tag v0.1.0 && git push origin v0.1.0
```
Verify the publish run is green and `https://github.com/orgs/hscowork/packages` lists `service-generator 0.1.0`. In **Package settings → Manage Actions access**, add `hyperspace-platform`, `public-booking-page`, `hscowork-landingpage` (read). Create a PAT (`read:packages`) for local installs.

---

### Task 12: Migrate `hyperspace-platform`

**Files (in `hyperspace-platform`):**
- Create: `.npmrc`, `service-generator.config.mjs`, `lib/service/http-client.ts`
- Modify: `package.json`, `lib/auth/session.ts`, `lib/service-supplement.ts`, `README.md`, `deploy/docker/Dockerfile`, `.github/workflows/deploy.yml`, `.gitignore`
- Delete: `tools/generators/`, `lib/shared/HttpClient.ts`, `lib/shared/HttpError.ts`, `lib/shared/ProblemError.ts`, `lib/shared/types.ts`

- [ ] **Step 1: Branch, install**
```bash
git checkout -b chore/service-generator-package
printf '@hscowork:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NPM_GITHUB_TOKEN}\n' > .npmrc
export NPM_GITHUB_TOKEN=<PAT>
npm i -D @hscowork/service-generator && npm rm swagger-typescript-api
```

- [ ] **Step 2: Config + script**
`service-generator.config.mjs`:
```js
import { defineConfig } from '@hscowork/service-generator'

export default defineConfig({
  input: { url: process.env.HS_SWAGGER_URL ?? 'http://localhost:8080/_docs/json' },
  saveSpecTo: './swagger.json',
  output: './lib/service',
  serviceName: 'HsService',
})
```
`package.json`: `"generate": "service-generator"`.

- [ ] **Step 3: Client instance + session helper**
`lib/auth/session.ts`: add
```ts
export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  } catch {
    return null // Supabase not configured: continue unauthenticated
  }
}
```
and delete `requestSecurityWorker`.
`lib/service/http-client.ts`:
```ts
import { HttpClient, bearerTokenSecurityWorker } from '@hscowork/service-generator/runtime'
import { getAccessToken } from '../auth/session'

export const httpClient = new HttpClient({ securityWorker: bearerTokenSecurityWorker(getAccessToken) })
```

- [ ] **Step 4: Regenerate and compare**
```bash
cp -r lib/service /tmp/service-before
HS_SWAGGER_URL=https://platform-api-5wk6.onrender.com/_docs/json npm run generate
diff -r /tmp/service-before lib/service
```
Allowed: import lines, collapsed unions, new `checkOut` export. Then in `lib/service-supplement.ts` repoint `lib/shared/*` imports to `@hscowork/service-generator/runtime` and delete its `checkOut` workaround if `lib/service/index.ts` now exports it (update importers: `grep -rn "service-supplement" app lib components`).

- [ ] **Step 5: Delete old code**
```bash
git rm -r tools/generators lib/shared/HttpClient.ts lib/shared/HttpError.ts lib/shared/ProblemError.ts lib/shared/types.ts
grep -rn "lib/shared/HttpClient\|lib/shared/HttpError\|lib/shared/ProblemError\|lib/shared/types\|shared/HttpClient\|shared/types" app lib components   # must be empty
```

- [ ] **Step 6: Docker + deploy token**
`deploy/docker/Dockerfile` builder stage: replace `RUN npm ci` with
```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```
and **remove** the `.npmrc` copied from the repo before `npm ci` only if it would shadow the secret (it won't — `COPY package*.json ./` does not copy `.npmrc`; keep `COPY . .` after install). `.github/workflows/deploy.yml` build step:
```yaml
      - name: 🔐 Prepare npmrc for GitHub Packages
        run: printf '@hscowork:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=%s\n' "${{ secrets.GITHUB_TOKEN }}" > /tmp/npmrc
      - name: 📦🏷️ Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          ...
          secret-files: |
            npmrc=/tmp/npmrc
```

- [ ] **Step 7: README** — replace the "Generators" section with: `npm run generate` fetches the spec from `HS_SWAGGER_URL` (default `http://localhost:8080/_docs/json`; hosted: `https://platform-api-5wk6.onrender.com/_docs/json`), saves it to `swagger.json`, and writes `lib/service`. Mention `.npmrc` + `NPM_GITHUB_TOKEN`.

- [ ] **Step 8: Verify and PR**
```bash
npm run lint && npm run build
git add -A && git commit -m "chore: use @hscowork/service-generator (generator + runtime)"
gh pr create --base staging --fill
```

---

### Task 13: Migrate `public-booking-page`

**Files (in `public-booking-page`):**
- Create: `.npmrc`, `service-generator.config.mjs`, `lib/service/http-client.ts`
- Modify: `package.json`, `lib/api/client.ts`, `lib/api/types.ts`, `README.md`
- Vercel: env `NPM_GITHUB_TOKEN`, `HS_API_BASE_URL`, `HS_API_KEY` (last two already exist)

- [ ] **Step 1: Install + config**
```bash
git checkout -b chore/service-generator
printf '@hscowork:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NPM_GITHUB_TOKEN}\n' > .npmrc
npm i -D @hscowork/service-generator
```
`service-generator.config.mjs`:
```js
import { defineConfig } from '@hscowork/service-generator'

export default defineConfig({
  input: { url: process.env.HS_SWAGGER_URL ?? 'https://platform-api-5wk6.onrender.com/_docs/json' },
  saveSpecTo: './swagger.json',
  output: './lib/service',
  serviceName: 'HsPublicService',
  include: { pathPrefixes: ['/api/v1/public'] },
})
```
`package.json` scripts: `"generate": "service-generator"`. Add `swagger.json` to `.gitignore`.
`lib/service/http-client.ts`:
```ts
import { HttpClient, apiKeySecurityWorker } from '@hscowork/service-generator/runtime'

export const httpClient = new HttpClient({ securityWorker: apiKeySecurityWorker() })
```
Run `npm run generate`; confirm `lib/service/HsPublicService.ts` contains only `public.*` routes and that the operations exist with these generated names (check `_meta.ts` `usage` fields): `listPublicResources`, `listPublicResourceTypes`, `getPublicResourceAvailability`, `listPublicPlans`, `createPublicBookingRequest`, `createPublicPlanRequest` — **adjust the names below to whatever `_meta.ts` says**.

- [ ] **Step 2: Rewrite `lib/api/client.ts` as a façade** (same exports, same signatures, same caching/error behaviour):
```ts
import "server-only";

import { HttpError } from "@hscowork/service-generator/runtime";
import { hsPublicService } from "@/lib/service/api";
import type { Availability, BookingRequestBody, BookingRequestQuote, PlanRequestBody, PlanRequestQuote, ProblemDetails, PublicPlan, PublicResource, ResourceType } from "./types";
import { ApiError } from "./types";

const READ_REVALIDATE_S = 60;
const read = (revalidate = READ_REVALIDATE_S) => ({ secure: true, next: { revalidate } });
const write = () => ({ secure: true, cache: "no-store" as const });

/** Preserve the previous ApiError contract for the route handlers. */
async function guard<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (err instanceof HttpError) throw new ApiError(toProblem(err));
    throw err;
  }
}

function toProblem(err: HttpError): ProblemDetails {
  const p = err.error as Partial<ProblemDetails> | undefined;
  if (p && typeof p.type === "string") return p as ProblemDetails;
  return { type: err.status === 429 ? "rate_limited" : "unexpected_error", status: err.status, title: err.message || "Request failed" };
}

export async function getResourceTypes(): Promise<ResourceType[]> {
  try {
    return await guard(() => hsPublicService.public.listPublicResourceTypes(read()));
  } catch (err) {
    if (err instanceof ApiError && err.problem.status === 404) return deriveResourceTypes(await getResources());
    throw err;
  }
}
// deriveResourceTypes: unchanged

export async function getResources(resourceType?: string, planCode?: string): Promise<PublicResource[]> {
  return guard(() => hsPublicService.public.listPublicResources({ resourceType, planCode }, read()));
}
export async function getResource(id: string): Promise<PublicResource | undefined> {
  const all = await getResources();
  return all.find((r) => r.id === id);
}
export async function getAvailability(resourceId: string, from: string, to: string): Promise<Availability> {
  return guard(() => hsPublicService.public.getPublicResourceAvailability({ id: resourceId, from, to }, read(30)));
}
export async function getPlans(): Promise<PublicPlan[]> {
  return guard(() => hsPublicService.public.listPublicPlans({}, read()));
}
export async function createPlanRequest(body: PlanRequestBody): Promise<PlanRequestQuote> {
  return guard(() => hsPublicService.public.createPublicPlanRequest(body, write()));
}
export async function createBookingRequest(body: BookingRequestBody): Promise<BookingRequestQuote> {
  return guard(() => hsPublicService.public.createPublicBookingRequest(body, write()));
}
```
Note `secure: true` — the generated methods already set `secure: true` when the spec declares `security` on the operation; keep it in the params anyway so the worker always runs. `{ resourceType, planCode }` argument shapes follow the generated `*Params` types — match them to `_meta.ts`.

- [ ] **Step 3: `lib/api/types.ts`** — for each hand-typed DTO, check the generated `HsPublicService.ts` for the equivalent (`PublicResourceDto`, `PublicPlanDto`, `PublicResourceTypeDto`, `AvailabilityDto`, `CreateBookingRequestDto`, `BookingRequestQuoteDto`, … — exact names from the file) and replace the local definition with a type alias:
```ts
import type { PublicResourceDto, PublicPlanDto /* … */ } from "@/lib/service/HsPublicService";
export type PublicResource = PublicResourceDto;
export type PublicPlan = PublicPlanDto;
// …
```
Keep `ApiError`, `ProblemDetails`, and any local type without a generated counterpart (e.g. derived `ResourceType` if the endpoint no longer exists). Where a generated DTO is *narrower* than the local one (the `status?` comment says some backend versions omit it), keep the local type and add a `// generated: X` note rather than break components.

- [ ] **Step 4: Verify**
```bash
npm run lint && npm run build
HS_API_BASE_URL=https://platform-api-5wk6.onrender.com HS_API_KEY=<key> npm run dev
# open /fr, a space page, POST /api/availability/<id>?from=…&to=…, submit a booking request
```
Add `NPM_GITHUB_TOKEN` to Vercel project env (all environments). README: one paragraph on `npm run generate` + the token.

- [ ] **Step 5: Commit + PR** `git add -A && git commit -m "chore: generated HsPublicService via @hscowork/service-generator" && gh pr create --fill`

---

### Task 14: Migrate `hscowork-landingpage`

**Files (in `hscowork-landingpage`):**
- Create: `.npmrc`, `service-generator.config.mjs`, `lib/service/http-client.ts`
- Modify: `package.json`, `.gitignore`, `lib/plans.ts`, `app/api/booking/route.ts`, `README.md`
- Vercel: env `NPM_GITHUB_TOKEN`

- [ ] **Step 1: Install + config** — identical to Task 13 Step 1 (same `.npmrc`, same config with `serviceName: 'HsPublicService'` and the public prefix filter, same `http-client.ts`). Run `npm run generate`; note the generated names for `/public/plans`, `/public/plan-categories`, `/public/contact-requests` from `_meta.ts`.

- [ ] **Step 2: `lib/plans.ts`** — replace `fetchPublic` and the two fetchers; keep every other export untouched:
```ts
import { hsPublicService } from "@/lib/service/api";
import type { PublicPlanDto, PublicPlanCategoryDto } from "@/lib/service/HsPublicService"; // exact generated names

export type PublicPlanCategory = PublicPlanCategoryDto;
export type PublicPlan = PublicPlanDto;

/** null when the API is not configured, fails, or returns nothing — callers keep static content. */
async function fetchPublic<T>(call: () => Promise<T[]>): Promise<T[] | null> {
  if (!process.env.HS_API_BASE_URL || !process.env.HS_API_KEY) return null;
  try {
    const items = await call();
    return Array.isArray(items) && items.length > 0 ? items : null;
  } catch {
    return null;
  }
}
const read = () => ({ secure: true, next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });

export async function fetchPublicPlans(category?: string): Promise<PublicPlan[] | null> {
  return fetchPublic(() => hsPublicService.public.listPublicPlans({ category }, read()));
}
export async function fetchPublicPlanCategories(): Promise<PublicPlanCategory[] | null> {
  return fetchPublic(() => hsPublicService.public.listPublicPlanCategories(read()));
}
```
If the generated `PublicPlanDto` fields differ from the local `PublicPlan` (e.g. `priceTtc: number | string`, `benefits[].amenityName`), keep the local type and cast at the boundary rather than changing `mapPublicPlans`.

- [ ] **Step 3: `app/api/booking/route.ts#deliverToBackend`** — same payload; replace the `fetch` block with:
```ts
import { HttpError } from "@hscowork/service-generator/runtime";
import { hsPublicService } from "@/lib/service/api";
// …
  try {
    await hsPublicService.public.createPublicContactRequest(payload, { secure: true, signal: AbortSignal.timeout(5000) });
    return { ok: true };
  } catch (err) {
    if (err instanceof HttpError) {
      console.error(`Backend contact-request delivery failed with status ${err.status}`);
      return err.status === 422
        ? { ok: false, error: "validation", status: 422 }
        : { ok: false, error: "unavailable", status: 502 };
    }
    console.error("Backend contact-request delivery threw");
    return { ok: false, error: "unavailable", status: 502 };
  }
```
Keep the `if (HS_API_BASE_URL && HS_API_KEY)` guard above it unchanged.

- [ ] **Step 4: Verify**
```bash
npm run lint && npm run build
HS_API_BASE_URL=https://platform-api-5wk6.onrender.com HS_API_KEY=<key> npm run dev   # pricing section shows live plans; submit the contact form
```
Add `NPM_GITHUB_TOKEN` to Vercel. README paragraph on `npm run generate`.

- [ ] **Step 5: Commit + PR** `git add -A && git commit -m "chore: generated HsPublicService via @hscowork/service-generator" && gh pr create --fill`

---

## Self-review

- **Spec coverage:** §4.1 → T1/T2; §4.2 runtime → T3/T4; §4.3 options incl. `include` → T5/T7; §4.4 CLI → T10; §4.5 input → T6; §4.6 templates + bugs → T8; §4.7 snapshot → T9; §5 CI/CD + access → T11; §6.1/6.2/6.3 → T12/T13/T14; §7 tests distributed across T3–T10 and the per-app verify steps.
- **Placeholders:** the only deliberately open items are generated operation/DTO names in T13/T14, which cannot be known until `_meta.ts` exists; each such step says exactly where to read them.
- **Type consistency:** `GeneratorOptions.runtimeImport`/`httpClientImport` (T5) ↔ `config.hs.*` (T7/T8) ↔ CLI flags (T10); `SecurityWorker` (T3) ↔ workers (T4) ↔ app `http-client.ts` files (T12–T14); `HttpError.status`/`.error` (T3) ↔ façades (T13/T14).
