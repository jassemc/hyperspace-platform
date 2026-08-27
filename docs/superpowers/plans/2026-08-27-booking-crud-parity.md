# Booking CRUD Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the bookings page up to the CRM pages' standard — embedded row summaries instead of blanket lookups, a stats endpoint with series and per-group values, a details modal, a proper date-time field, a bookable-only resource select, and four create/edit defects fixed.

**Architecture:** Backend first, in `hscowork-backend-platform`: slim summary DTOs on `BookingDto`, a read/write split so TypeORM never saves an entity with relations attached, joins in `list()`, three new stats fields, and a `canBook` filter on the resources list. Then regenerate the typed client in `hyperspace-platform` and let the frontend consume it. The frontend cleanup cannot compile before the regenerate, so the repo order is fixed.

**Tech Stack:** NestJS 11 + TypeORM + Postgres (backend, Jest); Next.js 15 App Router + React 19 + Tailwind + shadcn/Radix (frontend, no test runner).

**Spec:** `docs/superpowers/specs/2026-08-27-booking-crud-parity-design.md` (in `hyperspace-platform`)

## Global Constraints

- **Two repos.** Tasks 1–5 run in `/Users/mohamedali.may/Workspace/Personal/hs/hscowork-backend-platform`. Tasks 6–11 run in `/Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform`. Every task states its repo. Commit in the repo you are working in.
- **Backend commands:** `npm test -- <path>` for one spec, `npm run lint:check`, `npm run build`.
- **Frontend has no test runner.** Its verification is `npx tsc --noEmit` and `npm run lint`, plus the stated manual check. Do not add a test framework.
- **Business timezone** is `Africa/Tunis`, already declared as `BUSINESS_TZ` in `opportunity.service.ts`. Booking stats declares its own copy; do not import across modules.
- **Trend window** is 8 weeks, oldest first, always all 8 — a week with nothing in it is a zero row, never a gap.
- **Money** is dinars excluding VAT. `priceHt` NULL means fully credit-covered and contributes 0 to any sum.
- **Do not touch:** the member/company selects' 100-row cap, calendar click-to-edit, un-flagging a no-show, reschedule, or `state.resourceId`. All are recorded as out of scope in the spec.
- **`app/booking/bookings/add-booking-form.tsx` has uncommitted work** in the frontend repo (the `messageFor` / `problemType` handling). Keep it. Do not revert it.

---

### Task 1: Slim summary DTOs and mapper

**Repo:** `hscowork-backend-platform`

**Files:**
- Modify: `src/modules/booking/dtos/booking.dto.ts`
- Modify: `src/modules/booking/mappers/booking.mapper.ts`
- Test: `src/modules/booking/services/booking.service.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `BookingResourceDto {id: string, name: string}`, `BookingMemberDto {id: string, fullName: string, email: string | null}`, `BookingCompanyDto {id: string, name: string}`, all exported from `@modules/booking/dtos/booking.dto`. `BookingDto` gains `resource: BookingResourceDto`, `member?: BookingMemberDto | null`, `company?: BookingCompanyDto | null`.

- [ ] **Step 1: Write the failing test**

Append inside the top-level `describe('BookingService', ...)` block in `booking.service.spec.ts`:

```ts
  describe('summaries', () => {
    const mapperOnly = () => new BookingMapper();

    it('names the resource, member and company when the relations are joined', () => {
      const entity = Object.assign(new BookingEntity(), {
        id: BOOKING_ID,
        resourceId: RESOURCE_ID,
        resource: { id: RESOURCE_ID, name: 'Alpha Room' },
        memberId: MEMBER_ID,
        member: { id: MEMBER_ID, fullName: 'Dali May', email: 'dali@example.tn' },
        companyId: null,
        company: null,
        extras: [],
      });

      const dto = mapperOnly().toDto(entity);

      expect(dto.resource).toEqual({ id: RESOURCE_ID, name: 'Alpha Room' });
      expect(dto.member).toEqual({
        id: MEMBER_ID,
        fullName: 'Dali May',
        email: 'dali@example.tn',
      });
      expect(dto.company).toBeNull();
    });

    it('reports a summary blank rather than inventing one when unjoined', () => {
      const entity = Object.assign(new BookingEntity(), {
        id: BOOKING_ID,
        resourceId: RESOURCE_ID,
        memberId: MEMBER_ID,
        companyId: null,
        extras: [],
      });

      const dto = mapperOnly().toDto(entity);

      // The id is known from the foreign key; the name is not, and a
      // freshly saved entity has no relations. Blank, never guessed.
      expect(dto.resource).toEqual({ id: RESOURCE_ID, name: '' });
      expect(dto.member).toEqual({ id: MEMBER_ID, fullName: '', email: null });
    });

    it('keys the customer summaries off the foreign key, not the relation', () => {
      const entity = Object.assign(new BookingEntity(), {
        id: BOOKING_ID,
        resourceId: RESOURCE_ID,
        memberId: null,
        companyId: null,
        extras: [],
      });

      // null means genuinely no customer of that kind — the only case
      // where absence is a fact rather than an unloaded relation.
      expect(mapperOnly().toDto(entity).member).toBeNull();
      expect(mapperOnly().toDto(entity).company).toBeNull();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t summaries`
Expected: FAIL — `dto.resource` is `undefined`, because `BookingMapper.toDto` does not set it yet.

- [ ] **Step 3: Add the three DTOs**

In `src/modules/booking/dtos/booking.dto.ts`, above `export class BookingDto`:

```ts
/**
 * Just enough of the resource to render a row or a detail panel. A list of
 * bookings would otherwise cost one resource lookup per row — or a blanket
 * fetch of the first hundred, which silently mislabels everyone past it.
 */
export class BookingResourceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id: string;

  @ApiProperty({ example: 'Alpha Room' })
  @IsString()
  name: string;
}

/** The booking's customer, when it is a member. See BookingResourceDto. */
export class BookingMemberDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id: string;

  @ApiProperty({ example: 'Dali May' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ type: String, example: 'dali@example.tn', nullable: true })
  @IsString()
  @IsOptional()
  email: string | null;
}

/** The booking's customer, when it is a company. See BookingResourceDto. */
export class BookingCompanyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id: string;

  @ApiProperty({ example: 'Hyperspace SARL' })
  @IsString()
  name: string;
}
```

Then, inside `BookingDto`, immediately after the existing `resourceId` property:

```ts
  @ApiProperty({ type: BookingResourceDto })
  resource: BookingResourceDto;
```

immediately after `memberId`:

```ts
  @ApiPropertyOptional({ type: BookingMemberDto, nullable: true })
  @IsOptional()
  member?: BookingMemberDto | null;
```

and immediately after `companyId`:

```ts
  @ApiPropertyOptional({ type: BookingCompanyDto, nullable: true })
  @IsOptional()
  company?: BookingCompanyDto | null;
```

- [ ] **Step 4: Build the summaries in the mapper**

In `src/modules/booking/mappers/booking.mapper.ts`, add these imports:

```ts
import { ResourceEntity } from '@modules/catalog/entities/resource.entity';
import { MemberEntity } from '@modules/member/entities/member.entity';
import { CompanyEntity } from '@modules/company/entities/company.entity';
import {
  BookingCompanyDto,
  BookingDto,
  BookingMemberDto,
  BookingResourceDto,
} from '@modules/booking/dtos/booking.dto';
```

(replacing the existing single `BookingDto` import), set the three fields in `toDto` right after each matching id line:

```ts
    dto.resourceId = entity.resourceId;
    dto.resource = BookingMapper.resource(entity);
    dto.memberId = entity.memberId;
    dto.member = BookingMapper.member(entity);
    dto.companyId = entity.companyId;
    dto.company = BookingMapper.company(entity);
```

and add the three builders after `toDto`:

```ts
  /**
   * The relations are loaded by the list and the single-row reads; a mapper
   * called on a freshly saved entity has none, and reports the summary blank
   * rather than inventing one. The id always comes from the foreign key, which
   * is present either way.
   */
  private static resource(entity: BookingEntity): BookingResourceDto {
    const resource = entity.resource as ResourceEntity | undefined;
    const summary = new BookingResourceDto();
    summary.id = resource?.id ?? entity.resourceId;
    summary.name = resource?.name ?? '';
    return summary;
  }

  /**
   * Keyed off the foreign key, NOT the relation: null has to mean "this
   * booking has no member", never "the member was not joined". A booking
   * belongs to a member XOR a company, so one of these two is always null.
   */
  private static member(entity: BookingEntity): BookingMemberDto | null {
    if (!entity.memberId) {
      return null;
    }
    const member = entity.member as MemberEntity | undefined;
    const summary = new BookingMemberDto();
    summary.id = entity.memberId;
    summary.fullName = member?.fullName ?? '';
    summary.email = member?.email ?? null;
    return summary;
  }

  private static company(entity: BookingEntity): BookingCompanyDto | null {
    if (!entity.companyId) {
      return null;
    }
    const company = entity.company as CompanyEntity | undefined;
    const summary = new BookingCompanyDto();
    summary.id = entity.companyId;
    summary.name = company?.name ?? '';
    return summary;
  }
```

`toEntity` is unchanged: the summaries are read-only projections and have no inverse.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t summaries`
Expected: PASS, 3 tests.

- [ ] **Step 6: Run the whole booking suite and the linter**

Run: `npm test -- src/modules/booking && npm run lint:check`
Expected: PASS. Nothing else asserts on `toDto`'s exact shape, so no existing test should break.

- [ ] **Step 7: Commit**

```bash
git add src/modules/booking/dtos/booking.dto.ts src/modules/booking/mappers/booking.mapper.ts src/modules/booking/services/booking.service.spec.ts
git commit -m "feat(booking): summarise the resource and customer on BookingDto"
```

---

### Task 2: Split the read path from the write path

**Repo:** `hscowork-backend-platform`

**Files:**
- Modify: `src/modules/booking/services/booking.service.ts`
- Test: `src/modules/booking/services/booking.service.spec.ts`

**Interfaces:**
- Consumes: `BookingMapper.toDto` from Task 1.
- Produces: `SUMMARY_RELATIONS` (module constant), `findOrFail(id)` now loads relations, new `findForWrite(id)` loads none. `create`, `update`, `cancel` and `confirm` all read back through `findOrFail` before mapping their response.

- [ ] **Step 1: Write the failing test**

Append a new `describe` block inside `describe('BookingService', ...)`:

```ts
  describe('read and write paths', () => {
    const bookingRow = (over: Partial<BookingEntity> = {}) =>
      Object.assign(new BookingEntity(), {
        id: BOOKING_ID,
        resourceId: RESOURCE_ID,
        memberId: MEMBER_ID,
        companyId: null,
        startsAt: inHours(-2),
        endsAt: inHours(-1),
        status: BookingStatus.CONFIRMED,
        priceHt: 40,
        source: BookingSource.STAFF,
        title: 'Stand-up',
        notes: null,
        extras: [],
        ...over,
      });

    it('loads the summary relations when reading one booking', async () => {
      repository.findOne.mockResolvedValue(bookingRow());

      await service.getByIdFor(caller(RoleType.STAFF), BOOKING_ID);

      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BOOKING_ID },
          relations: { resource: true, member: true, company: true },
        }),
      );
    });

    it('loads NO relations on the write path, then reads back for the response', async () => {
      repository.findOne.mockResolvedValue(bookingRow());

      await service.update(caller(RoleType.STAFF), BOOKING_ID, {
        title: 'Renamed',
      });

      // A loaded relation outranks its own foreign key when TypeORM saves,
      // so the entity that gets saved must carry none.
      const [writeRead, readBack] = repository.findOne.mock.calls;
      expect(writeRead[0]).not.toHaveProperty('relations');
      expect(readBack[0]).toHaveProperty('relations');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t "read and write paths"`
Expected: FAIL — the first test fails because `findOne` is called without `relations`; the second fails because `findOne` is only called once.

- [ ] **Step 3: Add the constant and split the finder**

In `booking.service.ts`, below the `EXCLUSION_VIOLATION` constant:

```ts
/** What the row summaries are built from — see BookingDto.resource. */
const SUMMARY_RELATIONS = {
  resource: true,
  member: true,
  company: true,
} as const;
```

Replace the existing private `findOrFail` with these two:

```ts
  /** The read path: summaries included. */
  private async findOrFail(id: string): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: SUMMARY_RELATIONS,
    });
    if (!booking) {
      throw notFoundProblem(
        'booking_not_found',
        `Booking with id "${id}" not found`,
      );
    }
    return booking;
  }

  /**
   * The write path. Deliberately without relations: a loaded resource or
   * member outranks its own foreign key when TypeORM saves, so an attached
   * object can write a stale row straight back. Every mutator reads back
   * through findOrFail for its response.
   */
  private async findForWrite(id: string): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw notFoundProblem(
        'booking_not_found',
        `Booking with id "${id}" not found`,
      );
    }
    return booking;
  }
```

- [ ] **Step 4: Point the mutators at the write finder and read back**

In `update`, `cancel` and `confirm`, change the opening `const booking = await this.findOrFail(id);` to `const booking = await this.findForWrite(id);`.

Then change each mutator's return:

- `update` — replace `return this.mapper.toDto(await this.bookingRepository.save(booking));` with:

```ts
    await this.bookingRepository.save(booking);
    // Read back for the summaries: the saved entity carries ids, not relations.
    return this.mapper.toDto(await this.findOrFail(id));
```

- `cancel` — the transaction assigns `const saved = await this.dataSource.transaction(...)`. Replace the trailing `return this.mapper.toDto(saved);` with:

```ts
    return this.mapper.toDto(await this.findOrFail(saved.id));
```

- `confirm` — same change, replacing its trailing `return this.mapper.toDto(saved);` with:

```ts
    return this.mapper.toDto(await this.findOrFail(saved.id));
```

- `create` — same change to its trailing `return this.mapper.toDto(saved);`:

```ts
    return this.mapper.toDto(await this.findOrFail(saved.id));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t "read and write paths"`
Expected: PASS, 2 tests.

- [ ] **Step 6: Run the whole booking suite**

Run: `npm test -- src/modules/booking && npm run lint:check`
Expected: PASS. Existing tests mock `repository.findOne` with `mockResolvedValue`, which answers every call, so the added read-back resolves to the same row.

- [ ] **Step 7: Commit**

```bash
git add src/modules/booking/services/booking.service.ts src/modules/booking/services/booking.service.spec.ts
git commit -m "fix(booking): keep relations off the write path, read back for summaries"
```

---

### Task 3: Join the summaries in the list

**Repo:** `hscowork-backend-platform`

**Files:**
- Modify: `src/modules/booking/services/booking.service.ts`
- Test: `src/modules/booking/services/booking.service.spec.ts`

**Interfaces:**
- Consumes: `SUMMARY_RELATIONS` from Task 2.
- Produces: `applyBookingFilters(query, options, customerAliasesJoined = false)` — a third parameter. `list()` passes `true` and owns the joins; `stats()` keeps the default.

- [ ] **Step 1: Write the failing test**

In the existing `queryBuilderSpy()` helper, add `'leftJoinAndSelect'` to the array of mocked methods so it reads:

```ts
      for (const method of [
        'andWhere',
        'orderBy',
        'skip',
        'take',
        'leftJoin',
        'leftJoinAndSelect',
      ]) {
```

Then add these tests inside the same `describe` that holds `queryBuilderSpy`:

```ts
    it('selects the summary relations so a row can name its resource and customer', async () => {
      const { qb } = queryBuilderSpy();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.list(caller(RoleType.STAFF), {
        offset: 0,
        limit: 10,
        sort: Sort.ASC,
      } as BookingPageOptionsDto);

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('b.resource', 'resource');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('b.member', 'member');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('b.company', 'company');
    });

    it('does not join the customer twice when q is set', async () => {
      const { qb } = queryBuilderSpy();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.list(caller(RoleType.STAFF), {
        offset: 0,
        limit: 10,
        sort: Sort.ASC,
        q: 'stand-up',
      } as BookingPageOptionsDto);

      // The search predicate reuses the aliases list() already selected.
      // Joining them again under the same names is a TypeORM error.
      expect(qb.leftJoin).not.toHaveBeenCalled();
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t "summary relations"`
Expected: FAIL — `qb.leftJoinAndSelect` was never called.

- [ ] **Step 3: Add the flag to the filter helper**

In `booking.service.ts`, change the signature of the private `applyBookingFilters` to:

```ts
  private applyBookingFilters(
    query: SelectQueryBuilder<BookingEntity>,
    options: BookingPageOptionsDto | BookingStatsOptionsDto,
    customerAliasesJoined = false,
  ): void {
```

(keep the existing parameter names and types for the first two — only the third is new).

Inside it, replace the `if (term) { query.leftJoin(...).leftJoin(...).andWhere(...) }` block with:

```ts
    // Title and notes are the booking's own words; the customer name is
    // what staff actually search by, so it needs the joins. list() has
    // already selected these aliases for the row summaries — joining them
    // again under the same names is a TypeORM error, so it says so.
    const term = options.q?.trim();
    if (term) {
      if (!customerAliasesJoined) {
        query.leftJoin('b.member', 'member').leftJoin('b.company', 'company');
      }
      query.andWhere(
        new Brackets((qb) => {
          qb.where('b.title ILIKE :term', { term: `%${term}%` })
            .orWhere('b.notes ILIKE :term', { term: `%${term}%` })
            .orWhere('member.full_name ILIKE :term', { term: `%${term}%` })
            .orWhere('company.name ILIKE :term', { term: `%${term}%` });
        }),
      );
    }
```

- [ ] **Step 4: Join and select in the list**

In `list()`, replace the opening two lines:

```ts
    const query = this.bookingRepository.createQueryBuilder('b');

    this.applyBookingFilters(query, pageOptions);
```

with:

```ts
    const query = this.bookingRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.resource', 'resource')
      .leftJoinAndSelect('b.member', 'member')
      .leftJoinAndSelect('b.company', 'company');

    // The aliases above are the ones the `q` predicate searches.
    this.applyBookingFilters(query, pageOptions, true);
```

- [ ] **Step 5: Correct the stale orderBy comment**

In `list()`, the comment above `.orderBy('b.startsAt', pageOptions.sort)` currently says the distinct-ids path is triggered by `q`. It is now permanent. Replace that comment block with:

```ts
      // Property path, NOT the 'b.starts_at' column name the WHERE
      // fragments use. The summary joins above plus skip/take send
      // TypeORM down its distinct-ids path on EVERY call, and that path
      // resolves every orderBy key against entity metadata — a raw
      // column name has none there and the read dies with
      // "Cannot read properties of undefined (reading 'databaseName')".
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts`
Expected: PASS, whole file — including the pre-existing `orders by the property path` and `q` search-grouping tests, which must not regress.

- [ ] **Step 7: Confirm stats is untouched**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t stats`
Expected: PASS. `stats()` calls `applyBookingFilters` with two arguments, so it takes the `false` default and keeps its own plain joins — the grouping is unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/modules/booking/services/booking.service.ts src/modules/booking/services/booking.service.spec.ts
git commit -m "perf(booking): join the row summaries instead of fetching lookups per page"
```

---

### Task 4: Stats — weekly series, value per status, per-resource counts

**Repo:** `hscowork-backend-platform`

**Files:**
- Modify: `src/modules/booking/dtos/booking-stats.dto.ts`
- Modify: `src/modules/booking/services/booking.service.ts`
- Modify: `src/modules/booking/docs/booking.doc.ts`
- Test: `src/modules/booking/services/booking.service.spec.ts`

**Interfaces:**
- Consumes: `applyBookingFilters` from Task 3 (two-argument form).
- Produces: `BookingStatusCountDto` gains `valueHt: number`. New `BookingResourceCountDto {resourceId: string, name: string, count: number}` and `BookingWeekStatsDto {week: string, created: number, starting: number, bookedValueHt: number}`. `BookingStatsDto` gains `byResource: BookingResourceCountDto[]` and `byWeek: BookingWeekStatsDto[]`.

- [ ] **Step 1: Write the failing test**

Add inside `describe('BookingService', ...)`:

```ts
  describe('stats trend', () => {
    /** Records the raw-query builders stats() creates, in order. */
    function statsSpy(rows: Record<string, unknown>[][]) {
      let call = 0;
      return jest.fn(() => {
        const qb: Record<string, jest.Mock> = {};
        for (const method of [
          'select',
          'addSelect',
          'andWhere',
          'groupBy',
          'addGroupBy',
          'orderBy',
          'leftJoin',
        ]) {
          qb[method] = jest.fn(() => qb);
        }
        qb.getRawMany = jest.fn(() => Promise.resolve(rows[call++] ?? []));
        qb.getRawOne = jest.fn(() => Promise.resolve({ total: '0', value: '0' }));
        return qb;
      });
    }

    it('returns all eight weeks, zeros included', async () => {
      // Every getRawMany returns nothing: no bookings at all.
      repository.createQueryBuilder = statsSpy([]);

      const stats = await service.stats({} as never);

      expect(stats.byWeek).toHaveLength(8);
      expect(stats.byWeek.every((week) => week.created === 0)).toBe(true);
      // Oldest first, and every entry is a Monday business date.
      expect(stats.byWeek[0].week < stats.byWeek[7].week).toBe(true);
      expect(stats.byWeek[0].week).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('carries a value alongside every status count', async () => {
      repository.createQueryBuilder = statsSpy([
        [{ status: BookingStatus.CANCELLED, count: '2', value: '80' }],
      ]);

      const stats = await service.stats({} as never);

      const cancelled = stats.byStatus.find(
        (row) => row.status === BookingStatus.CANCELLED,
      );
      expect(cancelled).toEqual({
        status: BookingStatus.CANCELLED,
        count: 2,
        valueHt: 80,
      });
      // Every status is still present, zero included.
      expect(stats.byStatus).toHaveLength(4);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t "stats trend"`
Expected: FAIL — `stats.byWeek` is `undefined`.

- [ ] **Step 3: Extend the stats DTOs**

In `booking-stats.dto.ts`, add `valueHt` to the existing `BookingStatusCountDto`:

```ts
export class BookingStatusCountDto {
  @ApiProperty({ enum: BookingStatus, enumName: 'BookingStatus' })
  status: BookingStatus;

  @ApiProperty({ example: 12 })
  count: number;

  /**
   * Their priceHt summed. Which statuses count as money is the caller's
   * call — cancelled is money released, no_show is money kept.
   */
  @ApiProperty({ example: 480 })
  valueHt: number;
}
```

and add two new classes above `BookingStatsDto`:

```ts
/** Busiest room first — the counts a resource filter can show beside its options. */
export class BookingResourceCountDto {
  @ApiProperty({ format: 'uuid' })
  resourceId: string;

  @ApiProperty({ example: 'Alpha Room' })
  name: string;

  @ApiProperty({ example: 9 })
  count: number;
}

export class BookingWeekStatsDto {
  /**
   * Monday of the week, as a business date in Africa/Tunis.
   * @example "2026-08-24"
   */
  @ApiProperty({ example: '2026-08-24' })
  week: string;

  /** Bookings taken that week, by when they were created. */
  @ApiProperty({ example: 6 })
  created: number;

  /** Bookings whose slot starts that week, by startsAt. */
  @ApiProperty({ example: 4 })
  starting: number;

  /** Their priceHt summed; credit-covered bookings contribute 0. */
  @ApiProperty({ example: 320 })
  bookedValueHt: number;
}
```

then add the two fields to `BookingStatsDto`:

```ts
  @ApiProperty({ type: [BookingResourceCountDto] })
  byResource: BookingResourceCountDto[];

  /**
   * The last eight weeks, oldest first, always all eight — a week nothing
   * happened in reads as zero rather than going missing and bending the shape
   * of a chart drawn from it.
   */
  @ApiProperty({ type: [BookingWeekStatsDto] })
  byWeek: BookingWeekStatsDto[];
```

- [ ] **Step 4: Compute them in the service**

In `booking.service.ts`, add below `SUMMARY_RELATIONS`:

```ts
/** The business timezone: a booking taken late Sunday night belongs to Sunday. */
const BUSINESS_TZ = 'Africa/Tunis';

/** How many weeks the trend series covers. */
const TREND_WEEKS = 8;

/** Monday of the week the given date falls in, as a YYYY-MM-DD business date. */
function weekStart(date: Date): string {
  const monday = new Date(date);
  // getDay(): Sunday is 0, so it is six days after the Monday that opened it.
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  const month = `${monday.getMonth() + 1}`.padStart(2, '0');
  const day = `${monday.getDate()}`.padStart(2, '0');
  return `${monday.getFullYear()}-${month}-${day}`;
}
```

Add the new imports to the existing `booking-stats.dto` import block:

```ts
import {
  BookingResourceCountDto,
  BookingStatsDto,
  type BookingStatsOptionsDto,
  BookingWeekStatsDto,
} from '@modules/booking/dtos/booking-stats.dto';
```

In `stats()`, change the status query to carry the value — replace its `.addSelect('COUNT(*)', 'count')` line with:

```ts
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(b.price_ht), 0)', 'value')
```

and widen its row type to `getRawMany<{ status: BookingStatus; count: string; value: string }>()`.

Then, before the `stats` object is assembled, add the three new queries:

```ts
    const resourceQuery = this.bookingRepository.createQueryBuilder('b');
    this.applyBookingFilters(resourceQuery, options);
    const resourceRows = await resourceQuery
      .leftJoin('b.resource', 'statsResource')
      .select('b.resource_id', 'resourceId')
      .addSelect('statsResource.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('b.resource_id')
      .addGroupBy('statsResource.name')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{ resourceId: string; name: string; count: string }>();

    // Eight Mondays, oldest first, built here rather than read from the
    // rows so an empty week is a zero instead of a gap.
    const weeks: string[] = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - 7 * (TREND_WEEKS - 1));
    for (let index = 0; index < TREND_WEEKS; index += 1) {
      weeks.push(weekStart(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    const since = weeks[0];

    const createdQuery = this.bookingRepository.createQueryBuilder('b');
    this.applyBookingFilters(createdQuery, options);
    const createdRows = await createdQuery
      .select(
        `to_char(date_trunc('week', b.created_at AT TIME ZONE '${BUSINESS_TZ}'), 'YYYY-MM-DD')`,
        'week',
      )
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(b.price_ht), 0)', 'value')
      .andWhere(`b.created_at AT TIME ZONE '${BUSINESS_TZ}' >= :since::date`, {
        since,
      })
      .groupBy('week')
      .getRawMany<{ week: string; count: string; value: string }>();

    // A separate window, because "taken" and "starts" are different columns.
    const startingQuery = this.bookingRepository.createQueryBuilder('b');
    this.applyBookingFilters(startingQuery, options);
    const startingRows = await startingQuery
      .select(
        `to_char(date_trunc('week', b.starts_at AT TIME ZONE '${BUSINESS_TZ}'), 'YYYY-MM-DD')`,
        'week',
      )
      .addSelect('COUNT(*)', 'count')
      .andWhere(`b.starts_at AT TIME ZONE '${BUSINESS_TZ}' >= :since::date`, {
        since,
      })
      .groupBy('week')
      .getRawMany<{ week: string; count: string }>();

    const createdByWeek = new Map(createdRows.map((row) => [row.week, row]));
    const startingByWeek = new Map(startingRows.map((row) => [row.week, row]));
```

Then, where the DTO is assembled, set the two new fields:

```ts
    stats.byResource = resourceRows.map((row) => {
      const entry = new BookingResourceCountDto();
      entry.resourceId = row.resourceId;
      entry.name = row.name ?? '';
      entry.count = Number(row.count);
      return entry;
    });

    stats.byWeek = weeks.map((week) => {
      const entry = new BookingWeekStatsDto();
      entry.week = week;
      entry.created = Number(createdByWeek.get(week)?.count ?? 0);
      entry.starting = Number(startingByWeek.get(week)?.count ?? 0);
      entry.bookedValueHt = roundMoney(
        Number(createdByWeek.get(week)?.value ?? 0),
      );
      return entry;
    });
```

Finally, where `byStatus` is built from `statusRows`, set `valueHt` on each entry from the row's `value`, wrapped in `roundMoney(Number(...))`, and default it to `0` for the statuses that produced no row.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/modules/booking/services/booking.service.spec.ts -t "stats trend"`
Expected: PASS, 2 tests.

- [ ] **Step 6: Update the endpoint documentation**

In `booking.doc.ts`, `DocBookingStats`'s description ends by explaining that `total` and `bookedValueHt` never narrow by status. Append to that string:

```ts
        'Also returns `byResource` (busiest room first) and `byWeek` — the ' +
        'last eight weeks, oldest first, always all eight, so a chart drawn ' +
        'from it keeps its shape. There is no weekly cancellation series: ' +
        'bookings have no cancelled_at column, and updated_at moves on any ' +
        'title or notes edit. ',
```

Also change its `summary` from `'Booking counts by status and source'` to `'Booking counts, values and weekly trend'`.

- [ ] **Step 7: Run the suite and the linter**

Run: `npm test -- src/modules/booking && npm run lint:check && npm run build`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/modules/booking/dtos/booking-stats.dto.ts src/modules/booking/services/booking.service.ts src/modules/booking/docs/booking.doc.ts src/modules/booking/services/booking.service.spec.ts
git commit -m "feat(booking): add the weekly trend, per-status value and per-room counts to stats"
```

---

### Task 5: Filter the resources list to bookable types

**Repo:** `hscowork-backend-platform`

**Files:**
- Modify: `src/modules/catalog/dtos/resource.dto.ts:299-315`
- Modify: `src/modules/catalog/services/resource.service.ts:90-107`
- Test: `src/modules/catalog/services/resource.service.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ResourcePageOptionsDto.canBook?: boolean`, honoured by `ResourceService.listFor`.

- [ ] **Step 1: Write the failing test**

Add to `describe('ResourceService', ...)` in `resource.service.spec.ts`, beside the other `listFor` tests:

```ts
  it('keeps only bookable resources when canBook is set', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    await service.listFor(
      caller(RoleType.STAFF),
      plainToInstance(ResourcePageOptionsDto, { canBook: true }),
    );

    const { where } = repository.findAndCount.mock.calls[0][0];
    expect(where.resourceType).toEqual({ canBook: true });
  });

  it('leaves the type unconstrained when canBook is absent', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    await service.listFor(
      caller(RoleType.STAFF),
      plainToInstance(ResourcePageOptionsDto, {}),
    );

    const { where } = repository.findAndCount.mock.calls[0][0];
    expect(where).not.toHaveProperty('resourceType');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/catalog/services/resource.service.spec.ts -t bookable`
Expected: FAIL — `where.resourceType` is `undefined`.

- [ ] **Step 3: Add the query parameter**

In `resource.dto.ts`, inside `ResourcePageOptionsDto`, after the `status` property:

```ts
  /**
   * Keep only resources whose type allows booking. A resource on a
   * `canBook: false` type cannot be booked at all, so offering it in a
   * booking form is a trap.
   */
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  canBook?: boolean;
```

Add `IsBoolean` to the `class-validator` import list in that file, and `Transform` from `class-transformer` (add the import if the file does not already have one) — a query string carries `"true"`, not `true`.

- [ ] **Step 4: Honour it in the service**

In `resource.service.ts`, inside `listFor`, after the existing `if (pageOptions.resourceTypeId)` block:

```ts
    // A nested relation condition, which the `resourceType` relation
    // loaded below already satisfies — no extra join needed.
    if (pageOptions.canBook) {
      where.resourceType = { canBook: true };
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/modules/catalog/services/resource.service.spec.ts -t bookable`
Expected: PASS, 2 tests.

- [ ] **Step 6: Run the catalog suite, lint and build**

Run: `npm test -- src/modules/catalog && npm run lint:check && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/catalog/dtos/resource.dto.ts src/modules/catalog/services/resource.service.ts src/modules/catalog/services/resource.service.spec.ts
git commit -m "feat(catalog): filter the resources list by whether the type can be booked"
```

---

### Task 6: Regenerate the client and consume the summaries

**Repo:** `hyperspace-platform` — every remaining task runs here.

**Files:**
- Modify: `lib/service/` and `swagger.json` (generated — do not hand-edit)
- Modify: `app/booking/bookings/table-section.tsx`
- Modify: `app/booking/bookings/columns.tsx`
- Modify: `app/booking/bookings/booking-table.tsx`
- Modify: `app/booking/bookings/add-booking-form.tsx`

**Interfaces:**
- Consumes: `BookingDto.resource`, `.member`, `.company` from Task 1; `ListResourcesParams.canBook` from Task 5.
- Produces: `BookingTable` and `AddBookingForm` no longer take `memberNames` or `companyNames`. `createColumns` no longer takes `resourceNames`, `memberNames` or `companyNames`.

- [ ] **Step 1: Regenerate the typed client**

The backend must be running locally first, since the generator reads its swagger. Run:

```bash
npm run generate
```

Expected: `lib/service/HsService.ts` and `swagger.json` change. Confirm `BookingDto` now carries `resource`, `member` and `company`, and `ListResourcesParams` carries `canBook`:

```bash
grep -n "resource: BookingResourceDto" lib/service/HsService.ts
grep -n "canBook" lib/service/HsService.ts | head -5
```

If the generator cannot reach the backend, stop and say so — the rest of this task cannot compile without it.

- [ ] **Step 2: Read names off the row in the columns**

In `columns.tsx`, reduce `ColumnsProps` to:

```ts
interface ColumnsProps {
  onEdit: (booking: BookingDto) => void
  timeZone: string
}

export const createColumns = ({ onEdit, timeZone }: ColumnsProps): ColumnDef<BookingDto>[] => [
```

In the `title` column's cell, replace the resource lookup with `booking.resource.name || "Unknown resource"`.

Replace the whole `customer` column with:

```ts
  {
    id: "customer",
    // The API names the customer on the row, so a page past the hundredth
    // member no longer renders blank.
    accessorFn: (booking) => booking.member?.fullName ?? booking.company?.name ?? "",
    header: "Customer",
    cell: ({ row }) => {
      const value = row.getValue<string>("customer")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
```

- [ ] **Step 3: Drop the lookup maps from the table section**

In `table-section.tsx`, remove `getListMembers` and `getListCompanies` from the `@/lib/service` import, remove `CompanyDto` and `MemberDto` from the type import, delete the `memberNames` and `companyNames` declarations and their two `for` loops, and reduce the `Promise.all` to:

```ts
    const [resourcePage, zone] = await Promise.all([
      getListResources({ limit: 100, offset: 0, sort: "ASC" }),
      primaryTimeZone(),
    ])
```

Change the comment above the remaining declarations from "Bookings reference resource and customer by id only." to:

```ts
  // The rows name their own resource and customer; this list is for the
  // resource filter's options, which need every resource, bookable or not.
```

Then drop `memberNames={memberNames}` and `companyNames={companyNames}` from the `<BookingTable>` call. Keep `resourceNames` out of it entirely — delete that declaration and its loop too, and remove the prop.

- [ ] **Step 4: Drop the props from the table and the form**

In `booking-table.tsx`, remove `resourceNames`, `memberNames` and `companyNames` from `BookingTableProps`, from the destructured parameters and their defaults, from the `createColumns({ ... })` call, and from the `<AddBookingForm>` call.

In `add-booking-form.tsx`, make three edits:

1. Remove `memberNames?: Record<string, string>` and `companyNames?: Record<string, string>` from `AddBookingFormProps`. `resources?: ResourceDto[]` stays.
2. Remove `memberNames: seedMemberNames` and `companyNames: seedCompanyNames` from the destructured parameters. `resources: seedResources` stays.
3. Change the two state initialisers so they no longer read the removed seeds:

```tsx
  const [memberNames, setMemberNames] = useState<Record<string, string>>({})
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({})
```

Everything else in the file is untouched. Keep the lookups effect and its `if ((seedResources ?? []).length > 0) return` guard exactly as they are — the selects still need their own lists, and fixing their 100-row cap is out of scope.

- [ ] **Step 5: Ask for bookable resources only**

Still in `add-booking-form.tsx`, in the lookups effect, change the resources call to:

```ts
      // A resource whose type cannot be booked would be refused by the
      // API, so it is never offered.
      getListResources({ limit: 100, offset: 0, sort: "ASC", canBook: true }),
```

- [ ] **Step 6: Verify it compiles and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. Any remaining reference to `memberNames` or `companyNames` as a prop shows up here.

- [ ] **Step 7: Manual check**

Start the app, open `/booking/bookings`, and confirm each row still names its resource and its customer, and that opening Add Booking lists only bookable resources.

- [ ] **Step 8: Commit**

```bash
git add lib/service swagger.json app/booking/bookings
git commit -m "perf(booking): read names off the row instead of fetching lookup tables"
```

---

### Task 7: Cancel and Confirm grey out instead of disappearing

**Repo:** `hyperspace-platform`

**Files:**
- Modify: `app/booking/bookings/booking-actions-buttons.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `BookingActionButtons` keeps its existing props (`bookingId`, `bookingLabel`, `canConfirm`, `canCancel`); only its rendering changes. `columns.tsx` needs no edit.

- [ ] **Step 1: Add the disabled-button helper**

In `booking-actions-buttons.tsx`, add these imports:

```ts
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
```

and add this component above `BookingActionButtons`:

```tsx
/**
 * A disabled element fires no pointer events, so a bare `title` attribute
 * never shows and a Radix trigger never opens. The button is therefore
 * wrapped in a span, which is what the tooltip actually listens on.
 */
function DisabledAction({
  reason,
  children,
}: Readonly<{ reason: string; children: React.ReactNode }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button variant="outline" size="sm" disabled>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}
```

- [ ] **Step 2: Render both actions unconditionally**

Replace `{canConfirm && (` ... `)}` so the confirm branch reads:

```tsx
      {canConfirm ? (
        <Button
          variant="outline"
          size="sm"
          title="Confirm booking"
          disabled={pending !== null}
          onClick={confirm}
          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950 dark:border-green-800"
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Confirm</span>
        </Button>
      ) : (
        <DisabledAction reason="Only pending bookings can be confirmed">
          <Check className="h-4 w-4" />
          <span className="sr-only">Confirm</span>
        </DisabledAction>
      )}
```

Change the `canCancel` guard the same way — keep the whole existing `AlertDialog` as the `canCancel` branch, and add:

```tsx
      ) : (
        <DisabledAction reason="This booking is already closed">
          <Ban className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </DisabledAction>
      )}
```

Note it renders a plain disabled `Button`, **not** an `AlertDialogTrigger` — a disabled trigger would be dead markup.

- [ ] **Step 3: Give the reason the actual status**

`canCancel` is currently derived in `columns.tsx` as `!isClosed`, which merges two different reasons. Change the `BookingActionButtonsProps` interface to take the status instead of just the flag by adding one prop:

```ts
  /** Drives the disabled tooltip's wording. */
  status: BookingStatus
```

with `import type { BookingStatus } from "@/lib/service/HsService"`, destructure `status`, and change the cancel branch's reason to:

```tsx
        <DisabledAction
          reason={status === "no_show" ? "Marked as a no-show" : "Already cancelled"}
        >
```

In `columns.tsx`, pass it: `status={booking.status}` alongside the existing props.

- [ ] **Step 4: Confirm the tooltip provider exists**

Radix tooltips need a provider above them. Run:

```bash
grep -rn "TooltipProvider" app/layout.tsx components/ui/tooltip.tsx
```

If `components/ui/tooltip.tsx` wraps each `Tooltip` in its own provider, nothing more is needed. If it does not, and `app/layout.tsx` has none, wrap the `DisabledAction` return in `<TooltipProvider>` and import it.

- [ ] **Step 5: Verify it compiles and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual check**

Open `/booking/bookings`, filter to the Cancelled tab, and confirm the Cancel button is present but greyed, that hovering it says "Already cancelled", and that clicking it does nothing. Check a confirmed booking shows a greyed Confirm reading "Only pending bookings can be confirmed".

- [ ] **Step 7: Commit**

```bash
git add app/booking/bookings/booking-actions-buttons.tsx app/booking/bookings/columns.tsx
git commit -m "fix(booking): disable the closed row's actions instead of hiding them"
```

---

### Task 8: Fix the create and edit defects

**Repo:** `hyperspace-platform`

**Files:**
- Modify: `app/booking/bookings/actions.ts`
- Modify: `app/booking/bookings/add-booking-form.tsx`

**Interfaces:**
- Consumes: the existing `ActionState` and `messageFor` (already in the working tree).
- Produces: no signature changes.

- [ ] **Step 1: Require exactly one customer in the payload**

In `actions.ts`, inside `bookingPayload`, replace the existing XOR guard:

```ts
  // The customer is a member XOR a company.
  if (memberId && companyId) {
    return { error: "A booking belongs to a member or a company, not both" }
  }
```

with:

```ts
  // The customer is a member XOR a company — the API refuses both AND
  // neither, so the form has to as well. Neither was reachable through
  // the "walk-in" option, which always 422'd.
  if (memberId && companyId) {
    return { error: "A booking belongs to a member or a company, not both" }
  }
  if (!memberId && !companyId) {
    return { error: "Select a member or a company" }
  }
```

- [ ] **Step 2: Let the edit form clear the title and notes**

Still in `actions.ts`, add this helper beside `text`:

```ts
/**
 * Like `text`, but an emptied field stays an empty string instead of
 * vanishing. PATCH /bookings assigns on `!== undefined`, so `undefined`
 * means "leave it alone" — which made clearing a note a silent no-op.
 */
function clearableText(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" ? value.trim() : undefined
}
```

and in `updateBookingAction`, change the two assignments:

```ts
    const data: UpdateBookingDto = {
      title: clearableText(formData, "title"),
      notes: clearableText(formData, "notes"),
      status: formData.get("markNoShow") === "on" ? "no_show" : undefined,
    }
```

`bookingPayload` keeps `text` — on create, omitting an empty field is correct.

- [ ] **Step 3: Drop the walk-in option and require a customer**

In `add-booking-form.tsx`, change the `CustomerKind` type to:

```ts
type CustomerKind = "member" | "company"
```

Delete the `<option value="none">None (walk-in)</option>` line.

Add `required` to both customer selects, so they read `<select id="memberId" name="memberId" className={selectClassName} required>` and the same for `companyId`.

- [ ] **Step 4: Clear the quote when the inputs change**

Still in `add-booking-form.tsx`, add a handler above the `return`:

```tsx
  /**
   * The quote describes one exact resource, slot and set of extras. Once
   * any of them moves it is answering a question nobody asked any more,
   * so it goes rather than sitting there looking green.
   */
  const invalidateQuote = () => setQuoteMessage(null)
```

Add `onChange={invalidateQuote}` to the "Starts at" and "Ends at" fields and to every extras checkbox. On the resource select, fold it into the existing handler:

```tsx
                        onChange={(e) => {
                          setResourceId(e.target.value)
                          invalidateQuote()
                        }}
```

- [ ] **Step 5: Let a second failed submit raise a second toast**

Still in `add-booking-form.tsx`, the two notify effects guard on refs that are only reset when the drawer opens, so a second failed attempt is silent. Change both effects to reset their own ref on success only. Replace the create effect with:

```tsx
  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Booking created")
      onClose()
    } else if (createState.error) {
      // Not latched: a second failed attempt is a second thing to say.
      toast.error(messageFor(createState, "Failed to create booking"))
    }
  }, [createState, onClose])
```

and the update effect the same way, with `updateNotifiedRef`, `"Booking updated"` and `"Failed to update booking"`. The success ref stays latched, because `onClose` must fire once.

- [ ] **Step 6: Verify it compiles and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. Removing `"none"` from `CustomerKind` surfaces any remaining reference here.

- [ ] **Step 7: Manual check**

Open Add Booking and submit with no member picked — the browser blocks it on `required`. Open an existing booking's Edit, clear its notes, save, reopen: the notes stay cleared. Run a check-availability, then change the end time: the green line disappears.

- [ ] **Step 8: Commit**

```bash
git add app/booking/bookings/actions.ts app/booking/bookings/add-booking-form.tsx
git commit -m "fix(booking): require one customer, allow clearing notes, drop the stale quote"
```

---

### Task 9: Booking details modal

**Repo:** `hyperspace-platform`

**Files:**
- Create: `components/ui/dialog.tsx`
- Create: `app/booking/bookings/booking-details-dialog.tsx`
- Modify: `app/booking/bookings/columns.tsx`
- Modify: `app/booking/bookings/add-booking-form.tsx`

**Interfaces:**
- Consumes: `BookingDto.resource`, `.member`, `.company` from Task 6.
- Produces: `BookingDetailsDialog({ booking, timeZone }: { booking: BookingDto; timeZone: string })` — self-contained, renders its own Eye trigger.

- [ ] **Step 1: Add the dialog primitive**

Create `components/ui/dialog.tsx`. Same Radix package and `data-slot` convention as the existing `components/ui/alert-dialog.tsx`, plus a close button in the corner, which the alert variant deliberately lacks:

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
}
```

Before writing it, open `components/ui/alert-dialog.tsx` and check whether its animation utility classes differ from the ones above; if they do, match that file rather than this snippet, so the two primitives animate identically.

- [ ] **Step 2: Build the details dialog**

Create `app/booking/bookings/booking-details-dialog.tsx`:

```tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye } from "lucide-react"
import type { BookingDto } from "@/lib/service/HsService"
import { formatDateTime, formatEnumLabel, formatPriceHt } from "@/lib/format"
import { BOOKING_SOURCE_LABELS, BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from "./booking-status"

/** Minutes between two instants, rendered as "1h 30m". */
function duration(startsAt: string, endsAt: string): string {
  const minutes = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000
  )
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

function Row({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">{children}</span>
    </div>
  )
}

export function BookingDetailsDialog({
  booking,
  timeZone,
}: Readonly<{ booking: BookingDto; timeZone: string }>) {
  const customer = booking.member?.fullName ?? booking.company?.name
  const email = booking.member?.email

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Booking details">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{booking.title || "Untitled booking"}</DialogTitle>
          <DialogDescription>
            {booking.resource.name || "Unknown resource"}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y">
          <Row label="Status">
            <Badge
              variant="secondary"
              className={`${BOOKING_STATUS_CLASSES[booking.status] ?? ""} border-0`}
            >
              {BOOKING_STATUS_LABELS[booking.status] ?? formatEnumLabel(booking.status)}
            </Badge>
          </Row>
          <Row label="Customer">
            {customer ? (
              <>
                {customer}
                {email && <span className="block text-xs text-muted-foreground">{email}</span>}
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </Row>
          <Row label="When">
            {formatDateTime(booking.startsAt, timeZone)}
            <span className="block text-xs text-muted-foreground">
              to {formatDateTime(booking.endsAt, timeZone)} ·{" "}
              {duration(booking.startsAt, booking.endsAt)}
            </span>
          </Row>
          <Row label="Price">
            {booking.priceHt === null || booking.priceHt === undefined ? (
              <Badge variant="outline" className="font-normal">
                Credit covered
              </Badge>
            ) : (
              formatPriceHt(booking.priceHt)
            )}
          </Row>
          {(booking.extras ?? []).length > 0 && (
            <Row label="Extras">
              {(booking.extras ?? []).map((extra) => (
                <span key={extra.extraId} className="block">
                  {extra.name}
                  <span className="text-xs text-muted-foreground">
                    {" — "}
                    {formatPriceHt(extra.priceHt)} · {extra.vatRate}% VAT
                  </span>
                </span>
              ))}
            </Row>
          )}
          <Row label="Source">
            {BOOKING_SOURCE_LABELS[booking.source] ?? formatEnumLabel(booking.source)}
          </Row>
          {booking.notes && <Row label="Notes">{booking.notes}</Row>}
          <Row label="Created">{formatDateTime(booking.createdAt, timeZone)}</Row>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Lead the actions column with it**

In `columns.tsx`, import it and render it first in the actions cell, before the Edit button:

```tsx
        <div className="flex items-center gap-2">
          <BookingDetailsDialog booking={booking} timeZone={timeZone} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(booking)}
```

- [ ] **Step 4: Trim the edit drawer's duplicate summary**

In `add-booking-form.tsx`, the editing branch opens with a muted block repeating the time range. The modal now covers the whole record, so reduce that block to one line — replace its contents with:

```tsx
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      {formatDateTime(editingBooking.startsAt, timeZone ?? "UTC")}
                      <span className="block pt-1 text-xs">
                        Resource and times cannot be changed. Use the details
                        action in the table to see the whole booking.
                      </span>
                    </div>
```

- [ ] **Step 5: Verify it compiles and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual check**

Open `/booking/bookings`, click the Eye on a row: the modal shows resource, customer, times, duration, price and source. Find a credit-covered booking with extras and confirm it reads "Credit covered" and lists each extra with its VAT rate. Press Escape to close.

- [ ] **Step 7: Commit**

```bash
git add components/ui/dialog.tsx app/booking/bookings
git commit -m "feat(booking): add a details modal for the whole booking"
```

---

### Task 10: Date-time field

**Repo:** `hyperspace-platform`

**Files:**
- Create: `components/ui/date-time-field.tsx`
- Modify: `app/booking/bookings/add-booking-form.tsx`

**Interfaces:**
- Consumes: `DateField` from `components/ui/date-field.tsx`, unchanged.
- Produces: `DateTimeField({ id, name, value, onChange, min, required })` where `value` and the emitted form value are both `YYYY-MM-DDTHH:mm` — exactly the shape `toUtcIso` in `actions.ts` already parses.

- [ ] **Step 1: Build the field**

Create `components/ui/date-time-field.tsx`:

```tsx
"use client"

import * as React from "react"
import { DateField } from "@/components/ui/date-field"

/**
 * A wall-clock instant as the booking form means it: `YYYY-MM-DDTHH:mm`,
 * with no zone of its own. The zone it is read in is decided by the server
 * action, from the hidden `timeZone` field — see actions.ts:toUtcIso.
 *
 * DateField stays date-only: it is a business date everywhere else it is
 * used, and three other call sites depend on that. This composes it rather
 * than widening it.
 */
const STEP_MINUTES = 30

/** Half-hours across the day, matching the calendar grid's bookable slots. */
const TIMES: string[] = Array.from(
  { length: (24 * 60) / STEP_MINUTES },
  (_, index) => {
    const minutes = index * STEP_MINUTES
    const hh = `${Math.floor(minutes / 60)}`.padStart(2, "0")
    const mm = `${minutes % 60}`.padStart(2, "0")
    return `${hh}:${mm}`
  }
)

function split(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T")
  return { date, time: time.slice(0, 5) }
}

interface DateTimeFieldProps {
  id?: string
  name: string
  value: string
  onChange: (value: string) => void
  /** Earliest selectable instant, same shape as `value`. */
  min?: string
  required?: boolean
}

export function DateTimeField({
  id,
  name,
  value,
  onChange,
  min,
  required = false,
}: Readonly<DateTimeFieldProps>) {
  const { date, time } = split(value)
  const minParts = min ? split(min) : undefined

  // A time earlier than `min` is only invalid on `min`'s own day.
  const times =
    minParts && date && date === minParts.date
      ? TIMES.filter((option) => option >= minParts.time)
      : TIMES

  const emit = (nextDate: string, nextTime: string) => {
    onChange(nextDate && nextTime ? `${nextDate}T${nextTime}` : "")
  }

  return (
    <div className="flex items-center gap-2">
      {/* The value travels in the form, not in either control. */}
      <input type="hidden" name={name} value={value} required={required} />
      <div className="flex-1">
        <DateField
          id={id}
          name={`${name}__date`}
          value={date}
          onChange={(next) => emit(next, time || TIMES[18])}
          min={minParts?.date}
        />
      </div>
      <select
        aria-label="Time"
        className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={time}
        onChange={(event) => emit(date, event.target.value)}
      >
        <option value="">--:--</option>
        {times.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
```

`TIMES[18]` is `09:00` — the default when a date is picked before a time, matching the calendar toolbar's own 09:00 start.

Note `DateField` renders its own hidden input under `${name}__date`. That name is never read by any server action; it exists only because `DateField` requires a `name`.

- [ ] **Step 2: Drive the create form from state**

In `add-booking-form.tsx`, add two state hooks beside the existing ones:

```tsx
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
```

In the effect that runs when the drawer opens, seed them from the prefill:

```tsx
      setStartsAt(prefill && timeZone ? toLocalInput(prefill.startsAt, timeZone) : "")
      setEndsAt(prefill && timeZone ? toLocalInput(prefill.endsAt, timeZone) : "")
```

- [ ] **Step 3: Swap the inputs**

Replace the two `<Input type="datetime-local">` blocks with:

```tsx
                    <div className="grid gap-2">
                      <Label htmlFor="startsAt">Starts at</Label>
                      <DateTimeField
                        id="startsAt"
                        name="startsAt"
                        value={startsAt}
                        onChange={(next) => {
                          setStartsAt(next)
                          invalidateQuote()
                        }}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endsAt">Ends at</Label>
                      <DateTimeField
                        id="endsAt"
                        name="endsAt"
                        value={endsAt}
                        onChange={(next) => {
                          setEndsAt(next)
                          invalidateQuote()
                        }}
                        min={startsAt}
                        required
                      />
                    </div>
```

Add `import { DateTimeField } from "@/components/ui/date-time-field"`. Remove the `onChange={invalidateQuote}` added to these two fields in Task 8, Step 4 — it is folded into the handlers above. If `Input` is now unused in the file, drop it from the import.

- [ ] **Step 4: Verify it compiles and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual check**

Open Add Booking: both fields show a date picker and a half-hour time select. Pick a start of 14:00, then open the end time on the same day — options before 14:00 are gone. Create the booking and confirm the row shows the times you picked. Then open the calendar view, click a free half-hour, and confirm the drawer opens with both fields pre-filled to that slot.

- [ ] **Step 6: Commit**

```bash
git add components/ui/date-time-field.tsx app/booking/bookings/add-booking-form.tsx
git commit -m "feat(booking): pick booking times with the shared date field, not a raw input"
```

---

### Task 11: Draw the stats cards from the new series

**Repo:** `hyperspace-platform`

**Files:**
- Modify: `app/booking/bookings/stats.ts`
- Modify: `app/booking/bookings/section-cards.tsx`
- Modify: `app/booking/bookings/booking-table.tsx`

**Interfaces:**
- Consumes: `BookingStatsDto.byWeek`, `.byResource`, and `byStatus[].valueHt` from Task 4.
- Produces: `bookingTotals(stats)` gains `weeks: BookingWeekStatsDto[]`, `changeIn(key: "created" | "starting")`, `valueFor(status: string)`, and `busiestResource: { name: string; count: number } | null`. Its existing `countFor` and `total` are unchanged.

- [ ] **Step 1: Extend the totals helper**

In `stats.ts`, replace `bookingTotals` with:

```ts
/** Tab counts, with `undefined` meaning "unknown" rather than "zero". */
export function bookingTotals(stats: BookingStatsDto | null) {
  const rows = stats?.byStatus ?? []
  const byStatus = new Map(rows.map((row) => [row.status, row.count]))
  const valueByStatus = new Map(rows.map((row) => [row.status, row.valueHt]))
  const weeks = stats?.byWeek ?? []
  const busiest = (stats?.byResource ?? [])[0]

  /**
   * Two complete weeks, compared. From nothing to something has no
   * percentage to report, so it goes unsaid rather than being called 100%.
   */
  const changeIn = (key: "created" | "starting") => {
    if (weeks.length < 2) return undefined
    const previous = weeks[weeks.length - 2][key]
    const latest = weeks[weeks.length - 1][key]
    if (previous === 0) return undefined
    return Math.round(((latest - previous) / previous) * 1000) / 10
  }

  return {
    weeks,
    changeIn,
    countFor: (status: string) => (stats ? (byStatus.get(status) ?? 0) : undefined),
    valueFor: (status: string) => valueByStatus.get(status) ?? 0,
    total: stats?.total,
    busiestResource: busiest ? { name: busiest.name, count: busiest.count } : null,
  }
}
```

Add `BookingWeekStatsDto` to the type import if you reference it explicitly.

- [ ] **Step 2: Redraw the cards**

In `section-cards.tsx`, after `const totals = bookingTotals(stats)`, add:

```tsx
  const weekLabels = totals.weeks.map((entry) =>
    new Date(entry.week).toLocaleDateString(undefined, { day: "numeric", month: "short" })
  )
```

Replace the four card objects with:

```tsx
        {
          label: "Bookings taken",
          value: totals.weeks.at(-1)?.created ?? 0,
          unit: "this week",
          icon: CalendarCheckIcon,
          delta: totals.changeIn("created"),
          series: totals.weeks.map((entry) => entry.created),
          seriesLabels: weekLabels,
          footer: `${stats?.total ?? 0} matching the current filters`,
        },
        {
          label: "Starting",
          value: totals.weeks.at(-1)?.starting ?? 0,
          unit: "this week",
          icon: ClockIcon,
          delta: totals.changeIn("starting"),
          series: totals.weeks.map((entry) => entry.starting),
          seriesLabels: weekLabels,
          footer: totals.busiestResource
            ? `Busiest room: ${totals.busiestResource.name} (${totals.busiestResource.count})`
            : "No room booked yet",
        },
        {
          label: "Cancelled",
          value: count("cancelled"),
          badge: "Released",
          icon: XCircleIcon,
          // The figure that makes a cancellation card mean anything.
          footer: `${formatPriceHt(totals.valueFor("cancelled"))} released`,
        },
        {
          label: "Booked value",
          value: formatPriceHt(stats?.bookedValueHt ?? 0),
          badge: "HT",
          icon: CoinsIcon,
          series: totals.weeks.map((entry) => entry.bookedValueHt),
          seriesLabels: weekLabels,
          footer: "Credit-covered bookings count as zero",
        },
```

The `Pending` card is dropped: its count is already the Pending tab's own badge, and the two trend cards say more.

- [ ] **Step 3: Put counts on the resource filter**

In `booking-table.tsx`, the `resourceId` filter builds its options from `resources`. Give them counts from the stats, matching what the `source` filter already does:

```tsx
    {
      key: "resourceId",
      label: "Resource",
      value: activeResourceId,
      options: resources.map((resource) => ({
        value: resource.id,
        label: resource.name,
        count: (stats?.byResource ?? []).find(
          (row) => row.resourceId === resource.id
        )?.count,
      })),
    },
```

- [ ] **Step 4: Verify it compiles and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual check**

Open `/booking/bookings`. The first two cards show sparklines across eight weeks and a percentage delta. The Cancelled card names a released amount. Open the Resource filter and confirm each room shows a count. Filter to a date range and confirm the cards move with it.

- [ ] **Step 6: Commit**

```bash
git add app/booking/bookings/stats.ts app/booking/bookings/section-cards.tsx app/booking/bookings/booking-table.tsx
git commit -m "feat(booking): draw the summary cards from the weekly trend"
```

---

## Verification

After Task 11, in `hyperspace-platform`:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

and in `hscowork-backend-platform`:

```bash
npm test && npm run lint:check && npm run build
```

Then walk the whole flow once: create a booking for a member, view its details, edit it and clear the notes, cancel it, and confirm the Cancel button greys in place with the right tooltip.
