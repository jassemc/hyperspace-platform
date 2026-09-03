# Member Details Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `GET /members/{id}` returns the member plus six summary blocks, and a `/community/members/[id]` page in `hyperspace-platform` renders profile, employer, memberships, bookings, check-ins, credits, charges and invoices from it, with quick actions that pre-select the member.

**Architecture:** Backend: a new `member-overview` NestJS module owns the `GET /members/:id` route (moved out of `MemberController` to avoid a module cycle) and assembles `MemberDetailsDto extends MemberDto` from the existing domain services. Frontend: server-rendered App Router route mirroring `app/community/companies/[id]/`; sticky identity card + URL-driven tabs; Overview cards are synchronous components over the payload; domain tabs page through the existing list endpoints with `memberId`; add-forms gain `defaultMemberId`; server actions revalidate the member route.

**Tech Stack:** Backend — NestJS 11, TypeORM 0.3, pnpm, jest (`src/**/*.spec.ts`), house style per `docs/CONVENTIONS.md` / `building-nestjs-modules` skill. Frontend — Next.js (App Router; read `node_modules/next/dist/docs/` first, this version differs from training data), React 19, TS strict, shadcn/ui, `@tanstack/react-table` via `components/data-table.tsx`, generated client in `lib/service`.

**Spec:** `docs/superpowers/specs/2026-08-29-member-details-page-design.md`

## Global Constraints

- Backend work happens in `hscowork-backend-platform` on branch `feat/member-details` (cut from `feat/discounts`); frontend work in `hyperspace-platform` on `feat/member-details-page`. Both repos may be used by other sessions: stage **by path**, never `git add -A`, never stash/clean.
- Backend gate before every commit: `pnpm lint:check && pnpm format:check && pnpm type-check && pnpm test` all green. `.claude` hooks prettier/eslint every edited `.ts` and block a turn on type errors.
- Backend: RFC 9457 errors with existing codes (`member_not_found`, `member_access_denied`); no migration; `@ProtectedWith` only; path-alias imports only; controllers return DTOs.
- Direct data only: every list call passes `memberId: member.id`; never `forCompanyId`/`companyId`.
- No Opportunities tab.
- Backend change is limited to `GET /members/{id}` (Task B1); the client is regenerated once (Task B2).
- Valid tabs, in this order: `overview | memberships | bookings | checkins | credits | charges | invoices`.
- No test runner exists in the repo. Every task's verification is `npm run lint` and `npx tsc --noEmit` (both must exit 0) plus the manual check listed in the task, against a running local backend (`npm run dev` in `hyperspace-platform`).
- Follow the house style already in `app/community/companies/[id]/`: `Readonly<...>` props, `console.warn` + graceful empty state on failed fetches, `formatDate`/`formatDateTime` from `@/lib/format`.
- Commit after each task, staging files **by path** (no `git add -A`).
- Work on branch `feat/member-details-page`.

---

## File map

| File | Responsibility |
|---|---|
| `app/community/members/[id]/page.tsx` | Route: load member, pick tab, lay out card + tabs |
| `app/community/members/[id]/loading.tsx` | Route skeleton |
| `app/community/members/[id]/member-tabs.tsx` | Client tab strip, URL-driven (copy of `CompanyTabs`) |
| `app/community/members/[id]/identity-card.tsx` | Client identity card with Edit / Set status |
| `app/community/members/[id]/overview-tab.tsx` | Grid of the five `Suspense`-wrapped cards |
| `app/community/members/[id]/overview/*.tsx` | One async card per domain |
| `app/community/members/[id]/overview/overview-card.tsx` | Shared card shell (title, "View all", action slot) |
| `app/community/members/[id]/{memberships,bookings,checkins,credits,charges,invoices}-tab.tsx` | Async tab bodies |
| `app/community/members/[id]/member-route.ts` | `memberPath(id, tab?)` helper used by links and revalidation |
| Existing forms / buttons / actions | `defaultMemberId` prop; member-route revalidation |
| Existing columns | Optional `hideCustomer` flag |

---

### Task B1: `member-overview` module — DTO, service, controller move

**Files:**
- Create: `src/modules/member-overview/member-overview.module.ts`
- Create: `src/modules/member-overview/controllers/member-overview.controller.ts`
- Create: `src/modules/member-overview/dtos/member-details.dto.ts`
- Create: `src/modules/member-overview/services/member-overview.service.ts`
- Create: `src/modules/member-overview/services/member-overview.service.spec.ts`
- Create: `src/modules/member-overview/docs/member-overview.doc.ts`
- Modify: `src/modules/member/controllers/member.controller.ts` (remove `getById` + `DocGetMember`/`STAFF_OR_OWN` if now unused)
- Modify: `src/modules/member/docs/member.doc.ts` (remove `DocGetMember`; keep `MEMBER_ACCESS_DENIED`/`MEMBER_NOT_FOUND` exported if other docs use them — check with grep)
- Modify: `src/modules/billing/services/invoices.service.ts` (+ `outstandingFor`), `invoices.service.spec.ts`
- Modify: `src/app/app.module.ts` (register `MemberOverviewModule` after `BookingModule`)

**Interfaces:**
- Consumes: `MemberService.getByIdFor(caller, id): Promise<MemberDto>`; `MembershipService.list(MembershipPageOptionsDto)`; `MembershipStatsService.stats(MembershipStatsOptionsDto)` → `{ byStatus: {status,count}[] }`; `BookingService.list(caller, BookingPageOptionsDto)`; `CheckinService.list(CheckinPageOptionsDto)`; `CreditsService.balances(CreditBalancesQueryDto)` + `.list(CreditPageOptionsDto)`; `ChargesService.list(ChargePageOptionsDto)`; `InvoicesService.list(caller, InvoicePageOptionsDto)`; `PageDto<T>` = `{ results, meta: { totalItems } }`; `Sort` enum from `@common/pagination/constants/sort`; `roundMoney` from `@common/base/money-column.transformer`.
- Produces: `MemberDetailsDto` (+ `MemberMembershipsSummaryDto`, `MemberBookingsSummaryDto`, `MemberCheckinsSummaryDto`, `MemberCreditsSummaryDto`, `MemberChargesSummaryDto`, `MemberInvoicesSummaryDto`); `MemberOverviewService.getDetailsFor(caller: IUser, id: string): Promise<MemberDetailsDto>`; `InvoicesService.outstandingFor(memberId: string): Promise<number>`.

- [x] **Step 1: Branch**

```bash
cd hscowork-backend-platform && git checkout -b feat/member-details feat/discounts
```

- [x] **Step 2: DTOs** — `dtos/member-details.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberDto } from '@modules/member/dtos/member.dto';
import { MembershipDto } from '@modules/membership/dtos/membership.dto';
import { BookingDto } from '@modules/booking/dtos/booking.dto';
import { CheckinDto } from '@modules/attendance/dtos/checkin.dto';
import { CreditTransactionDto, MembershipCreditBalancesDto } from '@modules/credits/dtos/credit.dtos';
import { ChargeDto } from '@modules/billing/dtos/charge.dtos';
import { InvoiceDto } from '@modules/billing/dtos/invoice.dtos';

/** Every block: a count the tab header can show, and the few rows the Overview card lists. */
export class MemberMembershipsSummaryDto {
  @ApiProperty({ example: 3 }) total: number;
  @ApiProperty({ example: 1, description: 'Memberships whose derived status is active today.' }) active: number;
  @ApiProperty({ type: [MembershipDto], description: 'Newest five by creation.' }) items: MembershipDto[];
}
export class MemberBookingsSummaryDto {
  @ApiProperty({ example: 2, description: 'Confirmed bookings starting from now.' }) upcoming: number;
  @ApiProperty({ type: [BookingDto], description: 'Next five upcoming, soonest first.' }) items: BookingDto[];
}
export class MemberCheckinsSummaryDto {
  @ApiProperty({ example: 40 }) total: number;
  @ApiPropertyOptional({ type: CheckinDto, nullable: true, description: 'The open check-in, when the member is on site.' }) onSite: CheckinDto | null;
  @ApiProperty({ type: [CheckinDto], description: 'Last five, newest first.' }) items: CheckinDto[];
}
export class MemberCreditsSummaryDto {
  @ApiProperty({ type: [MembershipCreditBalancesDto] }) balances: MembershipCreditBalancesDto[];
  @ApiProperty({ type: [CreditTransactionDto], description: 'Last five ledger rows, newest first.' }) recent: CreditTransactionDto[];
}
export class MemberChargesSummaryDto {
  @ApiProperty({ example: 12 }) total: number;
  @ApiProperty({ example: 2, description: 'Charges not yet on an invoice.' }) uninvoiced: number;
  @ApiProperty({ type: [ChargeDto], description: 'Latest five uninvoiced charges.' }) items: ChargeDto[];
}
export class MemberInvoicesSummaryDto {
  @ApiProperty({ example: 9 }) total: number;
  @ApiProperty({ example: 1, description: 'Issued (sent) and not yet paid.' }) open: number;
  @ApiProperty({ example: 120.5, description: 'Σ totalTtc − paid over open invoices, TND.' }) outstandingTtc: number;
  @ApiProperty({ type: [InvoiceDto], description: 'Latest five open invoices.' }) items: InvoiceDto[];
}

/** The member row plus what the staff detail page shows at a glance. Direct holdings only — nothing pooled from the employer. */
export class MemberDetailsDto extends MemberDto {
  @ApiProperty({ type: MemberMembershipsSummaryDto }) memberships: MemberMembershipsSummaryDto;
  @ApiProperty({ type: MemberBookingsSummaryDto }) bookings: MemberBookingsSummaryDto;
  @ApiProperty({ type: MemberCheckinsSummaryDto }) checkins: MemberCheckinsSummaryDto;
  @ApiProperty({ type: MemberCreditsSummaryDto }) credits: MemberCreditsSummaryDto;
  @ApiProperty({ type: MemberChargesSummaryDto }) charges: MemberChargesSummaryDto;
  @ApiProperty({ type: MemberInvoicesSummaryDto }) invoices: MemberInvoicesSummaryDto;
}
```

(Format with one decorator per line as prettier dictates; the hook does it.)

- [x] **Step 3: `InvoicesService.outstandingFor`** — write the failing spec first in `invoices.service.spec.ts`:

```typescript
describe('outstandingFor', () => {
  it('sums totalTtc minus paid over sent invoices of the member only', async () => {
    const qb = { select: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getRawOne: jest.fn().mockResolvedValue({ outstanding: '120.500' }) };
    repository.createQueryBuilder.mockReturnValue(qb);
    await expect(service.outstandingFor(MEMBER_ID)).resolves.toBe(120.5);
    expect(qb.where).toHaveBeenCalledWith('i.member_id = :memberId', { memberId: MEMBER_ID });
    expect(qb.andWhere).toHaveBeenCalledWith('i.status = :status', { status: InvoiceStatus.SENT });
  });
  it('returns 0 when there is nothing open', async () => { /* getRawOne → { outstanding: null } → 0 */ });
});
```

Run `pnpm test -- invoices.service` → fails (method missing). Implement:

```typescript
/** What the member still owes: Σ(total_ttc − paid) over issued, unpaid invoices. */
async outstandingFor(memberId: string): Promise<number> {
  const row = await this.invoiceRepository
    .createQueryBuilder('i')
    .select('COALESCE(SUM(i.total_ttc - i.paid), 0)', 'outstanding')
    .where('i.member_id = :memberId', { memberId })
    .andWhere('i.status = :status', { status: InvoiceStatus.SENT })
    .getRawOne<{ outstanding: string | null }>();
  return roundMoney(Number(row?.outstanding ?? 0));
}
```

(Confirm the repository field name and the `paid` column name in `invoice.entity.ts` before writing.) Run again → passes.

- [x] **Step 4: Service + failing spec** — `services/member-overview.service.spec.ts` mocks every domain service (`{ list: jest.fn(), stats: jest.fn(), balances: jest.fn(), outstandingFor: jest.fn(), getByIdFor: jest.fn() }`) and asserts:
  - `getByIdFor` is called with `(caller, id)` and its 404/403 propagate (mock rejects → `rejects.toThrow`).
  - every `list`/`stats`/`balances` call receives an options object with `memberId: MEMBER_ID`, `limit: 5`, `offset: 0`, and **no** `companyId`/`forCompanyId` key.
  - bookings options: `status: 'confirmed'`, `sort: 'ASC'`, `from` is an ISO string ≤ now + 1s.
  - checkins: `sort: 'DESC'`; `onSite` is `items[0]` when its `checkedOutAt` is null, else `null`.
  - memberships: `active` = the `byStatus` entry with `status: 'active'` (0 when absent); `total` = `meta.totalItems`.
  - charges: two list calls, the second with `uninvoiced: true`; `uninvoiced` = its `totalItems`, `items` = its results.
  - invoices: `open` = totalItems of the `status: 'sent'` call; `outstandingTtc` = `outstandingFor` result; `total` = totalItems of the unfiltered call.
  - result spreads every `MemberDto` field (`fullName`, `status`, `company`, …).

Run `pnpm test -- member-overview` → fails (module missing). Implement `services/member-overview.service.ts`:

```typescript
@Injectable()
export class MemberOverviewService {
  private static readonly PAGE = { offset: 0, limit: 5 } as const;

  constructor(
    private readonly memberService: MemberService,
    private readonly membershipService: MembershipService,
    private readonly membershipStats: MembershipStatsService,
    private readonly bookingService: BookingService,
    private readonly checkinService: CheckinService,
    private readonly creditsService: CreditsService,
    private readonly chargesService: ChargesService,
    private readonly invoicesService: InvoicesService,
  ) {}

  /**
   * The member row plus one small block per domain, for the staff detail
   * page. Own-scope is settled by getByIdFor first, so a member-role caller
   * never reaches the lists with someone else's id. Every list is filtered
   * by memberId ONLY — a member-within-company seat is that person's, and
   * the employer's own rows belong on the company page.
   */
  async getDetailsFor(caller: IUser, id: string): Promise<MemberDetailsDto> {
    const member = await this.memberService.getByIdFor(caller, id);
    const memberId = member.id;
    const page = MemberOverviewService.PAGE;
    const [membershipPage, membershipStats, bookingPage, checkinPage, balances, creditPage, chargePage, uninvoicedPage, invoicePage, openInvoicePage, outstandingTtc] = await Promise.all([
      this.membershipService.list(opts(MembershipPageOptionsDto, { ...page, sort: Sort.DESC, memberId })),
      this.membershipStats.stats(opts(MembershipStatsOptionsDto, { memberId })),
      this.bookingService.list(caller, opts(BookingPageOptionsDto, { ...page, sort: Sort.ASC, memberId, status: BookingStatus.CONFIRMED, from: new Date().toISOString() })),
      this.checkinService.list(opts(CheckinPageOptionsDto, { ...page, sort: Sort.DESC, memberId })),
      this.creditsService.balances(opts(CreditBalancesQueryDto, { memberId })),
      this.creditsService.list(opts(CreditPageOptionsDto, { ...page, sort: Sort.DESC, memberId })),
      this.chargesService.list(opts(ChargePageOptionsDto, { ...page, sort: Sort.DESC, memberId })),
      this.chargesService.list(opts(ChargePageOptionsDto, { ...page, sort: Sort.DESC, memberId, uninvoiced: true })),
      this.invoicesService.list(caller, opts(InvoicePageOptionsDto, { ...page, sort: Sort.DESC, memberId })),
      this.invoicesService.list(caller, opts(InvoicePageOptionsDto, { ...page, sort: Sort.DESC, memberId, status: InvoiceStatus.SENT })),
      this.invoicesService.outstandingFor(memberId),
    ]);
    // build the DTO: Object.assign(new MemberDetailsDto(), member) then the six blocks
  }
}

/** class-transformer instance so the page DTO's defaults/transforms apply exactly as they would from the wire. */
function opts<T>(cls: new () => T, values: Partial<T>): T {
  return plainToInstance(cls, values);
}
```

`onSite = checkinPage.results[0] && !checkinPage.results[0].checkedOutAt ? checkinPage.results[0] : null`. `active = membershipStats.byStatus.find((s) => s.status === MembershipStatus.ACTIVE)?.count ?? 0`.

Run `pnpm test -- member-overview` → passes.

- [x] **Step 5: Docs, controller, module**

`docs/member-overview.doc.ts`: `DocGetMember()` = `Doc({ operationId: 'getMember', summary: 'Get a member with their overview', description: '…staff/admin any member; member-role own record. Blocks list direct holdings only (memberId filter), five newest each.' })`, `DocRequest({ params: [{ name: 'id', type: 'string' }] })`, `DocResponse(MemberDetailsDto)`, `DocErrorResponse(HttpStatus.FORBIDDEN, MEMBER_ACCESS_DENIED)`, `DocErrorResponse(HttpStatus.NOT_FOUND, MEMBER_NOT_FOUND)` — import the two problem constants from `@modules/member/docs/member.doc` (export them there).

`controllers/member-overview.controller.ts`: `@ApiTags('Members') @Controller({ version: '1', path: 'members' })`, one handler `@Get('/:id') @DocGetMember() @ProtectedWith(STAFF_OR_OWN)` → `this.overview.getDetailsFor(caller, id)`. Copy the `STAFF_OR_OWN` constant (roles admin/staff/member, permission READ MEMBER).

`member-overview.module.ts`: imports `MemberModule, MembershipModule, BookingModule, AttendanceModule, CreditsModule, BillingModule, UserModule, RoleModule`; controller + service; no exports.

`member.controller.ts`: delete `getById`, the `STAFF_OR_OWN` const if unused, the `CurrentUser`/`IUser` imports if unused, and `DocGetMember` from the import list; delete `DocGetMember` from `member.doc.ts`.

`app.module.ts`: add `MemberOverviewModule` after `BookingModule`.

- [x] **Step 6: Verify**

`pnpm lint:check && pnpm format:check && pnpm type-check && pnpm test` → green. Boot: `pnpm start:dev`; `GET /api/v1/members/<seeded id>` as admin returns the member fields plus six blocks; Swagger `/docs` shows one `getMember` with `MemberDetailsDto`; `GET /api/v1/members/<uuid-not-existing>` → 404 `member_not_found`.

- [x] **Step 7: DECISIONS + commit**

Append to `docs/DECISIONS.md` under a new `## 2026-08-29 — Member overview` heading, next number: the route moved into `member-overview` to break the module cycle; direct-only `memberId` filter and why; five-row blocks; no partial payloads.

```bash
git add src/modules/member-overview src/modules/member src/modules/billing src/app/app.module.ts docs/DECISIONS.md
git commit -m "feat(members): return an overview with GET /members/:id"
```

---

### Task B2: Regenerate the admin client

**Files (hyperspace-platform):** `swagger.json`, `lib/service/*` (generated; `lib/service/http-client.ts` is never overwritten).

- [x] **Step 1:** With the backend running locally: `cd hyperspace-platform && npm run generate` (default `HS_SWAGGER_URL=http://localhost:3000/_docs/json`).
- [x] **Step 2:** `git diff --stat swagger.json lib/service` — expect `MemberDetailsDto` and the six summary DTOs in `HsService.ts`, `getMember` returning `MemberDetailsDto`. `npx tsc --noEmit` passes (existing callers accept the subtype).
- [x] **Step 3:** `git add swagger.json lib/service && git commit -m "chore: regenerate client for the member overview"`.

---

### Task 1: Route shell, identity card, tabs, entry links

**Files:**
- Create: `app/community/members/[id]/member-route.ts`
- Create: `app/community/members/[id]/member-tabs.tsx`
- Create: `app/community/members/[id]/identity-card.tsx`
- Create: `app/community/members/[id]/page.tsx`
- Create: `app/community/members/[id]/loading.tsx`
- Modify: `app/community/members/columns.tsx:22-46` (name cell → `Link`)
- Modify: `app/community/members/member-row-actions.tsx` ("Details" → navigate)
- Modify: `app/community/members/member-table.tsx` (drop details dialog state)
- Modify: `app/community/companies/[id]/members-columns.tsx:24-36` (name cell → `Link`)
- Modify: `app/community/members/actions.ts:20-25` (revalidate member route)
- Delete: `app/community/members/member-details-dialog.tsx`

**Interfaces:**
- Produces: `memberPath(id: string, tab?: MemberTab): string`, `MEMBER_TABS`, `type MemberTab`, `<MemberTabs activeTab>`, `<IdentityCard member>`.

- [x] **Step 1: Route helper**

`app/community/members/[id]/member-route.ts`:

```ts
export const MEMBER_TABS = [
  "overview",
  "memberships",
  "bookings",
  "checkins",
  "credits",
  "charges",
  "invoices",
] as const

export type MemberTab = (typeof MEMBER_TABS)[number]

export const MEMBER_TAB_LABELS: Record<MemberTab, string> = {
  overview: "Overview",
  memberships: "Memberships",
  bookings: "Bookings",
  checkins: "Check-ins",
  credits: "Credits",
  charges: "Charges",
  invoices: "Invoices",
}

/** The one place the member URL is spelled, so links and revalidation agree. */
export function memberPath(id: string, tab?: MemberTab): string {
  const base = `/community/members/${id}`
  return tab && tab !== "overview" ? `${base}?tab=${tab}` : base
}

/** Pattern form for `revalidatePath(..., "page")`. */
export const MEMBER_ROUTE_PATTERN = "/community/members/[id]"
```

- [x] **Step 2: Tabs component**

`app/community/members/[id]/member-tabs.tsx` — copy `app/community/companies/[id]/company-tabs.tsx` verbatim, then:
- rename `CompanyTabs` → `MemberTabs`;
- replace the `TABS` constant with `MEMBER_TABS.map((value) => ({ value, label: MEMBER_TAB_LABELS[value] }))` imported from `./member-route`;
- in `onValueChange`, also `params.delete("kind")` and `params.delete("from")`, `params.delete("to")` (credits and bookings own those);
- `OverviewSkeleton` renders 5 `h-56` skeletons in `md:grid-cols-2 xl:grid-cols-3`.

- [x] **Step 3: Identity card**

`app/community/members/[id]/identity-card.tsx`:

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CopyId, Section } from "@/components/details-dialog-parts"
import { Building2, Mail, Pencil, Phone, UserCog } from "lucide-react"
import type { MemberDto } from "@/lib/service/HsService"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { MEMBER_STATUS_CLASSES, MEMBER_STATUS_LABELS } from "../member-status"
import { MemberFormDialog } from "../member-form-dialog"
import { StatusDialog } from "../status-dialog"
import { useMemberMutations } from "../use-member-mutations"

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Who the member is, always on screen. Edit and Set status live here so the
 * page never needs a row menu; both reuse the members-table dialogs.
 */
export function IdentityCard({ member }: Readonly<{ member: MemberDto }>) {
  const [editOpen, setEditOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const { pending, setStatus } = useMemberMutations(member)

  return (
    <Card className="lg:sticky lg:top-6">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)} disabled={pending !== null}>
            <UserCog className="mr-1.5 h-4 w-4" />
            Set status
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg">{initials(member.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight">{member.fullName}</h1>
              <Badge variant="secondary" className={`${MEMBER_STATUS_CLASSES[member.status]} border-0`}>
                {MEMBER_STATUS_LABELS[member.status]}
              </Badge>
              {member.statusOverride && <Badge variant="outline">Pinned</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {[formatEnumLabel(member.kindHint), member.segment && formatEnumLabel(member.segment)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <Section title="Contact">
          <div className="space-y-1 text-sm">
            {member.email ? (
              <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{member.email}</span>
              </a>
            ) : (
              <p className="text-muted-foreground">No email</p>
            )}
            {member.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {member.phone}
              </p>
            )}
          </div>
        </Section>

        <Section title="Employer">
          {!member.companyId ? (
            <p className="text-sm text-muted-foreground">Solo — no employer</p>
          ) : member.company ? (
            <div className="space-y-1.5 text-sm">
              <Link
                href={`/community/companies/${member.company.id}`}
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Building2 className="h-3.5 w-3.5" />
                {member.company.name}
              </Link>
              <div className="flex flex-wrap gap-1">
                {member.isBillingPerson && <Badge variant="outline">Billing person</Badge>}
                {member.isContactPerson && <Badge variant="outline">Contact person</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Company memberships & invoices live on {member.company.name}.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unknown company</p>
          )}
        </Section>

        {member.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-1">
              {member.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </Section>
        )}

        {member.notes && (
          <Section title="Notes">
            <p className="whitespace-pre-wrap text-sm">{member.notes}</p>
          </Section>
        )}

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Created {formatDate(member.createdAt)}</span>
          <span>Updated {formatDate(member.updatedAt)}</span>
          <CopyId id={member.id} label="Member" />
        </p>
      </CardContent>

      {editOpen && (
        <MemberFormDialog isOpen onClose={() => setEditOpen(false)} editingMember={member} />
      )}
      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        member={member}
        pending={pending === "status"}
        onApply={async (choice) => {
          if (await setStatus(choice)) setStatusOpen(false)
        }}
      />
    </Card>
  )
}
```

- [x] **Step 4: Page and loading**

`app/community/members/[id]/page.tsx`:

```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { getMember } from "@/lib/service"
import type { MemberDetailsDto } from "@/lib/service/HsService"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { firstParam } from "@/lib/search-params"
import { MEMBER_TABS, type MemberTab } from "./member-route"
import { MemberTabs } from "./member-tabs"
import { IdentityCard } from "./identity-card"
import { OverviewTab } from "./overview-tab"
import { MembershipsTab } from "./memberships-tab"
import { BookingsTab } from "./bookings-tab"
import { CheckinsTab } from "./checkins-tab"
import { CreditsTab } from "./credits-tab"
import { ChargesTab } from "./charges-tab"
import { InvoicesTab } from "./invoices-tab"

export default async function MemberDetailsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}>) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const requested = firstParam(resolvedSearchParams?.tab)
  const activeTab: MemberTab = MEMBER_TABS.includes(requested as MemberTab)
    ? (requested as MemberTab)
    : "overview"

  let member: MemberDetailsDto
  try {
    member = (await getMember(id)) as MemberDetailsDto
  } catch (error) {
    console.warn(`Failed to load member ${id}`, error)
    notFound()
  }

  return (
    <div className="w-full py-6">
      <div className="px-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
          <Link href="/community/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to members
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 px-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <IdentityCard member={member} />
        <div className="min-w-0">
          <MemberTabs activeTab={activeTab}>
            {activeTab === "overview" && <OverviewTab member={member} />}
            {activeTab === "memberships" && <MembershipsTab member={member} searchParams={resolvedSearchParams} />}
            {activeTab === "bookings" && <BookingsTab member={member} searchParams={resolvedSearchParams} />}
            {activeTab === "checkins" && <CheckinsTab member={member} searchParams={resolvedSearchParams} />}
            {activeTab === "credits" && <CreditsTab member={member} searchParams={resolvedSearchParams} />}
            {activeTab === "charges" && <ChargesTab member={member} searchParams={resolvedSearchParams} />}
            {activeTab === "invoices" && <InvoicesTab member={member} searchParams={resolvedSearchParams} />}
          </MemberTabs>
        </div>
      </div>
    </div>
  )
}
```

For this task only, create the six tab files and `overview-tab.tsx` as placeholders that render `<p className="px-4 text-sm text-muted-foreground">Coming in a later task.</p>` with the signature `({ member, searchParams }: Readonly<{ member: MemberDetailsDto; searchParams?: SearchParamsInput }>)` (Overview takes only `member: MemberDetailsDto`; the identity card keeps `MemberDto` since a details DTO is one). Tasks 3–5 replace them.

`app/community/members/[id]/loading.tsx`: back-button skeleton, then the same grid with a `h-[520px]` skeleton on the left and a `h-10` tab-strip skeleton plus 5 `h-56` card skeletons on the right.

- [x] **Step 5: Entry links**

`app/community/members/columns.tsx` name cell: replace the `<button>` with

```tsx
<Link
  href={memberPath(member.id)}
  className="rounded-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  {member.fullName}
</Link>
```

(`import Link from "next/link"`, `import { memberPath } from "./[id]/member-route"`). Remove `onDetails` from `ColumnsProps` and `createColumns`.

`app/community/members/member-row-actions.tsx`: drop the `onDetails` prop; the "Details" item becomes

```tsx
<DropdownMenuItem onSelect={() => router.push(memberPath(member.id))}>
```

with `const router = useRouter()` from `next/navigation`.

`app/community/members/member-table.tsx`: remove `detailsMember` state, `handOff`, the `MemberDetailsDialog` import/render, and pass only `onEdit` to `createColumns`.

`app/community/companies/[id]/members-columns.tsx`: add a `cell` to the `name` column rendering `<Link href={memberPath(member.id)} className="font-medium hover:underline">{member.fullName}</Link>`; keep `onDetails` in `ColumnsProps` untouched (the company page's own dialog stays).

Delete `app/community/members/member-details-dialog.tsx`. Run `grep -rn "MemberDetailsDialog" app components` — must be empty.

- [x] **Step 6: Revalidate the member route on member mutations**

`app/community/members/actions.ts` `revalidate()`: add `revalidatePath(MEMBER_ROUTE_PATTERN, "page")` importing from `./[id]/member-route`.

- [x] **Step 7: Verify**

Run: `npm run lint && npx tsc --noEmit` → both exit 0.
Manual: open `/community/members`, click a name → page renders card, tab strip, placeholder body; Edit and Set status work and the card updates after refresh; `/community/members/not-a-real-id` → 404 page; company page → Members tab → name links here.

- [x] **Step 8: Commit**

```bash
git add app/community/members app/community/companies/[id]/members-columns.tsx
git commit -m "feat(members): member details route with identity card and tabs"
```

---

### Task 2: `defaultMemberId` on the add forms; member-route revalidation

**Files:**
- Modify: `app/community/memberships/membership-form-dialog.tsx:33-37,107,129,395`
- Modify: `app/community/memberships/add-membership-button.tsx`
- Modify: `app/community/memberships/actions.ts:21-29`
- Modify: `app/booking/bookings/booking-customer-fields.tsx:20-50,343`
- Modify: `app/booking/bookings/booking-form-dialog.tsx:43-50,368-380`
- Modify: `app/booking/bookings/add-booking-button.tsx`
- Modify: `app/booking/bookings/actions.ts:85-90`
- Modify: `app/booking/checkins/add-checkin-form.tsx:22-25,109`
- Modify: `app/booking/checkins/add-checkin-button.tsx`
- Modify: `app/booking/checkins/actions.ts:40,59`
- Modify: `app/billing/credits/add-credit-form.tsx:23-26,51,105`
- Modify: `app/billing/credits/add-credit-button.tsx`
- Modify: `app/billing/credits/actions.ts:24-26`
- Modify: `app/billing/charges/add-charge-form.tsx:25-28,46,138`
- Modify: `app/billing/charges/add-charge-button.tsx`
- Modify: `app/billing/charges/actions.ts:54-55`
- Modify: `app/billing/invoices/add-invoice-form.tsx:24-27,45-46`
- Modify: `app/billing/invoices/add-invoice-button.tsx`
- Modify: `app/billing/invoices/actions.ts:24-27`

**Interfaces:**
- Produces: every `Add*Button` and form accepts `defaultMemberId?: string`; `AddBookingButton` additionally still needs `lookups` + `timeZone`. `BookingFormDialogProps["prefill"]` gains `memberId?: string`.

- [x] **Step 1: Membership form**

- `MembershipFormDialogProps` += `defaultMemberId?: string`.
- `useState<CustomerKind>("member")` unchanged; in the open-reset effect: `setCustomerKind(editingMembership?.companyId ? "company" : "member")` stays.
- Member `<select id="memberId">` gets `defaultValue={defaultMemberId ?? ""}`.
- `AddMembershipButton({ defaultMemberId }: Readonly<{ defaultMemberId?: string }>)` forwards it.
- `actions.ts` `revalidate()` += `revalidatePath(MEMBER_ROUTE_PATTERN, "page")` (import from `@/app/community/members/[id]/member-route`).

- [x] **Step 2: Booking form**

- `BookingCustomerFieldsProps` += `defaultMemberId?: string`; the member `NativeSelect` gets `defaultValue={defaultMemberId ?? ""}`.
- `BookingFormDialogProps.prefill` += `memberId?: string`; make `resourceId`, `startsAt`, `endsAt` optional (`prefill?: { resourceId?: string; startsAt?: string; endsAt?: string; resourceName?: string; memberId?: string }`) and guard `seedSlot`: only build a slot when `prefill.startsAt && prefill.endsAt`. Pass `defaultMemberId={prefill?.memberId}` to `<BookingCustomerFields>`.
- `AddBookingButton` += `defaultMemberId?: string`, rendered as `prefill={defaultMemberId ? { memberId: defaultMemberId } : undefined}`.
- `actions.ts` `revalidate()` += member route.

- [x] **Step 3: Check-in form**

- `AddCheckinFormProps` += `defaultMemberId?: string`; `<select id="memberId">` gets `defaultValue={defaultMemberId ?? ""}`. Because options load async and a `defaultValue` on an empty select is lost, render it as a controlled select: `const [memberId, setMemberId] = useState(defaultMemberId ?? "")`, `value={memberId} onChange={(e) => setMemberId(e.target.value)}`.
- `AddCheckinButton` forwards `defaultMemberId`.
- `actions.ts`: both `revalidatePath("/booking/checkins")` calls followed by `revalidatePath(MEMBER_ROUTE_PATTERN, "page")`.

- [x] **Step 4: Credit form**

Credits are granted to a *membership*, so `defaultMemberId` narrows the membership list:
- `AddCreditFormProps` += `defaultMemberId?: string`.
- Lookup call becomes `getListMemberships({ limit: 100, offset: 0, sort: "ASC", memberId: defaultMemberId })` (undefined = unchanged behaviour); add `defaultMemberId` to the effect deps.
- Membership select: controlled `const [membershipId, setMembershipId] = useState("")`; after the memberships load, `if (defaultMemberId && loaded.length === 1) setMembershipId(loaded[0].id)`.
- Drawer description when `defaultMemberId` is set: "Only this member's memberships are listed."
- `AddCreditButton` forwards; `actions.ts` `revalidate()` += member route.

- [x] **Step 5: Charge form**

- `AddChargeFormProps` += `defaultMemberId?: string`; `useState<CustomerKind>("member")` unchanged; the customer `<select id="customerId">` gets `defaultValue={customerKind === "member" ? defaultMemberId ?? "" : ""}` and `key={customerKind}` so switching kind resets it.
- `AddChargeButton` forwards; `actions.ts` += member route after the two existing `revalidatePath` calls.

- [x] **Step 6: Invoice form**

- `AddInvoiceFormProps` += `defaultMemberId?: string`; `useState(customerId)` initial value `defaultMemberId ?? ""`; in the `!isOpen` reset branch keep `setCustomerId("")`; in the open branch before fetching options add `setCustomerId(defaultMemberId ?? "")`.
- `AddInvoiceButton` forwards; `actions.ts` `revalidate()` += member route.

- [x] **Step 7: Verify**

Run: `npm run lint && npx tsc --noEmit` → exit 0.
Manual: on each global page (`/community/memberships`, `/booking/bookings`, `/booking/checkins`, `/billing/credits`, `/billing/charges`, `/billing/invoices`) open the add form — behaviour identical to before (no member preselected, all options listed).

- [x] **Step 8: Commit**

```bash
git add app/community/memberships app/booking/bookings app/booking/checkins app/billing/credits app/billing/charges app/billing/invoices
git commit -m "feat(forms): accept a default member and revalidate the member page"
```

---

### Task 3: Memberships and Bookings tabs

**Files:**
- Modify: `app/community/memberships/columns.tsx:15-18,38-56` (`hideCustomer`)
- Modify: `app/community/memberships/membership-table.tsx` (`hideCustomer`, `defaultMemberId`, `showStatusTabs` optional)
- Modify: `app/booking/bookings/columns.tsx` (`hideCustomer`)
- Modify: `app/booking/bookings/booking-table.tsx` (`hideCustomer`, `defaultMemberId`, optional filters)
- Replace: `app/community/members/[id]/memberships-tab.tsx`
- Replace: `app/community/members/[id]/bookings-tab.tsx`

**Interfaces:**
- Consumes: `AddMembershipButton({ defaultMemberId })`, `AddBookingButton({ lookups, timeZone, defaultMemberId })`, `bookingLookups()`, `primaryTimeZone()`.
- Produces: `createColumns({ ..., hideCustomer?: boolean })` in both column files; `MembershipTable` and `BookingTable` accept `hideCustomer?: boolean` and `defaultMemberId?: string` (forwarded to their edit/create dialogs as `defaultMemberId` / `prefill.memberId`).

- [x] **Step 1: `hideCustomer` in both column factories**

In each `createColumns`, build the array then `return hideCustomer ? columns.filter((c) => c.id !== "customer") : columns`. Both files already give the customer column `id: "customer"`.

- [x] **Step 2: Table props**

`MembershipTable` += `hideCustomer?: boolean`, `defaultMemberId?: string`, `showStatusTabs?: boolean` (default `true`), `showPlanFilter?: boolean` (default `true`, `filters={showPlanFilter ? filters : []}`). Forward `defaultMemberId` to `<MembershipFormDialog>`.

`BookingTable` += `hideCustomer?: boolean`, `defaultMemberId?: string`, `showFilters?: boolean` (default `true`; when false pass `filters={[]}`). Forward `prefill={defaultMemberId ? { memberId: defaultMemberId } : undefined}` to `<BookingFormDialog>`.

- [x] **Step 3: Memberships tab**

```tsx
import { getListMemberships, getMembershipStats } from "@/lib/service"
import type { MemberDto, MembershipDto, MembershipStatsDto, MembershipStatus } from "@/lib/service/HsService"
import { asEnum, firstParam, pageQuery, pageResult, resolveSearchParams, type SearchParamsInput } from "@/lib/search-params"
import { MembershipTable } from "@/app/community/memberships/membership-table"
import { AddMembershipButton } from "@/app/community/memberships/add-membership-button"
import { MEMBERSHIP_STATUS_VALUES } from "@/app/community/memberships/membership-status"

export async function MembershipsTab({
  member,
  searchParams,
}: Readonly<{ member: MemberDto; searchParams?: SearchParamsInput }>) {
  const params = await resolveSearchParams(searchParams)
  const { limit, offset, q } = pageQuery(params)
  const status = asEnum<MembershipStatus>(firstParam(params.status), MEMBERSHIP_STATUS_VALUES)

  const [response, stats] = await Promise.all([
    getListMemberships({ limit, offset, sort: "DESC", q, status, memberId: member.id }).catch((error) => {
      console.warn("Failed to load member memberships", error)
      return null
    }),
    getMembershipStats({ memberId: member.id, q }).catch(() => null),
  ])
  const { results, total } = response ? pageResult<MembershipDto>(response) : { results: [], total: 0 }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Memberships</h2>
          <p className="text-sm text-muted-foreground">Held directly by {member.fullName}.</p>
        </div>
        <AddMembershipButton defaultMemberId={member.id} />
      </div>
      <MembershipTable
        data={results}
        totalCount={total}
        stats={stats as MembershipStatsDto | null}
        activeStatus={status}
        hideCustomer
        showPlanFilter={false}
        defaultMemberId={member.id}
      />
    </div>
  )
}
```

- [x] **Step 4: Bookings tab**

Same shape. Fetch `getListBookings({ limit, offset, sort: "DESC", q, status, memberId: member.id })` with `status` narrowed via `BOOKING_STATUS_VALUES`, plus `bookingLookups()` and `primaryTimeZone()` in the same `Promise.all`. Header button: `<AddBookingButton lookups={lookups} timeZone={timeZone} defaultMemberId={member.id} />`. Render `<BookingTable data totalCount resources={lookups.resources} members={lookups.members} companies={lookups.companies} timeZone activeStatus hideCustomer showFilters={false} defaultMemberId={member.id} />` (no `stats` → status tab counts are omitted, which `bookingTotals(null)` already tolerates).

- [x] **Step 5: Verify**

Run: `npm run lint && npx tsc --noEmit` → exit 0.
Manual: member with memberships/bookings → tabs list only that member's rows, no Customer column; paging/search work; "Add Membership" and "Add Booking" open with the member preselected and the tab refreshes after create; the global `/community/memberships` and `/booking/bookings` pages look unchanged.

- [x] **Step 6: Commit**

```bash
git add app/community/members/[id]/memberships-tab.tsx app/community/members/[id]/bookings-tab.tsx app/community/memberships app/booking/bookings
git commit -m "feat(members): memberships and bookings tabs on the member page"
```

---

### Task 4: Check-ins, Credits, Charges, Invoices tabs

**Files:**
- Modify: `app/booking/checkins/columns.tsx` (`hideMember`), `checkin-table.tsx` (forward)
- Modify: `app/billing/charges/columns.tsx` (`hideCustomer`), `charge-table.tsx`
- Modify: `app/billing/invoices/columns.tsx` (`hideCustomer` → drops `id: "billedTo"`), `invoice-table.tsx`
- Replace: `app/community/members/[id]/checkins-tab.tsx`, `credits-tab.tsx`, `charges-tab.tsx`, `invoices-tab.tsx`

**Interfaces:**
- Consumes: `AddCheckinButton`, `AddCreditButton`, `AddChargeButton`, `AddInvoiceButton` (all `{ defaultMemberId }`), `CheckinTable`, `CreditTable`, `ChargeTable`, `InvoiceTable`.
- Produces: `hideMember?: boolean` on `createColumns`/`CheckinTable`; `hideCustomer?: boolean` on charge and invoice `createColumns`/tables.

- [x] **Step 1: Column flags** — same filter-by-id technique as Task 3 (`"member"`, `"customer"`, `"billedTo"`), forwarded from each table's props.

- [x] **Step 2: Check-ins tab**

Fetch `getListCheckins({ limit, offset, sort: "DESC", q, memberId: member.id })` and `getListLocations({ limit: 100, offset: 0, sort: "ASC" })` in parallel; build `locationNames`; `memberNames={{ [member.id]: member.fullName }}` (the checkout button needs the name). Header button `<AddCheckinButton defaultMemberId={member.id} />`. Render `<CheckinTable data totalCount memberNames locationNames hideMember />`.

- [x] **Step 3: Credits tab**

Fetch `getListCredits({ limit, offset, sort: "DESC", q, memberId: member.id, kind })` (`kind` narrowed to `["grant","consumption"]`) and `getListResourceTypes(...)`; header `<AddCreditButton defaultMemberId={member.id} />`; render `<CreditTable data totalCount resourceTypeNames />`. (No member column exists in credits.)

- [x] **Step 4: Charges tab**

Fetch `getListCharges({ limit, offset, sort: "DESC", q, memberId: member.id, uninvoiced })`; header `<AddChargeButton defaultMemberId={member.id} />`; render `<ChargeTable data totalCount memberNames={{ [member.id]: member.fullName }} hideCustomer />`.

- [x] **Step 5: Invoices tab**

Fetch `getListInvoices({ limit, offset, sort: "DESC", q, status, memberId: member.id })` (`status` via `INVOICE_STATUS_VALUES`); header `<AddInvoiceButton defaultMemberId={member.id} />`; render `<InvoiceTable data totalCount memberNames={{ [member.id]: member.fullName }} activeStatus={status} hideCustomer />`.

- [x] **Step 6: Verify**

Run: `npm run lint && npx tsc --noEmit` → exit 0.
Manual: each tab lists only the member's rows; Check out from the check-ins tab refreshes the tab; invoice status tabs filter; each add button opens preselected and the tab reflects the new row after submit; global pages unchanged.

- [x] **Step 7: Commit**

```bash
git add app/community/members/[id] app/booking/checkins app/billing/credits app/billing/charges app/billing/invoices
git commit -m "feat(members): check-ins, credits, charges and invoices tabs"
```

---

### Task 5: Overview tab (reads the payload, no fetching)

**Files:**
- Create: `app/community/members/[id]/overview/overview-card.tsx`
- Create: `app/community/members/[id]/overview/memberships-card.tsx`
- Create: `app/community/members/[id]/overview/credits-card.tsx`
- Create: `app/community/members/[id]/overview/bookings-card.tsx`
- Create: `app/community/members/[id]/overview/billing-card.tsx`
- Create: `app/community/members/[id]/overview/checkins-card.tsx`
- Replace: `app/community/members/[id]/overview-tab.tsx`

**Interfaces:**
- Consumes: `MemberDetailsDto` blocks (`memberships {total, active, items}`, `bookings {upcoming, items}`, `checkins {total, onSite, items}`, `credits {balances, recent}`, `charges {total, uninvoiced, items}`, `invoices {total, open, outstandingTtc, items}`), `memberPath`, the add buttons from Task 2, `CheckoutButton({ checkinId, memberName })`, `formatPriceHt`, `formatDate`, `formatDateTime`, `bookingLookups()`, `primaryTimeZone()`.
- Produces: `<OverviewCard title viewAllHref action headline children>` and the `CardRows/CardRow/CardEmpty` helpers.

- [x] **Step 1: Card shell** — `overview-card.tsx` exactly as below:

```tsx
import Link from "next/link"
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

export function OverviewCard({ title, viewAllHref, action, headline, children }: Readonly<{
  title: string
  viewAllHref: string
  /** The one quick action this card offers. */
  action: ReactNode
  /** Big number or short status line. */
  headline: ReactNode
  children: ReactNode
}>) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Link href={viewAllHref} className="flex items-center gap-1 text-xs text-primary hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="text-2xl font-semibold tabular-nums">{headline}</div>
        <div className="flex-1 text-sm">{children}</div>
        <div className="flex flex-wrap gap-2">{action}</div>
      </CardContent>
    </Card>
  )
}

export function CardRows({ children }: Readonly<{ children: ReactNode }>) {
  return <ul className="divide-y rounded-md border">{children}</ul>
}

export function CardRow({ primary, secondary, aside }: Readonly<{ primary: ReactNode; secondary?: ReactNode; aside?: ReactNode }>) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate">{primary}</p>
        {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
      </div>
      {aside}
    </li>
  )
}

export function CardEmpty({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
```

- [x] **Step 2: Memberships card** — plain component `({ member }: Readonly<{ member: MemberDetailsDto }>)`. Headline `member.memberships.active` with `<span className="text-sm font-normal text-muted-foreground"> active of {total}</span>`; rows = first 3 of `items` sorted active→pending→paused→ended (rank map `{active:0,pending:1,paused:2,ended:3}`), each `name`, `formatDate(startsAt) → endsAt|open-ended`, status badge via `MEMBERSHIP_STATUS_CLASSES/LABELS`; empty "No memberships yet"; action `<AddMembershipButton defaultMemberId={member.id} />`; `viewAllHref={memberPath(member.id, "memberships")}`.

- [x] **Step 3: Credits card** — headline = Σ `available` over `member.credits.balances.flatMap((b) => b.balances)`; secondary line lists up to 3 `creditType: available`; rows = `member.credits.recent.slice(0, 3)` (`creditType`, `formatDateTime(occurredAt)`, aside `delta > 0 ? "+" + delta : delta` tabular); empty "No credit activity"; action `<AddCreditButton defaultMemberId={member.id} />`.

- [x] **Step 4: Bookings card** — async server component (needs `bookingLookups()` and `primaryTimeZone()` for the add button; wrap in `Suspense` in the tab). Headline `{member.bookings.upcoming} upcoming`; rows = `items.slice(0, 3)` (`title ?? resource.name`, `formatDateTime(startsAt, timeZone)`, status badge from `booking-status.ts`); empty "Nothing booked ahead"; action `<AddBookingButton lookups timeZone defaultMemberId={member.id} />`.

- [x] **Step 5: Billing card** — headline `formatPriceHt(member.invoices.outstandingTtc)` + " outstanding"; secondary "{invoices.open} open invoices · {charges.uninvoiced} uninvoiced charges"; rows = `invoices.items.slice(0, 3)` (`number ?? "Draft"`, `due formatDate(dueAt)`, aside `formatPriceHt(totalTtc)`); empty "Nothing outstanding"; actions `<AddChargeButton defaultMemberId />` and `<AddInvoiceButton defaultMemberId />`; `viewAllHref` → invoices tab.

- [x] **Step 6: Check-ins card** — `const { onSite, items, total } = member.checkins`. Headline `onSite ? "On site" : items[0] ? \`Last visit ${formatDate(items[0].checkedInAt)}\` : "Never visited"`, secondary `${total} visits`; rows = `items.slice(0, 3)` (`formatDateTime(checkedInAt)`, secondary `checkedOutAt ? "→ " + formatDateTime(checkedOutAt) : "still inside"`); action `onSite ? <CheckoutButton checkinId={onSite.id} memberName={member.fullName} /> : <AddCheckinButton defaultMemberId={member.id} />`.

- [x] **Step 7: Overview tab**

```tsx
import { Suspense } from "react"
import type { MemberDetailsDto } from "@/lib/service/HsService"
import { Skeleton } from "@/components/ui/skeleton"
import { MembershipsCard } from "./overview/memberships-card"
import { CreditsCard } from "./overview/credits-card"
import { BookingsCard } from "./overview/bookings-card"
import { BillingCard } from "./overview/billing-card"
import { CheckinsCard } from "./overview/checkins-card"

export function OverviewTab({ member }: Readonly<{ member: MemberDetailsDto }>) {
  return (
    <div className="grid gap-4 px-4 md:grid-cols-2 xl:grid-cols-3">
      <MembershipsCard member={member} />
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
        <BookingsCard member={member} />
      </Suspense>
      <CheckinsCard member={member} />
      <CreditsCard member={member} />
      <BillingCard member={member} />
    </div>
  )
}
```

- [x] **Step 8: Verify**

`npm run lint && npx tsc --noEmit` → exit 0. Manual: Overview renders from the one payload (Network tab: only the page request plus the booking lookups); numbers match the tabs; "View all" lands on the right tab; each quick action opens preselected and the page reflects the change after submit; checking in flips the card to "On site" with Check out; a member with no data shows the empty lines.

- [x] **Step 9: Commit**

```bash
git add app/community/members/[id]
git commit -m "feat(members): overview cards from the member payload"
```

---

### Task 6: Final pass

- [x] **Step 1:** `npm run lint && npx tsc --noEmit && npm run build` → all exit 0.
- [ ] **Step 2:** Walk spec §7 end to end on a real member (company-attached and solo) and note any deviation in the PR description.
- [x] **Step 3:** `grep -rn "MemberDetailsDialog\|onDetails" app/community/members` → only company page references remain.
- [ ] **Step 4:** Commit any fixups by path, then hand off via `superpowers:finishing-a-development-branch`.
