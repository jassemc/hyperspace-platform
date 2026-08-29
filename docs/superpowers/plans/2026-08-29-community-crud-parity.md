# Community CRUD Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the members, companies and memberships pages (and the company detail page beneath them) onto the pattern the bookings and opportunities pages share: "⋯" row menus, details dialogs, one create/edit form dialog per domain, a mutations hook per domain with capability flags and hints, confirmed destructive actions, `problemType`-aware error copy, shared search-param and stat-card helpers, and no duplicated helpers or server actions.

**Architecture:** Frontend only, in `hyperspace-platform`. A shared `lib/action-state.ts` first, so every task after it returns the same `ActionState`. Then each module in turn — members, companies, memberships — each split into "table + menu + hook", "details dialog", "form dialog" tasks so a reviewer can accept one without the next. The company detail page's two tabs come last because they *consume* the members' and memberships' dialogs and hooks. Every task compiles and is manually checkable on its own.

**Tech Stack:** Next.js 15 App Router + React 19 (server actions, `useActionState`, `useFormStatus`), TypeScript, Tailwind, shadcn/Radix (`Dialog`, `AlertDialog`, `DropdownMenu`), TanStack table via `components/data-table.tsx`, `sonner` toasts. No form library, no react-query, no test runner.

**Spec:** `docs/superpowers/specs/2026-08-29-community-crud-parity-design.md`

## Global Constraints

- **One repo:** every task runs in `/Users/mohamedali.may/Workspace/Personal/hs/hyperspace-platform`. Do not touch `hscowork-backend-platform`.
- **No test runner.** Verification for every task is `npx tsc --noEmit` and `npm run lint`, both clean, plus the manual check the task names. Do not add a test framework.
- **Read `node_modules/next/dist/docs/`** before writing App Router code that you are unsure of — this Next version has breaking changes (see `AGENTS.md`).
- **Copy the reference, don't reinvent it.** When a task says "as in `booking-row-actions.tsx`", open that file and match its structure, class names and comments. The plan quotes the load-bearing parts; the reference is authoritative for the rest.
- **`DropdownMenu modal={false}`** on every row menu. A modal menu that hands off to a dialog races on the body's pointer-events lock.
- **Unavailable actions stay visible**, `disabled`, with a `title` that says *why*. Never `return null` an action.
- **Toast-once guard is state identity** (`if (state === lastStateRef.current) return`), never a boolean flag.
- **Every catch in a server action returns `problem(error, fallback)`** from `lib/action-state.ts`. No `error instanceof Error ? error.message : …`.
- **Do not touch:** `plans-tab.tsx`'s data loading (the 10-page scan), the 100-row lookup caps in `members/table-section.tsx` and `memberships/table-section.tsx`, the bookings and opportunities modules, and `lib/service/` (generated).
- **Copy rules:** menu items are verbs (Details, Edit, Set status, Renew, Pause, Resume, Cancel, Reassign, Detach). Alert titles are questions ("Cancel this membership?"). Alert cancel buttons read "Keep it" for destructive actions and "Cancel" otherwise. Pending labels are the verb + "…" ("Cancelling...").
- **The tree has unrelated uncommitted work** under `app/booking/bookings/`, `app/community/opportunities/`, `components/booking/` and `components/extra-tag-picker.tsx` (the booking edit-extras feature). Never `git add -A` at the repo root; stage only the paths each task names, and leave those files alone.
- **Commit after each task** on a feature branch off `staging` (the repo's integration branch, see `git log`), message style `type(scope): what it does` e.g. `refactor(community): move member row actions into a "⋯" dropdown`.

---

## File map

**Shared**
- Create `lib/action-state.ts` — `ActionState`, `problem`, `text`, `clearableText`, `num`, `tags`.
- Delete `app/community/members/table-skeleton.tsx`, `app/community/companies/table-skeleton.tsx`.

**`app/community/members/`**
- Modify `page.tsx`, `table-section.tsx`, `section-cards.tsx`, `member-table.tsx`, `columns.tsx`, `actions.ts`, `add-member-button.tsx`.
- Create `stats.ts`, `use-member-mutations.ts`, `member-row-actions.tsx`, `member-details-dialog.tsx`, `status-dialog.tsx` (replaces `status-button.tsx`), `member-form-dialog.tsx` (replaces `add-member-form.tsx`).

**`app/community/companies/`**
- Modify `page.tsx`, `table-section.tsx`, `section-cards.tsx`, `company-table.tsx`, `columns.tsx`, `actions.ts`, `add-company-button.tsx`.
- Create `stats.ts`, `company-status.ts`, `company-row-actions.tsx`, `company-form-dialog.tsx` (replaces `add-company-form.tsx`).
- Under `[id]/`: modify `page.tsx`, `overview-tab.tsx`, `members-tab.tsx`, `members-columns.tsx`, `company-members-table.tsx`, `plans-columns.tsx`, `company-plans-table.tsx`, `actions.ts`; create `edit-company-button.tsx`, `company-member-row-actions.tsx`, `reassign-member-dialog.tsx` (replaces `reassign-member-button.tsx`); delete `membership-action-buttons.tsx`.

**`app/community/memberships/`**
- Modify `page.tsx`, `table-section.tsx`, `section-cards.tsx`, `membership-table.tsx`, `columns.tsx`, `actions.ts`, `add-membership-button.tsx`.
- Create `stats.ts`, `use-membership-mutations.ts`, `membership-row-actions.tsx`, `membership-details-dialog.tsx`, `cancel-membership-alert.tsx`, `renew-membership-alert.tsx`, `pause-membership-dialog.tsx`, `resume-membership-alert.tsx`, `membership-form-dialog.tsx` (replaces `add-membership-form.tsx`); delete `lifecycle-buttons.tsx`.

---

### Task 1: Shared `ActionState` and the four `actions.ts` files

**Files:**
- Create: `lib/action-state.ts`
- Modify: `app/community/members/actions.ts`, `app/community/companies/actions.ts`, `app/community/memberships/actions.ts`, `app/community/companies/[id]/actions.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: from `@/lib/action-state` — `ActionState`, `problem(error, fallback): ActionState`, `text(formData, field): string | undefined`, `clearableText(formData, field): string | undefined`, `num(formData, field): number | undefined`, `tags(formData, field = "tags"): string[] | undefined`. Every community action keeps its current name and `(prevState: ActionState, formData: FormData) => Promise<ActionState>` signature. `companies/[id]/actions.ts` loses `cancelMembershipAction`/`renewMembershipAction` and gains `cancelCompanyMembershipAction`/`renewCompanyMembershipAction` (thin wrappers, see step 5). `memberships/actions.ts` gains `pauseMembershipAction` and `resumeMembershipAction`.

- [ ] **Step 1: Create `lib/action-state.ts`**

```ts
/**
 * The state every community server action returns, and the readers they
 * parse FormData with. Bookings and opportunities keep their own copies for
 * now; this file is the one the community modules share.
 */
export type ActionState = {
    success?: boolean
    error?: string
    /** RFC 9457 `type`, e.g. "membership_already_cancelled" — so the UI can react, not just report. */
    problemType?: string
    status?: number
}

/**
 * The generated client throws HttpError, whose `.message` is
 * `Status Code ${status}: ${detail}` and whose `.error` keeps the full
 * RFC 9457 payload. Reading only `.message` made every failure look like
 * a validation failure; `problemType` is what lets a form say what to do next.
 */
export function problem(error: unknown, fallback: string): ActionState {
    const http = error as { message?: string; status?: number; error?: { type?: string } }
    return {
        success: false,
        error: http?.message || fallback,
        problemType: http?.error?.type,
        status: http?.status,
    }
}

/** Trimmed string, or undefined when absent or blank. */
export function text(formData: FormData, field: string): string | undefined {
    const value = formData.get(field)
    return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/**
 * Like `text`, but an emptied field stays "" instead of vanishing. PATCH
 * endpoints assign on `!== undefined`, so `undefined` means "leave it alone",
 * which made clearing a note a silent no-op.
 */
export function clearableText(formData: FormData, field: string): string | undefined {
    const value = formData.get(field)
    return typeof value === "string" ? value.trim() : undefined
}

export function num(formData: FormData, field: string): number | undefined {
    const raw = text(formData, field)
    if (raw === undefined) return undefined
    const value = Number(raw)
    return Number.isFinite(value) ? value : undefined
}

/** A comma-separated field into a list; undefined when the field is blank. */
export function tags(formData: FormData, field = "tags"): string[] | undefined {
    const raw = text(formData, field)
    if (!raw) return undefined
    return raw.split(",").map((tag) => tag.trim()).filter(Boolean)
}
```

- [ ] **Step 2: Rewrite `app/community/members/actions.ts` on the shared helpers**

Delete the local `ActionState`, `emptyToUndefined`, `tags`. Import `{ type ActionState, problem, text, clearableText, tags } from "@/lib/action-state"` and `export type { ActionState }` so existing imports of `./actions`' `ActionState` keep working. Then:

- `parseMemberPayload` reads `text(formData, "fullName")` (still throws `Error("Full name is required")` when absent) and `clearableText` for `email`, `phone`, `notes` so clearing them on edit actually clears.
- Move the "billing/contact role needs an employer" guard out of `createMemberAction` into a helper used by both create and update:

```ts
/** Both roles are company-scoped; the API refuses them without an employer. */
function roleWithoutCompany(payload: UpdateMemberDto, companyId: string | undefined): ActionState | null {
    if ((payload.isBillingPerson || payload.isContactPerson) && !companyId) {
        return { success: false, error: "Billing and contact roles need an employer. Pick a company first." }
    }
    return null
}
```

In `updateMemberAction` call it with the submitted `companyId` (the new employer, which is what the roles will be checked against server-side).

- Every `catch (error)` becomes `return problem(error, "Failed to create member")` / `"Failed to update member"` / `"Failed to update status"`.
- Add `function revalidate() { revalidatePath("/community/members") }` and use it in all three actions.

- [ ] **Step 3: Rewrite `app/community/companies/actions.ts` the same way**

Delete local `ActionState`, `emptyToUndefined`, `parseTags`. `parseCompanyPayload` reads `text` for `name` (throws when absent), `clearableText` for `taxId`, `email`, `phone`, `website`, `description`, `billingName`, `registrationNumber`, and adds the three fields the form will now carry:

```ts
    billingName: clearableText(formData, "billingName"),
    registrationNumber: clearableText(formData, "registrationNumber"),
    // A blank date clears it; the DTO takes `null` for that, not "".
    startDate: clearableText(formData, "startDate") || null,
```

`startDate` is only valid on `UpdateCompanyDto`; on create, omit it when blank (`text(formData, "startDate")`). `parseAddress` stays. Both catches become `problem(...)`. `updateCompanyAction` revalidates both the list and the detail page:

```ts
function revalidate(id?: string) {
    revalidatePath("/community/companies")
    if (id) revalidatePath(`/community/companies/${id}`)
}
```

- [ ] **Step 4: Rewrite `app/community/memberships/actions.ts` and add pause/resume**

Delete the local `ActionState`, `text`, `num`; import from `@/lib/action-state` and re-export the type. `updateMembershipAction` uses `clearableText` for `notes` (name stays `text`; a blank name is "leave it"). All catches → `problem(...)`. Add:

```ts
import { pauseMembership, resumeMembership } from "@/lib/service"
import type { CreateMembershipPauseDto, ResumeMembershipDto } from "@/lib/service/HsService"

export async function pauseMembershipAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    const startsAt = text(formData, "startsAt")
    if (!id) return { success: false, error: "Membership ID is required" }
    if (!startsAt) return { success: false, error: "A pause needs a start date" }

    const data: CreateMembershipPauseDto = {
      startsAt,
      endsAt: text(formData, "endsAt"),
      reason: text(formData, "reason"),
    }
    await pauseMembership(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to pause membership")
  }
}

export async function resumeMembershipAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Membership ID is required" }

    const data: ResumeMembershipDto = { endsAt: text(formData, "endsAt") }
    await resumeMembership(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to resume membership")
  }
}
```

- [ ] **Step 5: Rewrite `app/community/companies/[id]/actions.ts`**

Delete the local `ActionState`, `emptyToUndefined`; import from `@/lib/action-state`. Replace the duplicate `cancelMembershipAction` / `renewMembershipAction` with wrappers over the memberships module's, so one implementation exists:

```ts
import {
  cancelMembershipAction as cancelMembership,
  renewMembershipAction as renewMembership,
  pauseMembershipAction as pauseMembership,
  resumeMembershipAction as resumeMembership,
} from "@/app/community/memberships/actions"

/**
 * The memberships module owns the lifecycle; these only add the company page
 * to what gets revalidated, since the plans tab is what the user is looking at.
 */
async function onCompanyPage(
  run: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  formData: FormData
): Promise<ActionState> {
  const result = await run({}, formData)
  const companyId = text(formData, "companyId")
  if (result.success && companyId) revalidateCompany(companyId)
  return result
}

export async function cancelCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(cancelMembership, formData) }
export async function renewCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(renewMembership, formData) }
export async function pauseCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(pauseMembership, formData) }
export async function resumeCompanyMembershipAction(prev: ActionState, formData: FormData) { return onCompanyPage(resumeMembership, formData) }
```

`reassignMemberAction` now allows detaching: drop the `if (!targetCompanyId) return { error: "Select a company" }` guard, read `const detach = formData.get("detach") === "on"`, and call `updateMemberCompany(memberId, { companyId: detach ? null : targetCompanyId ?? null })`; keep the same-company refusal; when `!detach && !targetCompanyId` return `{ success: false, error: "Select a company or choose to detach" }`. Every catch → `problem(...)`. Update the doc comment: "accepts null to detach a member into a solo membership" is now true of the action, not just the endpoint.

Temporarily keep `membership-action-buttons.tsx` compiling by pointing its imports at `cancelCompanyMembershipAction` / `renewCompanyMembershipAction` — it is deleted in Task 12.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean. Manual: edit a member and clear their phone; reload; the phone is gone. Edit a company from the list while its detail page is open in another tab; refresh the detail tab; the change shows.

- [ ] **Step 7: Commit**

```bash
git add lib/action-state.ts app/community/members/actions.ts app/community/companies/actions.ts app/community/memberships/actions.ts "app/community/companies/[id]/actions.ts" "app/community/companies/[id]/membership-action-buttons.tsx"
git commit -m "refactor(community): one ActionState, problemType on every action, pause/resume actions"
```

---

### Task 2: Shared search params, skeletons, server search and honest stat cards

**Files:**
- Modify: `app/community/members/page.tsx`, `members/table-section.tsx`, `members/section-cards.tsx`, `members/member-table.tsx`, `members/loading.tsx`
- Modify: `app/community/companies/page.tsx`, `companies/table-section.tsx`, `companies/section-cards.tsx`, `companies/company-table.tsx`, `companies/loading.tsx`, `companies/[id]/page.tsx`, `companies/[id]/members-tab.tsx`
- Modify: `app/community/memberships/page.tsx`, `memberships/section-cards.tsx`, `memberships/membership-table.tsx`
- Create: `members/stats.ts`, `companies/stats.ts`, `memberships/stats.ts`
- Delete: `members/table-skeleton.tsx`, `companies/table-skeleton.tsx`

**Interfaces:**
- Consumes: `lib/search-params` (`resolveSearchParams`, `pageQuery`, `firstParam`, `asEnum`, `pageResult`, `SearchParamsInput`), `components/table-skeleton` (`TableSkeleton`), `components/stat-cards` (`StatCards`).
- Produces: `memberStats(): Promise<MemberStats | null>` with `MemberStats = { total: number; leads: number; visitors: number; members: number }`; `companyStats(): Promise<CompanyStats | null>` with `{ companies: number; members: number; activeMemberships: number; pendingMemberships: number }`; `membershipStats(): Promise<MembershipStats | null>` with `{ total: number; active: number; pending: number; ended: number }`. All three are `cache()`-wrapped and take no arguments (the cards are deliberately unfiltered, as on opportunities).

- [ ] **Step 1: `members/stats.ts`**

```ts
import { cache } from "react"
import { getListMembers } from "@/lib/service"
import type { MemberKindHint } from "@/lib/service/HsService"
import { pageResult } from "@/lib/search-params"

export interface MemberStats {
    total: number
    leads: number
    visitors: number
    members: number
}

/** One `limit: 1` request per figure; `meta.totalItems` is the count. */
async function countMembers(kindHint?: MemberKindHint): Promise<number> {
    return pageResult(await getListMembers({ limit: 1, offset: 0, sort: "ASC", kindHint })).total
}

/**
 * `cache()` keys primitives by value and objects by reference, so this takes
 * no options object — the same call from the cards and any future caller
 * shares one set of requests per render.
 */
export const memberStats = cache(async (): Promise<MemberStats | null> => {
    try {
        const [total, leads, visitors, members] = await Promise.all([
            countMembers(),
            countMembers("lead"),
            countMembers("visitor"),
            countMembers("member"),
        ])
        return { total, leads, visitors, members }
    } catch (error) {
        console.warn("Failed to load member stats", error)
        return null
    }
})
```

- [ ] **Step 2: `companies/stats.ts` and `memberships/stats.ts`**

Same shape. Companies:

```ts
export const companyStats = cache(async (): Promise<CompanyStats | null> => {
    try {
        const [companies, members, activeMemberships, pendingMemberships] = await Promise.all([
            pageResult(await getListCompanies({ limit: 1, offset: 0, sort: "ASC" })).total,
            pageResult(await getListMembers({ limit: 1, offset: 0, sort: "ASC" })).total,
            pageResult(await getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "active" })).total,
            pageResult(await getListMemberships({ limit: 1, offset: 0, sort: "ASC", status: "pending" })).total,
        ])
        return { companies, members, activeMemberships, pendingMemberships }
    } catch (error) { console.warn("Failed to load company stats", error); return null }
})
```

(Write the four `await`s as four promises passed to `Promise.all`, not awaited inline — the snippet compresses.) Memberships: `total` unfiltered, then `status: "active" | "pending" | "ended"`.

- [ ] **Step 3: Rewrite the three `section-cards.tsx` on `StatCards`**

Members (companies and memberships follow the same shape with their own icons and footers):

```tsx
import { StatCards } from "@/components/stat-cards"
import { UsersIcon, UserPlusIcon, FootprintsIcon, UserCheckIcon } from "lucide-react"
import { memberStats } from "./stats"

export async function SectionCards() {
  const stats = await memberStats()
  const figure = (value: number | undefined) => (value === undefined ? "–" : value)

  return (
    <StatCards
      cards={[
        { label: "Total members", value: figure(stats?.total), badge: "All", icon: UsersIcon, footer: "People in your community directory" },
        { label: "Leads", value: figure(stats?.leads), badge: "Pipeline", icon: UserPlusIcon, footer: "Flagged as leads" },
        { label: "Visitors", value: figure(stats?.visitors), badge: "Drop-in", icon: FootprintsIcon, footer: "Flagged as visitors" },
        { label: "Members", value: figure(stats?.members), badge: "Community", icon: UserCheckIcon, footer: "Flagged as members" },
      ]}
    />
  )
}
```

Companies' four: "Companies" / "Members" / "Active memberships" / "Pending memberships" with footer "Across the whole community" on the last three. Memberships' four keep their current labels. A `null` stats result renders "–", never 0 — an unknown is not a zero.

- [ ] **Step 4: Adopt `lib/search-params` and the shared skeleton**

- `members/table-section.tsx`: replace the local `firstParam`, `asKindHint`, `MembersPage` and paging math with

```ts
const params = await resolveSearchParams(searchParams)
const { limit, offset, q } = pageQuery(params)
// The shared table writes its tab selection to `status`; for members that
// selection is a kindHint, the only lifecycle filter the endpoint accepts.
const kindHint = asEnum<MemberKindHint>(firstParam(params.status), MEMBER_KIND_HINT_VALUES)
```

with `MEMBER_KIND_HINT_VALUES: MemberKindHint[] = ["lead", "visitor", "member"]` exported from `member-status.ts` alongside `MEMBER_KIND_TABS` (move the tabs there from `member-table.tsx`). Use `pageResult<MemberDto>`.
- `companies/table-section.tsx` and `companies/[id]/members-tab.tsx`: same replacement (no tabs).
- `companies/[id]/page.tsx`: import `TableSkeleton` from `@/components/table-skeleton`, use `firstParam` from `lib/search-params`.
- All three `page.tsx` and `loading.tsx`: import `TableSkeleton` from `@/components/table-skeleton`; memberships' `page.tsx` wraps `SectionCards` in the same 4-card `Suspense` fallback the other two use.
- Delete `members/table-skeleton.tsx` and `companies/table-skeleton.tsx`.

- [ ] **Step 5: Turn on server search**

In `member-table.tsx`, `company-table.tsx`, `membership-table.tsx` add `serverSearch` and a `searchPlaceholder` ("Search members...", "Search companies...", "Search memberships...") to `<DataTable>`. The sections already pass `q`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: each list page shows four cards with numbers that match the table's "All" count; typing in search updates the URL's `name=` after a pause and the results come back from the server (the network tab shows a navigation, and a member on page 3 is found from page 1).

- [ ] **Step 7: Commit**

```bash
git add -A app/community/members app/community/companies app/community/memberships
git commit -m "refactor(community): shared search params, skeleton and stat cards; server search on all three lists"
```

---

### Task 3: Members — mutations hook, status dialog, "⋯" row menu, table-owned dialogs

**Files:**
- Create: `app/community/members/use-member-mutations.ts`, `members/status-dialog.tsx`, `members/member-row-actions.tsx`
- Modify: `members/columns.tsx`, `members/member-table.tsx`
- Delete: `members/status-button.tsx`

**Interfaces:**
- Consumes: `updateMemberStatusAction` from `./actions`; `MEMBER_STATUS_OVERRIDE_OPTIONS` from `./member-status`.
- Produces:
  - `useMemberMutations(member: MemberDto): { label: string; pending: "status" | null; setStatus(choice: MemberStatusUpdate): Promise<boolean> }`
  - `StatusDialog({ open, onOpenChange, member, pending, onApply(choice) })`
  - `MemberRowActions({ member, onDetails, onEdit })` — owns its `StatusDialog` and calls the hook itself, as `booking-row-actions.tsx` does.
  - `createColumns({ onDetails, onEdit, companyNames })`
  - `MemberTable` owns `detailsMember` and `editingMember` state. (Details dialog is wired in Task 4; this task leaves `onDetails` setting state and renders nothing for it yet.)

- [ ] **Step 1: `use-member-mutations.ts`**

```ts
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { MemberDto, MemberStatusUpdate } from "@/lib/service/HsService"
import type { ActionState } from "@/lib/action-state"
import { updateMemberStatusAction } from "./actions"

export type MemberMutationKind = "status"

function messageFor(result: ActionState, fallback: string): string {
  if (result.problemType === "member_not_found") return "This member no longer exists."
  return result.error ?? fallback
}

/**
 * The one non-form mutation a member has, shared by the row menu and the
 * details dialog so the two cannot drift. Returns whether it succeeded so the
 * caller can close what it had open.
 */
export function useMemberMutations(member: MemberDto) {
  const router = useRouter()
  const [pending, setPending] = useState<MemberMutationKind | null>(null)
  const label = member.fullName || "This member"

  const setStatus = async (choice: MemberStatusUpdate): Promise<boolean> => {
    setPending("status")
    try {
      const formData = new FormData()
      formData.set("id", member.id)
      formData.set("status", choice)
      const result = await updateMemberStatusAction({}, formData)
      if (result.success) {
        toast.success(`Status updated for ${label}`)
        router.refresh()
        return true
      }
      toast.error(messageFor(result, "Failed to update status"))
      return false
    } finally {
      setPending(null)
    }
  }

  return { label, pending, setStatus }
}
```

- [ ] **Step 2: `status-dialog.tsx` — the controlled version of `status-button.tsx`**

Take the `AlertDialogContent` body of `status-button.tsx` (title, description, the three radio cards from `MEMBER_STATUS_OVERRIDE_OPTIONS`, footer) verbatim, and change the shell:

```tsx
interface StatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberDto
  pending: boolean
  onApply: (choice: MemberStatusUpdate) => void
}

export function StatusDialog({ open, onOpenChange, member, pending, onApply }: Readonly<StatusDialogProps>) {
  // No override means the status is derived; "auto" is how the API says that.
  const [choice, setChoice] = useState<MemberStatusUpdate>(member.statusOverride ?? "auto")
  useEffect(() => { if (open) setChoice(member.statusOverride ?? "auto") }, [open, member.statusOverride])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {/* …header, radios as before, using member.fullName… */}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={() => onApply(choice)} disabled={pending}>
            {pending ? "Saving..." : "Apply"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

No `AlertDialogTrigger`, no `useRouter`, no `toast` — the hook does that. Delete `status-button.tsx`.

- [ ] **Step 3: `member-row-actions.tsx`**

Clone `app/booking/bookings/booking-row-actions.tsx` — the version that owns its own lifecycle dialog, since nothing needs loading before a status dialog opens. Same `DropdownMenu modal={false}`, same trigger (a `Loader2` while `pending !== null`), same header comment. Items: Details (`Eye`), Edit (`Edit`), separator, Set status (`UserCog`). Props `{ member, onDetails, onEdit }`, each callback `(member: MemberDto) => void`. Body:

```tsx
  const { label, pending, setStatus } = useMemberMutations(member)
  const [statusOpen, setStatusOpen] = useState(false)
  …menu…
      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        member={member}
        pending={pending === "status"}
        onApply={async (choice) => { if (await setStatus(choice)) setStatusOpen(false) }}
      />
```

- [ ] **Step 4: `columns.tsx`**

`ColumnsProps` becomes `{ onDetails, onEdit, companyNames? }`. Replace the actions cell with

```tsx
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <MemberRowActions member={row.original} onDetails={onDetails} onEdit={onEdit} />
    ),
  },
```

Remove the `StatusButton` and `Edit`/`Button` imports that are no longer used.

- [ ] **Step 5: `member-table.tsx` owns the details and form dialogs**

```tsx
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [detailsMember, setDetailsMember] = useState<MemberDto | null>(null)

  const handleEdit = (member: MemberDto) => { setEditingMember(member); setIsFormOpen(true) }
  const handleClose = () => { setIsFormOpen(false); setEditingMember(null) }

  // Handing over from the details dialog: it closes first, so the two are
  // never stacked, and only reopens if the caller goes back to it.
  const handOff = (run: (member: MemberDto) => void) => {
    const member = detailsMember
    if (!member) return
    setDetailsMember(null)
    run(member)
  }

  const columns = createColumns({ onDetails: setDetailsMember, onEdit: handleEdit, companyNames })
```

Render, after `<DataTable>`, the form only while open (matching bookings):

```tsx
      {isFormOpen && (
        <AddMemberForm key={editingMember?.id || "create"} isOpen onClose={handleClose} editingMember={editingMember} companyNames={companyNames} />
      )}
```

`handOff` is unused until Task 4 wires the details dialog; keep it, with the comment, so Task 4 only adds JSX.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: every member row shows one "⋯"; Set status opens the radios preselected on the current pin; Apply closes it and the row's badge updates; Edit still opens the drawer (Task 5 replaces it).

- [ ] **Step 7: Commit**

```bash
git add -A app/community/members
git commit -m "refactor(members): \"⋯\" row menu, mutations hook and a controlled status dialog"
```

---

### Task 4: Members — details dialog

**Files:**
- Create: `app/community/members/member-details-dialog.tsx`
- Modify: `members/member-table.tsx`

**Interfaces:**
- Consumes: `getCompany`, `getListMemberships` from `@/lib/service` (both `"use server"` wrappers, callable from a client component); `MEMBERSHIP_STATUS_LABELS/CLASSES` from `../memberships/membership-status`; `useMemberMutations`, `StatusDialog`.
- Produces: `MemberDetailsDialog({ member, open, onOpenChange, onEdit, busy? })`.

- [ ] **Step 1: Write the dialog**

Clone the shell of `app/community/opportunities/opportunity-details-dialog.tsx`: its `Section` and `CopyId` helpers verbatim, `Dialog` + `DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden"`, header, scrolling body, footer. Content:

- **Header:** `DialogTitle` = `member.fullName` next to `<Badge variant="secondary" className={`${MEMBER_STATUS_CLASSES[member.status]} border-0`}>` and, when `member.statusOverride`, a second outline badge "Pinned". `DialogDescription`: `[formatEnumLabel(kindHint), segment && formatEnumLabel(segment)].filter(Boolean).join(" · ")`. Under it, email as `<a href={`mailto:${email}`}>` and phone as plain text, when present.
- **Lazy loads on open** (two, in one effect with one cancellation flag; each `.catch(() => undefined)` so one failing does not blank the other):

```tsx
  const [company, setCompany] = useState<CompanyDto | null>(null)
  const [memberships, setMemberships] = useState<MembershipDto[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCompany(null); setMemberships(null); setLoading(true)
    const companyLoad = member.companyId
      ? getCompany(member.companyId).then((c) => { if (!cancelled) setCompany(c as CompanyDto) }).catch(() => undefined)
      : Promise.resolve()
    const membershipsLoad = getListMemberships({ limit: 20, offset: 0, sort: "DESC", memberId: member.id })
      .then((page) => { if (!cancelled) setMemberships(pageResult<MembershipDto>(page).results) })
      .catch(() => undefined)
    Promise.all([companyLoad, membershipsLoad]).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, member.id, member.companyId])
```

- **Hero** (`rounded-lg border bg-muted/30 p-4`): the count of `memberships` with `status === "active"` as the `text-2xl font-semibold tabular-nums` figure, captioned "active memberships"; a `Skeleton` while loading.
- **Section "Employer":** company name as a `<Link href={`/community/companies/${company.id}`}>`, with "Billing person" / "Contact person" outline badges when `member.isBillingPerson` / `member.isContactPerson`. When `member.companyId` is set but `company` failed to load: "Unknown company". When no `companyId`: `<span className="text-muted-foreground">Solo — no employer</span>`.
- **Section "Memberships":** a list of `memberships` sorted active first (`active`, `pending`, `paused`, `ended`), each row: name, status badge from `MEMBERSHIP_STATUS_*`, `formatDate(startsAt)` → `endsAt ? formatDate(endsAt) : "open-ended"`. Empty: "No memberships yet".
- **Section "Tags"** (only when `member.tags.length`): `Badge variant="outline"` per tag.
- **Section "Notes"** (only when `member.notes`): `whitespace-pre-wrap text-sm`.
- **Footer meta line:** `Created {formatDate(createdAt)} · Updated {formatDate(updatedAt)} · <CopyId id={member.id} />`.
- **`DialogFooter`:** `Set status` (`variant="outline"`, opens the `StatusDialog` mounted inside `DialogContent`, exactly as `booking-details-dialog.tsx` mounts its alerts inside the dialog) and `Edit` (`onClick={onEdit}`, `disabled={busy}`).

The dialog calls `useMemberMutations(member)` itself for the status action; `onApply={async (choice) => { if (await setStatus(choice)) setStatusOpen(false) }}`.

- [ ] **Step 2: Mount it from `member-table.tsx`**

```tsx
      {detailsMember && (
        <MemberDetailsDialog
          key={detailsMember.id}
          member={detailsMember}
          open
          onOpenChange={(next) => { if (!next) setDetailsMember(null) }}
          onEdit={() => handOff(handleEdit)}
        />
      )}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: Details on an employed member shows the company as a link and the roles; on a solo member shows "Solo"; memberships list loads after open (skeleton first); Edit from the footer closes the details dialog *before* the form opens; Set status from the footer updates the header badge after Apply (the page refreshes; because the table re-renders with new data, the dialog's `member` prop is the stale object — acceptable, the badge updates on next open; note this in a comment).

- [ ] **Step 4: Commit**

```bash
git add app/community/members/member-details-dialog.tsx app/community/members/member-table.tsx
git commit -m "feat(members): a details dialog with employer and memberships"
```

---

### Task 5: Members — form dialog

**Files:**
- Create: `app/community/members/member-form-dialog.tsx`
- Modify: `members/member-table.tsx`, `members/add-member-button.tsx`, `members/section-cards.tsx` (no change needed unless imports break)
- Delete: `members/add-member-form.tsx`

**Interfaces:**
- Consumes: `createMemberAction`, `updateMemberAction`, `ActionState` from `./actions`.
- Produces: `MemberFormDialog({ isOpen, onClose, editingMember?, companyNames? })` — same props as `AddMemberForm` had, so both call sites change only the import and name.

- [ ] **Step 1: Write `member-form-dialog.tsx`**

Start from `add-member-form.tsx` and change four things; keep every field, name, `defaultValue`, the `previousCompanyId` hidden input, the conditional role checkboxes and the edit-mode status note.

1. **Shell** — replace the `Drawer` with the bookings dialog shell (`booking-form-dialog.tsx` lines ~319–345 and ~575–598):

```tsx
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editingMember ? "Edit Member" : "Add New Member"}</DialogTitle>
          <DialogDescription>{editingMember ? "Update their details or employer." : "Add someone to the community directory."}</DialogDescription>
        </DialogHeader>
        <form key={editingMember?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
          {/* Only this body scrolls; the header above and the footer below stay pinned. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-1 pr-2">
            …fields, laid out in a `grid gap-4 sm:grid-cols-2` where a pair fits (name/email, phone/kind, employer/segment); tags and notes span both (`sm:col-span-2`)…
            {currentState.error && <div className="text-sm text-red-600">{messageFor(currentState, "The member could not be saved.")}</div>}
          </div>
          <DialogFooter className="mt-4 shrink-0 border-t pt-4">
            <div className="flex w-full gap-3">
              <SubmitButton editingMember={editingMember} />
              <DialogClose asChild><Button type="button" variant="outline" className="flex-1">Cancel</Button></DialogClose>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
```

2. **`messageFor`** above the component:

```ts
function messageFor(state: ActionState, fallback: string): string {
  if (state.problemType === "member_company_role_requires_company") {
    return "Billing and contact roles need an employer. Pick a company first."
  }
  if (state.problemType === "company_not_found") return "That company no longer exists."
  return state.error ?? fallback
}
```

3. **Toast guard** — replace both `notifiedRef` booleans and the reset effect with the identity guard from `booking-form-dialog.tsx` (~158–202), one effect per state:

```tsx
  const lastCreateStateRef = useRef<ActionState | null>(null)
  useEffect(() => {
    if (createState === lastCreateStateRef.current) return
    lastCreateStateRef.current = createState
    if (createState.success) { toast.success("Member created"); onClose() }
    else if (createState.error) toast.error(messageFor(createState, "Failed to create member"))
  }, [createState, onClose])
```

and the same for update with "Member updated" / "Failed to update member".

4. **Reset on open** — keep the existing `useEffect(() => { if (isOpen) setCompanyId(editingMember?.companyId ?? "") }, [isOpen, editingMember])`.

- [ ] **Step 2: Rename the call sites**

`member-table.tsx` and `add-member-button.tsx`: import `MemberFormDialog` from `./member-form-dialog` in place of `AddMemberForm`. Delete `add-member-form.tsx`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: Add Member opens a centred dialog; create with only a name; create with the billing role and no employer → the mapped copy appears in the toast and inline; edit and change the employer → the company column updates; submit the same failing form twice → two toasts.

- [ ] **Step 4: Commit**

```bash
git add -A app/community/members
git commit -m "refactor(members): create/edit in a dialog with problemType-aware copy"
```

---

### Task 6: Companies — status column, row menu, form dialog, detail-page Edit

**Files:**
- Create: `app/community/companies/company-status.ts`, `companies/company-row-actions.tsx`, `companies/company-form-dialog.tsx`, `companies/[id]/edit-company-button.tsx`
- Modify: `companies/columns.tsx`, `companies/company-table.tsx`, `companies/add-company-button.tsx`, `companies/[id]/page.tsx`, `companies/[id]/overview-tab.tsx`
- Delete: `companies/add-company-form.tsx`

**Interfaces:**
- Consumes: `createCompanyAction`, `updateCompanyAction` (Task 1, now accepting `billingName`, `registrationNumber`, `startDate`).
- Produces: `COMPANY_STATUS_LABELS`, `COMPANY_STATUS_CLASSES`, `COMPANY_STATUS_VALUES`, `COMPANY_STATUS_TABS`; `CompanyRowActions({ company, onEdit })`; `CompanyFormDialog({ isOpen, onClose, editingCompany? })`; `EditCompanyButton({ company })`.

- [ ] **Step 1: `company-status.ts`**

Same four exports as `member-status.ts`, over `CompanyStatus = "lead" | "drop-in" | "pending" | "active" | "former" | "inactive"`. Reuse the member colours for the five shared values; `inactive` gets the gray pair (`bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`). Doc comment: "Derived on read from the company's memberships; display-only, the list has no status filter."

- [ ] **Step 2: `company-row-actions.tsx`**

Clone `opportunity-row-actions.tsx`. Items: Details (`Eye`, rendered as `<DropdownMenuItem asChild><Link href={`/community/companies/${company.id}`}>` — the route *is* the details view), Edit (`Edit`). No separator, no lifecycle items, no `loading`. Header comment: "The company page is the details view, so Details navigates instead of opening a dialog."

- [ ] **Step 3: `columns.tsx`**

Add a **Status** column after `name`:

```tsx
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<CompanyStatus>("status")
      return (
        <Badge variant="secondary" className={`${COMPANY_STATUS_CLASSES[value] ?? ""} border-0`}>
          {COMPANY_STATUS_LABELS[value] ?? value}
        </Badge>
      )
    },
  },
```

Replace the `createdAt` cell's hand-rolled `toLocaleDateString` with `formatDate`. Replace the actions cell with `<CompanyRowActions company={row.original} onEdit={onEdit} />`.

- [ ] **Step 4: `company-form-dialog.tsx`**

Same four changes as Task 5 step 1, applied to `add-company-form.tsx`. Two-column grid: name/taxId, email/phone, website/startDate, billingName/registrationNumber; the address block and description span both. New fields:

```tsx
<div className="grid gap-2">
  <Label htmlFor="startDate">Start date</Label>
  <Input id="startDate" name="startDate" type="date" defaultValue={editingCompany?.startDate?.slice(0, 10) ?? ""} />
  <p className="text-xs text-muted-foreground">Memberships cannot start before this.</p>
</div>
<div className="grid gap-2">
  <Label htmlFor="billingName">Billing name</Label>
  <Input id="billingName" name="billingName" defaultValue={editingCompany?.billingName ?? ""} placeholder="If invoices need a different name" />
</div>
<div className="grid gap-2">
  <Label htmlFor="registrationNumber">Registration number</Label>
  <Input id="registrationNumber" name="registrationNumber" defaultValue={editingCompany?.registrationNumber ?? ""} />
</div>
```

`messageFor` maps only `company_not_found` → "That company no longer exists." Toasts: "Company created" / "Company updated".

- [ ] **Step 5: Table, add button, detail page**

- `company-table.tsx`: `isFormOpen` + `editingCompany`, mount `{isFormOpen && <CompanyFormDialog … />}`. No details state.
- `add-company-button.tsx`: import rename.
- `[id]/edit-company-button.tsx`:

```tsx
"use client"
export function EditCompanyButton({ company }: Readonly<{ company: CompanyDto }>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
      {open && <CompanyFormDialog isOpen onClose={() => setOpen(false)} editingCompany={company} />}
    </>
  )
}
```

- `[id]/page.tsx`: in the header `flex … justify-between` div, render `<EditCompanyButton company={company} />` as the right-hand child, and a status badge (`COMPANY_STATUS_*`) beside the `<h1>`.
- `[id]/overview-tab.tsx`: the Identity card gains rows for Status (badge), Start date (`formatDate` or "-"), Billing name, Registration number.
- Delete `add-company-form.tsx`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: list shows a status badge per company; "⋯ → Details" navigates; Edit on the detail page opens the dialog prefilled, saving updates the header without a reload (Task 1's revalidation); set a start date, clear it, save → the overview shows "-".

- [ ] **Step 7: Commit**

```bash
git add -A app/community/companies
git commit -m "refactor(companies): status column, \"⋯\" row menu, form dialog and an Edit on the detail page"
```

---

### Task 7: Memberships — mutations hook and the four confirmation dialogs

**Files:**
- Create: `app/community/memberships/use-membership-mutations.ts`, `memberships/cancel-membership-alert.tsx`, `memberships/renew-membership-alert.tsx`, `memberships/pause-membership-dialog.tsx`, `memberships/resume-membership-alert.tsx`

**Interfaces:**
- Consumes: `cancelMembershipAction`, `renewMembershipAction`, `pauseMembershipAction`, `resumeMembershipAction` from `./actions`.
- Produces:
  - `useMembershipMutations(membership, actions?)` returning `{ label, pending: MembershipMutationKind | null, canCancel, cancelHint?, canRenew, renewHint?, canPause, pauseHint?, canResume, resumeHint?, cancel(), renew(), pause(fields: PauseFields), resume(fields: ResumeFields) }`, each returning `Promise<boolean>`. `actions` is an optional override `{ cancel, renew, pause, resume }` of the four server actions so the company page can pass its `*CompanyMembershipAction` wrappers (Task 12).
  - `PauseFields = { startsAt: string; endsAt?: string; reason?: string }`, `ResumeFields = { endsAt?: string }`.
  - `CancelMembershipAlert`, `RenewMembershipAlert`, `ResumeMembershipAlert` on the `{ open, onOpenChange, label, pending, onConfirm }` contract; `ResumeMembershipAlert.onConfirm(fields: ResumeFields)`; `PauseMembershipDialog` with `onConfirm(fields: PauseFields)`.

- [ ] **Step 1: The hook**

```ts
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { MembershipDto } from "@/lib/service/HsService"
import type { ActionState } from "@/lib/action-state"
import { cancelMembershipAction, pauseMembershipAction, renewMembershipAction, resumeMembershipAction } from "./actions"

export type MembershipMutationKind = "cancel" | "renew" | "pause" | "resume"
export type PauseFields = { startsAt: string; endsAt?: string; reason?: string }
export type ResumeFields = { endsAt?: string }
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>
export type MembershipActions = { cancel: Action; renew: Action; pause: Action; resume: Action }

const DEFAULT_ACTIONS: MembershipActions = {
  cancel: cancelMembershipAction, renew: renewMembershipAction,
  pause: pauseMembershipAction, resume: resumeMembershipAction,
}

/** Mirrors the API's rules so the menu is disabled with a reason instead of a 409. */
export function cancelBlocker(m: MembershipDto): string | null {
  if (m.cancelledAt) return "Already cancelled"
  if (m.status === "ended") return "Ended memberships cannot be cancelled"
  return null
}
export function renewBlocker(m: MembershipDto): string | null {
  if (m.cancelledAt) return "A cancelled membership cannot be renewed"
  return null
}
export function pauseBlocker(m: MembershipDto): string | null {
  if (m.status !== "active") return "Only an active membership can be paused"
  return null
}
export function resumeBlocker(m: MembershipDto): string | null {
  if (m.status !== "paused") return "Only a paused membership can be resumed"
  return null
}

function messageFor(result: ActionState, fallback: string): string {
  switch (result.problemType) {
    case "membership_already_cancelled": return "This membership is already cancelled."
    case "membership_not_recurring": return "Only a recurring membership can be renewed."
    case "membership_end_reached": return "This membership has reached its end date and cannot be renewed."
    case "membership_cancelled": return "A cancelled membership cannot be renewed."
    case "membership_not_pausable": return "Only an active membership can be paused."
    case "pause_outside_membership": return "The pause must fall inside the membership's term."
    case "pause_end_before_start": return "The pause ends before it starts."
    case "pause_overlap": return "That pause overlaps an existing one."
    case "membership_not_paused": return "Only a paused membership can be resumed."
    default: return result.error ?? fallback
  }
}

export function useMembershipMutations(membership: MembershipDto, actions: MembershipActions = DEFAULT_ACTIONS) {
  const router = useRouter()
  const [pending, setPending] = useState<MembershipMutationKind | null>(null)
  const label = membership.name || "This membership"

  const run = async (kind: MembershipMutationKind, action: Action, done: string, failed: string, fields: Record<string, string> = {}): Promise<boolean> => {
    setPending(kind)
    try {
      const formData = new FormData()
      formData.set("id", membership.id)
      // The company page's wrappers revalidate by this; harmless elsewhere.
      if (membership.companyId) formData.set("companyId", membership.companyId)
      for (const [k, v] of Object.entries(fields)) if (v) formData.set(k, v)
      const result = await action({}, formData)
      if (result.success) { toast.success(`${label} ${done}`); router.refresh(); return true }
      toast.error(messageFor(result, failed))
      return false
    } finally {
      setPending(null)
    }
  }

  const cancelHint = cancelBlocker(membership)
  const renewHint = renewBlocker(membership)
  const pauseHint = pauseBlocker(membership)
  const resumeHint = resumeBlocker(membership)

  return {
    label, pending,
    canCancel: cancelHint === null, cancelHint: cancelHint ?? undefined,
    canRenew: renewHint === null, renewHint: renewHint ?? undefined,
    canPause: pauseHint === null, pauseHint: pauseHint ?? undefined,
    canResume: resumeHint === null, resumeHint: resumeHint ?? undefined,
    cancel: () => run("cancel", actions.cancel, "cancelled", "Failed to cancel membership"),
    renew: () => run("renew", actions.renew, "renewed", "Failed to renew membership"),
    pause: (f: PauseFields) => run("pause", actions.pause, "paused", "Failed to pause membership", { startsAt: f.startsAt, endsAt: f.endsAt ?? "", reason: f.reason ?? "" }),
    resume: (f: ResumeFields) => run("resume", actions.resume, "resumed", "Failed to resume membership", { endsAt: f.endsAt ?? "" }),
  }
}
```

Note the company page's membership on the plans tab may have `companyId` null (held by a member); Task 12's wrapper table sets `companyId` itself — see there.

- [ ] **Step 2: The alerts**

`cancel-membership-alert.tsx` is `cancel-booking-alert.tsx` with the copy from `lifecycle-buttons.tsx`: title "Cancel this membership?", description "{label} will stop renewing. Charges already raised are not affected.", buttons "Keep it" / "Cancel membership" (pending "Cancelling...").

`renew-membership-alert.tsx`: title "Renew this membership?", description "{label} gets another billing cycle appended to its term.", `AlertDialogCancel` "Cancel", `<Button disabled={pending} onClick={onConfirm}>` (default variant, not destructive) "Renew" / "Renewing...".

`resume-membership-alert.tsx`: title "Resume this membership?", description "{label} starts billing again. Leave the date blank to end the pause today.", one `DateField` (from `components/ui/date-field`, `portalled={false}` because it sits in a modal layer) bound to local `endsAt` state, buttons "Cancel" / "Resume". `onConfirm({ endsAt })`.

`pause-membership-dialog.tsx`: a `Dialog` (not an alert — it collects three fields): title "Pause this membership?", description "Billing stops for the pause. Leave the end blank for an open-ended pause.", `DateField` for `startsAt` (required, default today as `YYYY-MM-DD`), `DateField` for `endsAt`, `Input` for `reason`; footer "Cancel" / `<Button disabled={pending || !startsAt} onClick={() => onConfirm({ startsAt, endsAt, reason })}>` "Pause" / "Pausing...". Reset the three fields in an effect on `open`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`. Nothing renders yet; the next task wires it.

- [ ] **Step 4: Commit**

```bash
git add app/community/memberships/use-membership-mutations.ts app/community/memberships/*-alert.tsx app/community/memberships/pause-membership-dialog.tsx
git commit -m "feat(memberships): a mutations hook with capability hints, and confirmations for every lifecycle action"
```

---

### Task 8: Memberships — "⋯" row menu and table-owned dialogs

**Files:**
- Create: `app/community/memberships/membership-row-actions.tsx`
- Modify: `memberships/columns.tsx`, `memberships/membership-table.tsx`
- Delete: `memberships/lifecycle-buttons.tsx`

**Interfaces:**
- Consumes: Task 7's hook and dialogs.
- Produces: `MembershipRowActions({ membership, onDetails, onEdit, actions? })` — it owns its own lifecycle dialogs, the way `booking-row-actions.tsx` does, because none of them needs data loaded before opening; `createColumns({ onDetails, onEdit, memberNames, companyNames })`; `MembershipTable` owns `detailsMembership`, `editingMembership`.

- [ ] **Step 1: `membership-row-actions.tsx`**

Clone `booking-row-actions.tsx` (the version that owns its alerts locally). Items: Details, Edit, separator, Renew (`RotateCw`), Pause (`Pause`) or Resume (`Play`) — render Pause when `membership.status !== "paused"`, Resume when it is, so one slot shows the sensible verb — and Cancel (`Ban`, `variant="destructive"`). Each lifecycle item:

```tsx
        <DropdownMenuItem disabled={!canRenew} title={renewHint ?? "Append another billing cycle"} onSelect={() => setRenewOpen(true)}>
          <RotateCw />
          Renew
        </DropdownMenuItem>
```

The trigger shows `Loader2` while `pending !== null`. Below the menu, mount the four dialogs with `label`, `pending === "cancel"` etc., and `onConfirm={async () => { if (await cancel()) setCancelOpen(false) }}` (pause/resume pass their fields through). `actions` is forwarded to the hook.

- [ ] **Step 2: `columns.tsx`**

`ColumnsProps` gains `onDetails`; the actions cell becomes `<MembershipRowActions membership={row.original} onDetails={onDetails} onEdit={onEdit} />`. Remove the `LifecycleButtons`, `Button`, `Edit` imports. Delete `lifecycle-buttons.tsx`.

- [ ] **Step 3: `membership-table.tsx`**

Add `detailsMembership` state, `handOff` (same shape as Task 3 step 5), `onDetails: setDetailsMembership` into `createColumns`, mount the form only while open. The details dialog itself is Task 9; leave the state and `handOff` in place.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: on an active membership the menu offers Renew, Pause, Cancel enabled and Details/Edit; Cancel asks first; after it, the row's Cancel greys with "Already cancelled" on hover; on a paused membership the slot reads Resume; Renew asks first (it did not, on this page).

- [ ] **Step 5: Commit**

```bash
git add -A app/community/memberships
git commit -m "refactor(memberships): move row actions into a \"⋯\" dropdown; renew asks first"
```

---

### Task 9: Memberships — details dialog

**Files:**
- Create: `app/community/memberships/membership-details-dialog.tsx`
- Modify: `memberships/membership-table.tsx`

**Interfaces:**
- Consumes: `getMember`, `getCompany`, `getPlan`, `getListMembershipPauses` from `@/lib/service`; `membershipSnapshot`, `billingCycleLabel` from `./membership-snapshot`; `benefitLabel` from `@/lib/benefits`; `formatPriceHt`, `formatVatRate`, `formatDate`, `formatEnumLabel` from `@/lib/format`; the hook and dialogs from Task 7.
- Produces: `MembershipDetailsDialog({ membership, open, onOpenChange, onEdit, busy?, actions? })`.

- [ ] **Step 1: Write it**

Shell as in Task 4. Content:

- **Header:** `membership.name` + status badge; `DialogDescription` = `${membership.companyId ? "Company" : "Member"} · ${snapshot.plan?.name ?? "Plan not in snapshot"}`; when `cancelledAt`, an outline badge "Cancelled {formatDate}".
- **Lazy loads on open:** the customer (`getMember(memberId)` or `getCompany(companyId)`), the live plan (`getPlan(planId)`, only to link its name — the *terms* come from the snapshot), and `getListMembershipPauses(membership.id)`. One effect, one cancellation flag, each `.catch(() => undefined)`.
- **Hero:** `formatPriceHt(snapshot.plan?.priceHt)` as the figure, captioned `${billingCycleLabel(snapshot.plan)} · VAT ${formatVatRate(snapshot.plan?.vatRate)}`; right-aligned small "Billed to the {membership.billTo}".
- **Section "Term":** Starts `formatDate(startsAt)`; Ends `endsAt ? formatDate(endsAt) : "open-ended"`; Cancelled `formatDate(cancelledAt)` when set.
- **Section "Customer":** name; for a company a `<Link href={`/community/companies/${id}`}>`; for a member, email as `mailto:`. Skeleton while loading; "Could not load" if the fetch failed.
- **Section "Plan snapshot":** move the `Term` grid and the extras and benefits lists from `add-membership-form.tsx` lines ~272–351 here verbatim (Price HT, VAT, Deposit, Kind, Cancellation days, Taken). Add Setup fee (`formatPriceHt(snapshot.plan?.setupFee)`) if the snapshot type carries it — check `membership-snapshot.ts`'s `SnapshotPlan`; if it does not, add `setupFee?: number | null` there, read defensively like its siblings.
- **Section "Pauses"** (only when the list is non-empty): each row `formatDate(startsAt)` → `endsAt ? formatDate(endsAt) : "open"`, with `reason` in muted text.
- **Section "Notes"** when present. Meta line with `CopyId`.
- **Footer:** Edit (`disabled={busy}`), Renew, Pause/Resume, Cancel (destructive) — using the hook with `actions` forwarded, and the four dialogs mounted inside `DialogContent`.

- [ ] **Step 2: Mount from `membership-table.tsx`** exactly as Task 4 step 2, with `onEdit={() => handOff(handleEdit)}`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: open Details on a company-billed membership → company link; on a member's → mailto; the snapshot table matches what the edit drawer used to show; pause from the footer → after refresh, reopen shows the pause in "Pauses".

- [ ] **Step 4: Commit**

```bash
git add app/community/memberships/membership-details-dialog.tsx app/community/memberships/membership-table.tsx app/community/memberships/membership-snapshot.ts
git commit -m "feat(memberships): a details dialog with the snapshot, customer and pauses"
```

---

### Task 10: Memberships — form dialog

**Files:**
- Create: `app/community/memberships/membership-form-dialog.tsx`
- Modify: `memberships/membership-table.tsx`, `memberships/add-membership-button.tsx`, `memberships/actions.ts`
- Delete: `memberships/add-membership-form.tsx`

**Interfaces:**
- Consumes: `createMembershipAction`, `updateMembershipAction`.
- Produces: `MembershipFormDialog` with the same props `add-membership-form.tsx` accepts today (`isOpen`, `onClose`, `editingMembership?`, and the seed option props it takes — read them off the file, they are not renamed).

- [ ] **Step 1: Write it**

From `add-membership-form.tsx`, apply the four Task-5 changes (Dialog shell `max-w-2xl`, `messageFor`, identity toast guard, keep the reset-on-open effect), then:

- **Edit mode** renders only Name and Notes, and a muted line: "Terms are fixed to the plan snapshot. Open Details to see them." The `ReadOnlyField`s and the snapshot block are gone (they live in Task 9's dialog).
- **Create mode** keeps every field and adds Setup fee next to Deposit:

```tsx
<div className="grid gap-2">
  <Label htmlFor="setupFee">Setup fee (HT)</Label>
  <Input id="setupFee" name="setupFee" type="number" min="0" step="0.01" placeholder="Plan default" />
</div>
```

and `createMembershipAction` reads `setupFee: num(formData, "setupFee")`.
- `messageFor`:

```ts
function messageFor(state: ActionState, fallback: string): string {
  switch (state.problemType) {
    case "customer_xor_violation": return "Pick a member or a company, not both."
    case "plan_archived": return "That plan is archived and cannot be sold."
    case "membership_before_company_start": return "The membership cannot start before the company does."
    case "membership_end_before_start": return "The end date is before the start date."
    case "extra_not_on_plan": return "One of the extras is not offered on this plan."
    default: return state.error ?? fallback
  }
}
```

- The date inputs: if they are native `<input type="date">` today, keep them; a `Dialog` has no vaul drag layer, so the `openNativePicker` workaround from `subscribe-plan-button.tsx` is not needed.

- [ ] **Step 2: Rename call sites, delete the old form.**

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: create a company membership with a setup fee → Details shows it in the snapshot (if the backend snapshots it; if not, the field still posts without error); edit shows only name and notes; clearing notes and saving clears them.

- [ ] **Step 4: Commit**

```bash
git add -A app/community/memberships
git commit -m "refactor(memberships): create/edit in a dialog; the snapshot moves to Details"
```

---

### Task 11: Company detail — members tab on the members module's pattern

**Files:**
- Create: `app/community/companies/[id]/company-member-row-actions.tsx`, `[id]/reassign-member-dialog.tsx`
- Modify: `[id]/members-columns.tsx`, `[id]/company-members-table.tsx`
- Delete: `[id]/reassign-member-button.tsx`

**Interfaces:**
- Consumes: `MemberDetailsDialog`, `MemberFormDialog`, `useMemberMutations`, `StatusDialog` from `@/app/community/members/*`; `MEMBER_STATUS_*` from `@/app/community/members/member-status`; `listCompanyOptions`, `reassignMemberAction` from `./actions`.
- Produces: `CompanyMemberRowActions({ member, onDetails, onEdit, onReassign, onDetach })`; `ReassignMemberDialog({ open, onOpenChange, member, currentCompanyId, detach, onDone })`; `createMemberColumns({ companyId, onDetails, onEdit, onReassign, onDetach })`.

- [ ] **Step 1: `members-columns.tsx`**

Delete the local `statusBadgeClass` and `formatLabel`; use `MEMBER_STATUS_CLASSES/LABELS` and `formatEnumLabel`. Actions cell → `<CompanyMemberRowActions … />`.

- [ ] **Step 2: `company-member-row-actions.tsx`**

Clone the members' row actions (menu only — this one owns no dialog; the table does, because Reassign loads companies before it opens). Items: Details, Edit, separator, Reassign (`ArrowLeftRight`), Detach (`UserMinus`, `variant="destructive"`, `title="Make this member solo"`).

- [ ] **Step 3: `reassign-member-dialog.tsx`**

The `AlertDialogContent` of `reassign-member-button.tsx` made controlled. Props above. The select gains a first real option:

```tsx
<option value="">Select a company</option>
<option value="__none__">No employer (solo)</option>
{companies.map(…)}
```

`detach` prop preselects `"__none__"`. On confirm, `formData.set("detach", target === "__none__" ? "on" : "")` and `targetCompanyId` only when not detaching. Title "Reassign {name}" or "Detach {name}?" when `detach`; description drops the false "the API requires every member to keep an employer" sentence and reads "Move this member to another company, or make them solo." Toast "Member reassigned" / "Member detached", `router.refresh()`, then `onDone()`. Delete the old button.

- [ ] **Step 4: `company-members-table.tsx` owns the dialogs**

State: `detailsMember`, `editingMember` + `isFormOpen`, `reassign: { member: MemberDto; detach: boolean } | null`. `handOff` as before. Mount `MemberDetailsDialog` (its Edit hands off to the form), `MemberFormDialog` (pass `companyNames={{ [companyId]: companyName }}` — add a `companyName` prop to the table and thread it from `members-tab.tsx`, which has it via the page; if not, load nothing and let the select show the id — no: thread it), and `ReassignMemberDialog`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: on a company page, Details on a member shows this company as employer; Edit opens the members form prefilled; Reassign to another company removes the row after refresh; Detach removes the row and the member shows "Solo" in the members list.

- [ ] **Step 6: Commit**

```bash
git add -A "app/community/companies/[id]"
git commit -m "refactor(company): members tab reuses the members dialogs; detach exposed"
```

---

### Task 12: Company detail — plans tab on the memberships module's pattern

**Files:**
- Modify: `app/community/companies/[id]/plans-columns.tsx`, `[id]/company-plans-table.tsx`
- Delete: `[id]/membership-action-buttons.tsx`

**Interfaces:**
- Consumes: `MembershipRowActions`, `MembershipDetailsDialog`, `MembershipFormDialog`, `MembershipActions` type from `@/app/community/memberships/*`; `MEMBERSHIP_STATUS_*`; the four `*CompanyMembershipAction` wrappers from `./actions`.
- Produces: `createPlanColumns({ companyId, plansById, subscribersById, onDetails, onEdit, actions })`.

- [ ] **Step 1: `plans-columns.tsx`**

Delete the local `statusBadgeClass` and `formatDate`; use `MEMBERSHIP_STATUS_*` and `lib/format`'s `formatDate`. Actions cell:

```tsx
<MembershipRowActions membership={row.original} onDetails={onDetails} onEdit={onEdit} actions={actions} />
```

- [ ] **Step 2: `company-plans-table.tsx`**

Build the override once:

```tsx
const COMPANY_ACTIONS: MembershipActions = {
  cancel: cancelCompanyMembershipAction, renew: renewCompanyMembershipAction,
  pause: pauseCompanyMembershipAction, resume: resumeCompanyMembershipAction,
}
```

The hook sets `companyId` on the FormData from `membership.companyId`, which is null for member-held rows; so the wrappers would not revalidate the page. Fix at the source: in `use-membership-mutations.ts`, accept an optional third argument `revalidateCompanyId?: string` and set `formData.set("companyId", revalidateCompanyId ?? membership.companyId ?? "")`. `MembershipRowActions` and `MembershipDetailsDialog` gain a matching optional `companyId` prop and forward it. This table passes `companyId`.

Own `detailsMembership` / `editingMembership` state, `handOff`, mount `MembershipDetailsDialog` (with `actions={COMPANY_ACTIONS}` and `companyId`) and `MembershipFormDialog`. Delete `membership-action-buttons.tsx`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`. Manual: on the plans tab, cancel a member-held membership → asked first → the roster's row shows Cancelled after refresh without leaving the page; Details opens the memberships dialog; Edit opens the name/notes form.

- [ ] **Step 4: Commit**

```bash
git add -A "app/community/companies/[id]"
git commit -m "refactor(company): plans tab reuses the memberships menu, hook and dialogs"
```

---

### Task 13: Final sweep

**Files:** everything under `app/community/members`, `companies`, `memberships`, `lib/action-state.ts`.

- [ ] **Step 1: Dead code**

`grep -rn "add-member-form\|add-company-form\|add-membership-form\|status-button\|lifecycle-buttons\|membership-action-buttons\|reassign-member-button\|table-skeleton\"" app/community` returns nothing. `MEMBER_STATUS_TABS` in `member-status.ts` is still unused (the tabs are kinds) — delete it. `companies/[id]/actions.ts` no longer imports `cancelMembership`/`renewMembership` from the service.

- [ ] **Step 2: The spec's end-to-end manual pass**

Run the pass listed under "Testing" in the spec, in full, on a dev server against staging data.

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm run lint && npm run build`. Commit any cleanup as `chore(community): remove the last pre-pattern leftovers`. Then follow `superpowers:finishing-a-development-branch`.

---

## Self-review

**Spec coverage.** Shared helpers → Task 1, 2. Stat cards → 2. Server search → 2. Members menu/hook/status → 3; details → 4; form → 5. Companies status column, menu, form, detail Edit, overview fields, detail revalidation → 6 (+1). Memberships hook, four dialogs, hints, confirmed renew → 7; menu → 8; details with snapshot and pauses → 9; form with setupFee and slim edit → 10. Members tab with detach → 11. Plans tab, deleted duplicates → 1 and 12. Error map → 1, 5, 6, 7, 10. Not-in-scope items are untouched by any task.

**Type consistency.** `ActionState` is the shared one everywhere from Task 1 on; the community `actions.ts` files re-export it so `./actions`' imports still resolve. `MembershipActions` is defined in Task 7 and consumed in 8, 9, 12. `handOff` has the same shape in 3, 8, 11, 12. `companyId` threading in Task 12 changes Task 7's hook and Task 8/9's props — implementers of 7–9 should add the optional `companyId` up front rather than revisit.
