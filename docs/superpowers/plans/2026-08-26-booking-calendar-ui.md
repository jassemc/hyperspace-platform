# Booking Calendar UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the bookings page a calendar (day, week, month) alongside the table, a toggle between them, date-range filtering, and the CRM page's toolbar — with every time value resolved in the location's timezone rather than the browser's or the server's.

**Architecture:** Server components fetch; client components render. The calendar is a `BookingCalendarDto` fetched server-side and handed to a client grid, mirroring the existing `BookingTableSection` → `BookingTable` split. Both views read the same `searchParams`, so filters carry across the toggle. The slot maths is ported from `public-booking-page/lib/slots.ts` with the region taken out.

**Tech Stack:** Next 15.4 (App Router, server actions), React 19.1, Tailwind v4, TanStack Table 8, `date-fns@4`, `react-day-picker@10`, `sonner`. **No new dependencies.**

**Repo:** `hyperspace-platform` (all paths below are relative to it).

**Spec:** `docs/superpowers/specs/2026-08-26-booking-calendar-and-table-design.md`

**Depends on:** `docs/superpowers/plans/2026-08-26-booking-calendar-api.md` must be complete through its Task 8, so `lib/service/` exposes `getBookingCalendar` and `getBookingStats`. Verify before starting:

```bash
grep -n "getBookingCalendar\|getBookingStats" lib/service/index.ts
```

## Global Constraints

- **No region constants.** No file may contain `Africa/Tunis` or any other IANA zone. Timezone always arrives as data — `BookingCalendarDto.timezone`, or `LocationDto.timezone`. `formatDateTime` takes `timeZone` as a **required** parameter; a default is how a region creeps back in.
- **No new npm dependencies.** Everything needed is installed.
- **`lib/service/` is generated** — never hand-edit. Regenerate with `pnpm generate`.
- **Follow the CRM page.** `app/community/opportunities/` is the reference implementation of the reworked toolbar. When in doubt, copy its shape.
- **Defaults stay out of the URL** — the rule commented at `data-table.tsx:218`. Writing a default causes an extra navigation and a refetch on every plain arrival.
- **Theme-aware.** Every colour comes from a Tailwind token that resolves in both light and dark. No raw hex.
- **No test runner exists** in this repo and this plan does not add one. Every task ends with `pnpm exec tsc --noEmit && pnpm build`, plus a named manual check.
- **File references** use the `path:line` form in commit messages where they help a reviewer.
- **Commits:** conventional (`feat(booking): …`).

---

### Task 1: Port the slot maths, region-free; fix two adjacent defects

The foundation everything else stands on. The ported functions come from a site that serves one region and therefore hardcodes its timezone — that constant must not travel.

**Files:**
- Create: `lib/slots.ts`
- Modify: `lib/format.ts`
- Modify: `app/booking/bookings/columns.tsx:19-22`
- Modify: `app/dashboard/overview/attention-lists.tsx:22-25`
- Modify: `app/booking/bookings/add-booking-form.tsx:234`
- Modify: `app/booking/bookings/actions.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  // lib/slots.ts
  export interface Slot { startUtc: string; endUtc: string }
  export interface FreeRange { startMs: number; endMs: number }
  export function wallClockToUtcMs(date: string, hhmm: string, timeZone: string): number
  export function freeRangesForDay(
    day: { date: string; windows: { open: string; close: string }[] },
    busy: { startsAt: string; endsAt: string }[],
    nowMs: number,
    timeZone: string,
  ): FreeRange[]
  export function startOptionsForDuration(ranges: FreeRange[], durationMin: number): Slot[]
  export function durationChoices(minMin: number | null, maxMin: number | null): number[]

  // lib/format.ts
  export function formatDateTime(value: string | null | undefined, timeZone: string): string
  export function formatTimeOfDay(value: string | null | undefined, timeZone: string): string

  // app/booking/bookings/actions.ts — ActionState gains:
  //   problemType?: string
  //   status?: number
  ```

- [ ] **Step 1: Create `lib/slots.ts` with the timezone as a parameter**

```ts
/**
 * Free-slot maths. Windows are wall-clock strings ("08:00") in the
 * location's timezone; busy intervals are UTC instants. Everything is
 * normalised to UTC milliseconds here.
 *
 * Ported from public-booking-page/lib/slots.ts. That copy closes over a
 * BUSINESS_TZ constant, which is fine for a site serving one region and
 * wrong for an admin serving many — so every function here takes the
 * zone as an argument instead.
 */

export interface Slot {
  /** ISO instant. */
  startUtc: string
  endUtc: string
}

export interface FreeRange {
  startMs: number
  endMs: number
}

export interface DayWindows {
  date: string
  windows: { open: string; close: string }[]
}

export interface BusyInterval {
  startsAt: string
  endsAt: string
}

/** UTC offset (ms) of `timeZone` at a given instant. */
function tzOffsetMs(atUtcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(atUtcMs))

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second")
  )
  return asUtc - atUtcMs
}

/**
 * A wall-clock time on a date, in `timeZone`, as a UTC instant.
 *
 * Two passes: the offset is read at the naive instant, then re-read at
 * the corrected one. A single pass is wrong on DST transition days, and
 * silently so — the slot simply lands an hour out.
 */
export function wallClockToUtcMs(date: string, hhmm: string, timeZone: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  const naive = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    h,
    m
  )
  const guess = naive - tzOffsetMs(naive, timeZone)
  return naive - tzOffsetMs(guess, timeZone)
}

/** A day's open windows, minus busy intervals and minus the past. */
export function freeRangesForDay(
  day: DayWindows,
  busy: BusyInterval[],
  nowMs: number,
  timeZone: string
): FreeRange[] {
  let ranges: FreeRange[] = day.windows.map((w) => ({
    startMs: wallClockToUtcMs(day.date, w.open, timeZone),
    endMs: wallClockToUtcMs(day.date, w.close, timeZone),
  }))

  const sorted = busy
    .map((b) => ({ startMs: Date.parse(b.startsAt), endMs: Date.parse(b.endsAt) }))
    .sort((a, b) => a.startMs - b.startMs)

  for (const b of sorted) {
    ranges = ranges.flatMap((r) => {
      if (b.endMs <= r.startMs || b.startMs >= r.endMs) return [r]
      const pieces: FreeRange[] = []
      if (b.startMs > r.startMs) pieces.push({ startMs: r.startMs, endMs: b.startMs })
      if (b.endMs < r.endMs) pieces.push({ startMs: b.endMs, endMs: r.endMs })
      return pieces
    })
  }

  return ranges
    .map((r) => ({ startMs: Math.max(r.startMs, nowMs), endMs: r.endMs }))
    .filter((r) => r.endMs > r.startMs)
}

const STEP_MIN = 30

/** Bookable starts on a 30-minute grid that still fit `durationMin`. */
export function startOptionsForDuration(
  ranges: FreeRange[],
  durationMin: number
): Slot[] {
  const out: Slot[] = []
  const step = STEP_MIN * 60_000
  const dur = durationMin * 60_000
  for (const r of ranges) {
    let t = Math.ceil(r.startMs / step) * step
    if (t < r.startMs) t = r.startMs
    for (; t + dur <= r.endMs; t += step) {
      out.push({
        startUtc: new Date(t).toISOString(),
        endUtc: new Date(t + dur).toISOString(),
      })
    }
  }
  return out
}

/** Duration choices between the resource's bounds, on sensible steps. */
export function durationChoices(minMin: number | null, maxMin: number | null): number[] {
  const min = minMin ?? 60
  const max = maxMin ?? 480
  const out: number[] = []
  for (let d = min; d <= max; d += d < 120 ? 30 : 60) out.push(d)
  if (out[out.length - 1] !== max) out.push(max)
  return out
}
```

- [ ] **Step 2: Add the formatters to `lib/format.ts`**

```ts
/**
 * Date and time in a given zone. `timeZone` is required, not defaulted:
 * a default is how a single region creeps back into a multi-region
 * product. Callers take it from the location the value belongs to.
 */
export function formatDateTime(
    value: string | null | undefined,
    timeZone: string
): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

/** Just the clock time, for calendar axes and block labels. */
export function formatTimeOfDay(
    value: string | null | undefined,
    timeZone: string
): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(date)
}
```

- [ ] **Step 3: Replace the three copy-pasted local formatters**

Each of these currently calls bare `toLocaleString()`, which renders in whatever zone the process happens to be in.

In `app/booking/bookings/columns.tsx`, delete the local `formatDateTime` (lines 19-22) and take `timeZone` through `ColumnsProps`:

```ts
interface ColumnsProps {
  onEdit: (booking: BookingDto) => void
  timeZone: string
  resourceNames?: Record<string, string>
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
}
```

Import the shared one and pass the zone at each call: `formatDateTime(booking.startsAt, timeZone)`.

In `app/dashboard/overview/attention-lists.tsx`, delete the local `formatTime` (lines 22-25) and use `formatTimeOfDay(checkin.checkedInAt, timeZone)`; the dashboard already fetches locations, so thread the first location's `timezone` through, falling back to `"UTC"` when there are none.

- [ ] **Step 4: Thread the timezone into the table**

In `app/booking/bookings/table-section.tsx`, add `getListLocations` to the existing `Promise.all` and pass the zone down:

```ts
const locationPage = await getListLocations({ limit: 100, offset: 0, sort: "ASC" })
const locations = (locationPage?.results ?? []) as LocationDto[]
// Table rows may span locations; the column formatter needs one zone, so
// the first location wins. The calendar, which is per-location, uses the
// zone the API puts on its envelope instead.
const timeZone = locations[0]?.timezone ?? "UTC"
```

Pass `timeZone` to `<BookingTable>`, which passes it to `createColumns`.

- [ ] **Step 5: Fix the no-show checkbox (audit B5)**

`add-booking-form.tsx:234` offers "Mark as a no-show" for any booking not already flagged — including one that starts next week, which the API refuses with `422 no_show_before_start`. Change the condition:

```tsx
{editingBooking.status !== "no_show" &&
  new Date(editingBooking.startsAt) <= new Date() && (
```

- [ ] **Step 6: Keep the problem type on `ActionState` (audit P2)**

In `app/booking/bookings/actions.ts`, extend the state and read what the client runtime already carries:

```ts
export type ActionState = {
  success?: boolean
  error?: string
  /** RFC 9457 `type`, e.g. "booking_conflict" — so the UI can react, not just report. */
  problemType?: string
  status?: number
  quote?: unknown
}

/**
 * The generated client throws HttpError, which puts the problem's
 * `detail` on `.message` and keeps the whole payload on `.error`. Only
 * the message was being read, so a conflict was indistinguishable from a
 * validation failure and nothing could respond to it.
 */
function problem(error: unknown, fallback: string): ActionState {
  const http = error as { message?: string; status?: number; error?: { type?: string } }
  return {
    success: false,
    error: http?.message || fallback,
    problemType: http?.error?.type,
    status: http?.status,
  }
}
```

Replace every `catch` block's return in this file with `return problem(error, "Failed to create booking")` (and the equivalent message per action).

- [ ] **Step 7: Verify the build and types**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS. A type error on `formatDateTime` is the point — it means a call site had not thought about its timezone.

- [ ] **Step 8: Manual check**

```bash
pnpm dev
```

Open `/booking/bookings`. Confirm the **When** column still renders real dates rather than `-`. Then open a booking that starts in the future and confirm the "Mark as a no-show" checkbox is **absent**; open one that has already started and confirm it is present.

- [ ] **Step 9: Commit**

```bash
git add lib/slots.ts lib/format.ts app/booking/bookings app/dashboard/overview
git commit -m "feat(booking): port the slot maths with the region taken out

Every ported function takes timeZone as an argument rather than closing
over a constant, and formatDateTime requires it so the type checker
flags call sites that have not thought about it. Replaces three
copy-pasted toLocaleString helpers.

Also guards the no-show checkbox on start time, which the API refuses
with 422 no_show_before_start, and keeps the RFC 9457 type on
ActionState so the UI can react to a conflict rather than only report
it."
```

---

### Task 2: A date-range filter for the shared `DataTable`

`TableFilter` is a `<select>` with `options[]`; a date range does not fit that shape. **20 files import `DataTable`**, so the change must be strictly additive — an optional discriminant, defaulting to today's behaviour.

**Files:**
- Modify: `components/data-table.tsx:47-60` (types), `:389-...` (filter popover)
- Create: `components/ui/date-range-filter.tsx`

**Interfaces:**
- Consumes: `DateField` from `components/ui/date-field.tsx`.
- Produces:
  ```ts
  export interface TableSelectFilter {
    kind?: "select"
    key: string
    label: string
    value?: string
    options: TableFilterOption[]
  }
  export interface TableDateRangeFilter {
    kind: "dateRange"
    label: string
    fromKey: string
    toKey: string
    fromValue?: string
    toValue?: string
    /** Named shortcuts, e.g. "Last 7 days". Values are computed on click. */
    presets?: { label: string; days: number }[]
  }
  export type TableFilter = TableSelectFilter | TableDateRangeFilter
  ```

- [ ] **Step 1: Widen the filter type additively**

In `components/data-table.tsx`, replace the `TableFilter` interface:

```ts
/** A dropdown that narrows the list through its own URL param. */
export interface TableSelectFilter {
    /** Defaults to "select" so every existing call site is unchanged. */
    kind?: "select"
    /** The query-string key it owns, e.g. "interest". */
    key: string
    label: string
    value?: string
    options: TableFilterOption[]
}

/**
 * A from/to pair owning two URL params. The control writes ISO instants,
 * not date strings: the API takes instants and refuses to guess what a
 * "day" means, because the answer depends on where the reader is.
 */
export interface TableDateRangeFilter {
    kind: "dateRange"
    label: string
    fromKey: string
    toKey: string
    fromValue?: string
    toValue?: string
    presets?: { label: string; days: number }[]
}

export type TableFilter = TableSelectFilter | TableDateRangeFilter
```

- [ ] **Step 2: Verify the widening broke nothing**

Run: `pnpm exec tsc --noEmit`
Expected: PASS with no changes to any of the 20 call sites. **If any call site errors, the change was not additive — fix the type, not the call site.**

- [ ] **Step 3: Build the range control**

Create `components/ui/date-range-filter.tsx`:

```tsx
"use client"

import { DateField } from "@/components/ui/date-field"
import { Button } from "@/components/ui/button"

/**
 * Picks a local day range and emits UTC instants.
 *
 * The zone is the caller's: a location's when there is one in scope,
 * otherwise the reader's own browser zone. The server deliberately does
 * not decide this — an opportunity has no location, so "today" is the
 * today of whoever is looking.
 */
export interface DateRangeValue {
  fromIso?: string
  toIso?: string
}

function startOfLocalDay(day: string, timeZone: string): string {
  const [y, m, d] = day.split("-").map(Number)
  const naive = Date.UTC(y, m - 1, d)
  const offset = (at: number) =>
    at -
    Date.parse(
      new Intl.DateTimeFormat("sv-SE", {
        timeZone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23",
      })
        .format(new Date(at))
        .replace(" ", "T") + "Z"
    )
  // Two passes, so a DST transition day is not an hour out.
  const guess = naive + offset(naive)
  return new Date(naive + offset(guess)).toISOString()
}

/** Exclusive upper bound: the start of the day after `day`. */
function endOfLocalDay(day: string, timeZone: string): string {
  const [y, m, d] = day.split("-").map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  return startOfLocalDay(next, timeZone)
}

function isoToLocalDay(iso: string | undefined, timeZone: string): string {
  if (!iso) return ""
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

export function DateRangeFilter({
  label,
  fromValue,
  toValue,
  timeZone,
  presets = [],
  onChange,
}: Readonly<{
  label: string
  fromValue?: string
  toValue?: string
  timeZone: string
  presets?: { label: string; days: number }[]
  onChange: (value: DateRangeValue) => void
}>) {
  const fromDay = isoToLocalDay(fromValue, timeZone)
  const toDay = isoToLocalDay(toValue, timeZone)

  const applyPreset = (days: number) => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date())
    const start = new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000)
      .toISOString()
      .slice(0, 10)
    onChange({
      fromIso: startOfLocalDay(days === 0 ? today : start, timeZone),
      toIso: endOfLocalDay(today, timeZone),
    })
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <DateField
        name="from"
        value={fromDay}
        clearable
        placeholder="From"
        onChange={(day) =>
          onChange({
            fromIso: day ? startOfLocalDay(day, timeZone) : undefined,
            toIso: toValue,
          })
        }
      />
      <DateField
        name="to"
        value={toDay}
        clearable
        placeholder="To"
        onChange={(day) =>
          onChange({
            fromIso: fromValue,
            toIso: day ? endOfLocalDay(day, timeZone) : undefined,
          })
        }
      />
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Render it inside the filter popover**

In `components/data-table.tsx`, the popover currently maps every filter to a `<select>`. Branch on the discriminant:

```tsx
{filters.map((filter) =>
    filter.kind === "dateRange" ? (
        <DateRangeFilter
            key={`${filter.fromKey}-${filter.toKey}`}
            label={filter.label}
            fromValue={filter.fromValue}
            toValue={filter.toValue}
            timeZone={timeZone}
            presets={filter.presets}
            onChange={(value) => applyRange(filter, value)}
        />
    ) : (
        <div key={filter.key} className="grid gap-1.5">
            {/* the existing <select> block, unchanged */}
        </div>
    )
)}
```

Add the two-key writer beside `applyFilter`:

```tsx
    const applyRange = (
        filter: TableDateRangeFilter,
        value: { fromIso?: string; toIso?: string }
    ) => {
        const params = new URLSearchParams(searchParams.toString())
        for (const [key, next] of [
            [filter.fromKey, value.fromIso],
            [filter.toKey, value.toIso],
        ] as const) {
            if (next) {
                params.set(key, next)
            } else {
                params.delete(key)
            }
        }
        params.delete("page") // a narrower list starts at the first page
        startTransition(() => router.replace(`?${params.toString()}`))
    }
```

- [ ] **Step 5: Make the active-filter count understand ranges**

The badge on the Filters button counts `filters.filter((f) => Boolean(f.value))`, which is always false for a range. Replace:

```tsx
    const activeFilters = filters.filter((filter) =>
        filter.kind === "dateRange"
            ? Boolean(filter.fromValue || filter.toValue)
            : Boolean(filter.value)
    )
```

- [ ] **Step 6: Accept the timezone as a prop**

Add to `DataTableProps` and the signature, defaulting to the reader's own zone — the correct fallback when no location is in scope:

```ts
    /**
     * Zone in which a picked day is converted to instants. Pass the
     * location's when one is in scope; the reader's own is the right
     * answer when nothing is (an opportunity has no location).
     */
    timeZone?: string
```

```ts
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
```

- [ ] **Step 7: Clear ranges on "clear filters"**

`clearFilters()` already replaces the URL with a bare `pathname`, which drops every param including the range keys. No change needed — verify by reading it rather than assuming.

- [ ] **Step 8: Verify types and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS, with no edits to any of the other 19 `DataTable` call sites.

- [ ] **Step 9: Commit**

```bash
git add components/data-table.tsx components/ui/date-range-filter.tsx
git commit -m "feat(table): add a date-range filter to the shared toolbar

TableFilter gains an optional kind discriminant defaulting to \"select\",
so all 20 existing call sites are untouched. The control picks local
days and writes UTC instants, in the location's zone when one is in
scope and the reader's own when none is."
```

---

### Task 3: Bring the bookings table up to the CRM toolbar

Status tabs with counts, the filters whose params `table-section.tsx:32` has always read, working search, and stat cards from the database instead of the first hundred rows.

**Files:**
- Create: `app/booking/bookings/stats.ts`
- Modify: `app/booking/bookings/table-section.tsx`
- Modify: `app/booking/bookings/booking-table.tsx`
- Modify: `app/booking/bookings/section-cards.tsx`
- Modify: `app/booking/bookings/booking-status.ts`

**Interfaces:**
- Consumes: `TableDateRangeFilter` (Task 2), `timeZone` threading (Task 1).
- Produces:
  ```ts
  // app/booking/bookings/stats.ts
  export const bookingStats: (
    query: BookingStatsQuery,
  ) => Promise<BookingStatsDto | null>
  export interface BookingStatsQuery {
    q?: string; resourceId?: string; from?: string; to?: string
    source?: string; memberId?: string; companyId?: string
  }
  export function bookingTotals(stats: BookingStatsDto | null): {
    countFor: (status: string) => number | undefined
    total: number | undefined
  }
  ```

- [ ] **Step 1: Add the source vocabulary first**

Later steps in this task import these, so they exist before anything needs them.

In `app/booking/bookings/booking-status.ts`, beside the status constants:

```ts
import type { BookingSource } from "@/lib/service/HsService"

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
    portal: "Member portal",
    staff: "Staff",
    public: "Website",
}

export const BOOKING_SOURCE_VALUES = Object.keys(
    BOOKING_SOURCE_LABELS
) as BookingSource[]
```

- [ ] **Step 2: Add the memoised stats reader**

Create `app/booking/bookings/stats.ts`, following `app/community/opportunities/stats.ts` including its caching note:

```ts
import { cache } from "react"
import { getBookingStats } from "@/lib/service"
import type { BookingStatsDto } from "@/lib/service/HsService"

export interface BookingStatsQuery {
  q?: string
  resourceId?: string
  from?: string
  to?: string
  source?: string
  memberId?: string
  companyId?: string
}

/**
 * The tabs and the summary cards both want these counts. Memoised per
 * request, so rendering them side by side asks the API once. Always call
 * it with the argument: cache() keys on the argument list, and f() is not
 * f(undefined).
 */
export const bookingStats = cache(
  async (query: BookingStatsQuery): Promise<BookingStatsDto | null> => {
    try {
      return (await getBookingStats(query)) as BookingStatsDto
    } catch (error) {
      console.warn("Failed to load booking stats", error)
      return null
    }
  }
)

/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function bookingTotals(stats: BookingStatsDto | null) {
  const byStatus = new Map(
    (stats?.byStatus ?? []).map((row) => [row.status, row.count])
  )
  return {
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    total: stats?.total,
  }
}
```

- [ ] **Step 3: Feed the table section from it**

Rewrite `app/booking/bookings/table-section.tsx` to read the new params, pass them to both calls, and hand the stats down:

```ts
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)

  const status = asEnum<BookingStatus>(firstParam(params.status), BOOKING_STATUS_VALUES)
  const source = asEnum<BookingSource>(firstParam(params.source), BOOKING_SOURCE_VALUES)
  const resourceId = firstParam(params.resourceId)
  const from = firstParam(params.from)
  const to = firstParam(params.to)

  const statsQuery = { q, resourceId, from, to, source }

  const [response, stats] = await Promise.all([
    getListBookings({
      limit,
      offset,
      // Upcoming first: the oldest booking ever taken is not what staff
      // open this page to see.
      sort: "DESC",
      q,
      status,
      source,
      resourceId,
      from,
      to,
    }).catch((error) => {
      console.warn("Failed to load bookings", error)
      return null
    }),
    bookingStats(statsQuery),
  ])
```

Keep the existing lookup-name block; add `getListLocations` to it per Task 1 Step 4 and derive `timeZone`.

- [ ] **Step 4: Wire the toolbar in the client table**

In `app/booking/bookings/booking-table.tsx`, mirroring `opportunity-table.tsx`:

```tsx
  const totals = bookingTotals(stats)

  const filters: TableFilter[] = [
    {
      key: "resourceId",
      label: "Resource",
      value: activeResourceId,
      options: resources.map((resource) => ({
        value: resource.id,
        label: resource.name,
      })),
    },
    {
      key: "source",
      label: "Source",
      value: activeSource,
      options: (stats?.bySource ?? []).map((entry) => ({
        value: entry.source,
        label: formatEnumLabel(entry.source),
        count: entry.count,
      })),
    },
    {
      kind: "dateRange",
      label: "Dates",
      fromKey: "from",
      toKey: "to",
      fromValue: activeFrom,
      toValue: activeTo,
      presets: [
        { label: "Today", days: 0 },
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 },
      ],
    },
  ]
```

```tsx
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={`${activeStatus ?? "all"}-${activeResourceId ?? "any"}-${activeSource ?? "any"}-${activeFrom ?? ""}-${activeTo ?? ""}`}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        filters={filters}
        timeZone={timeZone}
        showStatusTabs={true}
        statusTabOptions={BOOKING_STATUS_TABS.map((tab) => ({
          ...tab,
          count: totals.countFor(tab.value),
        }))}
        statusAllCount={totals.total}
        serverSearch
        searchPlaceholder="Search title, notes or customer..."
      />
```

`BOOKING_STATUS_TABS` is at `booking-status.ts:19` and has been exported and unused since it was written — this is its first import.

- [ ] **Step 5: Rewrite the stat cards against the stats endpoint**

Replace the body of `app/booking/bookings/section-cards.tsx`. It must take the same search params as the table, or the cards describe a different set of rows than the ones below them:

```tsx
export async function SectionCards({
  searchParams,
}: Readonly<{ searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { q } = pageQuery(params)

  // Same argument list as the table's call, so cache() returns the very
  // same promise rather than issuing a second request.
  const stats = await bookingStats({
    q,
    resourceId: firstParam(params.resourceId),
    from: firstParam(params.from),
    to: firstParam(params.to),
    source: firstParam(params.source),
  })

  const totals = bookingTotals(stats)
  const count = (status: string) => totals.countFor(status) ?? 0

  return (
    <StatCards
      cards={[
        { label: "Total bookings", value: stats?.total ?? 0, badge: "All", icon: CalendarCheckIcon, footer: "Matching the current filters" },
        { label: "Pending", value: count("pending"), badge: "To confirm", icon: ClockIcon, footer: "Awaiting confirmation" },
        { label: "Cancelled", value: count("cancelled"), badge: "Released", icon: XCircleIcon, footer: "Slots freed again" },
        { label: "Booked value", value: formatPriceHt(stats?.bookedValueHt ?? 0), badge: "HT", icon: CoinsIcon, footer: "Credit-covered bookings count as zero" },
      ]}
    />
  )
}
```

Pass `searchParams` to `<SectionCards>` in `page.tsx`.

- [ ] **Step 6: Verify types and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 7: Manual check — the two things that silently lie**

```bash
pnpm dev
```

On `/booking/bookings`:

1. Click each status tab. The count in the tab must equal the row count the table reports. **Then apply a resource filter and check again** — if the counts do not move with the rows, `statsQuery` and the list query have drifted apart.
2. Type in the search box. Rows must narrow (this is the first time this box has ever done anything). Confirm the URL gains `?name=` and that reloading the page keeps the term.
3. Set a date range from the Filters popover and confirm the URL gains `from` and `to` as **ISO instants**, not `YYYY-MM-DD`.
4. Open the network tab and reload. There must be **one** `/bookings/stats` request, not two — that is `cache()` doing its job.

- [ ] **Step 8: Commit**

```bash
git add app/booking/bookings
git commit -m "feat(booking): bring the table up to the CRM toolbar

Status tabs with counts, resource/source/date-range filters, and server
search. BOOKING_STATUS_TABS has been exported and unused since it was
written (booking-status.ts:19); this is its first import, and the API
can finally filter by what it names.

Stat cards now come from GET /bookings/stats rather than counting the
first hundred rows, which were the *oldest* hundred because the list
sorted ascending. Sort now defaults to upcoming-first."
```

---

### Task 4: CRM created-date filter UI

The smallest use of Task 2's control, and the one where the browser-zone fallback is the correct answer rather than a compromise.

**Files:**
- Modify: `app/community/opportunities/table-section.tsx`
- Modify: `app/community/opportunities/opportunity-table.tsx`
- Modify: `app/community/opportunities/stats.ts`

**Interfaces:**
- Consumes: `TableDateRangeFilter` (Task 2).
- Produces: nothing consumed later.

- [ ] **Step 1: Read and forward the new params**

In `app/community/opportunities/table-section.tsx`:

```ts
  const createdFrom = firstParam(params.createdFrom)
  const createdTo = firstParam(params.createdTo)
```

Add both to the `getListOpportunities` call and to the `opportunityStats` call.

- [ ] **Step 2: Widen the memoised stats signature**

**CORRECTION (found during Task 3 — do NOT convert this to an options object).**
An earlier draft of this step said to replace the positional signature with a
single options object. That is wrong and would *break* the caching that works
today. React's `cache()` keys object arguments in a `WeakMap` **by reference**
and primitives in a `Map` **by value** — verified in
`node_modules/react/cjs/react.react-server.development.js`, inside
`exports.cache`. Two structurally identical object literals from two server
components are two distinct cache keys, so an options object guarantees a
cache miss and a duplicate request.

Keep the positional signature and add the two new bounds as further positional
primitives:

```ts
export const opportunityStats = cache(
  async (
    q: string | undefined,
    interest: OpportunityInterest | undefined,
    createdFrom: string | undefined,
    createdTo: string | undefined
  ): Promise<OpportunityStatsDto | null> => {
    try {
      return (await getOpportunityStats({
        q, interest, createdFrom, createdTo,
      })) as OpportunityStatsDto
    } catch (error) {
      console.warn("Failed to load opportunity stats", error)
      return null
    }
  }
)
```

The object is built *inside* the memoised function, where its identity no
longer matters — only the four primitives crossing the `cache()` boundary do.

Update both call sites — `table-section.tsx` and `section-cards.tsx` — to pass the same four values **positionally, in the same order**. Primitives compare by value, so identical arguments genuinely share one cache entry.

- [ ] **Step 3: Add the filter**

In `app/community/opportunities/opportunity-table.tsx`, append to the existing `filters` array:

```ts
    {
      kind: "dateRange",
      label: "Created",
      fromKey: "createdFrom",
      toKey: "createdTo",
      fromValue: activeCreatedFrom,
      toValue: activeCreatedTo,
      presets: [
        { label: "Today", days: 0 },
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 },
      ],
    },
```

Add both values to the remount `key`. Do **not** pass `timeZone`: an opportunity has no location, so the reader's own zone — the `DataTable` default — is the right answer.

- [ ] **Step 4: Verify types and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 5: Manual check**

On `/community/opportunities`, apply **Today** from the Created filter. Confirm the rows narrow, the stage tab counts narrow with them, and the URL carries ISO instants. A count that does not move means Step 1 forwarded the params to the list but not to the stats.

- [ ] **Step 6: Commit**

```bash
git add app/community/opportunities
git commit -m "feat(crm): filter opportunities by when they were created

Applied to the list and the stats together, so the stage tab counts keep
labelling the rows on screen. The picked day is converted in the
reader's own timezone, because an opportunity has no location to borrow
one from."
```

---

### Task 5: The view toggle and the calendar's data

The shell: a toggle in the URL, and a server component that fetches the grid. No grid rendering yet — that lands in Task 6, so this task's deliverable is independently reviewable.

**Files:**
- Modify: `app/booking/bookings/page.tsx`
- Create: `app/booking/bookings/view-toggle.tsx`
- Create: `app/booking/bookings/calendar-section.tsx`
- Create: `components/booking/calendar/types.ts`

**Interfaces:**
- Consumes: `getBookingCalendar` from the regenerated client.
- Produces:
  ```ts
  // components/booking/calendar/types.ts
  export type CalendarView = "day" | "week" | "month"
  export interface CalendarViewState {
    view: CalendarView
    /** Anchor day, YYYY-MM-DD in the grid's timezone. */
    date: string
    resourceTypeId?: string
    /** Narrows the week view to one room. */
    resourceId?: string
    locationId?: string
  }
  export function rangeFor(state: CalendarViewState, timeZone: string): { from: string; to: string }
  export function weekStartOf(date: string): string
  export function addDays(date: string, days: number): string
  ```

- [ ] **Step 1: Define the view state and its range**

Create `components/booking/calendar/types.ts`:

```ts
import { wallClockToUtcMs } from "@/lib/slots"

export type CalendarView = "day" | "week" | "month"

export interface CalendarViewState {
  view: CalendarView
  /** Anchor day, YYYY-MM-DD in the grid's timezone. */
  date: string
  resourceTypeId?: string
  /** Narrows the week view to one room. */
  resourceId?: string
  locationId?: string
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Monday of the week containing `date`. */
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  const shift = (d.getUTCDay() + 6) % 7
  return addDays(date, -shift)
}

/**
 * The instants a view covers, bounded in the grid's own timezone — never
 * in the reader's. Month is clamped to 31 days, which is also the API's
 * ceiling.
 */
export function rangeFor(
  state: CalendarViewState,
  timeZone: string
): { from: string; to: string } {
  const startDay =
    state.view === "day"
      ? state.date
      : state.view === "week"
        ? weekStartOf(state.date)
        : `${state.date.slice(0, 7)}-01`

  const span = state.view === "day" ? 1 : state.view === "week" ? 7 : 31

  return {
    from: new Date(wallClockToUtcMs(startDay, "00:00", timeZone)).toISOString(),
    to: new Date(
      wallClockToUtcMs(addDays(startDay, span), "00:00", timeZone)
    ).toISOString(),
  }
}
```

- [ ] **Step 2: Build the toggle**

Create `app/booking/bookings/view-toggle.tsx`:

```tsx
"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { CalendarDays, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Table is the default, so `view` is absent for it — the same
 * defaults-stay-out-of-the-URL rule the table's pagination follows
 * (data-table.tsx:218). Both views read the same params, so filters
 * survive the switch.
 */
export function ViewToggle() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const view = searchParams.get("view") === "calendar" ? "calendar" : "table"

  const select = (next: "table" | "calendar") => {
    if (next === view) return
    const params = new URLSearchParams(searchParams.toString())
    if (next === "calendar") {
      params.set("view", "calendar")
    } else {
      params.delete("view")
    }
    params.delete("page") // the calendar has no pages
    const query = params.toString()
    startTransition(() => router.replace(query ? `?${query}` : pathname))
  }

  return (
    <div
      className="inline-flex items-center rounded-md border p-0.5"
      role="group"
      aria-label="View"
    >
      {(
        [
          { value: "table", label: "Table", Icon: Table2 },
          { value: "calendar", label: "Calendar", Icon: CalendarDays },
        ] as const
      ).map(({ value, label, Icon }) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          aria-pressed={view === value}
          onClick={() => select(value)}
          className={cn(
            "h-8 gap-2 px-3",
            view === value && "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Fetch the calendar server-side**

Create `app/booking/bookings/calendar-section.tsx`:

```tsx
import { getBookingCalendar } from "@/lib/service"
import type { BookingCalendarDto } from "@/lib/service/HsService"
import { firstParam, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { rangeFor, type CalendarView } from "@/components/booking/calendar/types"

function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export async function BookingCalendarSection({
  searchParams,
  timeZone,
}: Readonly<{ searchParams?: SearchParamsInput; timeZone: string }>) {
  const params = await resolveSearchParams(searchParams)

  const view = (firstParam(params.calendarView) ?? "day") as CalendarView
  const date = firstParam(params.date) ?? todayIn(timeZone)
  const state = {
    view,
    date,
    resourceTypeId: firstParam(params.resourceTypeId),
    locationId: firstParam(params.locationId),
  }

  // Bounded in the grid's zone, not the reader's — the whole point of
  // carrying a timezone rather than assuming one.
  const { from, to } = rangeFor(state, timeZone)

  let calendar: BookingCalendarDto | null = null
  let error: string | null = null

  try {
    calendar = (await getBookingCalendar({
      from,
      to,
      resourceTypeId: state.resourceTypeId,
      locationId: state.locationId,
    })) as BookingCalendarDto
  } catch (cause) {
    // A room set spanning timezones is refused rather than drawn wrong;
    // say so instead of showing an empty grid.
    const problem = cause as { error?: { type?: string }; message?: string }
    error =
      problem?.error?.type === "mixed_location_calendar"
        ? "This selection spans more than one location. Pick a location to see its calendar."
        : (problem?.message ?? "The calendar could not be loaded.")
    console.warn("Failed to load booking calendar", cause)
  }

  if (error) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  return <CalendarViews calendar={calendar!} state={state} />
}
```

`CalendarViews` does not exist yet — Task 6 creates it. For this task, render a placeholder that proves the fetch works, and replace it in Task 6:

```tsx
  return (
    <pre className="mx-4 overflow-x-auto rounded-md border p-4 text-xs">
      {JSON.stringify(
        { timezone: calendar?.timezone, rooms: calendar?.resources.length },
        null,
        2
      )}
    </pre>
  )
```

- [ ] **Step 4: Branch the page on the view**

Rewrite `app/booking/bookings/page.tsx`:

```tsx
export default async function BookingsPage({
    searchParams,
}: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
    const resolvedSearchParams = await searchParams
    const isCalendar = firstParam(resolvedSearchParams?.view) === "calendar"
    const timeZone = await primaryTimeZone()

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between py-4 px-4 mb-8">
                <h1 className="text-4xl font-semibold">Bookings</h1>
                <div className="flex items-center gap-3">
                    <ViewToggle />
                    <AddBookingButton />
                </div>
            </div>
            {/* The cards describe the filtered set in both views. */}
            <SectionCards searchParams={resolvedSearchParams} />
            {isCalendar ? (
                <Suspense fallback={<CalendarSkeleton />}>
                    <BookingCalendarSection
                        searchParams={resolvedSearchParams}
                        timeZone={timeZone}
                    />
                </Suspense>
            ) : (
                <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
                    <BookingTableSection searchParams={resolvedSearchParams} />
                </Suspense>
            )}
        </div>
    )
}
```

Add `primaryTimeZone()` to `lib/locations.ts` (create it), memoised so the page and the table share one read:

```ts
import { cache } from "react"
import { getListLocations } from "@/lib/service"
import type { LocationDto } from "@/lib/service/HsService"

/**
 * The zone the page's clock is drawn in. One location is the common
 * case; when there are several the first wins, and the calendar's own
 * envelope timezone overrides it for the grid.
 */
export const primaryTimeZone = cache(async (): Promise<string> => {
  try {
    const page = await getListLocations({ limit: 1, offset: 0, sort: "ASC" })
    return ((page?.results ?? []) as LocationDto[])[0]?.timezone ?? "UTC"
  } catch {
    return "UTC"
  }
})
```

Create `components/booking/calendar/calendar-skeleton.tsx` so the toggle does not collapse the page while the grid loads:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function CalendarSkeleton() {
  return (
    <div className="mx-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-md" />
    </div>
  )
}
```

- [ ] **Step 5: Verify types and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 6: Manual check**

```bash
pnpm dev
```

1. Toggle to Calendar. The URL gains `?view=calendar`; the placeholder shows the location's real timezone and a room count.
2. Toggle back. `view` **disappears** from the URL rather than becoming `view=table`.
3. Apply a status filter in Table view, then toggle to Calendar and back — the filter survives both switches.
4. Reload on `?view=calendar` — it stays on the calendar.

- [ ] **Step 7: Commit**

```bash
git add app/booking/bookings components/booking lib/locations.ts
git commit -m "feat(booking): add the calendar/table toggle and the calendar fetch

The view lives in the URL so it survives a reload and can be linked, and
both views read the same searchParams so filters carry across. The range
is bounded in the grid's timezone, which the API puts on the envelope."
```

---

### Task 6: The day grid

The primary view: hours down the side, rooms as scrollable columns with photo-card headers, three cell states, click-empty-to-book.

**Files:**
- Create: `components/booking/calendar/resource-day-grid.tsx`
- Create: `components/booking/calendar/room-header-card.tsx`
- Create: `components/booking/calendar/calendar-toolbar.tsx`
- Create: `components/booking/calendar/calendar-views.tsx`
- Modify: `app/booking/bookings/calendar-section.tsx` (drop the placeholder)

**Interfaces:**
- Consumes: `BookingCalendarDto`, `rangeFor`, `formatTimeOfDay`, `wallClockToUtcMs`.
- Produces:
  ```ts
  export function CalendarViews(props: {
    calendar: BookingCalendarDto
    state: CalendarViewState
  }): JSX.Element
  export function ResourceDayGrid(props: {
    calendar: BookingCalendarDto
    date: string
    timeRange?: { from: string; to: string }
    vacantOnly?: boolean
    onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
  }): JSX.Element
  ```

- [ ] **Step 1: Build the room header card**

Create `components/booking/calendar/room-header-card.tsx`:

```tsx
"use client"

import { Users } from "lucide-react"
import type { CalendarResourceSummaryDto } from "@/lib/service/HsService"

/**
 * The column header: what the room *is*, not just its name. Everything
 * here already rides on the calendar payload, so picking a room by
 * capacity or kit costs no extra request.
 */
export function RoomHeaderCard({
  resource,
}: Readonly<{ resource: CalendarResourceSummaryDto }>) {
  return (
    <div className="flex w-40 shrink-0 flex-col gap-2 p-2">
      <div className="h-20 w-full overflow-hidden rounded-md bg-muted">
        {resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{resource.name}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {resource.amenities.length}{" "}
            {resource.amenities.length === 1 ? "amenity" : "amenities"}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {resource.capacity}
          </span>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build the day grid**

Create `components/booking/calendar/resource-day-grid.tsx`:

```tsx
"use client"

import { useMemo } from "react"
import type {
  BookingCalendarDto,
  CalendarBlockDto,
  CalendarResourceDto,
} from "@/lib/service/HsService"
import { formatTimeOfDay } from "@/lib/format"
import { wallClockToUtcMs } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { RoomHeaderCard } from "./room-header-card"

/** Pixels per hour. Tall enough that a 30-minute block is still legible. */
const HOUR_PX = 56
const SLOT_MIN = 30

interface DayGridProps {
  calendar: BookingCalendarDto
  date: string
  vacantOnly?: boolean
  /** Wall-clock narrowing, e.g. { from: "09:00", to: "10:00" }. */
  timeRange?: { from: string; to: string }
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
}

export function ResourceDayGrid({
  calendar,
  date,
  vacantOnly = false,
  timeRange,
  onPickSlot,
}: Readonly<DayGridProps>) {
  const tz = calendar.timezone

  // The axis spans the union of every room's windows that day, so a room
  // opening early does not push every other column off the grid.
  const axis = useMemo(() => {
    const opens: number[] = []
    const closes: number[] = []
    for (const entry of calendar.resources) {
      const day = entry.days.find((d) => d.date === date)
      for (const w of day?.windows ?? []) {
        opens.push(wallClockToUtcMs(date, w.open, tz))
        closes.push(wallClockToUtcMs(date, w.close, tz))
      }
    }
    if (opens.length === 0) return null
    return { startMs: Math.min(...opens), endMs: Math.max(...closes) }
  }, [calendar, date, tz])

  const visible = useMemo(() => {
    if (!vacantOnly || !timeRange || !axis) return calendar.resources
    const fromMs = wallClockToUtcMs(date, timeRange.from, tz)
    const toMs = wallClockToUtcMs(date, timeRange.to, tz)
    return calendar.resources.filter(
      (entry) =>
        !entry.blocks.some(
          (b) => Date.parse(b.startsAt) < toMs && Date.parse(b.endsAt) > fromMs
        )
    )
  }, [calendar.resources, vacantOnly, timeRange, date, tz, axis])

  if (!axis) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No room is open on this day.
      </div>
    )
  }

  const totalHours = (axis.endMs - axis.startMs) / 3_600_000
  const height = totalHours * HOUR_PX
  const topFor = (ms: number) => ((ms - axis.startMs) / 3_600_000) * HOUR_PX

  const hourTicks: number[] = []
  for (let t = axis.startMs; t <= axis.endMs; t += 3_600_000) hourTicks.push(t)

  return (
    <div className="mx-4 overflow-x-auto rounded-md border">
      <div className="flex min-w-max">
        {/* Hour gutter */}
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r bg-background">
          <div className="h-[104px] border-b" />
          <div className="relative" style={{ height }}>
            {hourTicks.map((t) => (
              <div
                key={t}
                className="absolute -translate-y-1/2 pr-2 text-right text-xs text-muted-foreground tabular-nums w-full"
                style={{ top: topFor(t) }}
              >
                {formatTimeOfDay(new Date(t).toISOString(), tz)}
              </div>
            ))}
          </div>
        </div>

        {visible.map((entry) => (
          <RoomColumn
            key={entry.resource.id}
            entry={entry}
            date={date}
            tz={tz}
            axis={axis}
            height={height}
            topFor={topFor}
            onPickSlot={onPickSlot}
          />
        ))}
      </div>
    </div>
  )
}

function RoomColumn({
  entry,
  date,
  tz,
  axis,
  height,
  topFor,
  onPickSlot,
}: Readonly<{
  entry: CalendarResourceDto
  date: string
  tz: string
  axis: { startMs: number; endMs: number }
  height: number
  topFor: (ms: number) => number
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
}>) {
  const day = entry.days.find((d) => d.date === date)
  const windows = (day?.windows ?? []).map((w) => ({
    startMs: wallClockToUtcMs(date, w.open, tz),
    endMs: wallClockToUtcMs(date, w.close, tz),
  }))

  // Clickable half-hour slots inside the open windows.
  const slots: { startMs: number; endMs: number }[] = []
  const step = SLOT_MIN * 60_000
  for (const w of windows) {
    for (let t = w.startMs; t + step <= w.endMs; t += step) {
      slots.push({ startMs: t, endMs: t + step })
    }
  }

  const isBusy = (startMs: number, endMs: number) =>
    entry.blocks.some(
      (b) => Date.parse(b.startsAt) < endMs && Date.parse(b.endsAt) > startMs
    )

  const minDuration = entry.resource.minDurationMin ?? SLOT_MIN

  return (
    <div className="w-40 shrink-0 border-r last:border-r-0">
      <div className="h-[104px] border-b">
        <RoomHeaderCard resource={entry.resource} />
      </div>

      <div className="relative bg-muted/40" style={{ height }}>
        {/* Open windows read as available ground. */}
        {windows.map((w) => (
          <div
            key={w.startMs}
            className="absolute inset-x-0 bg-background"
            style={{ top: topFor(w.startMs), height: topFor(w.endMs) - topFor(w.startMs) }}
          />
        ))}

        {/* Free half-hours: clickable, and the only way to start a booking. */}
        {slots
          .filter((s) => !isBusy(s.startMs, s.endMs))
          .map((s) => (
            <button
              key={s.startMs}
              type="button"
              className="absolute inset-x-0 border-b border-dashed border-border/60 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              style={{ top: topFor(s.startMs), height: topFor(s.endMs) - topFor(s.startMs) }}
              onClick={() =>
                onPickSlot(
                  entry.resource.id,
                  new Date(s.startMs).toISOString(),
                  new Date(s.startMs + minDuration * 60_000).toISOString()
                )
              }
            >
              <span className="sr-only">
                Book {entry.resource.name} at {formatTimeOfDay(new Date(s.startMs).toISOString(), tz)}
              </span>
            </button>
          ))}

        {/* Bookings. Pending is drawn differently because it does NOT hold
            the slot — several may legitimately overlap. */}
        {entry.blocks.map((block) => (
          <BlockChip
            key={block.bookingId}
            block={block}
            tz={tz}
            top={topFor(Math.max(Date.parse(block.startsAt), axis.startMs))}
            height={
              topFor(Math.min(Date.parse(block.endsAt), axis.endMs)) -
              topFor(Math.max(Date.parse(block.startsAt), axis.startMs))
            }
          />
        ))}
      </div>
    </div>
  )
}

function BlockChip({
  block,
  tz,
  top,
  height,
}: Readonly<{ block: CalendarBlockDto; tz: string; top: number; height: number }>) {
  const pending = block.status === "pending"
  return (
    <div
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-xs",
        pending
          ? "border-dashed border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100"
          : "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
      )}
      style={{ top, height: Math.max(height, 18) }}
      title={`${block.title ?? "Untitled"} — ${block.customerName ?? "No customer"}`}
    >
      <p className="truncate font-medium">
        {block.title || block.customerName || "Untitled"}
      </p>
      <p className="truncate opacity-80 tabular-nums">
        {formatTimeOfDay(block.startsAt, tz)}–{formatTimeOfDay(block.endsAt, tz)}
        {pending ? " · pending" : ""}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Build the toolbar**

Create `components/booking/calendar/calendar-toolbar.tsx` with: `Today`, `‹`/`›`, the current date (a `DateField`), a wall-clock `from`→`to` pair of `<input type="time">`, a **Vacant only** toggle, and the resource-type tabs. Date and type write to the URL (`date`, `resourceTypeId`); the time range and Vacant-only are **client state**, because the payload already holds the whole day and re-narrowing it needs no request.

```tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"

export function CalendarToolbar({
  date,
  view,
  timeRange,
  vacantOnly,
  onTimeRangeChange,
  onVacantOnlyChange,
}: Readonly<{
  date: string
  /** Drives the step size of the arrows; Task 7 adds the view switch. */
  view: CalendarView
  timeRange: { from: string; to: string }
  vacantOnly: boolean
  onTimeRangeChange: (value: { from: string; to: string }) => void
  onVacantOnlyChange: (value: boolean) => void
}>) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const goTo = (nextDate: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", nextDate)
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  const shift = (days: number) => {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    goTo(d.toISOString().slice(0, 10))
  }

  return (
    <div className="mx-4 mb-3 flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" disabled={isPending}
        onClick={() => goTo(new Date().toISOString().slice(0, 10))}>
        Today
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(-1)} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(1)} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-48">
        <DateField name="date" value={date} onChange={goTo} />
      </div>

      {/* Client-side: the payload already holds the whole day. */}
      <div className="flex items-center gap-2 text-sm">
        <input type="time" value={timeRange.from} aria-label="From"
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          onChange={(e) => onTimeRangeChange({ ...timeRange, from: e.target.value })} />
        <span aria-hidden="true">→</span>
        <input type="time" value={timeRange.to} aria-label="To"
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          onChange={(e) => onTimeRangeChange({ ...timeRange, to: e.target.value })} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={vacantOnly} className="h-4 w-4 rounded border-input"
          onChange={(e) => onVacantOnlyChange(e.target.checked)} />
        Vacant only
      </label>
    </div>
  )
}
```

- [ ] **Step 3b: Add the resource-type tabs**

Without these, `resourceTypeId` is a param the fetch reads and nothing ever writes — exactly the dead-filter shape this work exists to remove.

Create `components/booking/calendar/resource-type-tabs.tsx`:

```tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ResourceTypeDto } from "@/lib/service/HsService"

/**
 * Scopes the grid to one kind of room. "All" is the default, so it is
 * absent from the URL rather than written as a value.
 */
export function ResourceTypeTabs({
  types,
  activeTypeId,
}: Readonly<{ types: ResourceTypeDto[]; activeTypeId?: string }>) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (types.length === 0) return null

  return (
    <div className="mx-4 mb-3 border-b">
      <Tabs
        value={activeTypeId ?? "all"}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString())
          if (value === "all") {
            params.delete("resourceTypeId")
          } else {
            params.set("resourceTypeId", value)
          }
          startTransition(() => router.replace(`?${params.toString()}`))
        }}
      >
        <TabsList variant="line" className="max-w-full overflow-x-auto border-b-0">
          <TabsTrigger value="all" disabled={isPending}>
            All rooms
          </TabsTrigger>
          {types.map((type) => (
            <TabsTrigger key={type.id} value={type.id} disabled={isPending}>
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
```

Fetch the types server-side in `app/booking/bookings/calendar-section.tsx`, filtered to the bookable ones — `canBook` is the flag, not `bookingMode`, which describes pricing rather than whether a thing can be booked at all:

```ts
  const typePage = await getListResourceTypes({
    limit: 100, offset: 0, sort: "ASC",
  }).catch(() => null)
  const bookableTypes = ((typePage?.results ?? []) as ResourceTypeDto[]).filter(
    (type) => type.canBook
  )
```

Pass `bookableTypes` into `CalendarViews` and render `<ResourceTypeTabs types={bookableTypes} activeTypeId={state.resourceTypeId} />` above the toolbar.

- [ ] **Step 4: Compose the views and wire click-to-book**

Create `components/booking/calendar/calendar-views.tsx`, holding the client state and opening the existing drawer prefilled:

```tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { BookingCalendarDto, ResourceTypeDto } from "@/lib/service/HsService"
import { AddBookingForm } from "@/app/booking/bookings/add-booking-form"
import { CalendarToolbar } from "./calendar-toolbar"
import { ResourceTypeTabs } from "./resource-type-tabs"
import { ResourceDayGrid } from "./resource-day-grid"
import type { CalendarViewState } from "./types"

interface Prefill {
  resourceId: string
  startsAt: string
  endsAt: string
}

export function CalendarViews({
  calendar,
  state,
  bookableTypes,
}: Readonly<{
  calendar: BookingCalendarDto
  state: CalendarViewState
  bookableTypes: ResourceTypeDto[]
}>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [timeRange, setTimeRange] = useState({ from: "09:00", to: "10:00" })
  const [vacantOnly, setVacantOnly] = useState(false)
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  const pick = (resourceId: string, startsAt: string, endsAt: string) =>
    setPrefill({ resourceId, startsAt, endsAt })

  return (
    <>
      <ResourceTypeTabs types={bookableTypes} activeTypeId={state.resourceTypeId} />
      <CalendarToolbar
        date={state.date}
        view={state.view}
        timeRange={timeRange}
        vacantOnly={vacantOnly}
        onTimeRangeChange={setTimeRange}
        onVacantOnlyChange={setVacantOnly}
      />
      {state.view === "day" && (
        <ResourceDayGrid
          calendar={calendar}
          date={state.date}
          vacantOnly={vacantOnly}
          timeRange={timeRange}
          onPickSlot={pick}
        />
      )}
      {/* Tasks 7 and 8 add the week and month branches here. */}
      {prefill && (
        <AddBookingForm
          key={`${prefill.resourceId}-${prefill.startsAt}`}
          isOpen
          onClose={() => setPrefill(null)}
          prefill={prefill}
          timeZone={calendar.timezone}
        />
      )}
    </>
  )
}
```

`router` and `searchParams` are unused until Task 8's month branch navigates with them — declare them now so that task adds a branch rather than rewriting the component's head.

Add optional `prefill` and `timeZone` props to `AddBookingForm` that seed `resourceId` and the two datetime inputs:

```tsx
interface AddBookingFormProps {
  isOpen: boolean
  onClose: () => void
  editingBooking?: BookingDto | null
  resources?: ResourceDto[]
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
  /** Set when opened from a calendar cell. */
  prefill?: { resourceId: string; startsAt: string; endsAt: string }
  /** Zone the datetime-local inputs are written in. Required with prefill. */
  timeZone?: string
}
```

The inputs are `datetime-local`, so convert the instants to the **grid's** wall clock, not the browser's:

```tsx
function toLocalInput(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso))
  return parts.replace(" ", "T")
}
```

- [ ] **Step 5: Replace the placeholder**

In `app/booking/bookings/calendar-section.tsx`, swap the `<pre>` for `<CalendarViews calendar={calendar!} state={state} />`.

- [ ] **Step 6: Verify types and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 7: Manual check — the failures that look fine**

Seed a booking at **09:00 local** in a location whose timezone is **not** your machine's (e.g. set the location to `America/New_York` while your laptop is on European time). Then on `?view=calendar`:

1. The 09:00 booking sits at the **09:00** gridline. If it is offset by hours, a `new Date()` has crept in where `wallClockToUtcMs` belongs.
2. Create two **pending** bookings on one room at the same time. Both render, dashed and amber, distinct from confirmed. This is legal — the exclusion constraint covers only confirmed rows.
3. Hours outside a room's window are grey; hours inside are white and clickable.
4. Click an empty half-hour. The drawer opens with that room selected and the start time matching the cell you clicked **in the grid's timezone**.
5. Set the time range to `09:00`→`10:00` and tick **Vacant only**. Rooms busy in that hour disappear; nothing refetches (watch the network tab).

- [ ] **Step 8: Commit**

```bash
git add components/booking/calendar app/booking/bookings
git commit -m "feat(booking): add the day grid

Hours down the side, rooms as scrollable columns with photo-card
headers, and three states: open, booked, outside hours. Clicking a free
half-hour opens the drawer prefilled.

Pending blocks are drawn dashed rather than solid because they do not
hold the slot — the exclusion constraint covers confirmed rows only, so
several pending requests on one slot are legal and staff need to see
them competing.

All positioning goes through wallClockToUtcMs with the grid's timezone;
nothing reads the browser clock."
```

---

### Task 7: The week grid

**Files:**
- Create: `components/booking/calendar/week-grid.tsx`
- Modify: `components/booking/calendar/calendar-views.tsx`
- Modify: `components/booking/calendar/calendar-toolbar.tsx`

**Interfaces:**
- Consumes: the same `BookingCalendarDto`; `rangeFor` already returns a 7-day range for `view: "week"`.
- Produces:
  ```ts
  export function WeekGrid(props: {
    calendar: BookingCalendarDto
    weekStartDate: string
    resourceId?: string
    onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
  }): JSX.Element
  ```

- [ ] **Step 1: Add the view switch to the toolbar**

Add a three-way segmented control writing `?calendarView=day|week|month`. Day is the default, so it is **absent** from the URL:

```tsx
      <div className="inline-flex items-center rounded-md border p-0.5">
        {(["day", "week", "month"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={view === value}
            className={cn("h-8 px-3 capitalize", view === value && "bg-accent")}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              if (value === "day") {
                params.delete("calendarView")
              } else {
                params.set("calendarView", value)
              }
              startTransition(() => router.replace(`?${params.toString()}`))
            }}
          >
            {value}
          </Button>
        ))}
      </div>
```

Also make `‹`/`›` step by the view's span — 1 day, 7 days, or a month — rather than always one day.

- [ ] **Step 2: Build the week grid**

Create `components/booking/calendar/week-grid.tsx`. Days are columns, hours are rows — the same axis maths as the day grid, but the column key is a date rather than a room:

```tsx
"use client"

import { useMemo } from "react"
import type { BookingCalendarDto } from "@/lib/service/HsService"
import { formatTimeOfDay } from "@/lib/format"
import { wallClockToUtcMs } from "@/lib/slots"
import { cn } from "@/lib/utils"

const HOUR_PX = 48
const SLOT_MIN = 30

/**
 * One week. With a resource filter it is that room's week; without one
 * every room's bookings are stacked per day, which answers "how busy is
 * Thursday" rather than "which room is free".
 */
export function WeekGrid({
  calendar,
  weekStartDate,
  resourceId,
  onPickSlot,
}: Readonly<{
  calendar: BookingCalendarDto
  weekStartDate: string
  resourceId?: string
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
}>) {
  const tz = calendar.timezone
  const rooms = resourceId
    ? calendar.resources.filter((r) => r.resource.id === resourceId)
    : calendar.resources

  const days = useMemo(() => {
    const out: string[] = []
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(`${weekStartDate}T00:00:00Z`)
      d.setUTCDate(d.getUTCDate() + i)
      out.push(d.toISOString().slice(0, 10))
    }
    return out
  }, [weekStartDate])

  const axis = useMemo(() => {
    const opens: number[] = []
    const closes: number[] = []
    for (const entry of rooms) {
      for (const day of entry.days) {
        for (const w of day.windows) {
          opens.push(wallClockToUtcMs(day.date, w.open, tz))
          closes.push(wallClockToUtcMs(day.date, w.close, tz))
        }
      }
    }
    if (opens.length === 0) return null
    // Reduce each instant to its wall-clock hour so all seven days share
    // one vertical axis.
    const hourOf = (ms: number) =>
      Number(formatTimeOfDay(new Date(ms).toISOString(), tz).slice(0, 2))
    return { startHour: Math.min(...opens.map(hourOf)), endHour: Math.max(...closes.map(hourOf)) }
  }, [rooms, tz])

  if (!axis) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No room is open this week.
      </div>
    )
  }

  const height = (axis.endHour - axis.startHour) * HOUR_PX
  const topForHhmm = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number)
    return (h - axis.startHour + m / 60) * HOUR_PX
  }

  return (
    <div className="mx-4 overflow-x-auto rounded-md border">
      <div className="flex min-w-max">
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r bg-background">
          <div className="h-10 border-b" />
          <div className="relative" style={{ height }}>
            {Array.from({ length: axis.endHour - axis.startHour + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute -translate-y-1/2 w-full pr-2 text-right text-xs text-muted-foreground tabular-nums"
                style={{ top: i * HOUR_PX }}
              >
                {String(axis.startHour + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {days.map((date) => {
          const blocks = rooms.flatMap((entry) =>
            entry.blocks
              .filter(
                (b) =>
                  new Intl.DateTimeFormat("en-CA", {
                    timeZone: tz,
                    year: "numeric", month: "2-digit", day: "2-digit",
                  }).format(new Date(b.startsAt)) === date
              )
              .map((b) => ({ ...b, roomName: entry.resource.name }))
          )

          return (
            <div key={date} className="w-40 shrink-0 border-r last:border-r-0">
              <div className="flex h-10 items-center justify-center border-b text-sm font-medium">
                {new Intl.DateTimeFormat("en-GB", {
                  timeZone: tz, weekday: "short", day: "numeric",
                }).format(new Date(`${date}T12:00:00Z`))}
              </div>
              <div className="relative bg-background" style={{ height }}>
                {blocks.map((block) => {
                  const start = formatTimeOfDay(block.startsAt, tz)
                  const end = formatTimeOfDay(block.endsAt, tz)
                  return (
                    <div
                      key={block.bookingId}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded border px-1.5 py-0.5 text-[11px]",
                        block.status === "pending"
                          ? "border-dashed border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100"
                          : "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                      )}
                      style={{
                        top: topForHhmm(start),
                        height: Math.max(topForHhmm(end) - topForHhmm(start), 16),
                      }}
                      title={`${block.roomName} — ${block.title ?? "Untitled"}`}
                    >
                      <p className="truncate font-medium">
                        {resourceId ? (block.title ?? "Untitled") : block.roomName}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Branch in `CalendarViews`**

Replace the `{/* Tasks 7 and 8 add the week and month branches here. */}` comment left by Task 6:

```tsx
      {state.view === "week" && (
        <WeekGrid
          calendar={calendar}
          weekStartDate={weekStartOf(state.date)}
          resourceId={state.resourceId}
          onPickSlot={pick}
        />
      )}
```

`weekStartOf` and `CalendarViewState.resourceId` were both exported by Task 5 — import the helper, do not re-declare it.

- [ ] **Step 4: Verify types and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 5: Manual check**

Switch to Week. Confirm: seven day columns starting Monday; `›` advances a **week**, not a day; a booking appears under the correct weekday **in the location's zone** (test with a booking near local midnight, which is the case that lands on the wrong day if the browser zone leaks in); with a resource filter set, only that room's bookings show and the chips read as titles rather than room names.

- [ ] **Step 6: Commit**

```bash
git add components/booking/calendar
git commit -m "feat(booking): add the week view

Days across, hours down, sharing one wall-clock axis so the seven
columns line up. Filtered to a room it is that room's week; unfiltered
it answers how busy each day is. Day-of-week is decided in the location's
timezone, so a booking near local midnight lands on the right column."
```

---

### Task 8: The month overview

Hour blocks are unreadable at month scale, so this view shows load per day and hands off to Day view.

**Files:**
- Create: `components/booking/calendar/month-overview.tsx`
- Modify: `components/booking/calendar/calendar-views.tsx`

**Interfaces:**
- Consumes: `BookingCalendarDto` over a month range (`rangeFor` already caps at 31 days).
- Produces:
  ```ts
  export function MonthOverview(props: {
    calendar: BookingCalendarDto
    month: string          // 'YYYY-MM'
    onPickDay: (date: string) => void
  }): JSX.Element
  ```

- [ ] **Step 1: Build the month overview**

Create `components/booking/calendar/month-overview.tsx`:

```tsx
"use client"

import { useMemo } from "react"
import { DayPicker } from "react-day-picker"
import type { BookingCalendarDto } from "@/lib/service/HsService"
import { cn } from "@/lib/utils"

/**
 * A month of hour-blocks is unreadable, so this view answers a different
 * question: which days are busy. Picking a day switches to the day grid,
 * where the actual booking happens.
 */
export function MonthOverview({
  calendar,
  month,
  onPickDay,
}: Readonly<{
  calendar: BookingCalendarDto
  month: string
  onPickDay: (date: string) => void
}>) {
  const tz = calendar.timezone

  const loadByDay = useMemo(() => {
    const counts = new Map<string, number>()
    const dayOf = (iso: string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date(iso))

    for (const entry of calendar.resources) {
      for (const block of entry.blocks) {
        const key = dayOf(block.startsAt)
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return counts
  }, [calendar, tz])

  const busiest = Math.max(1, ...loadByDay.values())

  const toKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

  return (
    <div className="mx-4 rounded-md border p-4">
      <DayPicker
        mode="single"
        defaultMonth={new Date(`${month}-01T12:00:00Z`)}
        showOutsideDays
        onSelect={(date) => date && onPickDay(toKey(date))}
        components={{
          DayButton: (props) => {
            const key = toKey(props.day.date)
            const count = loadByDay.get(key) ?? 0
            // Four steps rather than a continuous ramp: a reader
            // comparing two days wants "busier", not a precise value.
            const step = count === 0 ? 0 : Math.ceil((count / busiest) * 3)
            return (
              <button
                {...props}
                className={cn(
                  "relative flex h-12 w-12 flex-col items-center justify-center rounded-md text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  step === 1 && "bg-emerald-50 dark:bg-emerald-950",
                  step === 2 && "bg-emerald-100 dark:bg-emerald-900",
                  step === 3 && "bg-emerald-200 dark:bg-emerald-800"
                )}
              >
                <span>{props.day.date.getDate()}</span>
                {count > 0 && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            )
          },
        }}
      />
      <p className="pt-3 text-xs text-muted-foreground">
        Bookings per day. Pick a day to open its grid.
      </p>
    </div>
  )
}
```

Verify the `DayButton` custom-component name against the installed `react-day-picker` v10 API before relying on it:

```bash
grep -rn "DayButton\|CustomComponents" node_modules/react-day-picker/dist/*.d.ts | head
```

If the name differs in the installed version, use whatever that file names — do not guess.

- [ ] **Step 2: Branch in `CalendarViews`**

`router` and `searchParams` were declared in Task 6 for exactly this. Add beside the week branch:

```tsx
      {state.view === "month" && (
        <MonthOverview
          calendar={calendar}
          month={state.date.slice(0, 7)}
          onPickDay={(date) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("date", date)
            params.delete("calendarView")   // day is the default, so absent
            router.replace(`?${params.toString()}`)
          }}
        />
      )}
```

- [ ] **Step 3: Verify types and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual check**

Switch to Month. Confirm busy days are shaded and carry a count; clicking one lands on Day view for that date with `calendarView` removed from the URL; `‹`/`›` step by a month; and a month with no bookings renders a plain calendar rather than an error.

- [ ] **Step 5: Commit**

```bash
git add components/booking/calendar
git commit -m "feat(booking): add the month overview

Load per day rather than hour blocks, which are unreadable at month
scale. Picking a day opens its grid, where booking actually happens.
Days are bucketed in the location's timezone."
```

---

### Task 9: Final verification pass

- [ ] **Step 1: No region constant crept in**

```bash
grep -rn "Africa/Tunis" app components lib \
  | grep -v "lib/service/"   # generated: doc examples only
```

Expected: no output.

- [ ] **Step 2: No bare locale formatting left on booking surfaces**

```bash
grep -rn "toLocaleString()\|toLocaleTimeString()\|toLocaleDateString()" app/booking components/booking
```

Expected: no output. Every one of these renders in whatever zone the process is in.

- [ ] **Step 3: Full gate**

```bash
pnpm exec tsc --noEmit
pnpm exec next lint
pnpm build
```

Expected: all three PASS.

- [ ] **Step 4: The cross-cutting manual check**

With the seeded location's timezone set to something other than your machine's:

1. Table view: tab counts match row counts, under a filter and without.
2. Search narrows rows and survives a reload.
3. A date range writes ISO instants and narrows both rows and counts.
4. Toggle to Calendar with filters applied — they survive; toggle back — they survive.
5. Day / Week / Month all place a 09:00 local booking at 09:00.
6. Two pending bookings on one slot render distinctly in Day view.
7. Clicking a free cell opens the drawer with the right room and start time.
8. One `/bookings/stats` request per page load, not two.
9. The other 19 `DataTable` pages still render — spot-check `/community/members`, `/billing/invoices`, `/space/resources`.

- [ ] **Step 5: Commit any fixes and open the PR**

```bash
git add -A
git commit -m "fix(booking): address the verification pass"
gh pr create --title "Booking calendar, view toggle and richer table" --body "$(cat <<'BODY'
Implements docs/superpowers/specs/2026-08-26-booking-calendar-and-table-design.md.

## What
- `GET /bookings/calendar` and `GET /bookings/stats` (see the API plan)
- Day / week / month calendar with a URL-backed table↔calendar toggle
- Status tabs with real counts, resource/source/date-range filters, working search
- Created-date filter on CRM opportunities

## Notes for review
- `TableFilter` gained an optional `kind` discriminant; all 20 existing
  `DataTable` call sites are untouched by design.
- No file outside generated client code names a timezone. `formatDateTime`
  requires one so the type checker catches call sites that skipped the question.
- Pending blocks are drawn distinctly because they do not hold a slot — the
  exclusion constraint covers confirmed rows only.

## Known limits
- The calendar covers one location; a room set spanning timezones is refused
  (`422 mixed_location_calendar`) rather than drawn wrong.
- Currency is still hardcoded TND — flagged in the spec's §9, not addressed here.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

---

## Done when

- `pnpm exec tsc --noEmit`, `next lint` and `pnpm build` all clean.
- `grep -rn "Africa/Tunis" app components lib` returns nothing outside `lib/service/`.
- `?view=calendar` survives a reload with filters applied; `view` is absent for the table.
- A 09:00 local booking renders at 09:00 in all three calendar views, verified with a location timezone different from the machine's.
- Tab counts equal row counts under every filter.
- One `/bookings/stats` request per page load.
- The other 19 `DataTable` pages are unchanged and still render.
