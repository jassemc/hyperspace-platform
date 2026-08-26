# Booking Calendar API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the API the booking calendar and the enriched bookings table need — a multi-resource calendar read, a stats endpoint, real list filters — plus a created-date filter on CRM opportunities, with all business-time logic resolved per location instead of from a constant.

**Architecture:** Three read endpoints on the existing `BookingModule`. A new `BookingCalendarService` composes resource lookup, the window computation extracted from `AvailabilityService`, and one booking query — `BookingService` is already 560 lines and stays out of it. Time handling reuses `localParts()`, which already resolves wall-clock from `LocationEntity.timezone`; nothing in this plan names a region.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, Jest, class-validator, `@nestjs/swagger`.

**Repo:** `hscowork-backend-platform` (all paths below are relative to it).

**Spec:** `hyperspace-platform/docs/superpowers/specs/2026-08-26-booking-calendar-and-table-design.md`

## Global Constraints

- **House conventions are binding:** `docs/CONVENTIONS.md`. New code must be indistinguishable in style from `src/modules/role/`.
- **Path aliases only** — `@modules/*`, `@common/*`, `@configs/*`, `@infrastructure/*`, `@app/*`. Never `../../` across top-level folders.
- **No region constants.** No file in this plan may contain the string `Africa/Tunis` (or any other IANA zone) outside a test fixture. Business time resolves from `LocationEntity.timezone` via `localParts()`.
- **Every endpoint** is documented by a composite decorator in `src/modules/booking/docs/booking.doc.ts` (or the CRM equivalent). Raw `@ApiResponse` in a controller is a smell.
- **Every endpoint** is guarded by `@ProtectedWith({ roles, permissions })` — never stack the underlying guards by hand.
- **Errors are RFC 9457** with snake_case `type` codes, thrown via the helpers in `@common/http/exceptions/problem.exception`, and documented with `DocOneOf`.
- **Response DTOs** for computed reads are plain classes (follow `AvailabilityDto`), not `AbstractDto` subclasses.
- **Money** is dinars via `moneyColumnTransformer`; every computed amount goes through `roundMoney`.
- **Tests:** `*.spec.ts` beside the code under test. `pnpm test` must pass. CI also runs prettier, eslint and `tsc --noEmit`.
- **Commits:** conventional (`feat(booking): …`), enforced by commitlint.
- **Migrations** are append-only. Never edit an executed migration.

---

### Task 1: Move the location-time utilities to `common/` and add `localDayBounds`

`booking` already imports `localParts` from `@modules/attendance/utils/` and `addDays` from `@modules/membership/utils/` — a booking feature depending on two unrelated domain modules for pure time maths. This task moves the file and adds the one function the rest of the plan needs.

**Files:**
- Create: `src/common/time/location-hours.util.ts` (moved from `src/modules/attendance/utils/location-hours.util.ts`)
- Create: `src/common/time/location-hours.util.spec.ts`
- Delete: `src/modules/attendance/utils/location-hours.util.ts`
- Modify: every importer (find with the grep in Step 1)

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export interface LocalParts {
    date: string;      // 'YYYY-MM-DD' in the location's timezone
    time: string;      // 'HH:mm'
    weekday: keyof WeeklyOpeningHoursDto;
    offset: string;    // '+01:00' at that instant
  }
  export function localParts(location: LocationEntity, at: Date): LocalParts
  export function localDayBounds(
    location: LocationEntity,
    date: string,             // 'YYYY-MM-DD', local to the location
  ): { startUtc: Date; endUtc: Date }   // endUtc exclusive
  ```

- [ ] **Step 1: Find every importer before moving anything**

```bash
cd hscowork-backend-platform
grep -rn "attendance/utils/location-hours.util" src | tee /tmp/location-hours-importers.txt
```

Expected: a handful of files across `attendance` and `booking`. Keep this list — Step 3 updates every one.

- [ ] **Step 2: Move the file with git so history follows it**

```bash
mkdir -p src/common/time
git mv src/modules/attendance/utils/location-hours.util.ts src/common/time/location-hours.util.ts
```

- [ ] **Step 3: Repoint every importer and export the `LocalParts` type**

In `src/common/time/location-hours.util.ts`, change the `LocalParts` interface declaration to be exported (it is currently module-private; `localDayBounds` tests and future callers need it):

```ts
export interface LocalParts {
```

Then update each importer from the Step 1 list:

```bash
grep -rl "@modules/attendance/utils/location-hours.util" src \
  | xargs sed -i '' 's|@modules/attendance/utils/location-hours.util|@common/time/location-hours.util|g'
grep -rn "attendance/utils/location-hours" src || echo "no stale imports"
```

- [ ] **Step 4: Verify the move compiles and nothing regressed**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: PASS. This step is pure motion — a failure here means an importer was missed.

- [ ] **Step 5: Commit the move on its own**

```bash
git add -A src
git commit -m "refactor(common): move location-hours util out of attendance

booking imported it for pure time maths, which made a booking feature
depend on the attendance module. Nothing else changes."
```

- [ ] **Step 6: Write the failing tests for `localDayBounds`**

Create `src/common/time/location-hours.util.spec.ts`. These fixtures deliberately span a positive whole-hour zone, a negative zone with DST, and a half-hour zone — a half-hour offset breaks any implementation that assumes whole hours.

```ts
import { localDayBounds } from '@common/time/location-hours.util';
import { type LocationEntity } from '@modules/location/entities/location.entity';

const at = (timezone: string): LocationEntity =>
  ({ timezone }) as LocationEntity;

describe('localDayBounds', () => {
  it('bounds a whole-hour positive zone', () => {
    const { startUtc, endUtc } = localDayBounds(at('Africa/Tunis'), '2026-08-26');
    expect(startUtc.toISOString()).toBe('2026-08-25T23:00:00.000Z');
    expect(endUtc.toISOString()).toBe('2026-08-26T23:00:00.000Z');
  });

  it('bounds a negative zone', () => {
    const { startUtc, endUtc } = localDayBounds(
      at('America/New_York'),
      '2026-08-26',
    );
    // EDT = UTC-4 in August
    expect(startUtc.toISOString()).toBe('2026-08-26T04:00:00.000Z');
    expect(endUtc.toISOString()).toBe('2026-08-27T04:00:00.000Z');
  });

  it('bounds a half-hour zone', () => {
    const { startUtc, endUtc } = localDayBounds(
      at('Asia/Kolkata'),
      '2026-08-26',
    );
    expect(startUtc.toISOString()).toBe('2026-08-25T18:30:00.000Z');
    expect(endUtc.toISOString()).toBe('2026-08-26T18:30:00.000Z');
  });

  it('returns a 23-hour day on a spring-forward transition', () => {
    // US DST begins 2026-03-08 at 02:00 local.
    const { startUtc, endUtc } = localDayBounds(
      at('America/New_York'),
      '2026-03-08',
    );
    const hours = (endUtc.getTime() - startUtc.getTime()) / 3_600_000;
    expect(hours).toBe(23);
  });

  it('returns a 25-hour day on a fall-back transition', () => {
    // US DST ends 2026-11-01 at 02:00 local.
    const { startUtc, endUtc } = localDayBounds(
      at('America/New_York'),
      '2026-11-01',
    );
    const hours = (endUtc.getTime() - startUtc.getTime()) / 3_600_000;
    expect(hours).toBe(25);
  });

  it('places a 23:30 local instant inside its own local day', () => {
    const location = at('Africa/Tunis');
    const { startUtc, endUtc } = localDayBounds(location, '2026-08-26');
    const lateEvening = new Date('2026-08-26T23:30:00+01:00');
    expect(lateEvening.getTime()).toBeGreaterThanOrEqual(startUtc.getTime());
    expect(lateEvening.getTime()).toBeLessThan(endUtc.getTime());
  });
});
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `pnpm test -- location-hours.util.spec`
Expected: FAIL — `localDayBounds is not a function`.

- [ ] **Step 8: Implement `localDayBounds`**

Append to `src/common/time/location-hours.util.ts`:

```ts
/**
 * The UTC instants bounding one local calendar day at a location.
 * `endUtc` is exclusive, so `endUtc - startUtc` is 23, 24 or 25 hours
 * depending on DST — never assume 24.
 */
export function localDayBounds(
  location: LocationEntity,
  date: string,
): { startUtc: Date; endUtc: Date } {
  return {
    startUtc: localMidnight(location, date),
    endUtc: localMidnight(location, addDaysIso(date, 1)),
  };
}

/**
 * Local midnight as a UTC instant. Two passes: the offset at local noon
 * is a safe probe for which day we are in, but on a DST-transition day
 * midnight may sit in the *other* offset — so the guess is re-read and
 * corrected. A single pass is wrong twice a year.
 */
function localMidnight(location: LocationEntity, date: string): Date {
  const probe = localParts(location, new Date(`${date}T12:00:00Z`));
  const guess = new Date(`${date}T00:00:00.000${probe.offset}`);
  const actual = localParts(location, guess);
  return new Date(`${date}T00:00:00.000${actual.offset}`);
}

/** 'YYYY-MM-DD' + n days, calendar-safe. */
function addDaysIso(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `pnpm test -- location-hours.util.spec`
Expected: PASS, 6 tests.

If the DST tests fail, the two-pass correction in `localMidnight` is the suspect — check that `actual.offset` is being read from `guess`, not from `probe`.

- [ ] **Step 10: Commit**

```bash
git add src/common/time/
git commit -m "feat(common): add localDayBounds for per-location day boundaries

Two-pass offset resolution so DST transition days come out 23 or 25
hours rather than a naive 24. Covers positive, negative and half-hour
zones."
```

---

### Task 2: Extract the window computation from `AvailabilityService`

`availabilityDays()` is private and computes `resource.bookingTimes ?? location.openingHours` per day (`availability.service.ts:160-198`). The calendar needs exactly that. Duplicating it is how the two views drift apart.

**Files:**
- Modify: `src/modules/booking/services/availability.service.ts:160-198`
- Modify: `src/modules/booking/services/availability.service.spec.ts`

**Interfaces:**
- Consumes: `localParts` from Task 1.
- Produces:
  ```ts
  // on AvailabilityService, now public
  async windowsForRange(
    resource: ResourceEntity,
    from: Date,
    to: Date,
  ): Promise<AvailabilityDayDto[]>
  ```

- [ ] **Step 1: Write the failing test**

Append to `src/modules/booking/services/availability.service.spec.ts`:

```ts
describe('AvailabilityService.windowsForRange', () => {
  let service: AvailabilityService;

  const repository = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
  const resourceService = {
    findOrFail: jest.fn(),
    selfAndAncestors: jest.fn(),
  };
  const resourceTypeService = { findOrFail: jest.fn() };
  const locationService = { findOrFail: jest.fn() };

  const location = {
    id: 'loc-1',
    timezone: 'Africa/Tunis',
    openingHours: { mon: [{ open: '08:00', close: '18:00' }] },
    closedDays: [],
  };

  const resource = {
    id: 'res-1',
    locationId: 'loc-1',
    active: true,
    bookingTimes: null,
    availability: [],
  } as unknown as ResourceEntity;

  beforeEach(async () => {
    jest.clearAllMocks();
    locationService.findOrFail.mockResolvedValue(location);
    resourceService.selfAndAncestors.mockResolvedValue([resource]);

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

  it('is callable from outside and returns the location hours', async () => {
    // 2026-08-24 is a Monday.
    const days = await service.windowsForRange(
      resource,
      new Date('2026-08-24T00:00:00+01:00'),
      new Date('2026-08-24T23:59:59+01:00'),
    );

    expect(days).toEqual([
      { date: '2026-08-24', windows: [{ open: '08:00', close: '18:00' }] },
    ]);
  });

  it('prefers the resource booking times over the location hours', async () => {
    const days = await service.windowsForRange(
      { ...resource, bookingTimes: { mon: [{ open: '09:00', close: '12:00' }] } } as unknown as ResourceEntity,
      new Date('2026-08-24T00:00:00+01:00'),
      new Date('2026-08-24T23:59:59+01:00'),
    );

    expect(days[0].windows).toEqual([{ open: '09:00', close: '12:00' }]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- availability.service.spec`
Expected: FAIL — `service.windowsForRange is not a function`.

- [ ] **Step 3: Make the method public and rename it**

In `src/modules/booking/services/availability.service.ts`, change the declaration at line ~160:

```ts
  // was: private async availabilityDays(
  /**
   * Bookable windows per local day across a range: `booking_times` when
   * the resource sets them, else the location's opening hours, minus
   * closed days and days no availability period covers. Public because
   * the calendar endpoint composes the same windows.
   */
  async windowsForRange(
    resource: ResourceEntity,
    from: Date,
    to: Date,
  ): Promise<AvailabilityDayDto[]> {
```

The body is unchanged. If the old signature took `location` as a parameter, resolve it inside instead so callers need only the resource:

```ts
    const location = await this.locationService.findOrFail(resource.locationId);
```

Update the single internal call site in `availabilityFor()` to `await this.windowsForRange(resource, from, to)`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- availability.service.spec`
Expected: PASS. The pre-existing `assertFree` tests must still pass — this is a rename, not a behaviour change.

- [ ] **Step 5: Commit**

```bash
git add src/modules/booking/services/availability.service.ts src/modules/booking/services/availability.service.spec.ts
git commit -m "refactor(booking): expose windowsForRange for the calendar

The calendar needs the same per-day window computation the availability
endpoint does. One method, two callers, rather than two copies of the
timezone logic."
```

---

### Task 3: Booking list filters, and `q` finally honoured

`list()` reads `resourceId`, `from` and `to` only. `q` is declared on `PageOptionsDto` and honoured by six other services — here the frontend has been sending it and the API silently dropping it.

**Files:**
- Modify: `src/modules/booking/dtos/booking.dto.ts:136-151`
- Modify: `src/modules/booking/services/booking.service.ts:391-440`
- Modify: `src/modules/booking/docs/booking.doc.ts:90-102`
- Modify: `src/modules/booking/services/booking.service.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  class BookingPageOptionsDto extends PageOptionsDto {
    resourceId?: string;    // existing
    from?: string;          // existing
    to?: string;            // existing
    status?: BookingStatus;
    source?: BookingSource;
    memberId?: string;
    companyId?: string;
  }
  ```

- [ ] **Step 1: Write the failing tests**

Append to `src/modules/booking/services/booking.service.spec.ts`. The query builder is mocked as a chainable recorder so the assertions are on the SQL fragments, not on a database:

```ts
describe('BookingService.list filters', () => {
  const staff = { id: 'u1', role: { type: RoleType.STAFF } } as IUser;

  function queryBuilderSpy() {
    const calls: { sql: string; params: unknown }[] = [];
    const qb: Record<string, jest.Mock> = {};
    for (const method of ['andWhere', 'orderBy', 'skip', 'take', 'leftJoin']) {
      qb[method] = jest.fn((sql: string, params: unknown) => {
        calls.push({ sql: String(sql), params });
        return qb;
      });
    }
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return { qb, calls };
  }

  it('filters by status', async () => {
    const { service, repository, calls } = await makeService();
    const { qb } = queryBuilderSpy();
    repository.createQueryBuilder.mockReturnValue(qb);

    await service.list(staff, {
      offset: 0, limit: 10, sort: Sort.ASC,
      status: BookingStatus.PENDING,
    } as BookingPageOptionsDto);

    expect(calls.some((c) => c.sql.includes('b.status = :status'))).toBe(true);
  });

  it('filters by source, memberId and companyId', async () => {
    const { service, repository, calls } = await makeService();
    const { qb } = queryBuilderSpy();
    repository.createQueryBuilder.mockReturnValue(qb);

    await service.list(staff, {
      offset: 0, limit: 10, sort: Sort.ASC,
      source: BookingSource.PUBLIC,
      memberId: 'm-1',
      companyId: 'c-1',
    } as BookingPageOptionsDto);

    const sql = calls.map((c) => c.sql).join(' | ');
    expect(sql).toContain('b.source = :source');
    expect(sql).toContain('b.member_id = :memberId');
    expect(sql).toContain('b.company_id = :companyId');
  });

  it('searches title, notes and the customer name when q is given', async () => {
    const { service, repository, calls } = await makeService();
    const { qb } = queryBuilderSpy();
    repository.createQueryBuilder.mockReturnValue(qb);

    await service.list(staff, {
      offset: 0, limit: 10, sort: Sort.ASC, q: 'stand-up',
    } as BookingPageOptionsDto);

    const sql = calls.map((c) => c.sql).join(' | ');
    expect(sql).toContain('b.title ILIKE :term');
    expect(sql).toContain('b.notes ILIKE :term');
    expect(sql).toContain('member.full_name ILIKE :term');
    expect(sql).toContain('company.name ILIKE :term');
  });

  it('ignores a q of only whitespace', async () => {
    const { service, repository, calls } = await makeService();
    const { qb } = queryBuilderSpy();
    repository.createQueryBuilder.mockReturnValue(qb);

    await service.list(staff, {
      offset: 0, limit: 10, sort: Sort.ASC, q: '   ',
    } as BookingPageOptionsDto);

    expect(calls.every((c) => !c.sql.includes('ILIKE'))).toBe(true);
  });
});
```

`makeService()` is the existing helper in this spec file that builds the testing module. If it does not exist yet, extract it from the `beforeEach` already in the file so both describes share it — do not duplicate the provider list.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- booking.service.spec`
Expected: FAIL — no `b.status = :status` fragment is recorded.

- [ ] **Step 3: Extend the DTO**

In `src/modules/booking/dtos/booking.dto.ts`, add to `BookingPageOptionsDto`:

```ts
  @ApiPropertyOptional({ enum: BookingStatus, enumName: 'BookingStatus' })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({ enum: BookingSource, enumName: 'BookingSource' })
  @IsEnum(BookingSource)
  @IsOptional()
  source?: BookingSource;

  /** Customer filter; member XOR company, same as the booking itself. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  companyId?: string;
```

Add `IsEnum` to the `class-validator` import and the two enums to the module imports.

- [ ] **Step 4: Implement the filters in `list()`**

In `src/modules/booking/services/booking.service.ts`, inside `list()` after the existing `to` filter:

```ts
    if (pageOptions.status) {
      query.andWhere('b.status = :status', { status: pageOptions.status });
    }
    if (pageOptions.source) {
      query.andWhere('b.source = :source', { source: pageOptions.source });
    }
    if (pageOptions.memberId) {
      query.andWhere('b.member_id = :memberId', {
        memberId: pageOptions.memberId,
      });
    }
    if (pageOptions.companyId) {
      query.andWhere('b.company_id = :companyId', {
        companyId: pageOptions.companyId,
      });
    }

    // Title and notes are the booking's own words; the customer name is
    // what staff actually search by, so it needs the joins.
    const term = pageOptions.q?.trim();
    if (term) {
      query
        .leftJoin('b.member', 'member')
        .leftJoin('b.company', 'company')
        .andWhere(
          new Brackets((qb) => {
            qb.where('b.title ILIKE :term', { term: `%${term}%` })
              .orWhere('b.notes ILIKE :term', { term: `%${term}%` })
              .orWhere('member.full_name ILIKE :term', { term: `%${term}%` })
              .orWhere('company.name ILIKE :term', { term: `%${term}%` });
          }),
        );
    }
```

`Brackets` is already imported at the top of this file.

If `BookingEntity` has no `member` / `company` relations declared, add them alongside the existing FK columns, following `UserEntity.roleId` + `role`:

```ts
  @ManyToOne(() => MemberEntity, { eager: false })
  @JoinColumn({ name: 'member_id' })
  member: MemberEntity | null;

  @ManyToOne(() => CompanyEntity, { eager: false })
  @JoinColumn({ name: 'company_id' })
  company: CompanyEntity | null;
```

No migration — the FK columns and constraints already exist (`1783728400000-create-bookings.ts:68-70`).

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test -- booking.service.spec`
Expected: PASS. The pre-existing member-scoping tests must still pass.

- [ ] **Step 6: Update the endpoint documentation**

In `src/modules/booking/docs/booking.doc.ts`, replace the `description` in `DocListBookings`:

```ts
      description:
        'Staff/admin see everything; member-role callers see their own ' +
        "and their employer company's bookings. Filters: resourceId, " +
        'status, source, memberId, companyId, and from/to (interval ' +
        'overlap — a booking matches when it touches the range). `q` ' +
        'searches title, notes and the customer name.',
```

- [ ] **Step 7: Verify the whole suite and the types**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/modules/booking
git commit -m "feat(booking): filter the list by status, source and customer

Also honours q, which PageOptionsDto has always declared and this
service has always ignored — the admin has been sending a search term
the API silently dropped."
```

---

### Task 4: `GET /bookings/stats`

The admin currently counts statuses by fetching 100 rows and filtering in JavaScript, which is wrong past 100 bookings. Same fix the CRM page already shipped.

**Files:**
- Create: `src/modules/booking/dtos/booking-stats.dto.ts`
- Modify: `src/modules/booking/services/booking.service.ts`
- Modify: `src/modules/booking/controllers/booking.controller.ts`
- Modify: `src/modules/booking/docs/booking.doc.ts`
- Create: `src/modules/booking/services/booking-stats.service.spec.ts`

**Interfaces:**
- Consumes: `BookingPageOptionsDto` filters from Task 3.
- Produces:
  ```ts
  class BookingStatusCountDto { status: BookingStatus; count: number }
  class BookingSourceCountDto { source: BookingSource; count: number }
  class BookingStatsDto {
    byStatus: BookingStatusCountDto[];
    bySource: BookingSourceCountDto[];
    total: number;
    bookedValueHt: number;
  }
  class BookingStatsOptionsDto {
    q?: string; resourceId?: string; from?: string; to?: string;
    source?: BookingSource; memberId?: string; companyId?: string;
  }
  // on BookingService
  async stats(options: BookingStatsOptionsDto): Promise<BookingStatsDto>
  ```

- [ ] **Step 1: Write the failing test**

Create `src/modules/booking/services/booking-stats.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingService } from '@modules/booking/services/booking.service';
import { BookingEntity } from '@modules/booking/entities/booking.entity';
import { BookingStatus } from '@modules/booking/enums/booking-status.enum';
import { BookingSource } from '@modules/booking/enums/booking-source.enum';

describe('BookingService.stats', () => {
  let service: BookingService;
  const repository = { createQueryBuilder: jest.fn() };

  function groupedQuery(rows: unknown[]) {
    const qb: Record<string, jest.Mock> = {};
    for (const m of ['select', 'addSelect', 'andWhere', 'groupBy', 'leftJoin']) {
      qb[m] = jest.fn(() => qb);
    }
    qb.getRawMany = jest.fn().mockResolvedValue(rows);
    qb.getRawOne = jest.fn().mockResolvedValue({ total: '3', value: '540' });
    return qb;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: getRepositoryToken(BookingEntity), useValue: repository },
        // ...the same collaborator mocks the existing booking.service.spec
        // beforeEach provides; copy that provider list verbatim.
      ],
    }).compile();
    service = moduleRef.get(BookingService);
  });

  it('returns a count for every status, including ones with no rows', async () => {
    repository.createQueryBuilder.mockReturnValue(
      groupedQuery([{ status: BookingStatus.PENDING, count: '3' }]),
    );

    const stats = await service.stats({});

    expect(stats.byStatus).toEqual([
      { status: BookingStatus.PENDING, count: 3 },
      { status: BookingStatus.CONFIRMED, count: 0 },
      { status: BookingStatus.CANCELLED, count: 0 },
      { status: BookingStatus.NO_SHOW, count: 0 },
    ]);
  });

  it('counts by source', async () => {
    repository.createQueryBuilder.mockReturnValue(
      groupedQuery([{ source: BookingSource.PUBLIC, count: '7' }]),
    );

    const stats = await service.stats({});

    expect(stats.bySource).toContainEqual({
      source: BookingSource.PUBLIC,
      count: 7,
    });
  });

  it('treats a credit-covered booking as zero value, not as missing', async () => {
    repository.createQueryBuilder.mockReturnValue(groupedQuery([]));

    const stats = await service.stats({});

    expect(stats.bookedValueHt).toBe(540);
    expect(stats.total).toBe(3);
  });
});
```

The "every status, including ones with no rows" case is the one that matters: a tab whose count vanishes when it hits zero reads as a broken tab, not an empty one.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- booking-stats.service.spec`
Expected: FAIL — `service.stats is not a function`.

- [ ] **Step 3: Create the DTOs**

Create `src/modules/booking/dtos/booking-stats.dto.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BookingStatus } from '@modules/booking/enums/booking-status.enum';
import { BookingSource } from '@modules/booking/enums/booking-source.enum';

export class BookingStatusCountDto {
  @ApiProperty({ enum: BookingStatus, enumName: 'BookingStatus' })
  status: BookingStatus;

  @ApiProperty({ example: 12 })
  count: number;
}

export class BookingSourceCountDto {
  @ApiProperty({ enum: BookingSource, enumName: 'BookingSource' })
  source: BookingSource;

  @ApiProperty({ example: 4 })
  count: number;
}

/**
 * The list's own filters, minus `status` — the counts *are* the
 * per-status breakdown, so filtering by status would collapse them.
 * Everything else must match the list, or the tab counts label rows
 * other than the ones on screen.
 */
export class BookingStatsOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ enum: BookingSource, enumName: 'BookingSource' })
  @IsEnum(BookingSource)
  @IsOptional()
  source?: BookingSource;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  companyId?: string;
}

export class BookingStatsDto {
  /** Every status, always — a zero reads as empty, a gap reads as broken. */
  @ApiProperty({ type: [BookingStatusCountDto] })
  byStatus: BookingStatusCountDto[];

  @ApiProperty({ type: [BookingSourceCountDto] })
  bySource: BookingSourceCountDto[];

  @ApiProperty({ example: 42 })
  total: number;

  /** Sum of priceHt; credit-covered bookings (NULL price) contribute 0. */
  @ApiProperty({ example: 1240.5 })
  bookedValueHt: number;
}
```

- [ ] **Step 4: Implement `stats()`**

In `src/modules/booking/services/booking.service.ts`, add below `list()`:

```ts
  /**
   * The whole list in three grouped queries. Counting a page of a hundred
   * rows in JavaScript was simply wrong once there were more than a
   * hundred bookings — and the page sorts ascending, so those hundred
   * were the oldest.
   */
  async stats(options: BookingStatsOptionsDto): Promise<BookingStatsDto> {
    const statusRows = await this.statsQuery(options)
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('b.status')
      .getRawMany<{ status: BookingStatus; count: string }>();

    const sourceRows = await this.statsQuery(options)
      .select('b.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('b.source')
      .getRawMany<{ source: BookingSource; count: string }>();

    const totals = await this.statsQuery(options)
      .select('COUNT(*)', 'total')
      .addSelect('COALESCE(SUM(b.price_ht), 0)', 'value')
      .getRawOne<{ total: string; value: string }>();

    const counted = new Map(
      statusRows.map((row) => [row.status, Number(row.count)]),
    );

    const stats = new BookingStatsDto();
    // Every status, always: a tab whose count disappears at zero reads
    // as broken rather than empty.
    stats.byStatus = Object.values(BookingStatus).map((status) => ({
      status,
      count: counted.get(status) ?? 0,
    }));
    stats.bySource = sourceRows.map((row) => ({
      source: row.source,
      count: Number(row.count),
    }));
    stats.total = Number(totals?.total ?? 0);
    stats.bookedValueHt = roundMoney(Number(totals?.value ?? 0));
    return stats;
  }

  /** The list's filters, minus status. Shared by all three aggregates. */
  private statsQuery(options: BookingStatsOptionsDto) {
    const query = this.bookingRepository.createQueryBuilder('b');

    if (options.resourceId) {
      query.andWhere('b.resource_id = :resourceId', {
        resourceId: options.resourceId,
      });
    }
    if (options.from) {
      query.andWhere('b.ends_at > :from', { from: options.from });
    }
    if (options.to) {
      query.andWhere('b.starts_at < :to', { to: options.to });
    }
    if (options.source) {
      query.andWhere('b.source = :source', { source: options.source });
    }
    if (options.memberId) {
      query.andWhere('b.member_id = :memberId', { memberId: options.memberId });
    }
    if (options.companyId) {
      query.andWhere('b.company_id = :companyId', {
        companyId: options.companyId,
      });
    }

    const term = options.q?.trim();
    if (term) {
      query
        .leftJoin('b.member', 'member')
        .leftJoin('b.company', 'company')
        .andWhere(
          new Brackets((qb) => {
            qb.where('b.title ILIKE :term', { term: `%${term}%` })
              .orWhere('b.notes ILIKE :term', { term: `%${term}%` })
              .orWhere('member.full_name ILIKE :term', { term: `%${term}%` })
              .orWhere('company.name ILIKE :term', { term: `%${term}%` });
          }),
        );
    }

    return query;
  }
```

Import `roundMoney` from `@common/base/money-column.transformer` (check the exact export path there; it is the same helper CONVENTIONS §2 requires for every computed amount).

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test -- booking-stats.service.spec`
Expected: PASS, 3 tests.

- [ ] **Step 6: Add the doc decorator**

In `src/modules/booking/docs/booking.doc.ts`:

```ts
export function DocBookingStats(): MethodDecorator {
  return applyDecorators(
    Doc({
      operationId: 'getBookingStats',
      summary: 'Booking counts by status and source',
      description:
        'Counts for the list tabs and the summary cards, computed in the ' +
        'database. Takes the same filters as the list except `status` — ' +
        'the counts are the per-status breakdown, so filtering by it ' +
        'would collapse them. Every status is present, zero included.',
    }),
    DocResponse(BookingStatsDto),
  );
}
```

- [ ] **Step 7: Add the route, before any `/:id`**

In `src/modules/booking/controllers/booking.controller.ts`, immediately after `list()`:

```ts
  // Declared before '/:id' so "stats" is never parsed as a booking id.
  @Get('/stats')
  @DocBookingStats()
  @ProtectedWith(BOOKING_READ)
  stats(@Query() options: BookingStatsOptionsDto): Promise<BookingStatsDto> {
    return this.bookingService.stats(options);
  }
```

- [ ] **Step 8: Verify the route order with a running server**

```bash
pnpm start:dev &
sleep 15
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:3000/api/v1/bookings/stats'
kill %1
```

Expected: `401` (unauthenticated), **not** `400`. A `400` means the route was matched by `/:id` and `ParseUUIDPipe` rejected the literal `stats` — move the declaration higher.

- [ ] **Step 9: Commit**

```bash
git add src/modules/booking
git commit -m "feat(booking): add GET /bookings/stats

Counts by status and source in the database, so the tabs and summary
cards stop being computed from the first page of results."
```

---

### Task 5: `GET /bookings/calendar`

The endpoint the calendar renders from: per room, its summary, its bookable windows, and its actual bookings as clickable blocks.

**Files:**
- Create: `src/modules/booking/dtos/booking-calendar.dto.ts`
- Create: `src/modules/booking/services/booking-calendar.service.ts`
- Create: `src/modules/booking/services/booking-calendar.service.spec.ts`
- Modify: `src/modules/booking/controllers/booking.controller.ts`
- Modify: `src/modules/booking/docs/booking.doc.ts`
- Modify: `src/modules/booking/booking.module.ts`

**Interfaces:**
- Consumes: `windowsForRange()` (Task 2), `localDayBounds()` (Task 1).
- Produces:
  ```ts
  class BookingCalendarQueryDto {
    from: string; to: string;
    resourceIds?: string[]; resourceTypeId?: string; locationId?: string;
  }
  class AmenitySummaryDto { id: string; name: string; icon: string | null }
  class CalendarResourceSummaryDto {
    id: string; name: string; capacity: number; imageUrl: string | null;
    resourceTypeId: string; bookingMode: BookingMode;
    minDurationMin: number | null; maxDurationMin: number | null;
    cancellationHours: number; amenities: AmenitySummaryDto[];
  }
  class CalendarBlockDto {
    bookingId: string; startsAt: Date; endsAt: Date;
    status: BookingStatus; title: string | null;
    customerName: string | null; source: BookingSource;
  }
  class CalendarResourceDto {
    resource: CalendarResourceSummaryDto;
    days: AvailabilityDayDto[];
    blocks: CalendarBlockDto[];
  }
  class BookingCalendarDto {
    from: string; to: string; timezone: string;
    resources: CalendarResourceDto[];
  }
  // on BookingCalendarService
  async calendar(query: BookingCalendarQueryDto): Promise<BookingCalendarDto>
  ```

**Note the `timezone` field on the envelope.** The grid needs to know which zone its time axis is in, and the frontend must not infer it from the browser. It is the location's timezone.

- [ ] **Step 1: Write the failing tests**

Create `src/modules/booking/services/booking-calendar.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingCalendarService } from '@modules/booking/services/booking-calendar.service';
import { AvailabilityService } from '@modules/booking/services/availability.service';
import { BookingEntity } from '@modules/booking/entities/booking.entity';
import { BookingStatus } from '@modules/booking/enums/booking-status.enum';
import { BookingSource } from '@modules/booking/enums/booking-source.enum';
import { ResourceService } from '@modules/catalog/services/resource.service';
import { LocationService } from '@modules/location/services/location.service';

const FROM = '2026-08-24T00:00:00Z';
const TO = '2026-08-25T00:00:00Z';

const room = (id: string, locationId = 'loc-1') =>
  ({
    id,
    name: `Room ${id}`,
    locationId,
    resourceTypeId: 'rt-1',
    capacity: 8,
    imageUrl: null,
    minDurationMin: 60,
    maxDurationMin: 480,
    cancellationHours: 24,
    amenities: [{ id: 'a1', name: 'Screen', icon: 'tv' }],
    resourceType: { id: 'rt-1', canBook: true, bookingMode: 'hourly' },
  }) as never;

describe('BookingCalendarService.calendar', () => {
  let service: BookingCalendarService;

  const repository = { createQueryBuilder: jest.fn() };
  const resourceService = { listBookable: jest.fn() };
  const locationService = { findOrFail: jest.fn() };
  const availabilityService = { windowsForRange: jest.fn() };

  function bookingQuery(rows: unknown[]) {
    const qb: Record<string, jest.Mock> = {};
    for (const m of ['where', 'andWhere', 'orderBy', 'leftJoinAndSelect']) {
      qb[m] = jest.fn(() => qb);
    }
    qb.getMany = jest.fn().mockResolvedValue(rows);
    return qb;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    locationService.findOrFail.mockResolvedValue({
      id: 'loc-1',
      timezone: 'Africa/Tunis',
    });
    availabilityService.windowsForRange.mockResolvedValue([
      { date: '2026-08-24', windows: [{ open: '08:00', close: '18:00' }] },
    ]);
    repository.createQueryBuilder.mockReturnValue(bookingQuery([]));

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingCalendarService,
        { provide: getRepositoryToken(BookingEntity), useValue: repository },
        { provide: ResourceService, useValue: resourceService },
        { provide: LocationService, useValue: locationService },
        { provide: AvailabilityService, useValue: availabilityService },
      ],
    }).compile();

    service = moduleRef.get(BookingCalendarService);
  });

  it('returns one entry per bookable room, with its windows', async () => {
    resourceService.listBookable.mockResolvedValue([room('r1'), room('r2')]);

    const result = await service.calendar({ from: FROM, to: TO });

    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].days[0].windows).toEqual([
      { open: '08:00', close: '18:00' },
    ]);
    expect(result.timezone).toBe('Africa/Tunis');
  });

  it('includes pending blocks alongside confirmed ones', async () => {
    resourceService.listBookable.mockResolvedValue([room('r1')]);
    repository.createQueryBuilder.mockReturnValue(
      bookingQuery([
        {
          id: 'b1', resourceId: 'r1',
          startsAt: new Date('2026-08-24T09:00:00Z'),
          endsAt: new Date('2026-08-24T10:00:00Z'),
          status: BookingStatus.CONFIRMED,
          source: BookingSource.STAFF,
          title: 'Stand-up', member: { fullName: 'Amel' }, company: null,
        },
        {
          id: 'b2', resourceId: 'r1',
          startsAt: new Date('2026-08-24T09:00:00Z'),
          endsAt: new Date('2026-08-24T10:00:00Z'),
          status: BookingStatus.PENDING,
          source: BookingSource.PUBLIC,
          title: null, member: null, company: { name: 'Acme' },
        },
      ]),
    );

    const result = await service.calendar({ from: FROM, to: TO });

    const statuses = result.resources[0].blocks.map((b) => b.status);
    expect(statuses).toEqual([BookingStatus.CONFIRMED, BookingStatus.PENDING]);
    // Two pending/confirmed bookings on one slot is legal — the exclusion
    // constraint only covers confirmed — and the calendar is where staff
    // are meant to see it.
    expect(result.resources[0].blocks[1].customerName).toBe('Acme');
  });

  it('resolves the customer name from member or company', async () => {
    resourceService.listBookable.mockResolvedValue([room('r1')]);
    repository.createQueryBuilder.mockReturnValue(
      bookingQuery([
        {
          id: 'b1', resourceId: 'r1',
          startsAt: new Date('2026-08-24T09:00:00Z'),
          endsAt: new Date('2026-08-24T10:00:00Z'),
          status: BookingStatus.CONFIRMED, source: BookingSource.STAFF,
          title: null, member: { fullName: 'Amel' }, company: null,
        },
      ]),
    );

    const result = await service.calendar({ from: FROM, to: TO });

    expect(result.resources[0].blocks[0].customerName).toBe('Amel');
  });

  it('refuses a range wider than 31 days', async () => {
    resourceService.listBookable.mockResolvedValue([room('r1')]);

    await expect(
      service.calendar({ from: '2026-01-01T00:00:00Z', to: '2026-03-01T00:00:00Z' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('refuses from >= to', async () => {
    resourceService.listBookable.mockResolvedValue([room('r1')]);

    await expect(
      service.calendar({ from: TO, to: FROM }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('refuses a room set spanning two locations', async () => {
    resourceService.listBookable.mockResolvedValue([
      room('r1', 'loc-1'),
      room('r2', 'loc-2'),
    ]);

    await expect(service.calendar({ from: FROM, to: TO })).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('returns an empty resource list rather than throwing when nothing is bookable', async () => {
    resourceService.listBookable.mockResolvedValue([]);

    const result = await service.calendar({ from: FROM, to: TO });

    expect(result.resources).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- booking-calendar.service.spec`
Expected: FAIL — cannot resolve `BookingCalendarService`.

- [ ] **Step 3: Create the DTOs**

Create `src/modules/booking/dtos/booking-calendar.dto.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { BookingMode } from '@modules/catalog/enums/booking-mode.enum';
import { BookingStatus } from '@modules/booking/enums/booking-status.enum';
import { BookingSource } from '@modules/booking/enums/booking-source.enum';
import { AvailabilityDayDto } from '@modules/booking/dtos/availability.dto';

export class BookingCalendarQueryDto {
  @ApiProperty({ example: '2026-08-24T00:00:00Z' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-08-25T00:00:00Z' })
  @IsDateString()
  to: string;

  /** Comma-separated; omit for every bookable room in scope. */
  @ApiPropertyOptional({ type: String, example: 'uuid,uuid' })
  @Transform(({ value }: { value: string | undefined }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  @IsUUID('4', { each: true })
  @IsOptional()
  resourceIds?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  resourceTypeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  locationId?: string;
}

export class AmenitySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Screen' })
  name: string;

  @ApiProperty({ type: String, nullable: true, example: 'tv' })
  icon: string | null;
}

/** Enough to draw the room's column header without a second call. */
export class CalendarResourceSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Alpha Room' })
  name: string;

  @ApiProperty({ example: 8 })
  capacity: number;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ format: 'uuid' })
  resourceTypeId: string;

  @ApiProperty({ enum: BookingMode, enumName: 'BookingMode' })
  bookingMode: BookingMode;

  @ApiProperty({ type: Number, nullable: true, example: 60 })
  minDurationMin: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 480 })
  maxDurationMin: number | null;

  @ApiProperty({ example: 24 })
  cancellationHours: number;

  @ApiProperty({ type: [AmenitySummaryDto] })
  amenities: AmenitySummaryDto[];
}

/**
 * A booking as the calendar draws it. Pending is present as well as
 * confirmed: the anti-overlap constraint covers only confirmed rows, so
 * several pending requests may sit on one slot, and this is where staff
 * are meant to see that.
 */
export class CalendarBlockDto {
  @ApiProperty({ format: 'uuid' })
  bookingId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startsAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endsAt: Date;

  @ApiProperty({ enum: BookingStatus, enumName: 'BookingStatus' })
  status: BookingStatus;

  @ApiProperty({ type: String, nullable: true })
  title: string | null;

  /** Resolved server-side; the grid must not re-derive it from ids. */
  @ApiProperty({ type: String, nullable: true, example: 'Amel Ben Ali' })
  customerName: string | null;

  @ApiProperty({ enum: BookingSource, enumName: 'BookingSource' })
  source: BookingSource;
}

export class CalendarResourceDto {
  @ApiProperty({ type: CalendarResourceSummaryDto })
  resource: CalendarResourceSummaryDto;

  @ApiProperty({ type: [AvailabilityDayDto] })
  days: AvailabilityDayDto[];

  @ApiProperty({ type: [CalendarBlockDto] })
  blocks: CalendarBlockDto[];
}

export class BookingCalendarDto {
  @ApiProperty({ type: String, format: 'date-time' })
  from: string;

  @ApiProperty({ type: String, format: 'date-time' })
  to: string;

  /**
   * IANA zone of the location this grid belongs to. The time axis is
   * drawn in it — clients must not fall back to the browser's zone.
   */
  @ApiProperty({ example: 'Europe/Lisbon' })
  timezone: string;

  @ApiProperty({ type: [CalendarResourceDto] })
  resources: CalendarResourceDto[];
}
```

- [ ] **Step 4: Add `listBookable` to `ResourceService`**

In `src/modules/catalog/services/resource.service.ts`:

```ts
  /**
   * Every bookable resource in scope, with the relations the calendar
   * header needs. Bookable is `resourceType.canBook` — not a bookingMode
   * test, which describes how it is priced rather than whether it can be
   * booked at all.
   */
  async listBookable(filter: {
    resourceIds?: string[];
    resourceTypeId?: string;
    locationId?: string;
  }): Promise<ResourceEntity[]> {
    const query = this.resourceRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.resourceType', 'rt')
      .leftJoinAndSelect('r.amenities', 'amenity')
      .where('rt.can_book = true')
      .andWhere('r.active = true')
      .andWhere('r.hidden = false');

    if (filter.resourceIds?.length) {
      query.andWhere('r.id IN (:...resourceIds)', {
        resourceIds: filter.resourceIds,
      });
    }
    if (filter.resourceTypeId) {
      query.andWhere('r.resource_type_id = :resourceTypeId', {
        resourceTypeId: filter.resourceTypeId,
      });
    }
    if (filter.locationId) {
      query.andWhere('r.location_id = :locationId', {
        locationId: filter.locationId,
      });
    }

    return query.orderBy('r.name', 'ASC').getMany();
  }
```

- [ ] **Step 5: Implement `BookingCalendarService`**

Create `src/modules/booking/services/booking-calendar.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unprocessableProblem } from '@common/http/exceptions/problem.exception';
import { BookingEntity } from '@modules/booking/entities/booking.entity';
import { BookingStatus } from '@modules/booking/enums/booking-status.enum';
import {
  BookingCalendarDto,
  BookingCalendarQueryDto,
  CalendarBlockDto,
  CalendarResourceDto,
  CalendarResourceSummaryDto,
} from '@modules/booking/dtos/booking-calendar.dto';
import { AvailabilityService } from '@modules/booking/services/availability.service';
import { ResourceService } from '@modules/catalog/services/resource.service';
import { LocationService } from '@modules/location/services/location.service';
import { type ResourceEntity } from '@modules/catalog/entities/resource.entity';

/** Same ceiling as the availability endpoint; also bounds the month view. */
const MAX_RANGE_DAYS = 31;

/** What the calendar draws. Cancelled and no-show are not on a calendar. */
const DRAWN = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

@Injectable()
export class BookingCalendarService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly resourceService: ResourceService,
    private readonly locationService: LocationService,
    private readonly availability: AvailabilityService,
  ) {}

  async calendar(query: BookingCalendarQueryDto): Promise<BookingCalendarDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (from >= to) {
      throw unprocessableProblem(
        'date_range_invalid',
        '`from` must be before `to`',
      );
    }
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) {
      throw unprocessableProblem(
        'date_range_too_wide',
        `Calendar ranges are limited to ${MAX_RANGE_DAYS} days`,
      );
    }

    const resources = await this.resourceService.listBookable({
      resourceIds: query.resourceIds,
      resourceTypeId: query.resourceTypeId,
      locationId: query.locationId,
    });

    const dto = new BookingCalendarDto();
    dto.from = query.from;
    dto.to = query.to;
    dto.resources = [];

    if (resources.length === 0) {
      // Nothing bookable in scope is an empty grid, not an error.
      dto.timezone = 'UTC';
      return dto;
    }

    // A day grid is one place's day. Rooms in two timezones have no
    // coherent time axis, so the caller must narrow rather than get a
    // silently wrong grid.
    const locationIds = [...new Set(resources.map((r) => r.locationId))];
    if (locationIds.length > 1) {
      throw unprocessableProblem(
        'mixed_location_calendar',
        'A calendar covers one location; narrow with locationId',
      );
    }

    const location = await this.locationService.findOrFail(locationIds[0]);
    dto.timezone = location.timezone;

    const blocks = await this.blocksByResource(
      resources.map((r) => r.id),
      from,
      to,
    );

    for (const resource of resources) {
      const entry = new CalendarResourceDto();
      entry.resource = this.summarise(resource);
      entry.days = await this.availability.windowsForRange(resource, from, to);
      entry.blocks = blocks.get(resource.id) ?? [];
      dto.resources.push(entry);
    }

    return dto;
  }

  private async blocksByResource(
    resourceIds: string[],
    from: Date,
    to: Date,
  ): Promise<Map<string, CalendarBlockDto[]>> {
    const rows = await this.bookingRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.member', 'member')
      .leftJoinAndSelect('b.company', 'company')
      .where('b.resource_id IN (:...resourceIds)', { resourceIds })
      .andWhere('b.status IN (:...statuses)', { statuses: DRAWN })
      .andWhere('b.starts_at < :to AND b.ends_at > :from', {
        from: from.toISOString(),
        to: to.toISOString(),
      })
      .orderBy('b.starts_at', 'ASC')
      .getMany();

    const grouped = new Map<string, CalendarBlockDto[]>();
    for (const row of rows) {
      const block = new CalendarBlockDto();
      block.bookingId = row.id;
      block.startsAt = row.startsAt;
      block.endsAt = row.endsAt;
      block.status = row.status;
      block.title = row.title ?? null;
      block.source = row.source;
      // Resolved here so the grid never re-derives names from ids and
      // inherits a page-size cliff.
      block.customerName =
        row.member?.fullName ?? row.company?.name ?? null;

      const list = grouped.get(row.resourceId) ?? [];
      list.push(block);
      grouped.set(row.resourceId, list);
    }
    return grouped;
  }

  private summarise(resource: ResourceEntity): CalendarResourceSummaryDto {
    const summary = new CalendarResourceSummaryDto();
    summary.id = resource.id;
    summary.name = resource.name;
    summary.capacity = resource.capacity;
    summary.imageUrl = resource.imageUrl ?? null;
    summary.resourceTypeId = resource.resourceTypeId;
    summary.bookingMode = resource.resourceType.bookingMode;
    summary.minDurationMin = resource.minDurationMin ?? null;
    summary.maxDurationMin = resource.maxDurationMin ?? null;
    summary.cancellationHours = resource.cancellationHours;
    summary.amenities = (resource.amenities ?? []).map((amenity) => ({
      id: amenity.id,
      name: amenity.name,
      icon: amenity.icon ?? null,
    }));
    return summary;
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test -- booking-calendar.service.spec`
Expected: PASS, 7 tests.

- [ ] **Step 7: Register the service in the module**

In `src/modules/booking/booking.module.ts`, add `BookingCalendarService` to `providers` and to `exports`.

- [ ] **Step 8: Add the doc decorator**

In `src/modules/booking/docs/booking.doc.ts`:

```ts
export function DocBookingCalendar(): MethodDecorator {
  return applyDecorators(
    Doc({
      operationId: 'getBookingCalendar',
      summary: 'Calendar grid: rooms, windows and blocks',
      description:
        'Everything one grid needs in a single read: per bookable room, ' +
        'its header summary, its bookable windows per local day, and its ' +
        'pending and confirmed bookings as blocks. Range ≤ 31 days. The ' +
        'grid covers one location — its timezone is on the envelope.',
    }),
    DocResponse(BookingCalendarDto),
    DocOneOf(
      HttpStatus.UNPROCESSABLE_ENTITY,
      {
        type: 'date_range_invalid',
        title: 'Unprocessable Entity',
        detail: '`from` must be before `to`',
      },
      {
        type: 'date_range_too_wide',
        title: 'Unprocessable Entity',
        detail: 'Calendar ranges are limited to 31 days',
      },
      {
        type: 'mixed_location_calendar',
        title: 'Unprocessable Entity',
        detail: 'A calendar covers one location; narrow with locationId',
      },
    ),
  );
}
```

- [ ] **Step 9: Add the route, before any `/:id`**

In `src/modules/booking/controllers/booking.controller.ts`, beside the stats route. Note the tighter guard — staff and admin only, deliberately not `BOOKING_READ`:

```ts
const CALENDAR_READ: ProtectedWithOptions = {
  roles: [RoleType.ADMIN, RoleType.STAFF],
  permissions: {
    action: PermissionAction.READ,
    resource: PermissionResource.BOOKING,
  },
};
```

```ts
  // Before '/:id', like '/stats'.
  @Get('/calendar')
  @DocBookingCalendar()
  @ProtectedWith(CALENDAR_READ)
  calendar(
    @Query() query: BookingCalendarQueryDto,
  ): Promise<BookingCalendarDto> {
    return this.calendarService.calendar(query);
  }
```

Inject `BookingCalendarService` in the constructor as `calendarService`.

- [ ] **Step 10: Verify route order and validation against a running server**

```bash
pnpm start:dev &
sleep 15
curl -s -o /dev/null -w 'no-auth: %{http_code}\n' \
  'http://localhost:3000/api/v1/bookings/calendar?from=2026-08-24T00:00:00Z&to=2026-08-25T00:00:00Z'
kill %1
```

Expected: `401`, not `400`. A `400` means `/:id` matched first.

- [ ] **Step 11: Verify the whole suite and types**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add src/modules/booking src/modules/catalog
git commit -m "feat(booking): add GET /bookings/calendar

One read per grid: rooms, their bookable windows per local day, and
their pending and confirmed bookings as blocks with resolved customer
names. Pending is included because the exclusion constraint covers only
confirmed rows, so contended slots exist and staff need to see them.

The grid is per-location: a room set spanning timezones has no coherent
time axis, so it is refused rather than silently drawn wrong."
```

---

### Task 6: Index for the calendar's access pattern

The calendar filters `resource_id IN (...) AND starts_at < :to AND ends_at > :from`. The existing `IDX_bookings_resource_id` is single-column and leaves the range predicate to a filter step.

**Files:**
- Create: `src/modules/booking/migrations/<epoch-ms>-index-bookings-resource-starts-at.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Generate the timestamp for the filename**

```bash
node -e "console.log(Date.now())"
```

Use that value for both the filename prefix and the class-name suffix.

- [ ] **Step 2: Write the migration**

Create `src/modules/booking/migrations/<epoch-ms>-index-bookings-resource-starts-at.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The calendar reads one range across many rooms:
 *   resource_id IN (...) AND starts_at < :to AND ends_at > :from
 * The existing single-column IDX_bookings_resource_id narrows to the
 * room and then filters the range row by row; the composite lets the
 * range be an index condition too.
 */
export class IndexBookingsResourceStartsAt<epoch-ms>
  implements MigrationInterface
{
  name = 'IndexBookingsResourceStartsAt<epoch-ms>';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_resource_starts_at"
        ON "bookings" ("resource_id", "starts_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bookings_resource_starts_at"`,
    );
  }
}
```

Replace both `<epoch-ms>` placeholders with the number from Step 1.

- [ ] **Step 3: Run the migration**

Run: `pnpm migration:run`
Expected: the migration applies with no error.

- [ ] **Step 4: Verify it reverts cleanly**

```bash
pnpm migration:revert
pnpm migration:run
```

Expected: both succeed. A `down()` that does not work is a broken migration per CONVENTIONS §10.

- [ ] **Step 5: Commit**

```bash
git add src/modules/booking/migrations
git commit -m "perf(booking): index (resource_id, starts_at) for the calendar

The calendar reads one time range across many rooms; the single-column
resource index left the range as a row-by-row filter."
```

---

### Task 7: CRM created-date range filter

The last piece, and the one where the region rule bites: opportunities have no location, so the server has no timezone to resolve a "day" against. It therefore takes instants and does no conversion — the client decides what a day means.

**Files:**
- Modify: `src/modules/crm/dtos/opportunity.dtos.ts:414-454`
- Modify: `src/modules/crm/services/opportunity.service.ts` (`list()` ~line 80, `statsQuery()` ~line 213)
- Modify: `src/modules/crm/docs/opportunity.doc.ts`
- Modify: `src/modules/crm/services/opportunity.service.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  // added to BOTH OpportunityPageOptionsDto and OpportunityStatsOptionsDto
  createdFrom?: string;   // ISO instant, inclusive
  createdTo?: string;     // ISO instant, exclusive
  ```

- [ ] **Step 1: Write the failing tests**

Append to `src/modules/crm/services/opportunity.service.spec.ts`:

```ts
describe('OpportunityService created-date filter', () => {
  it('bounds the list by createdFrom and createdTo', async () => {
    const { service, repository } = await makeService();

    await service.list({
      offset: 0, limit: 10, sort: Sort.DESC,
      createdFrom: '2026-08-01T00:00:00Z',
      createdTo: '2026-08-08T00:00:00Z',
    } as OpportunityPageOptionsDto);

    const where = repository.findAndCount.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('accepts createdFrom alone', async () => {
    const { service, repository } = await makeService();

    await service.list({
      offset: 0, limit: 10, sort: Sort.DESC,
      createdFrom: '2026-08-01T00:00:00Z',
    } as OpportunityPageOptionsDto);

    expect(repository.findAndCount.mock.calls[0][0].where.createdAt)
      .toBeDefined();
  });

  it('applies the same bounds to stats, so counts match the rows', async () => {
    const { service, calls } = await makeServiceWithQueryBuilderSpy();

    await service.stats({
      createdFrom: '2026-08-01T00:00:00Z',
      createdTo: '2026-08-08T00:00:00Z',
    } as OpportunityStatsOptionsDto);

    const sql = calls.map((c) => c.sql).join(' | ');
    expect(sql).toContain('opportunity.created_at >= :createdFrom');
    expect(sql).toContain('opportunity.created_at < :createdTo');
  });
});
```

Reuse the existing helpers in this spec file for building the service; if there is only an inline `beforeEach`, extract `makeService()` from it rather than duplicating the provider list.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- opportunity.service.spec`
Expected: FAIL — `where.createdAt` is undefined.

- [ ] **Step 3: Extend both DTOs**

In `src/modules/crm/dtos/opportunity.dtos.ts`, add the same pair to `OpportunityPageOptionsDto` **and** `OpportunityStatsOptionsDto`:

```ts
  /**
   * Instants, not dates. An opportunity has no location, so the server
   * has no timezone in which to decide what "a day" is — and picking one
   * would bake a region into a region-neutral entity. The client turns
   * the day it means into a pair of instants.
   */
  @ApiPropertyOptional({ example: '2026-08-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  createdFrom?: string;

  /** Exclusive upper bound. */
  @ApiPropertyOptional({ example: '2026-08-08T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  createdTo?: string;
```

Add `IsDateString` to the `class-validator` import if absent.

- [ ] **Step 4: Apply the bounds in `list()`**

In `src/modules/crm/services/opportunity.service.ts`, before the `findAndCount` call:

```ts
    if (pageOptions.createdFrom && pageOptions.createdTo) {
      where.createdAt = Between(
        new Date(pageOptions.createdFrom),
        new Date(pageOptions.createdTo),
      );
    } else if (pageOptions.createdFrom) {
      where.createdAt = MoreThanOrEqual(new Date(pageOptions.createdFrom));
    } else if (pageOptions.createdTo) {
      where.createdAt = LessThan(new Date(pageOptions.createdTo));
    }
```

Import `Between`, `MoreThanOrEqual` and `LessThan` from `typeorm`.

- [ ] **Step 5: Apply the same bounds in `statsQuery()`**

```ts
    if (options.createdFrom) {
      query.andWhere('opportunity.created_at >= :createdFrom', {
        createdFrom: options.createdFrom,
      });
    }
    if (options.createdTo) {
      query.andWhere('opportunity.created_at < :createdTo', {
        createdTo: options.createdTo,
      });
    }
```

Both, always — a stats query that ignores a filter the list applies makes every tab count label rows other than the ones on screen.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test -- opportunity.service.spec`
Expected: PASS.

- [ ] **Step 7: Update the documentation**

In `src/modules/crm/docs/opportunity.doc.ts`, extend the `description` on both `DocListOpportunities` and `DocOpportunityStats`:

```
'… Filter by creation time with createdFrom/createdTo (ISO instants, ' +
'upper bound exclusive). They are instants rather than dates because an ' +
'opportunity has no location and therefore no timezone in which to ' +
'define a day — the client decides what day it means.'
```

- [ ] **Step 8: Verify the whole suite and types**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/modules/crm
git commit -m "feat(crm): filter opportunities by creation time

createdFrom/createdTo on both the list and the stats, or the tab counts
would label rows other than the ones on screen.

Instants rather than day strings: an opportunity has no location, so the
server has no timezone in which to define a day, and guessing one would
bake a region into a region-neutral entity."
```

---

### Task 8: Amend the stale convention and hand off to the frontend

**Files:**
- Modify: `docs/CONVENTIONS.md:33`

- [ ] **Step 1: Correct the business-time line**

In `docs/CONVENTIONS.md:33`, replace the trailing clause of the Hyperspace domain rules:

```
… all timestamps `timestamptz`; business time resolves per location from
`LocationEntity.timezone` via `localParts()` (`src/common/time/location-hours.util.ts`)
— never from a constant, a platform default, or the server clock. The
platform is multi-region; no module may name an IANA zone outside a test
fixture.
```

- [ ] **Step 2: Verify no region constant crept in**

```bash
grep -rn "Africa/Tunis" src | grep -v "\.spec\.ts" | grep -v "create-location.dto.ts"
```

Expected: no output. The location DTO default and test fixtures are the only legitimate mentions.

- [ ] **Step 3: Run the full gate**

```bash
pnpm exec prettier --check "src/**/*.ts"
pnpm exec eslint src
pnpm exec tsc --noEmit
pnpm test
```

Expected: all four PASS. This is exactly what CI runs.

- [ ] **Step 4: Commit**

```bash
git add docs/CONVENTIONS.md
git commit -m "docs: business time resolves per location, not from a constant

The code has been region-general since location-hours.util; this line
still said Africa/Tunis."
```

- [ ] **Step 5: Regenerate the frontend client**

```bash
cd ../hyperspace-platform
pnpm generate
git diff --stat lib/service/
```

Expected: `lib/service/HsService.ts` and `lib/service/index.ts` gain `getBookingCalendar`, `getBookingStats`, the new DTO types, and the new query params. Nothing in `lib/service/` is hand-edited.

- [ ] **Step 6: Commit the regenerated client**

```bash
git add lib/service/
git commit -m "chore(api): regenerate the client against the booking calendar

Adds getBookingCalendar, getBookingStats, the calendar DTOs and the new
booking and opportunity list filters."
```

---

## Done when

- `pnpm test` green, including 6 `localDayBounds` cases across four timezones and both DST directions.
- `pnpm exec tsc --noEmit`, `eslint` and `prettier --check` clean.
- `grep -rn "Africa/Tunis" src` returns only the location DTO default and test fixtures.
- `GET /bookings/calendar` and `GET /bookings/stats` return `401` unauthenticated rather than `400` — proving they are matched before `/:id`.
- The regenerated client in `hyperspace-platform/lib/service/` exposes both new endpoints.

**Next:** `docs/superpowers/plans/2026-08-26-booking-calendar-ui.md` — the frontend plan, which depends on the regenerated client from Task 8.
