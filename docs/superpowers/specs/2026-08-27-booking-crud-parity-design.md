# Bookings: CRUD parity with the CRM

**Status:** design, awaiting review
**Spans:** `hscowork-backend-platform` and `hyperspace-platform`

The bookings page was built after the CRM pages and follows their structure,
but stops short of them in five ways: it resolves customer and resource names
by fetching the first hundred of each on every render, it has no detail view,
its create form drives times with raw `datetime-local` inputs, its stats
endpoint returns counts without the series or per-group values the CRM cards
are drawn from, and its resource select offers resources that cannot be booked.
Alongside those, the create and edit flows carry four defects.

This spec covers all of it. Backend first: the frontend cleanup cannot compile
until the regenerated client carries the new fields.

## 1. Embedded summaries on `BookingDto`

### The problem

`table-section.tsx` builds `resourceNames`, `memberNames` and `companyNames` by
fetching `limit: 100` of each and indexing them by id. Past the hundredth
member, the table renders a blank customer. `add-booking-form.tsx` repeats the
same three fetches for its selects.

`OpportunityDto` already solved this. It keeps `memberId` and adds a slim
`member: OpportunityMemberDto` beside it, with the same id-and-object pairing
for `requestedPlan` and `requestedResource`. The DTO says why:

> Just enough of the member to render a row. A list of leads would otherwise
> cost one member lookup per row — or a blanket fetch of the first hundred,
> which silently mislabels everyone past it.

`BookingEntity` already declares all three relations (`resource`, `member`,
`company`), `eager: false`, and nothing has ever joined them.

### The shape

Three slim DTOs in `booking.dto.ts`, mirroring `OpportunityMemberDto`:

| DTO | Fields |
|---|---|
| `BookingResourceDto` | `id`, `name` |
| `BookingMemberDto` | `id`, `fullName`, `email` |
| `BookingCompanyDto` | `id`, `name` |

Added to `BookingDto` beside the existing ids, which stay:

```ts
resourceId: string;  resource: BookingResourceDto;
memberId?: string | null;   member?: BookingMemberDto | null;
companyId?: string | null;  company?: BookingCompanyDto | null;
```

Additive and optional, so the public booking page's generated client keeps
compiling untouched.

`BookingMapper` gains three private static builders. Like `OpportunityMapper`,
they report the summary absent rather than inventing one when the relation was
not joined — a mapper called on a freshly saved entity has ids, not relations.

### Two things that are not mechanical

**Alias collision.** `applyBookingFilters` conditionally does
`leftJoin('b.member', 'member')` and `leftJoin('b.company', 'company')` for the
`q` search. It is shared with `stats()`, which reads through `getRawMany` and
`groupBy`, where added selects would break the grouping. Adding
`leftJoinAndSelect` under the same aliases in `list()` throws
`Alias 'member' was already added`.

Resolution: `applyBookingFilters` takes a `customerAliasesJoined` flag. `list()`
owns the three `leftJoinAndSelect` calls and passes `true`, so the `q` predicate
reuses the selected aliases; `stats()` passes `false` and keeps its own plain
joins.

**The write path must not load relations.** `cancel`, `confirm` and `update` all
mutate an entity from `findOrFail` and `manager.save` it. The CRM hit this and
left the warning in `opportunity.service.ts`:

> Deliberately without relations: a loaded requestedResource or requestedPlan
> outranks its own foreign key when TypeORM saves, so clearing the id while the
> object is still attached writes the old row straight back.

Resolution: mirror the CRM's split. `findOrFail` gains
`SUMMARY_RELATIONS = { resource: true, member: true, company: true }` and serves
the read path; a new bare `findForWrite` serves the three mutators, which then
read back through `findOrFail` for their response. `create` gains the same
read-back — it currently maps a freshly saved entity that has no relations.

**One comment to correct.** The `orderBy('b.startsAt')` block warns that a join
plus skip/take sends TypeORM down its distinct-ids path, which resolves orderBy
keys against entity metadata and dies on a raw column name. Today that only
bites when `q` is set. Once the summary joins are unconditional it always
applies, so the comment must stop describing it as conditional.

### Frontend, after `npm run generate`

- `table-section.tsx` — drop the `getListMembers` and `getListCompanies` lookup
  maps and the two name records. `getListResources` stays: the resource filter
  and the create form's select both still need the full list.
- `columns.tsx` — read `booking.resource.name`, `booking.member.fullName`,
  `booking.company.name`.
- `booking-table.tsx`, `add-booking-form.tsx` — drop the `memberNames` and
  `companyNames` props.

This fixes name *display* past row 100. It does not fix the member and company
*selects*, which still cap at 100 with no search. See Not in scope.

## 2. Booking stats: match the CRM's shape

`GET /bookings/stats` already exists and already feeds both the summary cards
and the tab counts, memoised per request through `cache()` on positional
primitives. This is not a new endpoint — it is three missing fields.

| | `OpportunityStatsDto` | `BookingStatsDto` |
|---|---|---|
| per-group counts | `byStage` | `byStatus`, `bySource` |
| value per group | `expectedValue` on every stage | global `bookedValueHt` only |
| weekly series | `byWeek`, eight weeks | absent |

**`byWeek`** — eight weeks, oldest first, always all eight. The CRM's rule
holds: a week nothing happened in reads as zero rather than going missing and
bending the shape of a chart drawn from it. Each entry carries `week` (Monday as
a business date in the location's zone), `created` (by `createdAt`), `starting`
(by `startsAt`) and `bookedValueHt`. `StatCards` already supports `series`,
`seriesLabels` and `delta`; today no booking card passes any of them.

**No weekly cancellation series.** The obvious fourth field, `cancelled`, is not
implementable. `OpportunityEntity` has a `closed_at` column, which is how
`byWeek.won` can be counted "by when they closed, not when they opened".
`BookingEntity` has no `cancelled_at` — only `createdAt`, `updatedAt`, `startsAt`
and `endsAt`. Counting cancellations by `updatedAt` would be wrong, since any
title or notes patch bumps it. So the cancellation figure stays a plain total
from `byStatus`, and a dated cancellation series is deferred behind adding a
`cancelled_at` column, which is out of scope here.

**`valueHt` on `byStatus`** — beside `count`, exactly as `expectedValue` sits
beside `count` on `byStage`. Without it there is no way to say what the
cancelled bookings were worth, which is the only figure that makes a
cancellation card mean anything.

**`byResource`** — busiest first, carrying id, name and count. Free once §1
joins the resource relation. It gives the resource filter the counts the source
filter already shows, and answers "busiest room".

Then rebuild the four cards in `section-cards.tsx` to use sparklines and deltas,
and add a `bookingTotals`-style helper beside the existing one, modelled on
`opportunityTotals`, including its rule that a change from zero has no
percentage to report and goes unsaid rather than being called 100%.

**Not occupancy.** `GET /analytics/occupancy` already exists and
`occupancy-section.tsx` already renders it. Utilisation belongs there.

## 3. Booking details modal

`components/ui/` has `alert-dialog`, `drawer` and `sheet`, but no plain
`dialog`. `@radix-ui/react-dialog` is already a dependency and is what both
`sheet.tsx` and `alert-dialog.tsx` wrap, so `components/ui/dialog.tsx` is added
beside them in the same style.

`app/booking/bookings/booking-details-dialog.tsx` is read-only and shows: title,
status badge, resource, customer with email, both times in the location's zone,
duration, price HT or "Credit covered", the extras snapshot with per-line price
and VAT, source, notes, and created/updated. An Eye button leads the actions
column, before Edit.

It needs no fetch, because §1 embeds every name it renders.

This **replaces** the read-only summary panel originally planned for inside the
edit drawer. With a details modal, duplicating the whole record in the drawer is
redundant; the drawer keeps a one-line context header instead.

## 4. Date-time field

`DateField` is deliberately date-only — "a business date, as the API means it:
a plain YYYY-MM-DD with no timezone attached" — and has three other call sites.
It is not extended with a `withTime` prop.

`components/ui/date-time-field.tsx` composes `DateField` with a time select and
emits a single hidden input in the `YYYY-MM-DDTHH:mm` shape, so `toUtcIso` and
the `timeZone` hidden field in `actions.ts` are untouched.

Time steps are 30 minutes, matching the calendar grid, which only ever books
free half-hour slots. Both booking entry points then produce the same start
times.

It replaces the two raw `<Input type="datetime-local">` in the create form, with
`min` on "Ends at" so it cannot precede the start. Create-only: the edit drawer
has no time fields, because the API will not reschedule.

## 5. Create and edit defects

**Customer is member XOR company.** The form offers "None (walk-in)", but
`resolveCustomer` requires exactly one of the two for a staff caller and 422s on
neither with `customer_xor_violation`. `bookingPayload` guards only against
*both*, never *neither*. Fix: drop the walk-in option, mark the member and
company selects `required`, and add the missing branch returning "Select a
member or a company" so it fails before the request.

**Edit cannot clear title or notes.** `text()` maps `""` to `undefined`, and the
backend assigns only when `!== undefined`, so emptying either field is a silent
no-op that reports success. Fix: in `updateBookingAction` only, read `title` and
`notes` as raw trimmed strings so `""` survives. `bookingPayload` keeps `text()`
— omitting is correct on create.

**Cancel and Confirm disappear instead of greying out.** Both sit behind
`{canX && ...}`. Fix: always render. When unavailable, emit a plain disabled
`Button` — not an `AlertDialogTrigger`, so there is no dead trigger — wrapped in
a `span` inside a `Tooltip`, because a disabled element fires no pointer events
and a bare `title` attribute never appears. Reasons: "Already cancelled",
"Marked as a no-show", "Only pending bookings can be confirmed". Edit stays
enabled everywhere, including on cancelled bookings: the backend does allow
patching title and notes on one, and staff need to record why it was cancelled.

**The quote goes stale.** Click "Check availability & price", then change the
resource or the times, and the green line stays. Fix: reset `quoteMessage` on
any change to resource, start, end, or extras.

**Already landed** (uncommitted, in `add-booking-form.tsx`): surfacing
`problemType`. A `messageFor` helper turns `booking_conflict` into "That slot
was just taken", in both the toast and the inline error. One residual defect
remains and is fixed here: `createNotifiedRef` is only reset when the drawer
opens, so a second failed submit in the same session shows no toast. The inline
error still renders, so it degrades rather than breaks.

## 6. Only bookable resources in the create form

The resource select offers every resource. A resource whose type has
`canBook = false` — a structural floor, an assignable desk — cannot be booked,
so the API refuses it and the option is a trap.

`ResourceDto` already embeds `resourceType`, added for exactly this: "so a
caller can tell a bookable space from an assignable one without fetching every
resource type alongside". But filtering on it client-side is not enough. The
form fetches `limit: 100` and would then discard the non-bookable rows from
*that page*, so a tenant whose first hundred resources are mostly desks ends up
with a near-empty select — the same silent-truncation bug as §1, in a new place.

So: add `canBook?: boolean` to `ListResourcesParams` and the resources query,
filtering on the joined resource type. The form passes `canBook: true`.

This is create-only. The edit drawer has no resource select, because the API
will not move a booking between resources.

**The table's resource filter is left alone.** It lists resources to filter
existing bookings by, and a resource whose type was flipped to `canBook = false`
after its bookings were taken must stay filterable, or those rows become
unreachable.

## Files

**Backend** — `booking.dto.ts`, `booking-stats.dto.ts`, `booking.mapper.ts`,
`booking.service.ts`, `booking.doc.ts`, `booking.service.spec.ts`; plus the
catalog module's resource list params, query and doc for §6.

**Frontend** — regenerate `lib/service/`; then `booking-actions-buttons.tsx`,
`columns.tsx`, `actions.ts`, `add-booking-form.tsx`, `table-section.tsx`,
`booking-table.tsx`, `section-cards.tsx`, `stats.ts`; new `ui/dialog.tsx`,
`ui/date-time-field.tsx`, `booking-details-dialog.tsx`.

## Testing

The backend has specs; `booking.service.spec.ts` covers the existing stats
grouping and query predicates. New cases: the summary joins load all three
relations, the mapper reports an unjoined relation absent rather than blank, the
write path does not load relations, the `q` search still works against the
selected aliases, `byWeek` returns all eight weeks including empty ones, the
stats grouping still holds under the shared-helper change, and `canBook=true`
keeps only resources whose type allows booking.

The frontend has no test setup. Verification is `npx tsc --noEmit`, `npm run
lint`, and a manual pass: cancel a booking and watch the button grey in place,
clear a note and reload, create with a blank member, create with a walk-in,
double-book a slot, open the details modal on a credit-covered booking with
extras, page past row 100 to confirm customer names still render, and confirm
the resource select omits a resource whose type has `canBook = false`.

## Not in scope

- **Member and company selects cap at 100 with no search.** §1 fixes display,
  not selection. Member 101 stays unbookable.
- **Calendar click-to-edit.** Booking blocks are not clickable; only free
  half-hours are. Needs a fetch-by-id path that does not exist.
- **Un-flagging a no-show.** `markNoShow` is one-way and the API has no reverse
  path. A backend gap, recorded rather than worked around.
- **Reschedule.** `UpdateBookingDto` is `{title, notes, status:"no_show"}`.
  Moving a booking means cancel and rebook.
- **`state.resourceId` is dead.** `calendar-section.tsx` never populates it, so
  `WeekGrid`'s room narrowing cannot fire.
