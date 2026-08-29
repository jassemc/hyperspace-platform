# Community Consume Summaries and Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the members, companies and memberships pages use the API's new embedded summaries, stats endpoints, `status` filter and `forCompanyId` roster filter — removing the 100-row name lookups (and the member edit form's silent detach), the placeholder stat cards, the kind-tabs-as-status-tabs on members, and the company plans tab's client-side scan.

**Architecture:** Bookings' stats pattern, applied three times: a `cache()`-wrapped positional-primitives fetcher in `stats.ts` shared by `section-cards.tsx` and `table-section.tsx` (same args → one request per render), a pure `xTotals(stats)` deriving `countFor`/`weeks`/`changeIn`, `StatCards` with `series`/`delta`, and status tabs counted from `byStatus`. Names come off the DTOs; lookups go away. One shared `lib/stats.ts` lifts `changeIn`/`weekLabels` out of the two modules that already carry them. The company plans tab becomes an ordinary server-paged table section on `forCompanyId`.

**Tech Stack:** Next.js 15 App Router + React 19 server components, `lib/search-params`, `components/data-table.tsx` (`serverSearch`, status tabs with counts, inline select filters), `components/stat-cards.tsx`, generated `lib/service` client (`getMemberStats`, `getCompanyStats`, `getMembershipStats`, `MemberDto.company`, `MembershipDto.member/company/plan`, `ListMembersParams.status`, `ListMembershipsParams.forCompanyId`). No test runner.

**Spec:** `docs/superpowers/specs/2026-08-29-community-consume-summaries-and-stats-design.md`

## Global Constraints

- **Repo:** `/Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform`, branch off `feat/free-bookings-partnerships` (which carries the regenerated client at `8f7668f` or later). Work in a worktree; the main checkout is shared with another session.
- **Verification per task:** `npx tsc --noEmit` and `npm run lint` (no new warnings; ~17 pre-existing), plus the manual check named. `npm run build` at the end.
- **Stats fetchers are positional primitives** wrapped in `cache()`, with the comment from `app/booking/bookings/stats.ts` explaining why (copy it). Cards and table section must call with identical arguments derived from the same `searchParams`.
- **`null` stats → "–"** on cards and tabs without counts; never 0.
- **Do not regress the discount work**: `memberships/columns.tsx` keeps its Discount column; `membership-form-dialog.tsx` keeps its discount select and self-fetches.
- **Do not touch** `lib/service/**`, `components/**` (except nothing), `app/booking/**` and `app/community/opportunities/**` beyond the import repoint in Task 1.
- **Stage only named paths;** never `git add -A`. Commit per task as `type(scope): what it does`.
- **Reference files:** `app/booking/bookings/stats.ts` + `section-cards.tsx` + `table-section.tsx` + `booking-table.tsx` for the stats/tabs/filters pattern; `app/community/memberships/table-section.tsx` for a section on `lib/search-params`.

---

## File map

- Create `lib/stats.ts`. Modify `app/booking/bookings/stats.ts`, `app/community/opportunities/opportunity-meta.ts`, `app/community/opportunities/section-cards.tsx`, `app/booking/bookings/section-cards.tsx` (import repoints only).
- Members: modify `stats.ts`, `section-cards.tsx`, `table-section.tsx`, `member-table.tsx`, `columns.tsx`, `member-status.ts`, `member-details-dialog.tsx`, `member-form-dialog.tsx`, `page.tsx`.
- Companies: modify `stats.ts`, `section-cards.tsx`, `[id]/plans-tab.tsx`, `[id]/company-plans-table.tsx`, `[id]/plans-columns.tsx`.
- Memberships: modify `stats.ts`, `section-cards.tsx`, `table-section.tsx`, `membership-table.tsx`, `columns.tsx`, `membership-details-dialog.tsx`, `page.tsx`.

---

### Task 1: `lib/stats.ts` — shared `changeIn` and `weekLabels`

**Files:** Create `lib/stats.ts`. Modify `app/booking/bookings/stats.ts`, `app/booking/bookings/section-cards.tsx`, `app/community/opportunities/opportunity-meta.ts`, `app/community/opportunities/section-cards.tsx`.

**Produces:**
```ts
// lib/stats.ts
/**
 * Two complete weeks, compared. From nothing to something has no
 * percentage to report, so it goes unsaid rather than being called 100%.
 */
export function changeIn<K extends string>(weeks: Array<Record<K, number> & { week: string }>, key: K): number | undefined {
    if (weeks.length < 2) return undefined
    const previous = weeks[weeks.length - 2][key]
    const latest = weeks[weeks.length - 1][key]
    if (previous === 0) return undefined
    return Math.round(((latest - previous) / previous) * 1000) / 10
}

/** "24 Aug" style labels for a sparkline, oldest first. */
export function weekLabels(weeks: Array<{ week: string }>): string[] {
    return weeks.map((entry) => new Date(entry.week).toLocaleDateString(undefined, { day: "numeric", month: "short" }))
}
```

- [ ] Step 1: create the file above.
- [ ] Step 2: in `bookings/stats.ts` `bookingTotals`, replace the inline `changeIn` closure with `changeIn: (key: "created" | "starting") => changeIn(weeks, key)`; in `opportunity-meta.ts` `opportunityTotals` likewise with its keys. Replace the inline `weekLabels` maps in both `section-cards.tsx` with `weekLabels(totals.weeks)`.
- [ ] Step 3: `npx tsc --noEmit && npm run lint`. Manual: the bookings and opportunities cards render identical deltas and labels as before (compare one screenshot each, or the numbers).
- [ ] Step 4: commit `refactor(stats): share changeIn and weekLabels across modules`.

---

### Task 2: Members — stats, cards, status tabs

**Files:** Modify `members/stats.ts`, `members/section-cards.tsx`, `members/table-section.tsx`, `members/member-table.tsx`, `members/member-status.ts`, `members/page.tsx`.

**Produces:**
```ts
// members/stats.ts
export const memberStats = cache(async (q: string | undefined, kindHint: MemberKindHint | undefined, companyId: string | undefined): Promise<MemberStatsDto | null> => { try { return (await getMemberStats({ q, kindHint, companyId })) as MemberStatsDto } catch (e) { console.warn("Failed to load member stats", e); return null } })
export function memberTotals(stats: MemberStatsDto | null) {
  const byStatus = new Map((stats?.byStatus ?? []).map((r) => [r.status, r.count]))
  const byKind = new Map((stats?.byKindHint ?? []).map((r) => [r.kindHint, r.count]))
  const weeks = stats?.byWeek ?? []
  return { weeks, changeIn: (key: "created") => changeIn(weeks, key), countFor: (s: string) => (stats ? byStatus.get(s) ?? 0 : undefined), kindCount: (k: string) => (stats ? byKind.get(k) ?? 0 : undefined), total: stats?.total, withCompany: stats?.withCompany }
}
```
`member-status.ts` re-exports `MEMBER_STATUS_TABS` (all six) and keeps `MEMBER_KIND_TABS`/`MEMBER_KIND_HINT_VALUES`.

- [ ] Step 1: `stats.ts` as above (delete the four `limit: 1` counters).
- [ ] Step 2: `table-section.tsx`: `status = asEnum<MemberStatus>(firstParam(params.status), MEMBER_STATUS_VALUES)`, `kindHint = asEnum<MemberKindHint>(firstParam(params.kindHint), MEMBER_KIND_HINT_VALUES)`; `getListMembers({ limit, offset, sort: "ASC", q, status, kindHint })`; `const stats = await memberStats(q, kindHint, undefined)` in the same `Promise.all`; pass `activeStatus`, `activeKindHint`, `stats` to `MemberTable`. Keep the `companies` fetch (`limit: 100`) — Task 3 still needs it for the form's option list — but rename the prop to `companies: CompanyDto[]`.
- [ ] Step 3: `member-table.tsx`: `key={`${activeStatus ?? "all"}-${activeKindHint ?? "any"}`}`; `showStatusTabs statusTabOptions={MEMBER_STATUS_TABS.map((t) => ({ ...t, count: totals.countFor(t.value) }))} statusAllCount={totals.total}`; `filters={[{ key: "kindHint", label: "Kind", value: activeKindHint, options: MEMBER_KIND_TABS.map((t) => ({ ...t, count: totals.kindCount(t.value) })) }]}`, `inlineFilters`, `serverSearch` kept.
- [ ] Step 4: `section-cards.tsx` takes `searchParams`, derives `q`/`kindHint` the same way as the section (share via a tiny exported `memberStatsArgs(params)` helper in `stats.ts` so the two cannot drift), and renders: Total members (`value: totals.total`, `series: weeks.map(w => w.created)`, `seriesLabels: weekLabels(weeks)`, `delta: totals.changeIn("created")`, footer "Added over the last eight weeks"), Active (`countFor("active")`), Leads (`countFor("lead")`), With employer (`withCompany`). `figure()` renders "–" for `undefined`. `page.tsx` passes `searchParams` to `SectionCards`.
- [ ] Step 5: `npx tsc --noEmit && npm run lint`. Manual: six status tabs with counts summing to All; the Kind select narrows both the table and the counts; cards match the tabs; with the API stopped the cards show "–".
- [ ] Step 6: commit `feat(members): status tabs and cards from GET /members/stats`.

---

### Task 3: Members — names from the summary, and an employer select that cannot detach

**Files:** Modify `members/columns.tsx`, `members/member-table.tsx`, `members/table-section.tsx`, `members/member-details-dialog.tsx`, `members/member-form-dialog.tsx`, and `companies/[id]/company-members-table.tsx` (it passes `companyNames` to the form).

- [ ] Step 1: `columns.tsx`: remove `companyNames`; the name subtitle and the Company column read `member.company?.name`, with `member.companyId && !member.company?.name ? "Unknown company" : …` guarding a blank summary, and "Solo" when `companyId` is null.
- [ ] Step 2: `member-details-dialog.tsx`: delete the `getCompany` lazy load and its state; the Employer section renders `member.company` (link to `/community/companies/${member.company.id}`, roles badges). Keep the memberships load.
- [ ] Step 3: `member-form-dialog.tsx`: props `companies?: { id: string; name: string }[]` (replacing `companyNames`); build `options = companies ?? []` and, when `editingMember?.company && !options.some((c) => c.id === editingMember.company.id)`, prepend `editingMember.company` with a comment: "An employer past the first hundred companies must still be selectable, or saving would silently detach the member." The select's `defaultValue`/state stays `editingMember?.companyId`.
- [ ] Step 4: `member-table.tsx` and `company-members-table.tsx`: pass `companies` (the table section's list; for the company page, `[{ id: companyId, name: companyName }]`).
- [ ] Step 5: `npx tsc && npm run lint`. Manual: list, details and edit form all show the employer name with no company lookup beyond the option list; edit a member and save without touching the employer → still employed.
- [ ] Step 6: commit `feat(members): read the employer off the dto; keep it selectable on edit`.

---

### Task 4: Memberships — names from the summaries

**Files:** Modify `memberships/table-section.tsx`, `memberships/membership-table.tsx`, `memberships/columns.tsx`, `memberships/membership-details-dialog.tsx`.

- [ ] Step 1: `table-section.tsx`: delete the three lookups and the `memberNames`/`companyNames`/`plans` props. `membership-table.tsx` stops passing them (the form self-fetches).
- [ ] Step 2: `columns.tsx`: customer column `accessorFn: (m) => m.member?.fullName ?? m.company?.name ?? ""`; add a muted `membership.plan.name` line under the membership name; Discount column untouched.
- [ ] Step 3: `membership-details-dialog.tsx`: remove the `getMember`/`getCompany`/`getPlan` loads and their state; header uses `membership.plan.name`; Customer section renders from `membership.member` (`mailto:${member.email}` when present) or `membership.company` (link by id); the "Catalog" aside uses `plan.name`; keep `getListMembershipPauses`.
- [ ] Step 4: `npx tsc && npm run lint`. Manual: rows 1–200 all carry names; details opens with customer/plan already filled (only the pauses skeleton).
- [ ] Step 5: commit `feat(memberships): read member, company and plan off the dto`.

---

### Task 5: Memberships — stats, cards, plan filter

**Files:** Modify `memberships/stats.ts`, `memberships/section-cards.tsx`, `memberships/table-section.tsx`, `memberships/membership-table.tsx`, `memberships/page.tsx`.

**Produces:** `membershipStats(q, planId, companyId, forCompanyId)` + `membershipTotals(stats)` → `{ weeks, changeIn(key: "created" | "starting"), countFor, total, topPlan: byPlan[0] | undefined, plans: byPlan }`, `membershipStatsArgs(params)`.

- [ ] Step 1: `stats.ts` as in Task 2's shape over `getMembershipStats`.
- [ ] Step 2: `table-section.tsx`: `planId = firstParam(params.planId) || undefined`; pass `planId` to the list and to `membershipStats(q, planId, undefined, undefined)`; hand `stats`, `activePlanId` to the table.
- [ ] Step 3: `membership-table.tsx`: tab counts from `totals.countFor`, `statusAllCount={totals.total}`; add `filters=[{ key: "planId", label: "Plan", value: activePlanId, options: totals.plans.map((p) => ({ value: p.planId, label: p.name, count: p.count })) }]`, `inlineFilters`; `key` includes `activePlanId`.
- [ ] Step 4: `section-cards.tsx` with `searchParams`: Total (series `created`, delta), Active, Pending, Ended; the Total card's footer reads `topPlan ? `Most held: ${topPlan.name}` : "Every membership on record"`.
- [ ] Step 5: `npx tsc && npm run lint`. Manual: tab counts equal the table's totals per tab; the Plan filter narrows both.
- [ ] Step 6: commit `feat(memberships): cards, tab counts and a plan filter from GET /memberships/stats`.

---

### Task 6: Companies — stats and cards

**Files:** Modify `companies/stats.ts`, `companies/section-cards.tsx`, `companies/page.tsx`.

- [ ] Step 1: `companyStats(q)` over `getCompanyStats`; `companyTotals` → `{ weeks, changeIn("created"), countFor, total, withMembers }`.
- [ ] Step 2: cards: Companies (series/delta), Active (`countFor("active")`), Leads (`countFor("lead")`), With members (`withMembers`). `page.tsx` passes `searchParams`; `table-section.tsx` calls `companyStats(q)` too (no tabs yet — the list has no status filter — but the shared cache costs nothing and keeps the pattern).
- [ ] Step 3: `npx tsc && npm run lint`. Manual: four real company figures.
- [ ] Step 4: commit `feat(companies): cards from GET /companies/stats`.

---

### Task 7: Company plans tab — server-paged roster on `forCompanyId`

**Files:** Modify `companies/[id]/plans-tab.tsx`, `companies/[id]/company-plans-table.tsx`, `companies/[id]/plans-columns.tsx`.

- [ ] Step 1: `plans-tab.tsx`: delete `loadCompanyMemberships`, `MAX_MEMBERSHIP_PAGES`, `MEMBERSHIP_PAGE_SIZE`, `resolvePlanNames`, the local `firstParam` and page types, and the in-memory search/pagination. New body: `params = await resolveSearchParams(searchParams)`, `{ limit, offset, q } = pageQuery(params)`, `status = asEnum<MembershipStatus>(firstParam(params.status), MEMBERSHIP_STATUS_VALUES)`, `[page, stats] = await Promise.all([getListMemberships({ limit, offset, sort: "DESC", q, status, forCompanyId: companyId }), getMembershipStats({ forCompanyId: companyId, q })])` in try/catch; render header + `SubscribePlanButton` + `<CompanyPlansTable data totalCount companyId activeStatus stats />`.
- [ ] Step 2: `company-plans-table.tsx`: drop `plansById`/`subscribersById`; `showStatusTabs` with `MEMBERSHIP_STATUS_TABS` counts from `membershipTotals(stats)`; `serverSearch searchPlaceholder="Search plans..."`; `key={activeStatus ?? "all"}`; dialogs/actions unchanged.
- [ ] Step 3: `plans-columns.tsx`: plan column reads `membership.plan.name` (no `filterFn`); subscriber column `membership.member?.fullName ?? membership.company?.name` with the existing "Company" badge when `!memberId`.
- [ ] Step 4: `npx tsc && npm run lint`. Manual: a company whose members hold memberships shows them; search hits the server; status tabs count correctly; pagination past 10.
- [ ] Step 5: commit `feat(company): plans tab pages the roster with forCompanyId instead of scanning`.

---

### Task 8: Sweep

- [ ] `grep -rn "companyNames\|memberNames\|plansById\|subscribersById\|MAX_MEMBERSHIP_PAGES\|limit: 1000" app/community` → only the create forms' option lists may remain (`membership-form-dialog.tsx` self-fetch; `attach-member-button`/`subscribe-plan-button`).
- [ ] `npx tsc --noEmit && npm run lint && npm run build`.
- [ ] The spec's manual pass end to end. Commit any cleanup as `chore(community): remove the last lookup leftovers`.

---

## Self-review

Spec sections → tasks: Members (names T3, employer select T3, tabs T2, stats T2); Companies (stats T6, plans tab T7); Memberships (names T4, stats/plan filter T5, form untouched); Shared `lib/stats.ts` T1. Interfaces: `memberTotals`/`membershipTotals`/`companyTotals` all expose `weeks`, `changeIn`, `countFor`, `total`; `xStatsArgs(params)` keeps cards and sections on one cache key. Task 3 depends on Task 2's `companies` prop rename — T3's implementer reads the current table section.
