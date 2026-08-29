# Member details page — design

**Date:** 2026-08-29 (revised same day) · **Apps:** `hscowork-backend-platform` + `hyperspace-platform` (staff admin)

## Goal

Give staff one page per member that shows everything held directly by that
person — profile, employer, memberships, bookings, check-ins, credits, charges,
invoices — and lets them act on any of it (edit, add, pause, check out, …)
without leaving the page. Today member details is a read-only dialog with only
memberships in it.

## Scope decisions

- **Direct data only.** Every list is filtered by `memberId`. Nothing pooled
  from the employer company; the identity card links to the company page for
  that. (Memberships could be pooled via `forCompanyId`, deliberately not used.)
- **Opportunities are out** for now, even though `/opportunities?memberId`
  exists. Easy to add as an eighth tab later.
- **No photo.** `MemberDto` has no avatar field; use an initials avatar.
- The existing `MemberDetailsDialog` is removed once the page replaces it.
- **One request for the page head and Overview.** `GET /members/{id}` returns
  `MemberDetailsDto` (the member plus six summary blocks, §0). The domain
  *tabs* still page through the existing list endpoints with `memberId`, since
  full histories are unbounded and need paging/search.

## 0. Backend — `GET /members/{id}` returns `MemberDetailsDto`

**Module cycle.** Membership, Booking, Attendance and Billing all import
`MemberModule`, so it cannot import them back. A new module
`src/modules/member-overview/` (imports Member, Membership, Booking,
Attendance, Credits, Billing, User, Role) owns `MemberOverviewController`
with the single route `@Get('/:id')` on `@Controller({ version: '1', path:
'members' })`. `getById` is removed from `MemberController`. Same URL, same
guard (`STAFF_OR_OWN`: admin/staff any member, member-role own record only,
resolved by `MemberService.getByIdFor`), same `operationId: getMember`, same
403 `member_access_denied` / 404 `member_not_found`.

**Payload.** `MemberDetailsDto extends MemberDto` (every existing `MemberDto`
consumer keeps working) plus six blocks, all built with `limit 5, offset 0`
through the existing domain services, in one `Promise.all`:

| Block | Fields | Source |
|---|---|---|
| `memberships` | `total`, `active`, `items: MembershipDto[]` (newest 5 by createdAt) | `MembershipService.list({memberId})`, `MembershipStatsService.stats({memberId})` → `byStatus` active count |
| `bookings` | `upcoming`, `items: BookingDto[]` (next 5 `confirmed`, `from = now`, ASC) | `BookingService.list(caller, …)` |
| `checkins` | `total`, `onSite: CheckinDto \| null` (latest with no `checkedOutAt`), `items` (last 5) | `CheckinService.list({memberId})` |
| `credits` | `balances: MembershipCreditBalancesDto[]`, `recent: CreditTransactionDto[]` (last 5) | `CreditsService.balances({memberId})`, `.list({memberId})` |
| `charges` | `total`, `uninvoiced`, `items` (latest 5 uninvoiced) | `ChargesService.list({memberId})` and `({memberId, uninvoiced: true})` |
| `invoices` | `total`, `open` (status `sent`), `outstandingTtc` (Σ `totalTtc − paid` over open, `roundMoney`), `items` (latest 5 open) | `InvoicesService.list(caller, …)` ×2 + new `InvoicesService.outstandingFor(memberId)` |

Plain DB reads only, so a failing block is a 500 — no partial payloads.
Docs: `DocGetMember` moves to `member-overview/docs/` with response
`MemberDetailsDto`. Unit spec `member-overview.service.spec.ts` with mocked
domain services asserts every call carries `memberId` only (never
`companyId`/`forCompanyId`) and the derived figures (`active`, `onSite`,
`outstandingTtc`). `docs/DECISIONS.md` gets an entry. No migration.

**Frontend consequence.** Regenerate `lib/service` (`npm run generate` against
the local backend) and commit `swagger.json` + `lib/service`. The identity
card and Overview read `member.<block>`; the Overview makes zero extra
requests.

## API surface used (all existing)

| Domain | Endpoint | Filter |
|---|---|---|
| Member + overview | `GET /members/{id}` → `MemberDetailsDto` | — (see §0) |
| Memberships | `GET /memberships`, `GET /memberships/stats` | `memberId` |
| Bookings | `GET /bookings`, `GET /bookings/stats` | `memberId`, `from`, `sort` |
| Check-ins | `GET /checkins` | `memberId`, `sort` |
| Credits | `GET /credits`, `GET /credits/balances` | `memberId` |
| Charges | `GET /charges` | `memberId`, `uninvoiced` |
| Invoices | `GET /invoices` | `memberId`, `status` |

## 1. Route & shell

`app/community/members/[id]/`, mirroring `app/community/companies/[id]/`.

- Server page: `getMember(id)`; failure → `notFound()`.
- Active tab from `?tab=`; valid values
  `overview | memberships | bookings | checkins | credits | charges | invoices`,
  default `overview`. A `MemberTabs` client component (copy of `CompanyTabs`
  with the tab list swapped) moves the highlight optimistically and clears
  `page`, `pageSize`, `q`, `status` on switch.
- Layout: `lg+` two columns — identity card (~320px, `sticky top-*`) left,
  tabs right; stacked below `lg`. "← Back to members" link above.
- Entry points: member name in `app/community/members/columns.tsx` and in
  `companies/[id]/members-columns.tsx` becomes a `Link` to
  `/community/members/{id}`. The row menu "Details" item navigates there too.

## 2. Identity card

Always visible. Contents, top to bottom:

- Actions row: **Edit** (existing `MemberFormDialog`) and **Set status**
  (existing `StatusDialog` through `useMemberMutations`).
- Initials avatar, full name, status badge (`MEMBER_STATUS_*`), "Pinned"
  outline badge when `statusOverride` is set.
- Kind / segment line (`formatEnumLabel`).
- Email (`mailto:`), phone.
- Employer: link to `/community/companies/{id}` plus "Billing person" /
  "Contact person" badges, or "Solo — no employer". When a company is set, a
  muted hint: "Company memberships & invoices live on {Company} →".
- Tags, notes (when present).
- Footer: created / updated dates, `CopyId`.

## 3. Overview tab

Grid of five cards (`md:grid-cols-2`, `xl:grid-cols-3`). Each card: headline
figure, up to three most-relevant rows, a "View all →" link to its tab, and one
quick action button (see §5).

| Card | Headline | Rows | Quick action |
|---|---|---|---|
| Memberships | active count from `memberships/stats` | active then pending memberships, name + dates + status badge | Add membership |
| Credits | balance from `credits/balances` | last 3 credit rows (`sort DESC, limit 3`) | Add credit |
| Bookings | upcoming count | next 3 bookings (`from = now`, `sort ASC`, `limit 3`) with resource + time | New booking |
| Billing | open/overdue invoice count and summed total; uninvoiced charge count | up to 3 open invoices | Add charge · Create invoice |
| Check-ins | "Checked in since {time}" when the latest check-in has no checkout, else "Last visit {date}" | last 3 check-ins | Check in, or **Check out** (existing `CheckoutButton`) when currently inside |

The cards are plain (synchronous) components over `member.<block>` from the
single `getMember` payload — no per-card fetching. The "Memberships" headline
is `memberships.active`; "Credits" sums `available` over
`credits.balances[].balances[]`; "Billing" shows `invoices.outstandingTtc`
with `invoices.open` / `charges.uninvoiced`; "Check-ins" uses
`checkins.onSite`.

## 4. Domain tabs

One file per tab: `memberships-tab.tsx`, `bookings-tab.tsx`, `checkins-tab.tsx`,
`credits-tab.tsx`, `charges-tab.tsx`, `invoices-tab.tsx`. Each is an async
server component that:

- reads `limit/offset/q` from `searchParams` via `pageQuery`,
- calls the list endpoint with `memberId` fixed,
- renders a header (title, one-line description, the tab's add button with
  `defaultMemberId`), then the table.

Tables reuse the global pages' table + columns + row actions. Where a global
page's column set includes a member/customer column, the column factory gains
a `hideMember` (or similar) flag rather than a duplicated column file. Row
actions (booking details/confirm/cancel, membership pause/renew/cancel,
invoice download/actions, credit edit/delete, check-in checkout) are imported
as-is.

Pagination and search stay URL-driven exactly like the company Members tab
(`DataTable` with `totalCount`).

## 5. Quick actions pre-selecting the member

Optional `defaultMemberId?: string` prop on `MembershipFormDialog`,
`AddCreditForm`, `AddChargeForm`, `AddInvoiceForm`, `AddCheckinForm`. When set:
customer kind starts as `member`, the member select is pre-selected and the
option list still loads (so staff can override if they truly need to).
`BookingFormDialog` already has `prefill`; extend it with `memberId`.

Each add-button wrapper (`AddMembershipButton`, `AddCreditButton`, …) accepts
and forwards `defaultMemberId`.

Server actions for these domains already call `revalidatePath` for their list
page; add `revalidatePath("/community/members/[id]", "page")` so the member
page refreshes after any mutation started from it.

## 6. Loading & errors

- `loading.tsx` for the route: identity-card skeleton + overview skeleton.
- Tab switch shows the tab skeleton (from `MemberTabs`) until the server
  payload lands.
- Unknown member id → Next's `notFound()`.

## 7. Verification

The repo has no test runner. Done means:

1. `npm run lint` and `npx tsc --noEmit` pass.
2. Against the local backend: open a member with data in every domain; every
   tab lists only that member's rows; every quick action opens with the member
   pre-selected and, after submit, the page reflects the change without a
   manual reload; Edit and Set status work from the card; a company member
   shows the company link; a bogus id renders the 404 page.
