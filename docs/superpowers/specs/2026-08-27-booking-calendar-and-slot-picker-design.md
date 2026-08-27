# Bookings: an availability-driven picker, and a calendar worth looking at

**Status:** design, awaiting review
**Spans:** `hscowork-backend-platform` and `hyperspace-platform`
**Follows:** `2026-08-27-booking-crud-parity-design.md`, which this supersedes
on two of its "Not in scope" entries — reschedule and calendar click-to-edit.

Two complaints, one root. Staff pick booking times by typing them into a pair
of fields that know nothing about whether the room is free, and the calendar
that *does* know is drawn in colours the design system never issued, with
inert blocks and free time you can only find by hovering.

So: the create form learns to offer real slots, read from the same availability
endpoint the public website books against; edit learns to move a booking at
all, which the API currently refuses; and the three grids get a pass that puts
them back on the token palette and makes their two obvious affordances —
"book this gap", "open this booking" — actually clickable.

Backend first: the frontend cannot offer an edit-time slot picker until PATCH
accepts times, and cannot draw the picker correctly until availability can
exclude the booking being moved.

---

## 1. Reschedule on `PATCH /bookings/{id}`

### The problem

`UpdateBookingDto` is `{ title?, notes?, status?: "no_show" }`. Moving a
booking means cancelling it and booking again — which burns the id, re-runs
every confirmed-booking side effect, and loses the thread for anyone reading
the row later.

### The shape

```ts
export class UpdateBookingDto extends PartialType(
  PickType(CreateBookingDto, ['title', 'notes'] as const),
) {
  @ApiPropertyOptional({ enum: [BookingStatus.NO_SHOW] })
  @IsIn([BookingStatus.NO_SHOW])
  @IsOptional()
  status?: BookingStatus.NO_SHOW;

  @ApiPropertyOptional({ example: '2026-08-26T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-08-26T11:00:00Z' })
  @IsDateString()
  @IsOptional()
  endsAt?: string;
}
```

**Times only — the resource stays put.** Moving a booking between rooms
changes the rate, invalidates the selected extras (they hang off the *old*
resource's rates), and rescopes the credits, since credit consumption is
scoped to a resource *type*. That is a different feature with a different risk
profile. Changing rooms remains cancel-and-rebook.

### Guards, in order

| Condition | Problem | Status |
|---|---|---|
| exactly one of `startsAt`/`endsAt` present | `reschedule_requires_both` | 422 |
| `endsAt <= startsAt` | `date_range_invalid` | 422 |
| status is not `confirmed` or `pending` | `booking_not_reschedulable` | 409 |
| the new window overlaps another confirmed booking | `booking_conflict` | 409 |

The overlap check passes the booking's own id as `excludeBookingId` (§2), or
every reschedule that keeps any part of its current window would conflict with
itself.

A member caller additionally passes through the existing
`assertWithinCancellationWindow`, which `update()` already applies on its
non-`no_show` branch — a member who may no longer cancel may not reschedule
around the rule either.

**Staff may move a booking whose start has passed.** Correcting a mis-typed
time after the fact is a real front-desk need, and refusing it would leave no
path to fix the row at all. Members cannot, because the cancellation window
has necessarily closed by then.

### The money

`priceHt`, the consumed credits and the charge rows were all derived from the
old duration. A booking stretched from one hour to four must not stay billed
for one.

One transaction, three steps:

**Reverse.** Delete the booking's negative `credit_transactions`, delete its
uninvoiced `charges`, then insert compensating negatives for any charge already
frozen onto an invoice. This is `cancel()`'s transaction body, verbatim — down
to its ordering constraint, since the compensating rows are themselves
uninvoiced booking charges and the delete above would sweep them. It moves into
a private `reverseBookingMoney(manager, booking)` and `cancel()` starts calling
it, so the two paths cannot drift.

**Re-quote** at the new window, for the booking's *own* customer — read off
`booking.memberId` / `booking.companyId`, never off the caller's payload, which
carries no customer on a PATCH.

**Extras stay frozen.** The quote is re-run with the stored
`booking.extras.map(e => e.extraId)`, but the resulting extras array is
discarded and the original snapshot written back and charged. `confirm()`
already establishes this rule — it "re-quotes from this snapshot rather than
trusting fresh client input" — and it holds harder here: extras are flat
per-booking add-ons that duration does not touch, so re-pricing a catering line
because the catalogue moved since the booking was taken would be a silent,
unasked-for repricing. Only the duration-driven `priceHt` changes.

**Re-apply.** Consume credits per the new `consumptionPlan`, write the booking
charge and the extras charges. This is `create()`'s transaction body; it moves
into a private `applyBookingMoney(manager, booking, quote, customer)` and
`create()` starts calling it, for the same anti-drift reason.

Then `startsAt`, `endsAt` and `priceHt` are assigned and the row saved. An
exclusion-constraint violation escaping the transaction maps to the same 409
`booking_conflict` `create()` already throws — the race backstop behind the
pre-check.

### One thing that is not mechanical

`update()` currently saves through `this.bookingRepository`. A reschedule must
save through the transaction's `manager`, or the row moves outside the
transaction that reversed and re-applied its money — and a failure between them
leaves a booking billed twice or not at all. The metadata-only path (title,
notes, no-show, no times) keeps its plain repository save: opening a transaction
to write a title is cost for nothing.

---

## 2. Availability that can ignore one booking

### The problem

Two of them, same cause.

Extending 10:00–11:00 to 10:00–12:00 overlaps the booking's own row, so
`assertFree` refuses a move that is perfectly legal. And the edit picker, drawn
from `GET /resources/{id}/availability`, paints the booking's own hour as busy
— so the slot it currently occupies is the one slot it cannot be moved to,
which is exactly where "make it half an hour longer" starts.

Postgres `EXCLUDE` never conflicts a row with itself on `UPDATE`, so the
constraint is already correct. Only the pre-check and the read are wrong.

### The shape

`AvailabilityService.assertFree(resourceId, startsAt, endsAt, excludeBookingId?)`
— adds `id: Not(excludeBookingId)` to the overlap query when set.
`BookingService.assertNoOverlap` grows the same optional parameter and forwards
it; `create()` and `confirm()` call it exactly as they do today.

`availabilityFor(...)` takes it too, filtering the busy query, and
`GetResourceAvailabilityParams` gains an optional `excludeBookingId` (uuid).
The public endpoint does **not** expose it: a website visitor has no booking to
exclude, and handing them a parameter that hides an occupied slot from the
availability read is a way to manufacture a 409 on submit.

### Tests

`booking.service.spec.ts`: a reschedule that changes duration re-quotes and
moves the charge total; extras charges come back at their snapshot prices, not
fresh catalogue prices; moving onto another booking's window 409s; moving
*within* the booking's own window succeeds; a cancelled booking refuses with
`booking_not_reschedulable`; one time without the other 422s; a member outside
the cancellation window is refused; the metadata-only path still takes the
non-transactional save.

`availability.service.spec.ts`: `assertFree` ignores the excluded id and still
catches every other overlap.

---

## 3. Create and edit move into a dialog

### The problem

The picker in §4 is a two-column layout. The form lives in a 440px right-hand
`Drawer`, which cannot hold one. And `add-booking-form.tsx` is 520 lines
before the picker exists.

### The shape

`app/booking/bookings/` gains three files and loses one:

| File | Holds |
|---|---|
| `booking-form-dialog.tsx` | the `sm:max-w-4xl` Dialog shell, create/edit mode, `useActionState` wiring, the notify effects, submit |
| `booking-slot-picker.tsx` | §4 |
| `booking-customer-fields.tsx` | the resource select and the member/company pair |
| ~~`add-booking-form.tsx`~~ | deleted; every caller re-pointed |

`components/ui/dialog.tsx` already exists — it was added for the details modal
in the CRUD-parity work and wraps the same `@radix-ui/react-dialog` the drawer
and sheet do.

Callers to re-point: `booking-table.tsx` (edit from a row),
`add-booking-button.tsx` (the page header), and
`components/booking/calendar/calendar-views.tsx` (click-to-book prefill).

**The wall-clock contract is untouched.** The picker writes the same wall-clock
`YYYY-MM-DDTHH:mm` strings into the same hidden `startsAt` / `endsAt` inputs
that `DateTimeField` writes today; the hidden `timeZone` field simply becomes
unconditional rather than prefill-only, so `toUtcIso` resolves both paths
through the location's zone instead of falling back to the server process's.
That fallback was only ever correct by accident.

The edit branch additionally submits `startsAt` / `endsAt`, and
`updateBookingAction` forwards them — through the same `toUtcIso`, and only
when both are present, so a metadata-only save still sends neither.

---

## 4. The slot picker

### The shape

```
booking-slot-picker.tsx
  props: resourceId, timeZone, value: { startsAt, endsAt } | null,
         onChange, excludeBookingId?
```

Fetches `getResourceAvailability({ id, from, to, excludeBookingId })` per
resource and per displayed month, straight from the client component — the
pattern `getListResources` already uses in this folder. Refetches when the
resource changes or the month is paged; renders the grid dimmed while a month
is in flight, the way the public wizard does.

Left column: duration chips from `durationChoices(minDurationMin,
maxDurationMin)`, a month grid whose cells carry that day's count of free
starts for the chosen duration, and the occupancy bar — open windows, busy
blocks, elapsed time, the selected slot — ported from the wizard's
`DayTimeline` and restyled onto tokens.

Right column: `startOptionsForDuration()` grouped into morning / afternoon /
evening, each start a button.

Every function this needs already exists in `lib/slots.ts`, which was ported
from the public page for exactly this and has had no second caller until now:
`wallClockToUtcMs`, `freeRangesForDay`, `startOptionsForDuration`,
`durationChoices`.

The month grid reuses `react-day-picker` — the same library `month-overview.tsx`
draws its heat grid with — so the admin has one calendar, not two that disagree
about where the week starts.

### The escape hatch

A **"Set times manually"** link swaps the picker for the existing
`DateTimeField` pair, and back. Staff are not visitors: booking outside a room's
opening window is a real front-desk action the API permits, and a picker that
only offers free in-window slots would make it impossible from the admin. The
API still refuses a genuine conflict, so the guard rail that matters survives.

`date-time-field.tsx` therefore stays, rather than being deleted.

### What invalidates the quote

The existing rule holds and extends: `quoteMessage` resets on any change to
resource, start, end, or extras — which now includes picking a duration or a
day, since both move the start.

---

## 5. The grids: colour, affordance, orientation

### Colour

`resource-day-grid.tsx` and `week-grid.tsx` each hardcode their own
`emerald`/`amber` pair, in light and dark variants, four places between them.
Nothing in `globals.css` issues either; the palette is a blue `--primary` with
standard shadcn neutrals, so the calendar reads as a different product.

One exported `BOOKING_BLOCK_STYLES` map in `booking-status.ts` — beside
`BOOKING_STATUS_LABELS`, which already lives there — keyed by status. Confirmed
sits on `primary` at low alpha; pending keeps its dashed border, because dashed
is carrying real meaning (a pending request does **not** hold the slot, which is
why several may legitimately overlap) and that meaning must not be encoded in
hue alone. Both grids read the map; neither owns a colour.

### Affordance

Free half-hours are invisible until hover. They are the primary action of the
whole view. They get a resting state — a faint ruled ground distinct from both
the closed grey and the booked fill — and a hover label rather than a bare
background shift.

A legend sits under the toolbar: confirmed, pending, free, closed. Four swatches
and four words; without it the grid has to be decoded.

### Orientation

A current-time rule, drawn only on a column whose date is today *in the grid's
zone* — not the reader's — and re-rendered on a 60-second interval. Nothing on
these grids currently says when "now" is, which is the first thing a front desk
looks for.

### Density

`RoomHeaderCard` is 140px tall: an 80px image stacked over two text lines. That
is a fifth of the viewport spent before a single hour is visible. It becomes
~92px with the image inline at 48px and the text beside it.

The 140px is currently written twice — once in the gutter spacer, once in the
column header — with a comment begging the next reader to keep them in sync.
It becomes one exported constant.

---

## 6. Blocks become clickable

Booking blocks are inert. The CRUD-parity spec deferred this on the grounds
that click-to-edit "needs a fetch-by-id path that does not exist" — but
`getBooking` is in the generated client today, and `booking-details-dialog.tsx`
is built and rendering from the table. That note is stale.

`BlockChip` becomes a button. `calendar-views.tsx` holds the open booking id,
fetches `getBooking(id)`, and renders the existing details dialog, whose Edit
action hands off to the form dialog from §3. Both grids; the "+N" overflow chip
stays a plain summary, since it stands for several bookings and has no single
one to open.

---

## 7. Toolbar

`calendar-toolbar.tsx` is a `flex-wrap` row mixing shadcn `Button`s with two
raw `<input type="time">` and a bare `<input type="checkbox">`. It reads as a
debug strip.

Regrouped, with separators, into `[Today] [‹ ›] [date] │ [Day|Week|Month] │
[from–to] [Vacant only]`.

The time pair becomes native selects stepped on the same half-hour grid the
picker and `date-time-field.tsx` already use, so the three surfaces offer the
same times. "Vacant only" becomes an `aria-pressed` toggle button — the pattern
`view-toggle.tsx` already uses for exactly this shape of control.

**No new Radix dependency.** `components/ui/` has no `select.tsx` and no
`switch.tsx`, and the folder's own convention is a styled native `<select>`
(see `add-booking-form.tsx`'s `selectClassName`, duplicated in three places).
That string becomes `components/ui/native-select.tsx`, matching `Input`'s
metrics, and the existing duplicates adopt it.

---

## 8. Click-to-book in the week view

Only `ResourceDayGrid` offers free slots; `WeekGrid` offers none, so switching
to the week view silently loses the view's main action.

With a room selected — `state.resourceId`, which `calendar-section.tsx` does
populate, contrary to the previous spec's "dead" note — the week columns get
the same free-slot buttons the day grid has, under the same rule: a slot is
only offered when the resource's own minimum duration clears the next booking
and fits before close.

Unfiltered, a week column aggregates every room, so there is no single room a
click could book. Clicking empty space there navigates to that day's grid
instead — which is where the room columns are.

---

## Files

**Backend** — `booking.dto.ts`, `booking.service.ts`, `availability.service.ts`,
`booking.doc.ts`, `booking.service.spec.ts`, `availability.service.spec.ts`.

**Frontend** — regenerate `lib/service/`; then new `booking-form-dialog.tsx`,
`booking-slot-picker.tsx`, `booking-customer-fields.tsx`,
`components/ui/native-select.tsx`; deleted `add-booking-form.tsx`; edited
`actions.ts`, `booking-status.ts`, `booking-table.tsx`, `add-booking-button.tsx`,
`calendar-views.tsx`, `calendar-toolbar.tsx`, `resource-day-grid.tsx`,
`week-grid.tsx`, `room-header-card.tsx`.

---

## Testing

The backend has specs; the cases are listed in §2.

The frontend has no test setup. Verification is `npx tsc --noEmit`, `npm run
lint`, and a manual pass:

- reschedule a credit-covered booking longer, and check the charge follows
- reschedule a booking onto its own window (the `excludeBookingId` path)
- reschedule onto an occupied window and read the 409 copy
- reschedule a booking whose extras were repriced since, and confirm the
  snapshot prices are what get charged
- book a slot from the picker, and double-book it from a second tab
- book outside opening hours through the manual escape hatch
- page the picker across a month boundary, and switch resource mid-pick
- click a block in the day grid and in the week grid
- click a free slot in the week grid with a room selected, and without one
- read all three grids in dark mode

---

## Not in scope

- **Moving a booking between rooms.** §1 explains why; still cancel-and-rebook.
- **Un-flagging a no-show.** `markNoShow` is one-way; a backend gap, unchanged.
- **Member and company selects cap at 100 with no search.** Carried over
  unfixed from the CRUD-parity spec. Member 101 is still unbookable.
- **A dated cancellation series.** Still blocked on a `cancelled_at` column.
- **Drag-to-move on the grid.** The reschedule API in §1 would support it. It
  is a separate interaction with its own touch, keyboard and undo problems, and
  the dialog picker has to exist first either way.
