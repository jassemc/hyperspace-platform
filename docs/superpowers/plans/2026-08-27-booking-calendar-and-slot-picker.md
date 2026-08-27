# Booking slot picker + calendar pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff pick booking times from real availability instead of typing them, let a booking be rescheduled instead of cancelled and rebooked, and put the three calendar grids back on the design system with their two obvious actions actually clickable.

**Architecture:** Backend first — `PATCH /bookings/{id}` learns `startsAt`/`endsAt` and re-runs the money in one transaction, and availability learns to exclude the booking being moved. Then the frontend regenerates its client, moves the create/edit form from a 440px drawer into a wide dialog holding a two-column availability picker, and reworks the grids.

**Tech Stack:** NestJS 11 + TypeORM + Postgres (backend, Jest); Next.js App Router + React 19 + Tailwind v4 + shadcn/Radix + react-day-picker (frontend, no test runner).

**Spec:** `docs/superpowers/specs/2026-08-27-booking-calendar-and-slot-picker-design.md` (in `hyperspace-platform`)

## Global Constraints

- **Two repos.** Backend paths are relative to `/Users/mohamedali.may/Workspace/Personal/hs/hscowork-backend-platform`; frontend paths to `/Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform`. Every task header names which.
- **Backend package manager is `pnpm`.** Frontend is `npm`.
- **Backend tests are real and must pass:** `pnpm test -- booking` and `pnpm type-check`.
- **The frontend has no test runner.** Its verification is `npx tsc --noEmit` and `npm run lint`, plus the named manual check in each task. This is the repo's actual state, not a shortcut — do not add a test framework as part of this work.
- **Times only.** No task in this plan lets a booking change resource. If you find yourself adding `resourceId` to `UpdateBookingDto`, stop — that is explicitly out of scope.
- **No new dependencies in either repo.** Task 9 exists specifically to avoid pulling in `@radix-ui/react-select`.
- **`from` is inclusive, `to` is EXCLUSIVE** on every availability and calendar range. To cover 13–19 July, pass the 20th at 00:00.
- **Never default a timezone.** `formatDateTime`/`formatTimeOfDay` take `timeZone` as a required argument by deliberate design; keep it that way.
- **Commit after every task**, using Conventional Commits with a `booking` scope, e.g. `feat(booking): …`. End every commit message with:
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

---

# Phase A — Backend (`hscowork-backend-platform`)

### Task 1: `assertFree` can ignore one booking

**Why:** Extending 10:00–11:00 to 10:00–12:00 overlaps the booking's own row. Without this, every reschedule that keeps any part of its current window conflicts with itself.

**Files:**
- Modify: `src/modules/booking/services/availability.service.ts:76-97`
- Modify: `src/modules/booking/services/booking.service.ts:774-781` (`assertNoOverlap`)
- Test: `src/modules/booking/services/availability.service.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `AvailabilityService.assertFree(resourceId: string, startsAt: Date, endsAt: Date, excludeBookingId?: string): Promise<void>`
  - `BookingService.assertNoOverlap(resourceId: string, startsAt: Date, endsAt: Date, excludeBookingId?: string): Promise<void>` (private)

- [ ] **Step 1: Write the failing test**

Add to `src/modules/booking/services/availability.service.spec.ts`, inside the existing `describe('AvailabilityService.assertFree', …)` block:

```ts
  it('ignores the booking being moved, so a reschedule does not conflict with itself', async () => {
    await service.assertFree(RESOURCE_ID, startsAt, endsAt, 'the-booking');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        resourceId: RESOURCE_ID,
        status: BookingStatus.CONFIRMED,
        id: Not('the-booking'),
      }),
    });
  });

  it('adds no id predicate when nothing is excluded', async () => {
    await service.assertFree(RESOURCE_ID, startsAt, endsAt);

    const [[arg]] = repository.findOne.mock.calls as [[{ where: object }]];
    expect(arg.where).not.toHaveProperty('id');
  });
```

Add `Not` to the `typeorm` import at the top of the spec file:

```ts
import { Not } from 'typeorm';
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hscowork-backend-platform
pnpm test -- availability.service.spec
```

Expected: FAIL — the first new test reports the received `where` has no `id` key.

- [ ] **Step 3: Implement**

In `availability.service.ts`, add `Not` to the `typeorm` import:

```ts
import { LessThan, MoreThan, Not, Repository } from 'typeorm';
```

Replace `assertFree` (keep the existing doc comment above it, and append the new paragraph):

```ts
  /**
   * …existing comment kept verbatim…
   *
   * `excludeBookingId` is the reschedule case: a booking being moved
   * overlaps its own row for any new window that touches its old one, so
   * without excluding it every "make it half an hour longer" would 409.
   * The Postgres exclusion constraint needs no equivalent — it never
   * conflicts a row with itself on UPDATE.
   */
  async assertFree(
    resourceId: string,
    startsAt: Date,
    endsAt: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const overlap = await this.bookingRepository.findOne({
      where: {
        resourceId,
        status: BookingStatus.CONFIRMED,
        // Half-open: a booking ending exactly when this one starts is
        // adjacent, not overlapping.
        startsAt: LessThan(endsAt),
        endsAt: MoreThan(startsAt),
        ...(excludeBookingId ? { id: Not(excludeBookingId) } : {}),
      },
    });
    if (overlap) {
      throw conflictProblem(
        'booking_conflict',
        'The resource is already booked for this time',
      );
    }
  }
```

In `booking.service.ts`, widen `assertNoOverlap`:

```ts
  private async assertNoOverlap(
    resourceId: string,
    startsAt: Date,
    endsAt: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    await this.resourceService.findOrFail(resourceId);
    await this.availability.assertFree(
      resourceId,
      startsAt,
      endsAt,
      excludeBookingId,
    );
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm test -- availability.service.spec booking.service.spec
pnpm type-check
```

Expected: PASS. `create()` and `confirm()` call `assertNoOverlap` with three arguments and are unaffected.

- [ ] **Step 5: Commit**

```bash
git add src/modules/booking/services/availability.service.ts \
        src/modules/booking/services/availability.service.spec.ts \
        src/modules/booking/services/booking.service.ts
git commit -m "$(cat <<'EOF'
feat(booking): let the slot check ignore the booking being moved

A reschedule that keeps any part of its current window overlaps its own
row. The GiST exclusion never conflicts a row with itself on UPDATE, so
only the pre-check was wrong.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `GET /resources/:id/availability` can ignore one booking

**Why:** The edit picker paints the booking's own hour as busy, so the one slot it cannot be moved to is exactly where "make it longer" starts.

**Files:**
- Modify: `src/modules/booking/dtos/availability.dto.ts:6-20` (`AvailabilityQueryDto`)
- Modify: `src/modules/booking/services/availability.service.ts` (`availability`, `availabilityFor`, `busyIntervals`)
- Modify: `src/modules/booking/controllers/resource-availability.controller.ts:26-36`
- Test: `src/modules/booking/services/availability.service.spec.ts`

**Interfaces:**
- Consumes: Task 1's `assertFree` signature (unchanged here).
- Produces:
  - `AvailabilityQueryDto` gains `excludeBookingId?: string`
  - `AvailabilityService.availability(caller, resourceId, fromIso, toIso, excludeBookingId?)`
  - `AvailabilityService.availabilityFor(resourceId, fromIso, toIso, options: { includeHidden: boolean; excludeBookingId?: string })`

**The public endpoint does NOT get this.** A website visitor has no booking to exclude, and the parameter would let them hide an occupied slot from the read and manufacture a 409 on submit. `PublicResourceAvailabilityParams` and the `/public` controller stay untouched.

- [ ] **Step 1: Write the failing test**

Add a new `describe` block at the end of `availability.service.spec.ts`:

```ts
describe('AvailabilityService.availabilityFor — excludeBookingId', () => {
  let service: AvailabilityService;

  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  const repository = { findOne: jest.fn(), createQueryBuilder: jest.fn(() => qb) };
  const resourceService = {
    findOrFail: jest.fn(),
    selfAndAncestors: jest.fn(),
  };
  const resourceTypeService = { findOrFail: jest.fn() };
  const locationService = { findOrFail: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb.where.mockReturnThis();
    qb.andWhere.mockReturnThis();
    qb.orderBy.mockReturnThis();
    qb.getMany.mockResolvedValue([]);
    repository.createQueryBuilder.mockReturnValue(qb);

    const resource = {
      id: RESOURCE_ID,
      resourceTypeId: 'type-1',
      locationId: 'loc-1',
      hidden: false,
      active: true,
      minDurationMin: 60,
      maxDurationMin: 480,
      cancellationHours: 24,
      bookingTimes: null,
    } as unknown as ResourceEntity;
    resourceService.findOrFail.mockResolvedValue(resource);
    resourceService.selfAndAncestors.mockResolvedValue([resource]);
    resourceTypeService.findOrFail.mockResolvedValue({
      canBook: true,
      bookingMode: 'hourly',
      slug: 'meeting-room',
    });
    locationService.findOrFail.mockResolvedValue({
      timezone: 'Africa/Tunis',
      openingHours: null,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: getRepositoryToken(BookingEntity), useValue: repository },
        { provide: ResourceService, useValue: resourceService },
        { provide: ResourceTypeService, useValue: resourceTypeService },
        { provide: LocationService, useValue: locationService },
      ],
    }).compile();

    service = moduleRef.get(AvailabilityService);
  });

  it('excludes the named booking from the busy intervals', async () => {
    await service.availabilityFor(
      RESOURCE_ID,
      '2026-08-26T00:00:00Z',
      '2026-08-27T00:00:00Z',
      { includeHidden: true, excludeBookingId: 'the-booking' },
    );

    expect(qb.andWhere).toHaveBeenCalledWith('b.id <> :excludeBookingId', {
      excludeBookingId: 'the-booking',
    });
  });

  it('adds no exclusion predicate when none is asked for', async () => {
    await service.availabilityFor(
      RESOURCE_ID,
      '2026-08-26T00:00:00Z',
      '2026-08-27T00:00:00Z',
      { includeHidden: true },
    );

    const clauses = qb.andWhere.mock.calls.map(([sql]) => sql as string);
    expect(clauses).not.toContain('b.id <> :excludeBookingId');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test -- availability.service.spec
```

Expected: FAIL — `andWhere` was never called with the exclusion clause.

- [ ] **Step 3: Implement**

`src/modules/booking/dtos/availability.dto.ts` — add to `AvailabilityQueryDto`, and add `IsOptional`/`IsUUID` to the `class-validator` import:

```ts
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
```

```ts
  /**
   * Staff-only: the booking currently being rescheduled. Its own busy
   * interval is dropped from the response, so the slot it already holds
   * reads as free — which is where "make it half an hour longer" starts.
   * Deliberately absent from the public endpoint: a visitor has no
   * booking to exclude, and the parameter would only let them hide an
   * occupied slot and manufacture a 409 on submit.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  excludeBookingId?: string;
```

`src/modules/booking/services/availability.service.ts`:

```ts
  async availability(
    caller: IUser,
    resourceId: string,
    fromIso: string,
    toIso: string,
    excludeBookingId?: string,
  ): Promise<AvailabilityDto> {
    const isAdmin =
      caller.role?.type === RoleType.ADMIN ||
      caller.role?.type === RoleType.SUPER_ADMIN;
    return this.availabilityFor(resourceId, fromIso, toIso, {
      includeHidden: isAdmin,
      excludeBookingId,
    });
  }
```

Widen `availabilityFor`'s options and forward it:

```ts
  async availabilityFor(
    resourceId: string,
    fromIso: string,
    toIso: string,
    options: { includeHidden: boolean; excludeBookingId?: string },
  ): Promise<AvailabilityDto> {
```

and its last line before `return dto`:

```ts
    dto.busy = await this.busyIntervals(
      resource.id,
      from,
      to,
      options.excludeBookingId,
    );
```

`busyIntervals`:

```ts
  private async busyIntervals(
    resourceId: string,
    from: Date,
    to: Date,
    excludeBookingId?: string,
  ): Promise<BusyIntervalDto[]> {
    const query = this.bookingRepository
      .createQueryBuilder('b')
      .where('b.resource_id = :resourceId', { resourceId })
      .andWhere('b.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('b.starts_at < :to AND b.ends_at > :from', {
        from: from.toISOString(),
        to: to.toISOString(),
      });

    if (excludeBookingId) {
      query.andWhere('b.id <> :excludeBookingId', { excludeBookingId });
    }

    const rows = await query.orderBy('b.starts_at', 'ASC').getMany();
```

(the `rows.map(...)` body below is unchanged.)

`src/modules/booking/controllers/resource-availability.controller.ts` — forward the param:

```ts
    return this.availabilityService.availability(
      caller,
      id,
      query.from,
      query.to,
      query.excludeBookingId,
    );
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm test -- availability.service.spec
pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/booking/dtos/availability.dto.ts \
        src/modules/booking/services/availability.service.ts \
        src/modules/booking/services/availability.service.spec.ts \
        src/modules/booking/controllers/resource-availability.controller.ts
git commit -m "$(cat <<'EOF'
feat(booking): let availability drop the booking being rescheduled

Staff-only, and not on the public endpoint: a visitor has no booking to
exclude, and the parameter would only hide an occupied slot from the read
and manufacture a 409 on submit.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Extract `reverseBookingMoney` out of `cancel()`

**Why:** A reschedule reverses the old money before applying the new. That reversal is `cancel()`'s transaction body — including its ordering constraint, where the compensating rows are themselves uninvoiced booking charges the delete above would sweep. Two copies of that would drift.

This is a pure refactor: no behaviour changes and no test changes. The existing `cancel` tests are the safety net.

**Files:**
- Modify: `src/modules/booking/services/booking.service.ts:278-315` (`cancel`'s transaction body)
- Test: `src/modules/booking/services/booking.service.spec.ts` (unchanged — must still pass)

**Interfaces:**
- Consumes: nothing.
- Produces: `private async reverseBookingMoney(manager: EntityManager, bookingId: string): Promise<void>`

- [ ] **Step 1: Confirm the existing tests pass before touching anything**

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hscowork-backend-platform
pnpm test -- booking.service.spec -t "cancel"
```

Expected: PASS (5 tests). If they do not pass, stop — the refactor has no safety net.

- [ ] **Step 2: Extract the helper**

Add `EntityManager` to the `typeorm` import in `booking.service.ts`:

```ts
import {
  Brackets,
  DataSource,
  type EntityManager,
  Repository,
  type SelectQueryBuilder,
} from 'typeorm';
```

Add to the `// ─── internals ───` section:

```ts
  /**
   * Undo a booking's money, inside a caller-supplied transaction: its
   * consumed credits and its uninvoiced charges go, and anything already
   * frozen onto an invoice is compensated rather than deleted (§4.14
   * — a frozen charge cannot be removed, so the correction is a negative
   * charge, left uninvoiced so staff issuing it produce a credit note).
   *
   * Shared by cancel() and by update()'s reschedule branch, which
   * reverses before re-applying at the new window.
   *
   * ORDER MATTERS: the compensating INSERT must run after the delete
   * above it. The rows it writes are themselves uninvoiced booking
   * charges, and the delete would sweep them.
   */
  private async reverseBookingMoney(
    manager: EntityManager,
    bookingId: string,
  ): Promise<void> {
    await manager.query(
      `DELETE FROM "credit_transactions"
       WHERE "booking_id" = $1 AND "delta" < 0`,
      [bookingId],
    );
    await manager.query(
      `DELETE FROM "charges"
       WHERE "booking_id" = $1 AND "invoice_id" IS NULL`,
      [bookingId],
    );
    await manager.query(
      `INSERT INTO "charges" (
         "member_id", "company_id", "membership_id", "booking_id",
         "plan_id", "kind", "description", "amount_ht", "vat_rate",
         "accounting_code", "invoice_id"
       )
       SELECT c."member_id", c."company_id", c."membership_id",
              c."booking_id", c."plan_id", c."kind",
              'Cancellation — ' || c."description"
                || ' (invoiced on ' || i."number" || ')',
              -c."amount_ht", c."vat_rate", c."accounting_code", NULL
       FROM "charges" c
       JOIN "invoices" i ON i."id" = c."invoice_id"
       WHERE c."booking_id" = $1 AND c."invoice_id" IS NOT NULL`,
      [bookingId],
    );
  }
```

- [ ] **Step 3: Point `cancel()` at it**

Replace `cancel()`'s transaction body (the three `manager.query` calls and their comments) with:

```ts
    const saved = await this.dataSource.transaction(async (manager) => {
      await this.reverseBookingMoney(manager, booking.id);
      booking.status = BookingStatus.CANCELLED;
      return manager.save(booking);
    });
```

- [ ] **Step 4: Run the tests to verify nothing moved**

```bash
pnpm test -- booking.service.spec
pnpm type-check
```

Expected: PASS, all of them. The `cancel` block asserts on `managerQueries` (the SQL strings pushed by the manager double), so an accidental reordering or a dropped statement fails loudly.

- [ ] **Step 5: Commit**

```bash
git add src/modules/booking/services/booking.service.ts
git commit -m "$(cat <<'EOF'
refactor(booking): extract reverseBookingMoney from cancel

The reschedule branch reverses the same way cancel does, ordering
constraint included. One copy, so the two cannot drift.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Extract `applyBookingMoney` out of `create()` and `confirm()`

**Why:** The consume-credits-then-write-charges block exists three times once the reschedule lands — in `create`, in `confirm`, and in `update`. It is already duplicated twice today.

Pure refactor again. No test changes.

**Files:**
- Modify: `src/modules/booking/services/booking.service.ts` (`create`'s and `confirm`'s transaction bodies)
- Test: `src/modules/booking/services/booking.service.spec.ts` (unchanged — must still pass)

**Interfaces:**
- Consumes: Task 3's `EntityManager` import.
- Produces:

```ts
private async applyBookingMoney(
  manager: EntityManager,
  booking: BookingEntity,
  quote: BookingQuoteDto,
): Promise<void>
```

- [ ] **Step 1: Confirm the existing tests pass**

```bash
pnpm test -- booking.service.spec -t "create"
pnpm test -- booking.service.spec -t "confirm"
```

Expected: PASS.

- [ ] **Step 2: Add the helper**

In the `// ─── internals ───` section:

```ts
  /**
   * Write a booking's money, inside a caller-supplied transaction:
   * consume the quote's credit plan, then charge the room remainder and
   * one row per extra. The customer is read off the booking, not off a
   * DTO — a reschedule has no customer in its payload, and create's
   * resolved customer is already on the row by the time this runs.
   *
   * Shared by create(), confirm() and update()'s reschedule branch.
   */
  private async applyBookingMoney(
    manager: EntityManager,
    booking: BookingEntity,
    quote: BookingQuoteDto,
  ): Promise<void> {
    for (const entry of quote.consumptionPlan) {
      await this.creditsService.consume(
        {
          membershipId: entry.membershipId,
          creditType: 'room_hour',
          amount: entry.amount,
          bookingId: booking.id,
          resourceTypeId: quote.resourceTypeId,
          reason: `booking ${booking.id}`,
        },
        manager,
      );
    }

    if (quote.priceHt !== null && quote.priceHt !== undefined) {
      await this.chargesService.create(
        {
          memberId: booking.memberId,
          companyId: booking.companyId,
          bookingId: booking.id,
          kind: ChargeKind.BOOKING,
          description: `Booking — ${quote.chargedUnits} × ${String(quote.bookingMode)} unit(s)`,
          amountHt: quote.priceHt,
          vatRate: quote.vatRate ?? 19,
        },
        manager,
      );
    }

    for (const extra of quote.extras) {
      await this.chargesService.create(
        {
          memberId: booking.memberId,
          companyId: booking.companyId,
          bookingId: booking.id,
          kind: ChargeKind.BOOKING,
          description: `Booking extra — ${extra.name}`,
          amountHt: extra.priceHt,
          vatRate: extra.vatRate,
        },
        manager,
      );
    }
  }
```

- [ ] **Step 3: Point `create()` at it**

`create()`'s transaction body becomes:

```ts
      const saved = await this.dataSource.transaction(async (manager) => {
        const booking = await manager.save(
          manager.create(BookingEntity, {
            resourceId: dto.resourceId,
            memberId: customer.member?.id ?? null,
            companyId: customer.companyId ?? null,
            startsAt,
            endsAt,
            status: BookingStatus.CONFIRMED,
            priceHt: quote.priceHt ?? null,
            source,
            title: dto.title ?? null,
            notes: dto.notes ?? null,
            extras: quote.extras,
          }),
        );

        await this.applyBookingMoney(manager, booking, quote);
        return booking;
      });
```

- [ ] **Step 4: Point `confirm()` at it**

`confirm()`'s transaction body becomes:

```ts
      const saved = await this.dataSource.transaction(async (manager) => {
        booking.status = BookingStatus.CONFIRMED;
        booking.priceHt = quote.priceHt ?? null;
        booking.extras = quote.extras;
        const persisted = await manager.save(booking);

        await this.applyBookingMoney(manager, persisted, quote);
        return persisted;
      });
```

Note `create` passes the entity *after* `manager.save`, so `booking.id` is populated — the helper reads `booking.id`, and an unsaved entity would link every ledger row to `undefined`.

- [ ] **Step 5: Run the tests to verify nothing moved**

```bash
pnpm test -- booking.service.spec
pnpm type-check
```

Expected: PASS. The create/confirm blocks assert on `creditsService.consume` and `chargesService.create` call arguments, so a changed description string or a dropped VAT fallback fails.

- [ ] **Step 6: Commit**

```bash
git add src/modules/booking/services/booking.service.ts
git commit -m "$(cat <<'EOF'
refactor(booking): extract applyBookingMoney from create and confirm

Already duplicated twice; the reschedule branch would have made three.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `UpdateBookingDto` accepts times

**Files:**
- Modify: `src/modules/booking/dtos/booking.dto.ts:184-191`
- Test: covered by Task 6's service tests (a DTO with only decorators has nothing to unit-test in isolation; the validation pipe is exercised end-to-end by `test/bookings-exclusion.e2e-spec.ts`).

**Interfaces:**
- Consumes: nothing.
- Produces: `UpdateBookingDto { title?: string; notes?: string; status?: BookingStatus.NO_SHOW; startsAt?: string; endsAt?: string }`

- [ ] **Step 1: Edit the DTO**

```ts
export class UpdateBookingDto extends PartialType(
  PickType(CreateBookingDto, ['title', 'notes'] as const),
) {
  @ApiPropertyOptional({ enum: [BookingStatus.NO_SHOW] })
  @IsIn([BookingStatus.NO_SHOW])
  @IsOptional()
  status?: BookingStatus.NO_SHOW;

  /**
   * Reschedule. Both times or neither — one alone is refused with
   * `reschedule_requires_both`, because "move the end" alone is far
   * more often a dropped field than an intent.
   *
   * The resource deliberately cannot move: it would change the rate,
   * invalidate the extras (they hang off the old resource's rates) and
   * rescope the credits, which are scoped to a resource TYPE. Changing
   * rooms stays cancel-and-rebook.
   */
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

`IsDateString` is already imported at the top of this file (`BookingPageOptionsDto` uses it). Verify before adding it.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/booking/dtos/booking.dto.ts
git commit -m "$(cat <<'EOF'
feat(booking): accept startsAt and endsAt on the update DTO

Times only. The resource cannot move: it would change the rate,
invalidate the extras and rescope the credits.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `update()` reschedules

**Files:**
- Modify: `src/modules/booking/services/booking.service.ts:428-465` (`update`)
- Test: `src/modules/booking/services/booking.service.spec.ts` (new `describe` block)

**Interfaces:**
- Consumes: `reverseBookingMoney` (Task 3), `applyBookingMoney` (Task 4), `assertNoOverlap(..., excludeBookingId?)` (Task 1), `UpdateBookingDto.startsAt/endsAt` (Task 5).
- Produces: nothing new. `update`'s signature is unchanged.

**The rules, in order:**

| Condition | Problem type | Status |
|---|---|---|
| exactly one of `startsAt`/`endsAt` | `reschedule_requires_both` | 422 |
| `endsAt <= startsAt` | `date_range_invalid` | 422 |
| status not `confirmed`/`pending` | `booking_not_reschedulable` | 409 |
| the new window overlaps another confirmed booking | `booking_conflict` | 409 |

Members additionally pass the existing `assertWithinCancellationWindow`. Staff may move a booking whose start has passed — correcting a mis-typed time is a real need, and refusing it leaves no way to fix the row.

- [ ] **Step 1: Write the failing tests**

Add to `booking.service.spec.ts`, inside `describe('BookingService', …)`, after the existing `describe('update', …)` block:

```ts
  describe('update — reschedule', () => {
    const existing = (over: Partial<BookingEntity> = {}) =>
      Object.assign(new BookingEntity(), {
        id: BOOKING_ID,
        resourceId: RESOURCE_ID,
        memberId: MEMBER_ID,
        companyId: null,
        status: BookingStatus.CONFIRMED,
        startsAt: inHours(24),
        endsAt: inHours(25),
        priceHt: 60,
        extras: [{ extraId: 'x1', name: 'Projector', priceHt: 30, vatRate: 19, totalTtc: 35.7 }],
        ...over,
      } as Partial<BookingEntity>);

    beforeEach(() => {
      repository.findOne.mockResolvedValue(existing());
      pricing.quote.mockResolvedValue(quote({ priceHt: 120, chargedUnits: 2 }));
    });

    it('refuses one time without the other', async () => {
      await expect(
        service.update(caller(RoleType.ADMIN), BOOKING_ID, {
          startsAt: inHours(48).toISOString(),
        }),
      ).rejects.toMatchObject({ response: { type: 'reschedule_requires_both' } });
    });

    it('refuses an end at or before the start', async () => {
      await expect(
        service.update(caller(RoleType.ADMIN), BOOKING_ID, {
          startsAt: inHours(48).toISOString(),
          endsAt: inHours(48).toISOString(),
        }),
      ).rejects.toMatchObject({ response: { type: 'date_range_invalid' } });
    });

    it('refuses to move a cancelled booking', async () => {
      repository.findOne.mockResolvedValue(
        existing({ status: BookingStatus.CANCELLED }),
      );

      await expect(
        service.update(caller(RoleType.ADMIN), BOOKING_ID, {
          startsAt: inHours(48).toISOString(),
          endsAt: inHours(50).toISOString(),
        }),
      ).rejects.toMatchObject({ response: { type: 'booking_not_reschedulable' } });
    });

    it('excludes the booking itself from the overlap check', async () => {
      await service.update(caller(RoleType.ADMIN), BOOKING_ID, {
        startsAt: inHours(24).toISOString(),
        endsAt: inHours(26).toISOString(),
      });

      expect(availabilityService.assertFree).toHaveBeenCalledWith(
        RESOURCE_ID,
        expect.any(Date),
        expect.any(Date),
        BOOKING_ID,
      );
    });

    it('reverses the old money before applying the new, and writes the new window', async () => {
      await service.update(caller(RoleType.ADMIN), BOOKING_ID, {
        startsAt: inHours(48).toISOString(),
        endsAt: inHours(50).toISOString(),
      });

      // Reversal ran: ledger sweep, uninvoiced sweep, then the
      // compensating insert — in that order.
      expect(managerQueries[0]).toContain('DELETE FROM "credit_transactions"');
      expect(managerQueries[1]).toContain('DELETE FROM "charges"');
      expect(managerQueries[2]).toContain('INSERT INTO "charges"');

      // Re-applied at the new price.
      expect(chargesService.create).toHaveBeenCalledWith(
        expect.objectContaining({ amountHt: 120, bookingId: BOOKING_ID }),
        expect.anything(),
      );

      expect(lastSaved?.startsAt).toEqual(inHours(48));
      expect(lastSaved?.endsAt).toEqual(inHours(50));
      expect(lastSaved?.priceHt).toBe(120);
    });

    it('re-prices the room live but freezes the extras at their snapshot', async () => {
      await service.update(caller(RoleType.ADMIN), BOOKING_ID, {
        startsAt: inHours(48).toISOString(),
        endsAt: inHours(50).toISOString(),
      });

      const [, , , , extraIds, frozen] = pricing.quote.mock.calls[0] as [
        unknown, unknown, unknown, unknown, string[],
        { priceHt: number | null; extras: { extraId: string; priceHt: number }[] },
      ];
      expect(extraIds).toEqual(['x1']);
      // priceHt null = the room re-prices at the new duration; the extras
      // array is what holds their old prices.
      expect(frozen.priceHt).toBeNull();
      expect(frozen.extras).toEqual([{ extraId: 'x1', priceHt: 30 }]);
    });

    it('quotes for the booking own customer, not the caller payload', async () => {
      await service.update(caller(RoleType.ADMIN), BOOKING_ID, {
        startsAt: inHours(48).toISOString(),
        endsAt: inHours(50).toISOString(),
      });

      expect(memberService.findOrFail).toHaveBeenCalledWith(MEMBER_ID);
    });

    it('a metadata-only patch opens no transaction and touches no money', async () => {
      await service.update(caller(RoleType.ADMIN), BOOKING_ID, {
        title: 'Renamed',
      });

      expect(managerQueries).toHaveLength(0);
      expect(chargesService.create).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm test -- booking.service.spec -t "reschedule"
```

Expected: FAIL — the guards do not exist, so the first tests resolve instead of rejecting.

- [ ] **Step 3: Implement**

Replace `update()` in `booking.service.ts`:

```ts
  /**
   * Metadata PATCH, plus reschedule. Times move together or not at all;
   * the resource never moves (see UpdateBookingDto).
   *
   * A reschedule re-runs the money, because price, consumed credits and
   * charge rows were all derived from the OLD duration — a booking
   * stretched from one hour to four must not stay billed for one.
   */
  async update(
    caller: IUser,
    id: string,
    dto: UpdateBookingDto,
  ): Promise<BookingDto> {
    const booking = await this.findForWrite(id);
    await this.assertCallerMayAccess(caller, booking);

    const moving = dto.startsAt !== undefined || dto.endsAt !== undefined;
    if (moving && (dto.startsAt === undefined || dto.endsAt === undefined)) {
      throw unprocessableProblem(
        'reschedule_requires_both',
        'Rescheduling needs both startsAt and endsAt',
      );
    }

    if (dto.status === BookingStatus.NO_SHOW) {
      if (caller.role?.type === RoleType.MEMBER) {
        throw forbiddenProblem(
          'no_show_requires_staff',
          'Only staff can flag a no-show',
        );
      }
      if (booking.startsAt.getTime() > Date.now()) {
        throw unprocessableProblem(
          'no_show_before_start',
          'A booking can only be flagged no-show after its start time',
        );
      }
      booking.status = BookingStatus.NO_SHOW;
    } else if (caller.role?.type === RoleType.MEMBER) {
      await this.assertWithinCancellationWindow(booking);
    }

    if (dto.title !== undefined) {
      booking.title = dto.title;
    }
    if (dto.notes !== undefined) {
      booking.notes = dto.notes;
    }

    if (!moving) {
      await this.bookingRepository.save(booking);
      // Read back for the summaries: the saved entity carries ids, not relations.
      return this.mapper.toDto(await this.findOrFail(id));
    }

    await this.reschedule(booking, dto.startsAt!, dto.endsAt!);
    return this.mapper.toDto(await this.findOrFail(id));
  }

  /**
   * Moves a booking's window and re-runs its money in ONE transaction:
   * reverse the old, re-quote at the new window, re-apply.
   *
   * The extras are NOT re-priced. They ride in as a frozen quote with a
   * null room price — `priceHt: null` is what tells the pricing service
   * to compute the room live (booking-pricing.service.ts:190) while the
   * extras array holds their booked-at prices. Extras are flat
   * per-booking add-ons that duration does not touch, so repricing them
   * because the catalogue moved would be a silent, unasked-for change.
   * confirm() freezes the same way, for the same reason.
   */
  private async reschedule(
    booking: BookingEntity,
    startsAtIso: string,
    endsAtIso: string,
  ): Promise<void> {
    const startsAt = new Date(startsAtIso);
    const endsAt = new Date(endsAtIso);
    if (endsAt <= startsAt) {
      throw unprocessableProblem(
        'date_range_invalid',
        '`startsAt` must be before `endsAt`',
      );
    }
    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.PENDING
    ) {
      throw conflictProblem(
        'booking_not_reschedulable',
        'Only confirmed or pending bookings can be rescheduled',
      );
    }

    // Excluding itself: any new window touching the old one overlaps the
    // booking's own row. The exclusion constraint needs no equivalent —
    // it never conflicts a row with itself on UPDATE.
    await this.assertNoOverlap(
      booking.resourceId,
      startsAt,
      endsAt,
      booking.id,
    );

    const customer: BookingCustomer = booking.memberId
      ? { member: await this.memberService.findOrFail(booking.memberId) }
      : { companyId: booking.companyId ?? undefined };
    const extraIds = (booking.extras ?? []).map((extra) => extra.extraId);
    const frozen: FrozenQuotePrices = {
      priceHt: null,
      extras: (booking.extras ?? []).map((extra) => ({
        extraId: extra.extraId,
        priceHt: extra.priceHt,
      })),
    };
    const quote = await this.pricing.quote(
      customer,
      booking.resourceId,
      startsAt,
      endsAt,
      extraIds,
      frozen,
    );

    try {
      await this.dataSource.transaction(async (manager) => {
        await this.reverseBookingMoney(manager, booking.id);
        booking.startsAt = startsAt;
        booking.endsAt = endsAt;
        booking.priceHt = quote.priceHt ?? null;
        booking.extras = quote.extras;
        // Through the MANAGER, not the repository: saving outside this
        // transaction would let a later failure leave a booking whose
        // window moved but whose money did not.
        const persisted = await manager.save(booking);
        await this.applyBookingMoney(manager, persisted, quote);
      });
    } catch (error) {
      if (this.isExclusionViolation(error)) {
        throw conflictProblem(
          'booking_conflict',
          'The resource is already booked for this time',
        );
      }
      throw error;
    }
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm test -- booking.service.spec
pnpm type-check
pnpm lint:check
```

Expected: PASS, including every pre-existing test.

- [ ] **Step 5: Commit**

```bash
git add src/modules/booking/services/booking.service.ts \
        src/modules/booking/services/booking.service.spec.ts
git commit -m "$(cat <<'EOF'
feat(booking): reschedule a booking instead of rebooking it

Price, credits and charges were all derived from the old duration, so a
move reverses and re-applies them in one transaction. Extras ride in as a
frozen quote with a null room price: the room re-prices at the new
window, the add-ons keep what they were booked at.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Document the new contract

**Why:** `DocUpdateBooking` currently tells every reader "Metadata only — rescheduling is cancel + rebook". Shipping Task 6 without this leaves the generated client and the Swagger page lying.

**Files:**
- Modify: `src/modules/booking/docs/booking.doc.ts:237-272`

**Interfaces:**
- Consumes: the problem types from Task 6.
- Produces: nothing consumed by later tasks; Task 8 regenerates the frontend client from the resulting `swagger.json`.

- [ ] **Step 1: Rewrite the decorator**

```ts
export function DocUpdateBooking(): MethodDecorator {
  return applyDecorators(
    Doc({
      operationId: 'updateBooking',
      summary: 'Update a booking (metadata, no_show, or reschedule)',
      description:
        'Title and notes anytime; staff may flag no_show after the start ' +
        'time. Passing startsAt AND endsAt reschedules: the slot is ' +
        're-checked (ignoring this booking itself), the room is re-priced ' +
        'at the new duration and its credits and charges are reversed and ' +
        're-applied. Extras keep the prices they were booked at. The ' +
        'resource cannot change — moving a booking between rooms is still ' +
        'cancel + rebook. Members may edit inside the cancellation window.',
    }),
    DocRequest({
      dto: UpdateBookingDto,
      params: [{ name: 'id', type: 'string' }],
    }),
    DocResponse(BookingDto),
    DocOneOf(
      HttpStatus.FORBIDDEN,
      BOOKING_ACCESS_DENIED,
      {
        type: 'no_show_requires_staff',
        title: 'Forbidden',
        detail: 'Only staff can flag a no-show',
      },
      {
        type: 'cancellation_window_passed',
        title: 'Forbidden',
        detail: 'The cancellation window has passed',
      },
    ),
    DocErrorResponse(HttpStatus.NOT_FOUND, BOOKING_NOT_FOUND),
    DocOneOf(
      HttpStatus.CONFLICT,
      {
        type: 'booking_conflict',
        title: 'Conflict',
        detail: 'The resource is already booked for this time',
      },
      {
        type: 'booking_not_reschedulable',
        title: 'Conflict',
        detail: 'Only confirmed or pending bookings can be rescheduled',
      },
    ),
    DocOneOf(
      HttpStatus.UNPROCESSABLE_ENTITY,
      {
        type: 'no_show_before_start',
        title: 'Unprocessable Entity',
        detail: 'A booking can only be flagged no-show after its start time',
      },
      {
        type: 'reschedule_requires_both',
        title: 'Unprocessable Entity',
        detail: 'Rescheduling needs both startsAt and endsAt',
      },
      {
        type: 'date_range_invalid',
        title: 'Unprocessable Entity',
        detail: '`startsAt` must be before `endsAt`',
      },
    ),
  );
}
```

`DocOneOf` is already imported in this file. If `HttpStatus.CONFLICT` is not yet used here, no import change is needed — `HttpStatus` is already imported.

Also update `DocResourceAvailability`'s description in the same file to mention the staff-only `excludeBookingId`, and check whether the existing decorator already documents `date_range_too_wide` — leave whatever is there.

- [ ] **Step 2: Verify the whole backend is green**

```bash
pnpm type-check
pnpm lint:check
pnpm test -- booking
```

Expected: PASS.

- [ ] **Step 3: Regenerate `swagger.json` for the frontend**

Start the API and capture the spec however this repo normally does (check `README.md` for the documented route; the frontend's `service-generator.config.mjs` names the source it reads).

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform
cat service-generator.config.mjs
```

Follow whatever source that config names. If it points at a running server, start the backend with `pnpm start:dev` first.

- [ ] **Step 4: Commit**

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hscowork-backend-platform
git add src/modules/booking/docs/booking.doc.ts
git commit -m "$(cat <<'EOF'
docs(booking): document reschedule on the update endpoint

The decorator still told every reader rescheduling was cancel + rebook.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase B — Frontend (`hyperspace-platform`)

**Read this before starting Phase B.** There is no test runner. Every task's verification is:

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform
npx tsc --noEmit && npm run lint
```

plus the named manual check, run against `npm run dev`. Do not claim a task done without running both commands and seeing them clean.

---

### Task 8: Regenerate the API client

**Files:**
- Modify: `lib/service/` (generated — do not hand-edit)

**Interfaces:**
- Consumes: the backend's regenerated `swagger.json` (Task 7).
- Produces: `UpdateBookingDto` gains `startsAt?: string; endsAt?: string`; `GetResourceAvailabilityParams` gains `excludeBookingId?: string`.

- [ ] **Step 1: Regenerate**

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform
npm run generate
```

- [ ] **Step 2: Verify the two new fields landed**

```bash
grep -n "excludeBookingId" lib/service/HsService.ts
grep -n "startsAt" -A 2 -B 8 lib/service/HsService.ts | grep -n "UpdateBookingDto" -A 20
```

Expected: `excludeBookingId?: string` on `GetResourceAvailabilityParams`, and `startsAt?: string` / `endsAt?: string` on `UpdateBookingDto`. If either is missing, the backend swagger was not regenerated — go back to Task 7 Step 3.

- [ ] **Step 3: Type-check and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: clean. The additions are optional, so nothing existing breaks.

- [ ] **Step 4: Commit**

```bash
git add lib/service
git commit -m "$(cat <<'EOF'
chore(api): regenerate the client for reschedule and slot exclusion

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `native-select.tsx`, and the three copies it replaces

**Why:** `components/ui/` has no `select.tsx` and no `switch.tsx`, and the folder's convention is a styled native `<select>`. That class string is copy-pasted; Tasks 13 and 15 both need it. Adding `@radix-ui/react-select` for a time picker would be a new dependency for no gain.

**Files:**
- Create: `components/ui/native-select.tsx`
- Modify: `app/booking/bookings/add-booking-form.tsx` (the `selectClassName` const and its three uses)

**Interfaces:**
- Consumes: nothing.
- Produces: `NativeSelect` — a `React.ComponentProps<"select">` passthrough, forwarding `ref`, matching `Input`'s metrics.

- [ ] **Step 1: Read `Input` so the metrics actually match**

```bash
cat components/ui/input.tsx
```

Copy its height, border, radius, padding, focus-ring and disabled classes exactly. Do not eyeball them.

- [ ] **Step 2: Create the component**

```tsx
"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A native <select> on Input's metrics.
 *
 * components/ui/ has no Radix Select, and this needs none: the options
 * here are short, static lists (times on a half-hour grid, a customer
 * kind, a resource). A native control also gets the platform's own
 * picker on touch, which is better than anything we would draw. The
 * class string this replaces was copy-pasted in three places.
 */
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          // Keep in step with components/ui/input.tsx.
          "flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
      />
    </div>
  )
}

export { NativeSelect }
```

Adjust the class string in Step 2 to whatever `input.tsx` actually says — the comment above it is a promise.

- [ ] **Step 3: Adopt it in the existing form**

In `app/booking/bookings/add-booking-form.tsx`: delete the `selectClassName` const, import `NativeSelect`, and replace the three `<select className={selectClassName} …>` elements (`resourceId`, `customerKind`, `memberId`/`companyId`) with `<NativeSelect …>`, dropping the `className` prop. Keep every other attribute — `id`, `name`, `value`, `onChange`, `required`.

This file is deleted in Task 15. Doing it here anyway keeps this task independently reviewable and keeps the tree compiling between tasks.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual: `npm run dev`, open `/booking/bookings`, click **Add Booking**, and confirm the three selects render at the same height and with the same border as the Title input beside them.

- [ ] **Step 5: Commit**

```bash
git add components/ui/native-select.tsx app/booking/bookings/add-booking-form.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add a native select on Input's metrics

Three copies of the same class string, and two upcoming callers. No
Radix Select: the lists are short and static, and a native control gets
the platform picker on touch.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: One source of truth for block colour

**Why:** `resource-day-grid.tsx` and `week-grid.tsx` each hardcode their own emerald/amber pair in light and dark — four places, none of them a token. `globals.css` issues a blue `--primary` and standard neutrals, so the calendar reads as a different product.

**Files:**
- Modify: `app/booking/bookings/booking-status.ts`
- Modify: `components/booking/calendar/resource-day-grid.tsx` (`BlockChip`)
- Modify: `components/booking/calendar/week-grid.tsx` (the inline block `div`)

**Interfaces:**
- Consumes: nothing.
- Produces: `BOOKING_BLOCK_STYLES: Record<BookingStatus, string>` exported from `app/booking/bookings/booking-status.ts`.

- [ ] **Step 1: Add the map**

Append to `app/booking/bookings/booking-status.ts`:

```ts
/**
 * How a booking is drawn ON THE CALENDAR — distinct from
 * BOOKING_STATUS_CLASSES, which styles a table badge.
 *
 * Confirmed sits on the primary token rather than the emerald both grids
 * used to hardcode; nothing in globals.css ever issued that green.
 *
 * Pending keeps a DASHED border, and that is not decoration: a pending
 * request does not hold the slot (the exclusion constraint is scoped to
 * confirmed rows), which is why several may legitimately overlap and why
 * the grids lane them side by side. Encoding that in hue alone would
 * lose it for anyone who cannot separate the two.
 */
export const BOOKING_BLOCK_STYLES: Record<BookingStatus, string> = {
    confirmed: "border-primary/30 bg-primary/10 text-foreground",
    pending: "border-dashed border-amber-500/60 bg-amber-500/10 text-foreground",
    cancelled: "border-border bg-muted text-muted-foreground line-through",
    no_show: "border-border border-dashed bg-muted text-muted-foreground",
}
```

`cancelled` and `no_show` never reach the grids today (the calendar endpoint returns confirmed and pending blocks only), but a `Record<BookingStatus, …>` must be total, and giving them a deliberate look now beats a runtime `undefined` if the endpoint ever widens.

- [ ] **Step 2: Adopt in the day grid**

In `resource-day-grid.tsx`, import it and replace `BlockChip`'s `cn(...)` conditional:

```tsx
import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
```

```tsx
  const pending = block.status === "pending"
  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-md border px-2 py-1 text-xs",
        BOOKING_BLOCK_STYLES[block.status]
      )}
      style={laneStyle(lane, lanes, top, height)}
      title={`${block.title ?? "Untitled"} — ${block.customerName ?? "No customer"}`}
    >
```

Keep the `pending` const — the `" · pending"` suffix in the second `<p>` still uses it.

- [ ] **Step 3: Adopt in the week grid**

In `week-grid.tsx`, same import, and replace the inline ternary:

```tsx
                      className={cn(
                        "absolute overflow-hidden rounded border px-1.5 py-0.5 text-[11px]",
                        BOOKING_BLOCK_STYLES[item.block.status]
                      )}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual: `/booking/bookings?view=calendar` in both light and dark (toggle the OS theme), day and week views. Confirmed blocks should be blue-tinted; pending should stay dashed and amber. Nothing should be emerald.

- [ ] **Step 5: Commit**

```bash
git add app/booking/bookings/booking-status.ts \
        components/booking/calendar/resource-day-grid.tsx \
        components/booking/calendar/week-grid.tsx
git commit -m "$(cat <<'EOF'
style(booking): draw calendar blocks from tokens, in one place

Four hardcoded emerald/amber pairs across two grids, none of them a
colour globals.css issues. Pending keeps its dashed border: it does not
hold the slot, and hue alone would not say so.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: A shorter room header, from one constant

**Why:** `RoomHeaderCard` is 140px — an 80px image stacked over two text lines — spent before a single hour is visible. And 140 is written twice, in the gutter spacer and the column header, with a comment asking the next reader to keep them in sync.

**Files:**
- Modify: `components/booking/calendar/room-header-card.tsx`
- Modify: `components/booking/calendar/resource-day-grid.tsx` (both `h-[140px]` sites)

**Interfaces:**
- Consumes: nothing.
- Produces: `ROOM_HEADER_PX` exported from `components/booking/calendar/room-header-card.tsx`.

- [ ] **Step 1: Rewrite the card**

```tsx
"use client"

import { Users } from "lucide-react"
import type { CalendarResourceSummaryDto } from "@/lib/service/HsService"

/**
 * Header height, in pixels. The hour gutter renders a spacer of exactly
 * this so its ticks line up with the columns' hour bands — export it
 * rather than writing the number twice, which is what previously needed
 * a comment begging the next reader to keep them in sync.
 */
export const ROOM_HEADER_PX = 92

/**
 * The column header: what the room *is*, not just its name. Everything
 * here already rides on the calendar payload, so picking a room by
 * capacity or kit costs no extra request.
 *
 * The image sits beside the text rather than above it: stacked, this
 * cost 140px of every screen before the first hour was visible.
 */
export function RoomHeaderCard({
  resource,
}: Readonly<{ resource: CalendarResourceSummaryDto }>) {
  return (
    <div className="flex w-40 shrink-0 items-start gap-2 p-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{resource.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3 shrink-0" />
          <span className="tabular-nums">{resource.capacity}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">
            {resource.amenities.length}{" "}
            {resource.amenities.length === 1 ? "amenity" : "amenities"}
          </span>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Use the constant in the grid**

In `resource-day-grid.tsx`, import it:

```tsx
import { RoomHeaderCard, ROOM_HEADER_PX } from "./room-header-card"
```

Replace the gutter spacer (delete the stale sync comment above it):

```tsx
          <div className="border-b" style={{ height: ROOM_HEADER_PX }} />
```

and the column header:

```tsx
      <div className="border-b" style={{ height: ROOM_HEADER_PX }}>
        <RoomHeaderCard resource={entry.resource} />
      </div>
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual: day view. The hour labels in the left gutter must sit level with the hour bands in the columns — scroll to the bottom and check the last hour too, where a desync is most visible. Headers should be visibly shorter than before.

- [ ] **Step 4: Commit**

```bash
git add components/booking/calendar/room-header-card.tsx \
        components/booking/calendar/resource-day-grid.tsx
git commit -m "$(cat <<'EOF'
style(booking): shorten the room header and stop writing 140 twice

The gutter spacer and the column header both hardcoded the height, with
a comment asking the next reader to keep them in sync. One constant now.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Now-line, free-slot affordance, legend

**Why:** Nothing on the grid says when "now" is — the first thing a front desk looks for. Free half-hours, the view's primary action, are invisible until hover. And two block styles with no key have to be decoded.

**Files:**
- Create: `components/booking/calendar/calendar-legend.tsx`
- Create: `components/booking/calendar/use-now.ts`
- Modify: `components/booking/calendar/resource-day-grid.tsx`
- Modify: `components/booking/calendar/calendar-views.tsx` (render the legend)

**Interfaces:**
- Consumes: `BOOKING_BLOCK_STYLES` (Task 10) and `todayIn` from `./types`. Runs after Task 11 only so the header height is already a constant — it imports nothing from it.
- Produces:
  - `useNow(intervalMs?: number): number` from `./use-now`
  - `CalendarLegend` from `./calendar-legend` (no props)

- [ ] **Step 1: Create the clock hook**

`components/booking/calendar/use-now.ts`:

```ts
"use client"

import { useEffect, useState } from "react"

/**
 * The current instant, re-read on an interval.
 *
 * Starts at 0 and fills in after mount ON PURPOSE: `Date.now()` in the
 * initial render differs between server and client, which is a
 * hydration mismatch. Callers treat 0 as "not known yet" and draw
 * nothing, which is also the correct first frame.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
```

- [ ] **Step 2: Create the legend**

`components/booking/calendar/calendar-legend.tsx`:

```tsx
"use client"

import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
import { cn } from "@/lib/utils"

/**
 * A key for the grid. Two block styles and two ground states is two more
 * than a reader can be expected to infer, and "pending" in particular
 * carries a rule — it does not hold the slot — that nothing else states.
 */
export function CalendarLegend() {
  const items: { label: string; className: string }[] = [
    { label: "Confirmed", className: BOOKING_BLOCK_STYLES.confirmed },
    { label: "Pending (does not hold the slot)", className: BOOKING_BLOCK_STYLES.pending },
    { label: "Free — click to book", className: "border-border bg-background" },
    { label: "Closed", className: "border-transparent bg-muted" },
  ]

  return (
    <ul className="mx-4 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("h-3 w-5 shrink-0 rounded-sm border", item.className)}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 3: Give free slots a resting state, and add the now-line**

In `resource-day-grid.tsx`:

Import at the top:

```tsx
import { todayIn } from "./types"
import { useNow } from "./use-now"
```

In `ResourceDayGrid`, after the `axis` memo, compute the now-line position once and pass it down:

```tsx
  const now = useNow()
  // Only on the grid's own today, read in the grid's zone — not the
  // reader's, which can be a different date entirely.
  const nowMs = date === todayIn(tz) && now > 0 ? now : null
```

and pass `nowMs` into each `<RoomColumn …>`, adding it to `RoomColumn`'s props type as `nowMs: number | null`.

Replace the free-slot button's className so it reads at rest:

```tsx
              className="group absolute inset-x-0 border-b border-dashed border-border/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-muted)_6px,var(--color-muted)_7px)] transition-colors hover:bg-accent hover:bg-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
```

and give it a visible hover label, replacing the `sr-only` span with:

```tsx
              <span className="sr-only">
                Book {entry.resource.name} at {formatTimeOfDay(new Date(s.startMs).toISOString(), tz)}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none flex h-full items-center justify-center text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                + Book
              </span>
```

Inside `RoomColumn`'s positioned container, after the windows and before the slot buttons, draw the rule:

```tsx
        {/* Where "now" is. Drawn under the blocks so it never hides one,
            and only on the grid's own today — see nowMs above. */}
        {nowMs !== null && nowMs >= axis.startMs && nowMs <= axis.endMs && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-20 border-t border-destructive"
            style={{ top: topFor(nowMs) }}
          >
            <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
          </div>
        )}
```

`RoomColumn` already receives `axis` and `topFor`; add `nowMs` to its destructured props.

- [ ] **Step 4: Render the legend**

In `calendar-views.tsx`, import `CalendarLegend` and render it directly under `<CalendarToolbar … />`.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual, all on `/booking/bookings?view=calendar`:
- Free half-hours are visible as a hatched ground without hovering; hovering shows "+ Book" and the hatch gives way to the accent fill.
- The red now-line appears on today and is gone when you page to tomorrow with `›`.
- Reload and watch the console: no hydration warning (that is what `useNow`'s 0 start is for).
- The legend's four swatches match what the grid actually draws.

- [ ] **Step 6: Commit**

```bash
git add components/booking/calendar/use-now.ts \
        components/booking/calendar/calendar-legend.tsx \
        components/booking/calendar/resource-day-grid.tsx \
        components/booking/calendar/calendar-views.tsx
git commit -m "$(cat <<'EOF'
feat(booking): show now, show free time, and key the grid

Free half-hours are the view's primary action and were invisible until
hover. Nothing said where "now" was. Two block styles had no key.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Rebuild the toolbar

**Why:** It is a `flex-wrap` row mixing shadcn `Button`s with two raw `<input type="time">` and a bare checkbox. It reads as a debug strip.

**Files:**
- Modify: `components/booking/calendar/calendar-toolbar.tsx`

**Interfaces:**
- Consumes: `NativeSelect` (Task 9).
- Produces: nothing new. `CalendarToolbar`'s props are unchanged.

- [ ] **Step 1: Add a shared half-hour list**

The picker (Task 14), `date-time-field.tsx` and this toolbar must all offer the same times. Add to `components/booking/calendar/types.ts`:

```ts
/** Minutes between offered start times, everywhere in the booking UI. */
export const SLOT_STEP_MIN = 30

/** Half-hours across a day, "HH:mm". Shared by the toolbar's time range,
 *  the slot picker and the manual date-time field, so the three surfaces
 *  cannot offer different times for the same booking. */
export const HALF_HOURS: string[] = Array.from(
  { length: (24 * 60) / SLOT_STEP_MIN },
  (_, index) => {
    const minutes = index * SLOT_STEP_MIN
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
      minutes % 60
    ).padStart(2, "0")}`
  }
)
```

Then make `components/ui/date-time-field.tsx` import `HALF_HOURS` and delete its own local `TIMES` and `STEP_MINUTES` — keeping `const TIMES = HALF_HOURS` as a local alias so the rest of that file (which references `TIMES[18]`) is untouched.

- [ ] **Step 2: Rewrite the toolbar's layout**

Keep every handler (`goTo`, `shift`, the view-switch `onClick`) exactly as it is. Replace only the returned JSX:

```tsx
  return (
    <div className="mx-4 mb-3 flex flex-wrap items-center gap-x-2 gap-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => goTo(todayIn(timeZone))}
      >
        Today
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(-1)} aria-label={`Previous ${view}`}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(1)} aria-label={`Next ${view}`}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-48">
        <DateField name="date" value={date} onChange={goTo} />
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="inline-flex items-center rounded-md border p-0.5" role="group" aria-label="Calendar view">
        {(["day", "week", "month"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={view === value}
            className={cn(
              "h-8 px-3 capitalize",
              view === value && "bg-accent text-accent-foreground"
            )}
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

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Client-side narrowing: the payload already holds the whole day. */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Between</span>
        <div className="w-24">
          <NativeSelect
            aria-label="From"
            className="h-8"
            value={timeRange.from}
            onChange={(e) => onTimeRangeChange({ ...timeRange, from: e.target.value })}
          >
            {HALF_HOURS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </NativeSelect>
        </div>
        <span aria-hidden="true" className="text-muted-foreground">–</span>
        <div className="w-24">
          <NativeSelect
            aria-label="To"
            className="h-8"
            value={timeRange.to}
            onChange={(e) => onTimeRangeChange({ ...timeRange, to: e.target.value })}
          >
            {HALF_HOURS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={vacantOnly}
        className={cn("h-8 px-3", vacantOnly && "bg-accent text-accent-foreground")}
        onClick={() => onVacantOnlyChange(!vacantOnly)}
      >
        Vacant only
      </Button>
    </div>
  )
```

Add the imports: `NativeSelect` from `@/components/ui/native-select`, `Separator` from `@/components/ui/separator`, and `HALF_HOURS` from `./types`.

`aria-pressed` on a `Button` is the pattern `view-toggle.tsx` already uses for exactly this shape of control — no `Switch` component needed.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual: the toolbar reads as three groups separated by rules. The time selects match the view buttons' height. "Vacant only" fills when active. Set the range to 09:00–10:00, turn on "Vacant only", and confirm rooms busy in that window disappear from the day grid — the behaviour must be unchanged.

- [ ] **Step 4: Commit**

```bash
git add components/booking/calendar/calendar-toolbar.tsx \
        components/booking/calendar/types.ts \
        components/ui/date-time-field.tsx
git commit -m "$(cat <<'EOF'
style(booking): rebuild the calendar toolbar on the design system

Raw time inputs and a bare checkbox in a flex-wrap row. The half-hour
list moves to types.ts so the toolbar, the manual field and the picker
cannot offer different times for the same booking.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: The slot picker

**Files:**
- Create: `app/booking/bookings/booking-slot-picker.tsx`
- Test: none available — see the Phase B note.

**Interfaces:**
- Consumes: `getResourceAvailability` from `@/lib/service`; `AvailabilityDto` from `@/lib/service/HsService`; `durationChoices`, `freeRangesForDay`, `startOptionsForDuration`, `wallClockToUtcMs`, `type Slot` from `@/lib/slots`; `todayIn` from `@/components/booking/calendar/types`; `formatTimeOfDay` from `@/lib/format`.

  It does NOT need `HALF_HOURS`: every time this offers comes from `startOptionsForDuration`, which steps the free ranges itself. Only the manual field and the toolbar pick from a fixed list.
- Produces:

```ts
export interface SlotValue {
  /** Wall-clock in the location's zone, "YYYY-MM-DDTHH:mm" — the shape
   *  actions.ts:toUtcIso reads, paired with the hidden timeZone field. */
  startsAt: string
  endsAt: string
}

export function BookingSlotPicker(props: {
  resourceId: string
  timeZone: string
  value: SlotValue | null
  onChange: (value: SlotValue | null) => void
  /** The booking being rescheduled, so its own slot reads as free. */
  excludeBookingId?: string
}): JSX.Element
```

**Why wall-clock and not ISO instants:** `actions.ts` already converts `YYYY-MM-DDTHH:mm` + a hidden `timeZone` through `wallClockToUtcMs`. Emitting instants instead would need a second code path in the action for no gain, and would leave the manual escape hatch on a different one.

- [ ] **Step 1: Read the public wizard's step 0 before writing anything**

```bash
sed -n '95,190p' /Users/mohamedali.may/Workspace/Personal/hs/public-booking-page/components/booking/BookingWizard.tsx
sed -n '560,760p' /Users/mohamedali.may/Workspace/Personal/hs/public-booking-page/components/booking/BookingWizard.tsx
```

That is `DayTimeline` and the two-column layout this ports. Port the *structure and the reasoning*; do not port its class names — that project has its own palette (`sky`, `ink`, `skytint`) which does not exist here.

- [ ] **Step 2: Write the component**

```tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import { getResourceAvailability } from "@/lib/service"
import type { AvailabilityDto } from "@/lib/service/HsService"
import {
  durationChoices,
  freeRangesForDay,
  startOptionsForDuration,
  wallClockToUtcMs,
  type Slot,
} from "@/lib/slots"
// Not redefined here: this is the third caller, and three copies of a
// "today, in the location's zone" helper is how one of them drifts.
import { todayIn } from "@/components/booking/calendar/types"
import { formatTimeOfDay } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SlotValue {
  /** Wall-clock in the location's zone, "YYYY-MM-DDTHH:mm" — the shape
   *  actions.ts:toUtcIso reads, paired with the hidden timeZone field. */
  startsAt: string
  endsAt: string
}

/** A UTC instant as "YYYY-MM-DDTHH:mm" in `timeZone`. */
function toWallClock(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T")
}

const monthOf = (date: string) => date.slice(0, 7)

/** "YYYY-MM" as its first instant, and the first instant of the month after. */
function monthRange(month: string, timeZone: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number)
  const first = `${month}-01`
  const nextMonth = new Date(Date.UTC(year, m, 1))
  const next = `${nextMonth.getUTCFullYear()}-${String(
    nextMonth.getUTCMonth() + 1
  ).padStart(2, "0")}-01`
  return {
    from: new Date(wallClockToUtcMs(first, "00:00", timeZone)).toISOString(),
    to: new Date(wallClockToUtcMs(next, "00:00", timeZone)).toISOString(),
  }
}

const PERIODS = ["Morning", "Afternoon", "Evening"] as const

/** Wall-clock hour (0–23) of a UTC instant in a zone. */
function hourIn(iso: string, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone })
      .format(new Date(iso))
  )
}

function periodOf(slot: Slot, timeZone: string): (typeof PERIODS)[number] {
  const hour = hourIn(slot.startUtc, timeZone)
  return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening"
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/**
 * The day's shape at a glance: open windows as ground, busy blocks
 * hatched, elapsed time greyed, the chosen slot filled. Ported from the
 * public wizard's DayTimeline, which is the one element staff and
 * visitors both read the same way.
 */
function DayTimeline({
  availability,
  date,
  selected,
  timeZone,
  nowMs,
}: Readonly<{
  availability: AvailabilityDto
  date: string
  selected: Slot | null
  timeZone: string
  nowMs: number
}>) {
  const day = availability.days.find((entry) => entry.date === date)
  if (!day || day.windows.length === 0) return null

  const dayStart = Math.min(
    ...day.windows.map((w) => wallClockToUtcMs(date, w.open, timeZone))
  )
  const dayEnd = Math.max(
    ...day.windows.map((w) => wallClockToUtcMs(date, w.close, timeZone))
  )
  const span = dayEnd - dayStart
  if (span <= 0) return null

  const pct = (ms: number) =>
    `${Math.min(100, Math.max(0, ((ms - dayStart) / span) * 100))}%`

  const busy = availability.busy
    .map((b) => ({ start: Date.parse(b.startsAt), end: Date.parse(b.endsAt) }))
    .filter((b) => b.end > dayStart && b.start < dayEnd)

  const ticks: number[] = []
  for (let t = dayStart; t <= dayEnd; t += 2 * 3_600_000) ticks.push(t)

  return (
    <div aria-hidden="true" className="select-none">
      <div className="relative h-8 overflow-hidden rounded-md border bg-muted">
        {day.windows.map((w) => {
          const open = wallClockToUtcMs(date, w.open, timeZone)
          const close = wallClockToUtcMs(date, w.close, timeZone)
          return (
            <div
              key={`${w.open}-${w.close}`}
              className="absolute inset-y-0 bg-background"
              style={{ left: pct(open), width: `calc(${pct(close)} - ${pct(open)})` }}
            />
          )
        })}
        {nowMs > dayStart && (
          <div
            className="absolute inset-y-0 left-0 bg-muted-foreground/15"
            style={{ width: pct(Math.min(nowMs, dayEnd)) }}
          />
        )}
        {busy.map((b) => (
          <div
            key={b.start}
            className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,var(--color-muted-foreground)_0,var(--color-muted-foreground)_2px,transparent_2px,transparent_7px)] opacity-40"
            style={{
              left: pct(Math.max(b.start, dayStart)),
              width: `calc(${pct(Math.min(b.end, dayEnd))} - ${pct(Math.max(b.start, dayStart))})`,
            }}
          />
        ))}
        {selected && (
          <div
            className="absolute inset-y-1 rounded-sm bg-primary"
            style={{
              left: pct(Date.parse(selected.startUtc)),
              width: `calc(${pct(Date.parse(selected.endUtc))} - ${pct(Date.parse(selected.startUtc))})`,
            }}
          />
        )}
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-muted-foreground">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: pct(t) }}>
            {formatTimeOfDay(new Date(t).toISOString(), timeZone)}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Pick a booking window from what the room is actually free for.
 *
 * Availability is fetched per resource and per displayed month, the way
 * the public wizard does — the endpoint caps a range at 31 days, so a
 * month is the natural page.
 */
export function BookingSlotPicker({
  resourceId,
  timeZone,
  value,
  onChange,
  excludeBookingId,
}: Readonly<{
  resourceId: string
  timeZone: string
  value: SlotValue | null
  onChange: (value: SlotValue | null) => void
  excludeBookingId?: string
}>) {
  const today = todayIn(timeZone)
  const [month, setMonth] = useState(() => monthOf(value?.startsAt ?? today))
  const [date, setDate] = useState<string | null>(
    value ? value.startsAt.slice(0, 10) : null
  )
  const [availability, setAvailability] = useState<AvailabilityDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [durationMin, setDurationMin] = useState<number | null>(null)

  // Captured once per mount: clips the past out of today's free ranges.
  // Not re-read on an interval — a slot list that silently drops its
  // first row mid-click is worse than one a few minutes stale.
  const [nowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!resourceId) {
      setAvailability(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setFailed(false)
    const { from, to } = monthRange(month, timeZone)
    getResourceAvailability({ id: resourceId, from, to, excludeBookingId })
      .then((data) => {
        if (cancelled) return
        setAvailability(data as AvailabilityDto)
      })
      .catch((error) => {
        if (cancelled) return
        console.error("Failed to load availability", error)
        setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [resourceId, month, timeZone, excludeBookingId])

  const durations = useMemo(
    () =>
      durationChoices(
        availability?.minDurationMin ?? null,
        availability?.maxDurationMin ?? null
      ),
    [availability?.minDurationMin, availability?.maxDurationMin]
  )

  // The resource decides the choices, so a duration picked for a previous
  // resource may not exist here — fall back to the shortest rather than
  // leaving a selection that matches no chip.
  const activeDuration =
    durationMin !== null && durations.includes(durationMin)
      ? durationMin
      : (durations[0] ?? 60)

  const freeStartsOn = useCallback(
    (day: string): Slot[] => {
      if (!availability) return []
      const dayWindows = availability.days.find((entry) => entry.date === day)
      if (!dayWindows) return []
      return startOptionsForDuration(
        freeRangesForDay(dayWindows, availability.busy, nowMs, timeZone),
        activeDuration
      )
    },
    [availability, activeDuration, nowMs, timeZone]
  )

  const startOptions = useMemo(
    () => (date ? freeStartsOn(date) : []),
    [date, freeStartsOn]
  )

  const countByDay = useMemo(() => {
    const counts = new Map<string, number>()
    for (const day of availability?.days ?? []) {
      counts.set(day.date, freeStartsOn(day.date).length)
    }
    return counts
  }, [availability, freeStartsOn])

  const selectedSlot: Slot | null = useMemo(() => {
    if (!value) return null
    const [d, t] = value.startsAt.split("T")
    const [ed, et] = value.endsAt.split("T")
    return {
      startUtc: new Date(wallClockToUtcMs(d, t, timeZone)).toISOString(),
      endUtc: new Date(wallClockToUtcMs(ed, et, timeZone)).toISOString(),
    }
  }, [value, timeZone])

  const pickDay = (next: string) => {
    setDate(next)
    onChange(null)
  }

  const pickDuration = (next: number) => {
    setDurationMin(next)
    onChange(null)
  }

  const pickSlot = (slot: Slot) =>
    onChange({
      startsAt: toWallClock(slot.startUtc, timeZone),
      endsAt: toWallClock(slot.endUtc, timeZone),
    })

  if (!resourceId) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Pick a resource to see when it is free.
      </p>
    )
  }

  if (failed) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Availability could not be loaded. Use “Set times manually” below.
      </p>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
      <div className={cn("space-y-4", loading && "opacity-50")}>
        <div>
          <p className="mb-2 text-sm font-medium">Duration</p>
          <div className="flex flex-wrap gap-1.5">
            {durations.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={option === activeDuration ? "default" : "outline"}
                className="h-8"
                onClick={() => pickDuration(option)}
              >
                {durationLabel(option)}
              </Button>
            ))}
          </div>
        </div>

        <DayPicker
          mode="single"
          month={new Date(`${month}-01T12:00:00Z`)}
          onMonthChange={(next) =>
            setMonth(
              `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
            )
          }
          selected={date ? new Date(`${date}T12:00:00Z`) : undefined}
          onSelect={(picked) => {
            if (!picked) return
            const key = `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(2, "0")}-${String(picked.getDate()).padStart(2, "0")}`
            if ((countByDay.get(key) ?? 0) === 0) return
            pickDay(key)
          }}
          disabled={(day) => {
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
            return (countByDay.get(key) ?? 0) === 0
          }}
          showOutsideDays
          classNames={{
            months: "flex flex-col",
            month_caption: "flex items-center justify-center h-9 font-medium text-sm",
            nav: "flex items-center justify-between absolute w-full px-1 h-9",
            button_previous: "h-7 w-7 rounded-md hover:bg-accent inline-flex items-center justify-center",
            button_next: "h-7 w-7 rounded-md hover:bg-accent inline-flex items-center justify-center",
            month_grid: "w-full border-collapse",
            weekdays: "flex",
            weekday: "text-muted-foreground w-9 text-xs font-normal",
            week: "flex w-full",
            day: "h-9 w-9 p-0 text-sm",
            day_button: "h-9 w-9 rounded-md hover:bg-accent inline-flex items-center justify-center",
            today: "font-semibold text-primary",
            selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
            outside: "text-muted-foreground/50",
            disabled: "text-muted-foreground/40 pointer-events-none",
            root: "relative",
          }}
        />

        {availability && date && (
          <DayTimeline
            availability={availability}
            date={date}
            selected={selectedSlot}
            timeZone={timeZone}
            nowMs={nowMs}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Times are the location’s, not yours ({timeZone}).
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">
          {date ? date : "Pick a day"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {durationLabel(activeDuration)}
        </p>

        <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
          {startOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : date
                  ? "Nothing free that day at this length."
                  : "Pick a day with free time."}
            </p>
          ) : (
            PERIODS.map((period) => {
              const slots = startOptions.filter(
                (slot) => periodOf(slot, timeZone) === period
              )
              if (slots.length === 0) return null
              return (
                <div key={period}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {period}
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {slots.map((slot) => (
                      <Button
                        key={slot.startUtc}
                        type="button"
                        variant={
                          selectedSlot?.startUtc === slot.startUtc ? "default" : "outline"
                        }
                        className="h-9 w-full justify-center tabular-nums"
                        onClick={() => pickSlot(slot)}
                      >
                        {formatTimeOfDay(slot.startUtc, timeZone)}–
                        {formatTimeOfDay(slot.endUtc, timeZone)}
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Check `freeRangesForDay`'s actual signature before trusting the code above**

```bash
grep -n "export function freeRangesForDay" -A 8 lib/slots.ts
```

It is `(day: DayWindows, busy: BusyInterval[], nowMs: number, timeZone: string)` — note it takes ONE day plus the busy list, not the whole availability object (that is how the public copy differs). If it does not match, fix the call, not the library.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint
```

The component has no caller yet, so there is nothing to click until Task 15. Type-clean is the gate here.

- [ ] **Step 5: Commit**

```bash
git add app/booking/bookings/booking-slot-picker.tsx
git commit -m "$(cat <<'EOF'
feat(booking): add an availability-driven slot picker

Ported from the public wizard's step 0, onto tokens. lib/slots.ts was
ported for exactly this and has had no second caller until now.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: The form becomes a dialog

**Why:** The picker is two columns; the drawer is 440px. And `add-booking-form.tsx` is 520 lines before the picker exists.

**Files:**
- Create: `app/booking/bookings/booking-customer-fields.tsx`
- Create: `app/booking/bookings/booking-form-dialog.tsx`
- Delete: `app/booking/bookings/add-booking-form.tsx`
- Modify: `app/booking/bookings/booking-table.tsx`, `app/booking/bookings/add-booking-button.tsx`, `components/booking/calendar/calendar-views.tsx`

**Interfaces:**
- Consumes: `BookingSlotPicker`, `SlotValue` (Task 14); `NativeSelect` (Task 9); the existing `createBookingAction` / `updateBookingAction` / `validateBookingAction` from `./actions`.
- Produces:

```ts
export function BookingCustomerFields(props: {
  /** SEED, not the whole list: when empty this component fetches
   *  `getListResources({ canBook: true })` itself, exactly as the old
   *  form did. Callers that already hold resources pass them to skip a
   *  request; the page-header button passes nothing. */
  resources?: ResourceDto[]
  resourceId: string
  onResourceChange: (id: string) => void
  prefillResourceName?: string
  /** Edit mode: the API refuses a room change, so the select is frozen. */
  disabled?: boolean
}): JSX.Element

export function BookingFormDialog(props: {
  isOpen: boolean
  onClose: () => void
  editingBooking?: BookingDto | null
  resources?: ResourceDto[]
  prefill?: { resourceId: string; startsAt: string; endsAt: string; resourceName?: string }
  timeZone: string
}): JSX.Element
```

**`timeZone` is now required, not optional.** It was optional only because the non-calendar path fell back to the server process's zone, which was correct by accident. Every caller has one: `booking-table.tsx` and `calendar-views.tsx` already pass it, and `add-booking-button.tsx` must start receiving it from the page (which already computes `primaryTimeZone()`).

- [ ] **Step 1: Extract the customer fields**

Create `app/booking/bookings/booking-customer-fields.tsx` by lifting the resource select, the customer-kind select and the member/company selects out of `add-booking-form.tsx` verbatim — including the `getListMembers`/`getListCompanies` fetch effect and the `prefill?.resourceName` fallback option with its comment. Use `NativeSelect` throughout. Keep the `canBook: true` on the resource fetch and its comment.

- [ ] **Step 2: Write the dialog**

Create `app/booking/bookings/booking-form-dialog.tsx`. Carry over from `add-booking-form.tsx`, unchanged in substance:

- both `useActionState` hooks and the two notify effects, **including their `lastCreateStateRef`/`lastUpdateStateRef` identity guards and the comment explaining why they guard on state identity rather than on `onClose`** — that comment records a real bug
- `messageFor` and its `booking_conflict` copy
- `runCheck` (the dry-run) and `invalidateQuote`
- `SubmitButton`

Changed:

- `Drawer`/`DrawerContent` become `Dialog`/`DialogContent` with `className="max-w-4xl max-h-[90vh] overflow-y-auto"`; `DrawerHeader`/`Title`/`Description`/`Footer` become their `Dialog*` equivalents. `DialogContent` renders its own close button, so drop the manual `DrawerClose` X row at the top.
- New state `const [slot, setSlot] = useState<SlotValue | null>(...)`, seeded from `prefill` (converted through the same wall-clock helper) or from `editingBooking` for the edit branch.
- New state `const [manualTimes, setManualTimes] = useState(false)`. When false, render `<BookingSlotPicker …>`; when true, render the two existing `DateTimeField`s. A `Button variant="link"` toggles, labelled "Set times manually" / "Back to available slots".
- **Exactly one input per field name, in both modes.** `DateTimeField` already writes its own `<input type="hidden" name={name}>`, so emitting a second `startsAt` alongside it would leave `FormData.get("startsAt")` reading whichever came first and silently ignoring the other. So:

  `timeZone` is emitted once, unconditionally, outside the branch:

```tsx
<input type="hidden" name="timeZone" value={timeZone} />
```

  and `startsAt`/`endsAt` are emitted by whichever mode is active — the picker branch renders them itself, the manual branch lets `DateTimeField` render them:

```tsx
{manualTimes ? (
  <>
    <DateTimeField
      name="startsAt"
      value={slot?.startsAt ?? ""}
      onChange={(next) => setSlot((s) => ({ startsAt: next, endsAt: s?.endsAt ?? "" }))}
    />
    <DateTimeField
      name="endsAt"
      value={slot?.endsAt ?? ""}
      min={slot?.startsAt}
      onChange={(next) => setSlot((s) => ({ startsAt: s?.startsAt ?? "", endsAt: next }))}
    />
  </>
) : (
  <>
    <input type="hidden" name="startsAt" value={slot?.startsAt ?? ""} />
    <input type="hidden" name="endsAt" value={slot?.endsAt ?? ""} />
    <BookingSlotPicker
      resourceId={resourceId}
      timeZone={timeZone}
      value={slot}
      onChange={setSlot}
      excludeBookingId={editingBooking?.id}
    />
  </>
)}
```

  Carry over the existing rule from `add-booking-form.tsx` that a start moving past the current end clears that end — in manual mode it belongs in the `startsAt` handler above.
- The edit branch now shows the picker instead of the read-only "Resource and times cannot be changed" panel. Delete that panel's copy. The resource select stays disabled in edit mode (the API still refuses a room change) — pass `disabled` to `BookingCustomerFields`.
- `BookingSlotPicker` gets `excludeBookingId={editingBooking?.id}` on the edit branch.
- `SubmitButton`'s `disabled` becomes `!slot` in both modes, not just create.

- [ ] **Step 3: Re-point the three callers**

`booking-table.tsx`: swap the import and the element name; props are otherwise identical (it already passes `timeZone`).

`add-booking-button.tsx`: accept a `timeZone: string` prop and forward it. In `app/booking/bookings/page.tsx`, pass the `timeZone` already computed there:

```tsx
<AddBookingButton timeZone={timeZone} />
```

`components/booking/calendar/calendar-views.tsx`: swap `AddBookingForm` for `BookingFormDialog`; the `prefill` and `timeZone` props are unchanged.

- [ ] **Step 4: Delete the old file**

```bash
git rm app/booking/bookings/add-booking-form.tsx
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual, thoroughly — this is the task most likely to break something:
- **Create from the header button:** pick a resource, watch the picker load, pick a duration, a day, a time. "Check availability & price" shows a quote. Change the duration — the quote clears. Submit; the row appears.
- **Create from a calendar cell:** click a free half-hour. The dialog opens with that resource and that slot already selected, and the picker's day matches the column you clicked.
- **Manual escape hatch:** toggle it, type a time outside opening hours, submit. It should succeed (the API allows it).
- **Edit:** open a confirmed booking. The picker shows its own current slot as *selectable*, not busy — that is Task 2 working. Move it 30 minutes later and save.
- **Conflict:** open two tabs, take the same slot in both. The second shows "That slot was just taken."
- **Toast regression:** fail a submit twice in the same dialog session; a toast must appear both times (this is what the ref guards protect).

- [ ] **Step 6: Commit**

```bash
git add -A app/booking/bookings components/booking/calendar/calendar-views.tsx
git commit -m "$(cat <<'EOF'
feat(booking): pick times from availability, in a dialog

The picker is two columns and the drawer was 440px. Splits the 520-line
form into a shell, the customer fields and the picker. Edit can now move
a booking; the manual field stays behind a toggle, because staff book
outside opening hours and the API allows it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: The update action forwards times

**Why:** Task 15's edit branch posts `startsAt`/`endsAt`, and `updateBookingAction` currently drops them on the floor — the save would silently succeed while changing nothing.

**Files:**
- Modify: `app/booking/bookings/actions.ts:150-172` (`updateBookingAction`)

**Interfaces:**
- Consumes: `UpdateBookingDto.startsAt/endsAt` from the regenerated client (Task 8); the existing `toUtcIso` and `text` helpers in this file.
- Produces: nothing new.

- [ ] **Step 1: Rewrite the action**

```ts
/**
 * Title, notes, a no-show mark, and — when both times are present — a
 * reschedule. Confirming and cancelling keep their own endpoints.
 */
export async function updateBookingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Booking ID is required" }

    const startsAt = text(formData, "startsAt")
    const endsAt = text(formData, "endsAt")
    const timeZone = text(formData, "timeZone")

    // Both or neither. The API refuses one alone with
    // `reschedule_requires_both`, so failing here saves a round trip and
    // says it in the form's own words.
    if (Boolean(startsAt) !== Boolean(endsAt)) {
      return { success: false, error: "Pick both a start and an end time" }
    }
    if (startsAt && endsAt) {
      const startUtc = toUtcIso(startsAt, timeZone)
      const endUtc = toUtcIso(endsAt, timeZone)
      if (new Date(endUtc) <= new Date(startUtc)) {
        return { success: false, error: "The end time must be after the start time" }
      }
    }

    const data: UpdateBookingDto = {
      title: clearableText(formData, "title"),
      notes: clearableText(formData, "notes"),
      status: formData.get("markNoShow") === "on" ? "no_show" : undefined,
      startsAt: startsAt ? toUtcIso(startsAt, timeZone) : undefined,
      endsAt: endsAt ? toUtcIso(endsAt, timeZone) : undefined,
    }

    await updateBooking(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to update booking")
  }
}
```

- [ ] **Step 2: Correct `toUtcIso`'s comment**

Its doc block says the zone-less fallback is "the previous behaviour so the zone-less path is unchanged". After Task 15 the `timeZone` field is unconditional, so that fallback is now unreachable from this app. Update the comment to say so rather than leaving a stale claim; keep the fallback branch, since it costs nothing and the function is exported-adjacent.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual:
- Edit a booking, move it, save. Reload — the new times persist.
- Edit a booking and change only the title. Save. The times must be unchanged (the form posts them, so this exercises "a same-window reschedule is still a reschedule" — the backend handles it via `excludeBookingId`; confirm the charge total did not double by checking the booking's charges, or accept the details dialog's price line as the proxy).
- Clear a note and save — it must actually clear (the `clearableText` behaviour must survive this rewrite).

- [ ] **Step 4: Commit**

```bash
git add app/booking/bookings/actions.ts
git commit -m "$(cat <<'EOF'
feat(booking): forward the new times on update

The edit form posts them; the action dropped them, so a reschedule
reported success and changed nothing.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: A block opens its booking

**Why:** Blocks are inert. The old spec deferred this because "click-to-edit needs a fetch-by-id path that does not exist" — but `getBooking` is in the generated client and `booking-details-dialog.tsx` is already built and rendering from the table. That note was stale.

**Files:**
- Modify: `components/booking/calendar/resource-day-grid.tsx` (`BlockChip`)
- Modify: `components/booking/calendar/week-grid.tsx` (the inline block element)
- Modify: `components/booking/calendar/calendar-views.tsx`

**Interfaces:**
- Consumes: `getBooking` from `@/lib/service`; `BookingDetailsDialog` from `@/app/booking/bookings/booking-details-dialog`; `BookingFormDialog` (Task 15).
- Produces: `onOpenBooking: (bookingId: string) => void` — a new required prop on `ResourceDayGrid` and `WeekGrid`, threaded to `BlockChip`.

- [ ] **Step 1: Read the details dialog's actual props**

```bash
sed -n '38,60p' app/booking/bookings/booking-details-dialog.tsx
```

It is currently trigger-driven (it renders its own `DialogTrigger` with an Eye button). For the calendar it must be controllable from outside. Add optional `open`/`onOpenChange` props and make the `DialogTrigger` render only when no `open` prop is passed — do not fork the component.

- [ ] **Step 2: Make the day-grid block a button**

In `resource-day-grid.tsx`, `BlockChip` gains `onOpen: () => void` and its root `div` becomes:

```tsx
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "absolute overflow-hidden rounded-md border px-2 py-1 text-left text-xs",
        "hover:ring-1 hover:ring-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        BOOKING_BLOCK_STYLES[block.status]
      )}
      style={laneStyle(lane, lanes, top, height)}
      title={`${block.title ?? "Untitled"} — ${block.customerName ?? "No customer"}`}
    >
```

Thread `onOpenBooking` from `ResourceDayGrid` through `RoomColumn` to each `BlockChip` as `onOpen={() => onOpenBooking(item.block.bookingId)}`.

`OverflowChip` stays a plain `div`: it stands for several bookings and has no single one to open.

- [ ] **Step 3: Same in the week grid**

The inline block `div` becomes a `<button type="button" onClick={() => onOpenBooking(item.block.bookingId)}>` with the same added focus/hover classes and `text-left`. Add `onOpenBooking` to `WeekGrid`'s props.

- [ ] **Step 4: Wire the host**

In `calendar-views.tsx`:

```tsx
  const [openBooking, setOpenBooking] = useState<BookingDto | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [editing, setEditing] = useState<BookingDto | null>(null)

  const openBookingById = (bookingId: string) => {
    setLoadingBooking(true)
    getBooking(bookingId)
      .then((booking) => setOpenBooking(booking as BookingDto))
      .catch((error) => {
        console.error("Failed to load booking", error)
        toast.error("That booking could not be opened")
      })
      .finally(() => setLoadingBooking(false))
  }
```

Pass `onOpenBooking={openBookingById}` to both grids. Render:

```tsx
      {openBooking && (
        <BookingDetailsDialog
          booking={openBooking}
          timeZone={calendar.timezone}
          open
          onOpenChange={(next) => {
            if (!next) setOpenBooking(null)
          }}
          onEdit={() => {
            setEditing(openBooking)
            setOpenBooking(null)
          }}
        />
      )}
      {editing && (
        <BookingFormDialog
          isOpen
          onClose={() => setEditing(null)}
          editingBooking={editing}
          timeZone={calendar.timezone}
        />
      )}
```

Add an `onEdit?: () => void` prop to `BookingDetailsDialog` that renders an Edit button in its footer when provided. `loadingBooking` should at minimum disable further clicks or show a spinner — do not leave a click with no feedback.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual:
- Click a confirmed block in the day grid → details open with the right room, customer, times and price.
- Click Edit in the details → the form dialog opens on that booking, with its slot selected.
- Click a block in the week grid → same.
- Click a "+N" overflow chip → nothing happens (correct).
- Tab through the grid: blocks are reachable and show a focus ring.

- [ ] **Step 6: Commit**

```bash
git add components/booking/calendar app/booking/bookings/booking-details-dialog.tsx
git commit -m "$(cat <<'EOF'
feat(booking): open a booking from the calendar

Deferred once on the grounds that no fetch-by-id path existed. getBooking
has been in the client since, and the details dialog was already built.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: Click-to-book in the week view

**Why:** Only the day grid offers free slots, so switching to the week view silently loses the view's main action.

**Files:**
- Modify: `components/booking/calendar/week-grid.tsx`
- Modify: `components/booking/calendar/calendar-views.tsx`

**Interfaces:**
- Consumes: `onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void` — the same signature `ResourceDayGrid` already takes, so `calendar-views.tsx` passes its existing `pick`.
- Produces: `WeekGrid` gains `onPickSlot` and `onPickDay: (date: string) => void`.

**The rule:** free slots are offered only when exactly one room is selected. Unfiltered, a week column aggregates every room, so there is no single room a click could book — clicking empty space there navigates to that day's grid instead, which is where the room columns are.

- [ ] **Step 1: Add the slot layer**

In `week-grid.tsx`, inside each day column's positioned container, after the lane items, add:

```tsx
                {/* Free half-hours, but only with one room selected: an
                    unfiltered column stacks every room, so a click has no
                    single room to book. Without a room, the empty ground
                    navigates to this day's grid instead. */}
                {soleRoom
                  ? freeSlotsFor(soleRoom, date).map((slot) => (
                      <button
                        key={slot.startMs}
                        type="button"
                        className="group absolute inset-x-0 border-b border-dashed border-border/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-muted)_6px,var(--color-muted)_7px)] transition-colors hover:bg-accent hover:bg-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        style={place(slot.startMs, slot.endMs)}
                        onClick={() =>
                          onPickSlot(
                            soleRoom.resource.id,
                            new Date(slot.startMs).toISOString(),
                            new Date(slot.endMs).toISOString()
                          )
                        }
                      >
                        <span className="sr-only">
                          Book {soleRoom.resource.name} at{" "}
                          {formatTimeOfDay(new Date(slot.startMs).toISOString(), tz)}
                        </span>
                      </button>
                    ))
                  : (
                      <button
                        type="button"
                        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        onClick={() => onPickDay(date)}
                      >
                        <span className="sr-only">Open {date} in the day view</span>
                      </button>
                    )}
```

Draw this layer **before** the lane items in the JSX so blocks sit on top of it and stay clickable (Task 17). If it must come after for layout reasons, give the blocks a higher `z-index` instead — but verify by clicking a block, not by reading.

Above the `days.map`, derive the sole room and the slot helper. Port `freeSlotsFor` from `resource-day-grid.tsx`'s `RoomColumn` — the windows-to-half-hours loop plus the `isBusy` and minimum-duration filter, unchanged in substance:

```tsx
  const soleRoom = rooms.length === 1 ? rooms[0] : null
```

- [ ] **Step 2: Wire the host**

In `calendar-views.tsx`, pass to `<WeekGrid …>`:

```tsx
          onPickSlot={pick}
          onPickDay={(date) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("date", date)
            params.delete("calendarView")   // day is the default, so absent
            router.replace(`?${params.toString()}`)
          }}
```

That day-navigation body is identical to `MonthOverview`'s `onPickDay` — extract it to a local `const goToDay = (date: string) => {…}` and use it for both rather than writing it twice.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Manual:
- Week view with no room filter: empty ground shows no hatch; clicking it lands on that day's grid.
- Filter to one room (via the table's resource filter, then toggle to the calendar — filters survive the switch): the week columns show hatched free slots. Click one; the form dialog opens with that room and slot.
- With a room selected, click an existing block: the details dialog opens, not the booking form. This is the z-order check.

- [ ] **Step 4: Commit**

```bash
git add components/booking/calendar/week-grid.tsx \
        components/booking/calendar/calendar-views.tsx
git commit -m "$(cat <<'EOF'
feat(booking): book a slot from the week view

Only the day grid offered free time, so switching views silently lost the
view's main action. Needs one room selected: an unfiltered column stacks
every room and has none to book.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

After Task 18, run the whole thing end to end.

**Backend:**

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hscowork-backend-platform
pnpm type-check && pnpm lint:check && pnpm test
```

**Frontend:**

```bash
cd /Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform
npx tsc --noEmit && npm run lint && npm run build
```

**The manual pass from the spec, in full:**

- [ ] Reschedule a credit-covered booking longer; the charge follows.
- [ ] Reschedule a booking onto its own window (the `excludeBookingId` path).
- [ ] Reschedule onto an occupied window; read the 409 copy.
- [ ] Reschedule a booking whose extras were repriced since; the snapshot prices are what get charged.
- [ ] Book a slot from the picker; double-book it from a second tab.
- [ ] Book outside opening hours through the manual escape hatch.
- [ ] Page the picker across a month boundary; switch resource mid-pick.
- [ ] Click a block in the day grid and in the week grid.
- [ ] Click a free slot in the week grid with a room selected, and without one.
- [ ] Read all three grids in dark mode.
