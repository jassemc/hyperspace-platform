# Members, companies, memberships: parity with bookings and opportunities

**Status:** design, awaiting review
**Spans:** `hyperspace-platform` only

The three community list pages predate the pattern the bookings and
opportunities pages now share. They work, but each one does the same things a
different way, and none of them does the things the newer pages do: a "⋯" row
menu, a details dialog, a mutations hook, actions that grey out with a reason
instead of vanishing, `problemType`-aware error copy. This spec brings the
three pages, and the company detail page under them, onto the same pattern.

## The reference pattern

Bookings is the newest idiom; opportunities has been refactored toward it and
is ahead of it on two points. "The pattern" below means bookings, plus those
two points:

| Concern | Reference |
|---|---|
| Page | server `page.tsx` → header + Add button, `SectionCards`, `Suspense` around an async `table-section.tsx` that parses the URL with `lib/search-params` and renders a client table |
| Table | `DataTable` with `serverSearch`, `inlineFilters`, status tabs with counts, `key` remount on filter change; `createColumns({...handlers})` factory; last column is `XRowActions` |
| Row menu | `DropdownMenu modal={false}`, `MoreHorizontal` trigger (a `Loader2` while that row is waiting), Details / Edit above a separator, state-changing items below it, destructive ones `variant="destructive"`, unavailable items kept visible and `disabled` with a `title` that says *why* |
| Dialog ownership | the **table** owns every dialog (opportunities' lift); `handOff` closes the details dialog before opening a form so they never stack |
| Details | `Dialog max-w-2xl`, header with title + status badge + dot-separated facts, hero figure, `Section`s, lazy fetch on open with a cancellation flag, `CopyId`, footer with Edit and the lifecycle actions |
| Form | one component for create and edit, `Dialog`, `useActionState` ×2, `SubmitButton` on `useFormStatus`, toast-once guard on **state object identity**, `messageFor(state, fallback)` mapping `problemType` → copy, body scrolls and footer pins |
| Mutations | `useXMutations(row)` returning `{ label, pending: Kind \| null, canX, xHint, x() => Promise<boolean> }`, toasting and `router.refresh()`ing itself, shared by the row menu and the details dialog |
| Confirmations | one small alert component per destructive action with the `{ open, onOpenChange, label, pending, onConfirm }` contract |
| Server actions | `ActionState { success, error, problemType, status }`, `problem(error, fallback)` unwrapping the client's `HttpError`, `text()`/`clearableText()` readers, `revalidatePath` helper |
| Stats | `stats.ts` with a `cache()`-wrapped positional-primitives fetcher, `StatCards` with four cards |

## What changes, by module

### Shared

- **`lib/action-state.ts`** — `ActionState`, `problem()`, `text()`, `num()`,
  `clearableText()`, `tags()`. The four community `actions.ts` files adopt it.
  Bookings and opportunities keep their local copies; converging them is not
  this work.
- **Delete** `members/table-skeleton.tsx` and `companies/table-skeleton.tsx`
  (copies of `components/table-skeleton.tsx`), the three private `firstParam`s
  (use `lib/search-params`), and the two hand-rolled stat-card layouts (use
  `StatCards`).
- **Stat cards stop scanning.** Members and companies fetch `limit: 1000` and
  count client-side; memberships fetches `limit: 100` and counts, so its
  figures are wrong past 100 rows. Each module gets a `stats.ts` whose
  `cache()`-wrapped fetcher issues one `limit: 1` request per figure and reads
  `meta.totalItems`. Figures that need a filter the API does not have (member
  `status`, company `status`, "with employer") are dropped rather than faked.
  Members: total, leads (`kindHint: lead`), visitors, members. Companies: the
  list accepts only `q`/`name`, so the only honest company figure is the
  total; the row shows total companies, total members, active memberships and
  pending memberships — the community at a glance — until a stats endpoint
  exists. Memberships: total, active, pending, ended (all real `status`
  filters).
- **All three tables** turn on `serverSearch` so search is the debounced
  server `q`, as on bookings, instead of riding the client column filter.

### Members

- Row actions become `MemberRowActions`: Details, Edit, separator, **Set
  status**. Nothing here is ever unavailable, so nothing is disabled.
- `useMemberMutations(member)` wraps `updateMemberStatusAction` → `setStatus(choice)`.
- `StatusButton` becomes `StatusDialog`, a controlled component on the shared
  alert contract, opened from the menu and from the details dialog.
- **`MemberDetailsDialog`**: name + status badge + kind · segment; email as
  `mailto:`, phone; employer (lazy `getCompany(companyId)` on open) with the
  billing/contact badges; memberships (lazy `getListMemberships({ memberId })`,
  active first); tags; notes; created/updated + `CopyId`. Footer: Edit, Set
  status.
- `add-member-form.tsx` becomes `member-form-dialog.tsx`: `Dialog max-w-2xl`,
  two-column grid, identity guard, `messageFor`. Same fields. Employer select
  keeps the `previousCompanyId` hidden input. The create-only rule "billing or
  contact role needs an employer" is enforced on update too.
- The table keeps kind tabs (the only lifecycle filter the endpoint has).

### Companies

- Row actions become `CompanyRowActions`: Details (navigates to
  `/community/companies/[id]` — the route *is* the details view and stays so;
  no second details surface), Edit. No lifecycle actions exist, so no hook.
- `add-company-form.tsx` becomes `company-form-dialog.tsx`, same treatment.
  Exposes the three `CompanyDto` fields the form silently drops today:
  `startDate`, `billingName`, `registrationNumber`.
- The list gains a **Status** column from `CompanyDto.status` (labels and
  classes in a new `company-status.ts`, same four exports as its siblings).
- `updateCompanyAction` also revalidates `/community/companies/${id}` so an
  edit from the list refreshes an open detail page.
- Detail page: an **Edit** button in the header opening the same form dialog;
  the overview tab shows status, start date, billing name and registration
  number.

### Company detail: members tab

- `members-columns.tsx` uses `member-status.ts` and `formatEnumLabel` instead
  of its private copies.
- Row actions become a "⋯" menu: Details (opens `MemberDetailsDialog`), Edit
  (opens `MemberFormDialog`), separator, Reassign, Detach. Both dialogs are
  the members module's components, owned by `CompanyMembersTable`.
- `ReassignMemberButton` becomes `ReassignMemberDialog` (controlled). It lists
  other companies **and** "No employer", since `updateMemberCompany` accepts
  `null` and `reassignMemberAction`'s own comment says detaching is possible.
  "Detach" in the menu opens the same dialog preselected on "No employer".

### Memberships

- Row actions become `MembershipRowActions`: Details, Edit, separator, Renew,
  Pause / Resume, Cancel (destructive). Unavailable items stay visible and
  disabled with a reason: "Already cancelled", "Ended memberships cannot be
  cancelled", "Only an active membership can be paused", "Only a paused
  membership can be resumed".
- `useMembershipMutations(membership)` wraps cancel, renew, pause, resume and
  ships the `canX` flags and hints. **Renew is confirmed** everywhere — today it
  is confirmed on the company page and not on the list.
- Four small dialogs on the shared contract: `CancelMembershipAlert`,
  `RenewMembershipAlert`, `PauseMembershipDialog` (asks for `startsAt`,
  optional `endsAt`, optional `reason` — the `CreateMembershipPauseDto`),
  `ResumeMembershipAlert` (optional `endsAt`).
- **`MembershipDetailsDialog`**: name + status badge + "Member · plan name" or
  "Company · plan name"; hero: the snapshot price (`formatPriceHt`) and billing
  cycle (`billingCycleLabel`); Term (starts, ends or open-ended, cancelled at);
  Customer (lazy `getMember` or `getCompany`, with a link to the company
  page); Plan snapshot table (from `membership-snapshot.ts`, moved out of the
  edit form: name, price HT, deposit, setup fee, extras, benefits via
  `benefitLabel`); Pauses (lazy `getListMembershipPauses`); notes; created /
  updated + `CopyId`. Footer: Edit, Renew, Pause/Resume, Cancel.
- `add-membership-form.tsx` becomes `membership-form-dialog.tsx`. Create keeps
  its fields and adds `setupFee`; the snapshot block moves to the details
  dialog, so edit is what the API allows — name and notes — with a one-line
  pointer "Terms live in the plan snapshot; see Details". The form's
  member-XOR-company rule stays: the DTO allows both, but the list, the columns
  and the company page all assume one, so allowing both here would be a
  half-feature.
- `lifecycle-buttons.tsx` is deleted.

### Company detail: plans tab

- `plans-columns.tsx` uses `membership-status.ts`; row actions become
  `MembershipRowActions` reusing the memberships module's hook and dialogs.
  `membership-action-buttons.tsx` is deleted, as are the duplicate
  `cancelMembershipAction` / `renewMembershipAction` in `[id]/actions.ts`,
  replaced by thin wrappers that call the memberships module's actions and
  then revalidate the company page.
- The plans tab's data loading (the 10-page scan) is **not** changed. It exists
  because a company's roster includes memberships held by its members, which
  `companyId=` alone cannot select. That needs a backend filter.

## Error handling

Every action returns `problem(error, fallback)` on catch, so `problemType`
reaches the UI. Each form dialog's and hook's `messageFor` maps the types its
endpoint raises (read from `hscowork-backend-platform`'s `*.doc.ts` files);
anything unmapped falls through to `state.error`. Neither members nor
companies raise a uniqueness problem, so there is nothing to map for
"already exists".

| Type | Copy |
|---|---|
| `member_company_role_requires_company` | "Billing and contact roles need an employer. Pick a company first." |
| `company_not_found` | "That company no longer exists." |
| `customer_xor_violation` | "Pick a member or a company, not both." |
| `plan_archived` | "That plan is archived and cannot be sold." |
| `membership_before_company_start` | "The membership cannot start before the company does." |
| `membership_end_before_start` | "The end date is before the start date." |
| `extra_not_on_plan` | "One of the extras is not offered on this plan." |
| `membership_already_cancelled` | "This membership is already cancelled." |
| `membership_not_recurring` | "Only a recurring membership can be renewed." |
| `membership_end_reached` | "This membership has reached its end date and cannot be renewed." |
| `membership_cancelled` | "A cancelled membership cannot be renewed." |
| `membership_not_pausable` | "Only an active membership can be paused." |
| `pause_outside_membership` | "The pause must fall inside the membership's term." |
| `pause_end_before_start` | "The pause ends before it starts." |
| `pause_overlap` | "That pause overlaps an existing one." |
| `membership_not_paused` | "Only a paused membership can be resumed." |

## Files

**Shared** — new `lib/action-state.ts`; delete `members/table-skeleton.tsx`,
`companies/table-skeleton.tsx`.

**Members** — modify `page.tsx`, `table-section.tsx`, `section-cards.tsx`,
`member-table.tsx`, `columns.tsx`, `actions.ts`; new `stats.ts`,
`member-row-actions.tsx`, `member-details-dialog.tsx`,
`use-member-mutations.ts`; rename `add-member-form.tsx` →
`member-form-dialog.tsx`, `status-button.tsx` → `status-dialog.tsx`;
`add-member-button.tsx` follows the rename.

**Companies** — modify `page.tsx`, `table-section.tsx`, `section-cards.tsx`,
`company-table.tsx`, `columns.tsx`, `actions.ts`; new `stats.ts`,
`company-status.ts`, `company-row-actions.tsx`; rename `add-company-form.tsx`
→ `company-form-dialog.tsx`. Under `[id]/`: modify `page.tsx`,
`overview-tab.tsx`, `members-columns.tsx`, `company-members-table.tsx`,
`plans-columns.tsx`, `company-plans-table.tsx`, `actions.ts`; new
`edit-company-button.tsx`, `company-member-row-actions.tsx`; rename
`reassign-member-button.tsx` → `reassign-member-dialog.tsx`; delete
`membership-action-buttons.tsx`.

**Memberships** — modify `page.tsx`, `table-section.tsx`, `section-cards.tsx`,
`membership-table.tsx`, `columns.tsx`, `actions.ts`; new `stats.ts`,
`membership-row-actions.tsx`, `membership-details-dialog.tsx`,
`use-membership-mutations.ts`, `cancel-membership-alert.tsx`,
`renew-membership-alert.tsx`, `pause-membership-dialog.tsx`,
`resume-membership-alert.tsx`; rename `add-membership-form.tsx` →
`membership-form-dialog.tsx`; delete `lifecycle-buttons.tsx`.

## Testing

The frontend has no test runner. Verification per task is `npx tsc --noEmit`
and `npm run lint`, plus a manual pass named in each task. The end-to-end
manual pass: on each list page open a row's menu, open Details, hand off to
Edit from the details footer and confirm the details dialog closed first,
save an edit and see the row change without a reload, search and confirm the
URL carries `name=` and results come from the server, page past 10 and change
a tab and confirm pagination resets; on members, pin a status from the menu
and from the details dialog; on memberships, cancel an active membership and
confirm the Cancel item greys with "Already cancelled", renew from the menu
and be asked first, pause and resume; on a company page, edit from the
header, reassign a member, detach one, cancel a plan from the plans tab and
watch the roster refresh.

## Not in scope

- **Backend changes.** Embedded summaries on `MemberDto` / `MembershipDto`
  (the way `BookingDto` carries `member`, `company`, `resource`), a stats
  endpoint per domain, a `status` filter on members, and a roster filter for
  the plans tab would each remove a workaround here. They are the natural
  follow-up spec, in `hscowork-backend-platform`.
- **The 100-row lookup caps** in `memberships/table-section.tsx` and
  `members/table-section.tsx` (names for rows past the first hundred
  members/companies). Same class of bug booking parity fixed with embedded
  DTOs; the details dialogs sidestep it by fetching by id.
- **Delete** for any of the three. The API has no delete endpoint.
- **Member + company on one membership.** The DTO allows it; the UI does not.
- **Converging bookings' and opportunities' `ActionState`** onto
  `lib/action-state.ts`.
