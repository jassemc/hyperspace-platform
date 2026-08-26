# Booking calendar, view toggle and richer table — Design

Date: 2026-08-26
Repos touched: `hscowork-backend-platform`, `hyperspace-platform`
Related: [booking module audit](#appendix-a--audit-findings-referenced-here)

---

## 0. Problem

Staff book meeting rooms through two raw `datetime-local` inputs and a
*Check availability & price* button: guess a time, submit, get refused,
guess again. There is no view anywhere in the admin that shows when a room
is free.

`GET /resources/{id}/availability` already returns bookable windows, busy
intervals, duration bounds and the cancellation window — the admin has
never called it. Its generated client function sits unused at
`lib/service/index.ts:420`. Meanwhile `public-booking-page` ships a full
month calendar, a duration chooser and a day timeline. The customer-facing
product books rooms better than the staff tool does.

Separately, the bookings list is the only major list page that did not get
the reworked toolbar from `54a17c4` / `2a4aa41`: no status tabs, no
filters, no working search. `table-section.tsx:32` already *reads*
`resourceId`, `from` and `to` from the URL — nothing ever writes them.

## 1. Assumptions (override any of these)

1. The calendar is a **staff tool**. Members do not reach it; a member
   portal calendar would be a separate endpoint with its own scoping.
2. "Meeting rooms" means resources whose `resourceType.canBook` is true.
   `canBook` is preferred over testing `bookingMode !== 'none'`.
3. **The platform is multi-region.** Business time is resolved per
   location from `LocationEntity.timezone` — never from a constant, and
   never from the server clock. No code in this work names a region. See
   §4.5; `docs/CONVENTIONS.md` §2 should be amended, as its "business-time
   logic uses `Africa/Tunis`" line no longer describes the code.
4. "Filter by created day" on CRM means a **range** (`createdFrom` /
   `createdTo`). A single day is a range of one; presets cover the common
   cases.
5. Recurring bookings stay out of scope. The schema models no series, and
   `docs/OFFICERND-NOTES.md` line 79 already flags `rrule` + `exdates` as
   the storage model if they enter scope. That is its own decision.

## 2. Goals / Non-goals

**Goals**

- A built-in booking calendar with day, week and month views, for one room
  or many.
- A toggle between calendar and table that survives refresh and is
  linkable.
- Filter bookings by start and/or end date, plus status, source, resource
  and customer.
- Bring the bookings table up to the CRM page's toolbar: tabs with counts,
  filter dropdowns, working server search.
- Add a created-day range filter to the CRM opportunities page.
- Fold in the audit fixes that are a few lines each and sit in the same
  files.

**Non-goals**

- Recurring bookings (assumption 5).
- No-show auto-release policy.
- Drag-to-create and drag-to-resize on the grid. Click-empty-cell-to-book
  is in; direct manipulation is a later iteration.
- Frontend test tooling. `hyperspace-platform` has no test runner;
  standing up Vitest + RTL is its own decision and would be hidden inside
  a feature branch. See §7.
- A member-facing calendar.

## 3. Approaches considered

**Calendar library vs. custom.** Resource scheduling — rooms as
rows/columns — is a paid feature in both FullCalendar (Premium) and
Schedule-X. The free options that do multi-room are `react-big-calendar`
(MIT, ships its own stylesheet that fights Tailwind v4) and
`@event-calendar` (MIT, richest free resource views, but a Svelte 5 core
with no React wrapper — it must be mounted imperatively).

**Chosen: custom.** The hard part here is not the grid, it is the
availability math, and we already own it: `public-booking-page/lib/slots.ts`
already does the wall-clock ↔ instant maths and `DayTimeline` already renders
windows, busy blocks and a selection. No library models our three states
(bookable window / busy / contested pending), so any of them would mean
reshaping data into their event model and then fighting their CSS to
re-encode the distinction. `date-fns@4` and `react-day-picker@10` are
already installed; nothing new is added.

**Calendar data: new endpoint vs. compose on the client.** Composing means
`GET /bookings` plus one availability call per room — N+1 per rendered day.
Extending `/resources/{id}/availability` to many ids does not help either:
`AvailabilityDto.busy` is *anonymised intervals*, so a clickable block
still needs a second call to learn its title, customer and status.

**Chosen: one purpose-built `GET /bookings/calendar`.**

---

## 4. Backend design (`hscowork-backend-platform`)

All new code follows `docs/CONVENTIONS.md`: composite Doc decorators in
`docs/booking.doc.ts`, `@ProtectedWith`, RFC 9457 `type` codes, mappers
returning DTOs, `*.spec.ts` beside each service.

### 4.1 `GET /bookings/calendar`

Declared in `BookingController` **before** any `/:id` route, for the reason
already commented at `opportunity.controller.ts:60` — otherwise `calendar`
is parsed as an id.

```
GET /api/v1/bookings/calendar
  ?from=2026-08-27T00:00:00Z     required
  &to=2026-08-28T00:00:00Z       required
  &resourceIds=uuid,uuid         optional; default = all bookable rooms
  &resourceTypeId=uuid           optional; drives the type tabs
  &locationId=uuid               optional
```

`BookingCalendarQueryDto` — `@IsDateString()` on `from`/`to`,
`@IsUUID('4', { each: true })` on `resourceIds`, `@IsOptional()` on the
rest.

Response (plain classes, not `AbstractDto` — following `AvailabilityDto`,
which is also a computed read):

```ts
class BookingCalendarDto {
  from: string;
  to: string;
  resources: CalendarResourceDto[];
}

class CalendarResourceDto {
  resource: CalendarResourceSummaryDto;
  days: AvailabilityDayDto[];      // reused as-is
  blocks: CalendarBlockDto[];
}

class CalendarResourceSummaryDto {
  id: string;
  name: string;
  capacity: number;
  imageUrl: string | null;
  resourceTypeId: string;
  bookingMode: BookingMode;
  minDurationMin: number | null;
  maxDurationMin: number | null;
  cancellationHours: number;
  amenities: AmenitySummaryDto[];   // id, name, icon
}

class CalendarBlockDto {
  bookingId: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;            // pending | confirmed only
  title: string | null;
  customerName: string | null;
  source: BookingSource;
}
```

Four decisions inside that, each with its reason:

- **Blocks carry `pending` as well as `confirmed`.** The overlap rules
  deliberately exclude pending (`1783728400000-create-bookings.ts:75`:
  "Pending bookings are deliberately outside this WHERE clause"), which is
  correct — an unreviewed website request should not lock a room. But it
  means several visitors can request the same slot and the admin shows
  them as unrelated rows. The calendar is where that contention becomes
  visible. Cancelled and no-show are excluded; they are not on a calendar.
- **`customerName` is resolved server-side.** Otherwise the grid inherits
  the hundred-record lookup cliff (audit B3) and renders a wall of
  "Unknown".
- **Range capped at `MAX_RANGE_DAYS`** (31, `availability.service.ts:30`),
  reusing the existing `date_range_too_wide` / `date_range_invalid` codes
  rather than inventing new ones. This also bounds the month view.
- **Windows come from a refactor, not a copy.** `AvailabilityService`
  computes `resource.bookingTimes ?? location.openingHours` at line 189.
  Extract that into a method both endpoints call. Duplicating the
  timezone logic is how the two views drift apart.

**Access.** `@ProtectedWith({ roles: [ADMIN, STAFF], permissions: { READ,
BOOKING } })` — deliberately *not* the `BOOKING_READ` used by `list()`.
`list()` carries a member-scoping branch (`booking.service.ts:410`);
re-implementing that inside a multi-resource grid adds a leak surface for
no current gain.

**Implementation.** A new `BookingCalendarService` composing
`ResourceService` (room selection + summaries), the extracted window
computation, and one `IN (...)` booking query across the range. It does
**not** live in `BookingService`, which is already 560 lines and owns
create/cancel/confirm/pricing orchestration.

### 4.2 `GET /bookings/stats`

Same position rule as §4.1 (before `/:id`), same shape discipline as
`GET /opportunities/stats`.

```ts
class BookingStatsDto {
  byStatus: { status: BookingStatus; count: number }[];
  bySource: { source: BookingSource; count: number }[];
  total: number;
  bookedValueHt: number;    // credit-covered bookings contribute 0
}
```

`BookingStatsOptionsDto` takes **the same filters as the list** (`q`,
`resourceId`, `from`, `to`, `status` excluded, `source`, `memberId`,
`companyId`). This is the rule `OpportunityStatsOptionsDto` follows by
taking the same `q` and `interest`: if the counts do not narrow with the
rows, the tabs label something other than what is on screen.

`status` is excluded from the stats options on purpose — the counts *are*
the per-status breakdown, so filtering by status would collapse them.

One grouped query per aggregate, following `opportunity.service.ts:115`.

### 4.3 `BookingPageOptionsDto` extensions

```ts
status?: BookingStatus;      // @IsEnum, enumName: 'BookingStatus'
source?: BookingSource;      // @IsEnum, enumName: 'BookingSource'
memberId?: string;           // @IsUUID('4')
companyId?: string;          // @IsUUID('4')
```

`from` / `to` keep their existing overlap semantics (`ends_at > :from AND
starts_at < :to`). That is the right meaning for a date filter — "bookings
touching this range" — and works with either bound supplied alone, which
is what "filter by start and/or end dates" asks for.

**`list()` must finally honour `q`.** It is declared on `PageOptionsDto`
and honoured by the member, company, opportunity, resource, rate and
location services; `booking.service.ts:391` never reads it, so the
frontend has been sending a parameter the API silently drops. Search
`b.title`, `b.notes`, and the joined member/company name.

### 4.4 CRM created-day filter

`OpportunityPageOptionsDto` and `OpportunityStatsOptionsDto` both gain
`createdFrom` / `createdTo` (`@IsDateString`, optional). Both, or the tab
counts stop matching the rows they label.

`list()` uses `findAndCount` with a `where` object, so it takes
`Between` / `MoreThanOrEqual` / `LessThanOrEqual`. `statsQuery`
(`opportunity.service.ts:213`) is a query builder, so it takes `andWhere`.

**The parameters are instants, not day strings.** `OpportunityEntity` has
no location relation, so the server has no timezone to resolve a "day"
against — and inventing one (a platform default, the caller's location,
the server clock) would bake a region into a region-neutral entity. The
API therefore takes ISO instants and does no conversion at all, exactly
as the booking list's existing `from`/`to` do.

Turning a chosen day into a pair of instants is the **client's** job,
using the timezone context it actually has (§5.6). This keeps the same
API correct whether the operator is in Tunis, Lisbon or Dubai.

### 4.5 Business time is per-location, never a constant

The platform is multi-region and the codebase already reflects that:
`LocationEntity.timezone:22` is documented as "IANA timezone driving all
business-hour logic for this location", and there is **no `Africa/Tunis`
anywhere in backend `src/`** — it survives only as a default value in
`create-location.dto.ts` and in doc examples.

The helper this work needs also already exists:

```
localParts(location, at) -> { date, time, weekday, offset }
    src/modules/attendance/utils/location-hours.util.ts:31
```

It decomposes an instant into the location's local wall-clock parts via
`Intl.DateTimeFormat` with `longOffset`, and `AvailabilityService` already
uses it correctly at lines 168–186. **Nothing new is invented here.**

Two changes:

1. Add `localDayBounds(location, date)` beside it, returning the UTC
   instants bounding that local calendar day — derived from `localParts`,
   not from a fixed offset, so DST is handled wherever it applies.
2. Move `location-hours.util.ts` from `src/modules/attendance/utils/` to
   `src/common/`. It is already imported by `booking`, so its current home
   makes `booking` depend on `attendance` for a pure time utility.

Every window and block computation in §4.1 goes through this, resolving
the timezone from the room's `locationId`. No module in this work holds a
timezone constant.

**Consequence for the calendar: the grid is per-location.** A day grid is
one *place's* day, so a room set spanning two timezones has no coherent
time axis. When `resourceIds` resolve to more than one location the
endpoint returns `422 mixed_location_calendar`; `locationId` is how the
caller disambiguates. Cross-location scheduling, if it is ever wanted, is
a different view and a different design.

### 4.6 Migration

No schema change — everything here is a read. One index migration for the
calendar's access pattern (`resource_id IN (...) AND ends_at > :from AND
starts_at < :to AND status IN (...)`), which the existing single-column
`IDX_bookings_resource_id` serves poorly:

```
CREATE INDEX "IDX_bookings_resource_starts_at"
  ON "bookings" ("resource_id", "starts_at")
```

Module-owned (`src/modules/booking/migrations/`), epoch-ms filename,
working `down()`, append-only per CONVENTIONS §10.

### 4.7 Client regeneration

`pnpm generate` in `hyperspace-platform` after the API lands, per the
existing `service-generator` workflow. The new endpoints and DTOs arrive
in `lib/service/`; nothing is hand-written there.

---

## 5. Frontend design (`hyperspace-platform`)

### 5.1 View toggle

A segmented control in the page header writing `?view=table|calendar`.
Table is the default; the parameter is absent for it, matching the
"defaults stay out of the URL" rule already commented in
`data-table.tsx:218`.

It sits beside `AddBookingButton` in `app/booking/bookings/page.tsx`. Both
views read the **same** `searchParams`, so a resource or date filter set in
the table carries into the calendar unchanged.

### 5.2 Calendar views

New directory `components/booking/calendar/`:

```
calendar-toolbar.tsx      Today · ‹ › · date picker · time range ·
                          Vacant only · More filters
resource-day-grid.tsx     rooms as columns, hours as rows
week-grid.tsx             days as columns, hours as rows
month-overview.tsx        react-day-picker + per-day load density
room-header-card.tsx      photo, name, N amenities, capacity
```

**Day view** is the primary, modelled on the reference design: hours down
the left, rooms as horizontally scrollable columns with photo-card headers
(`imageUrl`, name, amenity count, capacity — all already on
`ResourceDto`). Three cell states:

- **free** — empty and clickable → opens the booking drawer prefilled with
  that room, start and duration
- **booked** — solid block with title and time range; `pending` renders
  distinctly from `confirmed`
- **unavailable** — hatched, the inverse of `days[].windows[]`

Rooms as columns (not rows) because with 5+ rooms the grid then scrolls
vertically like a normal page; rooms-as-rows forces a horizontal time axis
that gets cramped fast.

**Week view** — days across, hours down. One room when a resource filter
is set; otherwise rooms stack as sub-columns per day.

**Month view** — `react-day-picker` with per-day load density rather than
hour blocks, which are unreadable at month scale. Clicking a day switches
to Day view for it.

**Resource-type tabs** above the calendar, from `GET /resource-types`
filtered on `canBook`, writing `?resourceTypeId=`. They work exactly like
the table's status tabs.

**Time range and "Vacant only" are client-side.** The payload already
holds the full day's windows and blocks, so narrowing to 09:00–10:00 and
hiding occupied rooms is instant and needs no refetch. Only the date and
the type tab hit the server.

### 5.3 Table enrichment

Matching `opportunity-table.tsx`:

- **Status tabs with counts** from `/bookings/stats` — this is
  `BOOKING_STATUS_TABS` (`booking-status.ts:19`) finally imported; it has
  been built and unused since it was written.
- **Filters** — Resource, Source, Customer, and the date range.
- **Server search** — `serverSearch` + placeholder, once `q` works (§4.3).
- **Stat cards from the stats endpoint**, replacing the 100-row scan in
  `section-cards.tsx:13`.
- **Remount key** on filter change, per `opportunity-table.tsx:99`.

### 5.4 Shared component change: `dateRange` filter

`TableFilter` is currently a `<select>` with `options[]`. A date range does
not fit that shape, so the type gains a discriminant:

```ts
type TableFilter =
  | { kind?: "select"; key; label; value?; options }   // unchanged
  | { kind: "dateRange"; fromKey; toKey; fromValue?; toValue?; presets? }
```

`kind` is optional and defaults to `"select"`, so all **20** existing
`DataTable` call sites compile untouched. This is preferred over a
parallel `dateFilters` prop, which would put two filter systems in one
toolbar.

This is the only change outside the booking module, and it is what serves
both the booking date filter and the CRM created-day filter.

### 5.5 `lib/slots.ts` port — with the region taken out

Copy `freeRangesForDay`, `startOptionsForDuration`, `durationChoices` and
`wallClockToUtcMs` from `public-booking-page/lib/slots.ts`. They are pure
functions.

**What must not come with them is `BUSINESS_TZ`.** That constant
(`public-booking-page/lib/format.ts:8 = "Africa/Tunis"`) is defensible on
a site serving one region; in a multi-region admin it is a bug waiting to
happen. Every ported function takes the timezone as a parameter:

```ts
wallClockToUtcMs(date, hhmm, timeZone)
freeRangesForDay(availability, date, nowMs, timeZone)
```

The calendar passes the timezone of the grid's location (§4.5), which the
admin already has from `LocationDto.timezone` via `getListLocations`.

**Block positioning uses `wallClockToUtcMs`, never bare `new Date()`.** A
block's offset along the axis is `(startUtc − dayStartUtc) / span`, where
`dayStartUtc` comes from converting the window's *local* opening time in
the location's timezone. Get this wrong and every block is silently
displaced — the same defect as `actions.ts:51`, which parses a
`datetime-local` string inside a server action and so resolves it in the
*server's* timezone.

Add `formatDateTime(value, timeZone)` to `lib/format.ts`, which already
owns `formatDate`. `timeZone` is required, not defaulted: a default is how
a region creeps back in. The same three-line helper is currently
copy-pasted into `bookings/columns.tsx:19` and `attention-lists.tsx:22`,
all three calling bare `toLocaleString()`.

### 5.6 Day → instants on the client

The CRM created-day filter and the booking date filters send instants
(§4.4). The `dateRange` filter control (§5.4) converts the picked day to
`[startUtc, endUtc)` before writing the URL, using — in order — the
timezone of the location in scope, else the operator's browser timezone
via `Intl.DateTimeFormat().resolvedOptions().timeZone`.

The browser fallback matters: opportunities have no location, so their
"day" is the day of the person reading the screen. That is the right
answer for a multi-region tool, and it is only correct because the server
refuses to guess.

---

## 6. Folded-in audit fixes

Cheap, and in files this work already touches:

| Ref | Fix | Where |
|---|---|---|
| B1 | `q` honoured + `serverSearch` on | §4.3, §5.3 |
| B2 | Stats endpoint replaces 100-row scan | §4.2, §5.3 |
| B4 | Per-location timezone via `localParts`; `formatDateTime(v, tz)` | §4.5, §5.5 |
| B5 | No-show checkbox guarded on start time | one line, `add-booking-form.tsx:234` |
| B6 | `cache()` around shared reads | `opportunities/stats.ts` pattern |
| B7 | `BOOKING_STATUS_TABS` wired | §5.3 |
| G1 | Filters written, not just read | §5.3 |
| G2 | API filter params | §4.3 |
| G3 | Upcoming-first default sort | §4.3 |
| P2 | `error.status` / `error.error.type` kept in `ActionState` | `bookings/actions.ts` |
| A5 | Room metadata in the picker | §4.1 summary DTO, §5.2 |

Deferred, tracked separately: B3 (name embedding on `BookingDto`),
Q1 (quote breakdown panel), A2 (slot picker in the drawer), A6, A7.

---

## 7. Testing

**Backend — TDD.** Jest is configured and `booking.service.spec.ts`,
`availability.service.spec.ts`, `booking-pricing.service.spec.ts` already
exist. CONVENTIONS §13 requires specs for every service with business
rules. Written first:

- `localDayBounds` across a day boundary, **in at least three timezones
  with different signs and DST behaviour** — e.g. `Africa/Tunis` (+01, no
  DST), `America/New_York` (negative offset, DST), `Asia/Kolkata` (+05:30,
  half-hour offset). A booking at 23:30 local belongs to that local day,
  not the next UTC one, and a half-hour zone breaks any implementation
  that assumes whole-hour offsets. **Highest-value test in the plan.**
- A DST transition day: the local day is 23 or 25 hours long, and
  `localDayBounds` must return bounds that reflect that rather than
  `start + 24h`.
- `BookingCalendarService`: window/block composition; pending blocks
  present, cancelled absent; range cap; empty result for a room with no
  windows.
- `BookingService.list`: each new filter, and `q` matching title, notes
  and customer name.
- `BookingService.stats`: counts narrow with the same filters as the list.
- `OpportunityService`: `createdFrom`/`createdTo` on both list and stats.

**Frontend — manual, against seeded data.** No test runner exists and this
plan does not add one (§2). Verification targets the cases that fail
*silently*:

1. A booking at 09:00 local renders at 09:00 on the grid — checked with
   the seeded location's timezone set to something other than the
   developer's own, so a machine-timezone assumption cannot pass by
   accident.
2. Two pending bookings on one slot both render, distinctly from
   confirmed.
3. `?view=calendar` survives a refresh with filters applied.
4. Clicking an empty cell opens the drawer with room, start and duration
   prefilled.
5. Tab counts equal the row counts they label, under every filter.

**CI** must stay green: prettier, eslint, `tsc --noEmit`, jest.

---

## 8. Risks

- **`DataTable` blast radius.** 20 call sites. Mitigated by the optional
  `kind` discriminant (§5.4); a type error at any call site means the
  change was not additive.
- **Month view payload.** 31 days × N rooms of windows and blocks. Bounded
  by `MAX_RANGE_DAYS`, and the month view renders density rather than
  blocks — but if room counts grow past ~30 this wants an aggregate mode
  on the endpoint. Revisit if it bites; do not pre-build it.
- **Contested pending is surfaced, not solved.** The calendar makes
  competing requests visible. Deciding *what staff do* about them — a
  chooser in the confirm dialog — is audit P1 and stays a follow-up.
- **Region assumptions are silent failures.** A hardcoded timezone does
  not throw; it renders a grid that is plausibly wrong by an offset, and
  it looks correct to whoever built it. Two guards: the multi-timezone
  tests in §7, and `formatDateTime` taking a required `timeZone` (§5.5) so
  the type checker refuses the call sites that have not thought about it.
- **One-location-at-a-time is a real limit.** §4.5 refuses a room set
  spanning timezones. For an operator running one building this is
  invisible; for one running several it means the grid is a per-location
  view, which should be confirmed as acceptable before the plan is
  executed rather than discovered in review.

## 9. Follow-ups (out of scope)

**Region-generality, beyond this spec.** Timezone is now handled
per-location, but two region assumptions remain and neither is fixed here:

- **Currency is hardcoded TND.** `lib/format.ts:18` appends the literal
  `" TND"`, and `money-column.transformer.ts` is `numeric(12,3)` because
  millimes need three decimals — EUR and USD need two, JPY none. This is
  the same class of problem as the timezone one but structural: it is a
  schema decision, not a formatting one, and it wants its own design.
  Flagged here because it is the largest remaining barrier to a
  multi-region platform.
- **`docs/CONVENTIONS.md:33`** still states "business-time logic uses
  `Africa/Tunis`". The code has moved past that line; it should be amended
  to say business time resolves from `LocationEntity.timezone`.
- **`public-booking-page`** keeps `BUSINESS_TZ` (`lib/format.ts:8`). That
  is defensible while the site serves one region, but if it becomes
  multi-tenant it needs the same treatment as §5.5.

**Feature follow-ups**

- Recurrence (`rrule` + `exdates`), per OFFICERND-NOTES line 79.
- Cross-location calendar (the view §4.5 deliberately refuses).
- No-show auto-release policy.
- Drag-to-create / drag-to-resize on the grid.
- Quote breakdown panel (Q1) and the drawer slot picker (A2).
- `customerName` / `resourceName` embedded on `BookingDto` (B3), which
  would let the table drop its three lookup calls too.
- Frontend test tooling.

---

## Appendix A — audit findings referenced here

`B1` dead search · `B2` stats over the oldest 100 · `B3` name lookups
capped at 100 · `B4` server-timezone parsing · `B5` no-show checkbox on
future bookings · `B6` double fetch · `B7` unwired status tabs ·
`G1` filters read but never written · `G2` missing API filter params ·
`G3` oldest-first sort · `P1` contested pending requests · `P2` discarded
error codes · `Q1` discarded quote fields · `A2` no slot picker ·
`A5` room metadata unused.
