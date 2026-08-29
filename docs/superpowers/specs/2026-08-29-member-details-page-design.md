# Member details page — design

**Date:** 2026-08-29 · **App:** `hyperspace-platform` (staff admin) · **Backend changes:** none

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

## API surface used (all existing)

| Domain | Endpoint | Filter |
|---|---|---|
| Member | `GET /members/{id}` | — |
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

Each card is its own async server component wrapped in `Suspense` with a card
skeleton, so the five calls run in parallel and one slow call does not block
the rest. A failed call renders the card with an inline "Couldn't load" line
and logs a `console.warn`, matching the company page's tolerance.

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
