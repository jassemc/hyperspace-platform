# Community pages: consume the summaries, stats and filters

**Status:** design, awaiting review
**Spans:** `hyperspace-platform` only (client already regenerated at `8f7668f`)

The backend now embeds name summaries on `MemberDto` and `MembershipDto`,
serves `GET /members/stats`, `/companies/stats`, `/memberships/stats`, filters
`GET /members` by derived `status`, and filters `GET /memberships` by a
company's whole roster (`forCompanyId`). This spec makes the three community
pages use them, removing the four workarounds the previous frontend spec
(`2026-08-29-community-crud-parity-design.md`, "Not in scope") had to leave:

1. the 100-row name lookups (and the member edit form's silent detach),
2. stat cards that count only what a list filter could answer,
3. kind tabs standing in for status tabs on members,
4. the company plans tab's 1000-row client-side scan.

The pattern is bookings': `stats.ts` with a `cache()`-wrapped
positional-primitives fetcher shared by the cards and the table section so
tabs and cards never disagree; `StatCards` with `series` from `byWeek` and
`delta` from the last two complete weeks (`changeIn`, copied from
`bookings/stats.ts`); status tabs whose counts come from `byStatus`.

## Members

**Names.** `members/table-section.tsx` drops the `getListCompanies` lookup
and the `companyNames` prop; `columns.tsx` reads `member.company?.name`
("Solo" when null); `member-details-dialog.tsx` drops the lazy `getCompany`
and renders `member.company` directly (link + roles); the `memberships`
lazy load stays.

**Employer select without the detach bug.** `member-form-dialog.tsx` still
needs a list of companies to *choose* from, so it keeps a `companies` option
list (fetched by the table section with `limit: 100`, unchanged), but the
select is seeded from `editingMember.company`: if the current employer is
not in the option list it is prepended as an option, so saving never falls
back to "Solo" for an employer past row 100. The `previousCompanyId` hidden
input and the update action are unchanged.

**Status tabs.** `member-table.tsx` switches `statusTabOptions` from
`MEMBER_KIND_TABS` to `MEMBER_STATUS_TABS` (re-added to `member-status.ts`
with all six statuses) with counts from `stats.byStatus`; `table-section.tsx`
narrows `?status` with `asEnum<MemberStatus>` and passes `status` to
`getListMembers`. Kind becomes an inline select filter (`kindHint`, three
options with counts from `stats.byKindHint`). The `key` remount includes
both.

**Stats.** `members/stats.ts` becomes
`memberStats(q, kindHint, companyId)` → `getMemberStats`, plus
`memberTotals(stats)` with `countFor(status)`, `total`, `weeks`, `changeIn`.
`section-cards.tsx` takes `searchParams` (bookings-style) and shows: Total
members (series `byWeek.created`, delta), Active (`countFor("active")`),
Leads (`countFor("lead")`), With employer (`withCompany`). A `null` stats
result renders "–".

## Companies

**Stats.** `companies/stats.ts` → `getCompanyStats(q)`; cards: Companies
(series `byWeek.created`, delta), Active (`byStatus.active`), Leads
(`byStatus.lead`), With members (`withMembers`). The cross-domain
member/membership figures the interim cards showed are dropped.

**Plans tab.** `companies/[id]/plans-tab.tsx` replaces the scan
(`loadCompanyMemberships`, `MAX_MEMBERSHIP_PAGES`, `resolvePlanNames`, the
in-memory search and pagination) with one
`getListMemberships({ forCompanyId: id, q, status?, limit, offset, sort })`
call parsed through `lib/search-params` — a normal table section. Plan and
subscriber names come from `membership.plan.name` and
`membership.member?.fullName ?? membership.company?.name`, so `plansById` /
`subscribersById` props disappear from `company-plans-table.tsx` and
`plans-columns.tsx` (the custom `filterFn` goes with them; search is
server-side now). Status tabs from `MEMBERSHIP_STATUS_TABS` with counts from
`getMembershipStats({ forCompanyId: id })`. `subscribe-plan-button.tsx` keeps
its own member/plan option fetches.

**Members tab.** Unchanged (it already filters by `companyId`), except the
`companyName` threading can stay as is.

## Memberships

**Names.** `memberships/table-section.tsx` drops the three lookups and the
`memberNames`/`companyNames` props; `columns.tsx` reads
`membership.member?.fullName` / `membership.company?.name` for the customer
column and adds `membership.plan.name` under the membership name (small
muted line). `membership-details-dialog.tsx` drops the lazy `getMember` /
`getCompany` / `getPlan` loads: the header uses `plan.name`, the Customer
section uses the summaries (`member.email` for the `mailto:`, `company.id`
for the link), and the "Catalog: {name}" aside links `/space/plan` with
`plan.name`. The `getListMembershipPauses` load stays.

**Stats.** `memberships/stats.ts` → `getMembershipStats(q, planId,
companyId, forCompanyId)` with `membershipTotals`; cards: Total (series
`byWeek.created`, delta), Active, Pending, Ended (all `countFor`), each with
a footer naming the top plan from `byPlan[0]` where that reads well; tabs get
counts from `byStatus`. A `Plan` inline select filter (`planId`) with options
from `byPlan` (name + count) replaces nothing — it is new, cheap, and the
data is already in the response.

**Form.** `membership-form-dialog.tsx` keeps its own option fetches for the
create selects (member/company/plan lists are still needed to *choose*); it
no longer receives `memberNames`/`companyNames`/`plans` from the table (the
self-fetch path already covers it). Not touched otherwise.

## Shared

- `lib/stats.ts` (new): `changeIn(weeks, key)` and the `weekLabels(weeks)`
  helper, lifted from `bookings/stats.ts` so five modules stop copying them;
  bookings and opportunities are repointed in the same change (a pure move —
  their behaviour is pinned by comparing output before/after on the same
  input).
- `components/stat-cards.tsx` is untouched.

## Error handling

Stats fetchers return `null` on failure (warn, never throw) exactly as
today; cards render "–" and tabs render without counts. List calls keep
their existing try/catch.

## Files

**Members** — `stats.ts`, `section-cards.tsx`, `table-section.tsx`,
`member-table.tsx`, `columns.tsx`, `member-status.ts`,
`member-details-dialog.tsx`, `member-form-dialog.tsx`, `page.tsx`.
**Companies** — `stats.ts`, `section-cards.tsx`, `[id]/plans-tab.tsx`,
`[id]/company-plans-table.tsx`, `[id]/plans-columns.tsx`.
**Memberships** — `stats.ts`, `section-cards.tsx`, `table-section.tsx`,
`membership-table.tsx`, `columns.tsx`, `membership-details-dialog.tsx`,
`membership-form-dialog.tsx`, `page.tsx`.
**Shared** — new `lib/stats.ts`; `app/booking/bookings/stats.ts`,
`app/community/opportunities/opportunity-meta.ts` (import repoint only).

## Testing

No test runner: `npx tsc --noEmit`, `npm run lint`, `npm run build` per
task, and a manual pass against the running API (`feat/discounts` @
`0ebcfd3` or later): every card shows a number that matches its tab; the
members page has six status tabs whose counts sum to "All"; a member whose
employer is past the first hundred companies still shows the right name in
the list, the details dialog and the edit form, and saving the edit form
without touching the employer does not detach them; the company plans tab
lists memberships held by the company's members without a client scan and
searches server-side; the memberships details dialog opens with names
already present (no skeleton for customer/plan).

## Not in scope

- Member/company/plan **option lists** in the create forms and the
  subscribe/attach dialogs (still first-100; needs a searchable select).
- Money on any card.
- Converging bookings'/opportunities' `ActionState` or table code.
