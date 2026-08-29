# Discounts — hyperspace-platform (admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give staff a Billing › Discounts page and surface discounts on the plan form, the membership form (with a price preview), booking quotes/details and the charges list — and let staff keep or drop the promo code a website visitor typed, at onboarding and at booking confirmation.

**Architecture:** Follows the repo's CRUD idiom exactly (`page.tsx` / `table-section.tsx` / `*-table.tsx` / `columns.tsx` / `add-*-button.tsx` / `add-*-form.tsx` / `actions.ts` / `*-meta.ts`), native `<form action>` + `useActionState`, hand-rolled validation in server actions, `sonner` toasts, `@tanstack/react-table`. All API access goes through the generated `lib/service` (`npm run generate` against the backend Swagger). One pure module (`lib/pricing/discount-math.ts`) mirrors the backend's arithmetic for previews.

**Tech Stack:** Next.js 15 App Router, React 19, shadcn/ui, Tailwind v4, `@hscowork/service-generator`, no test runner (verification is manual via `/run`).

**Spec:** `../hscowork-backend-platform/docs/superpowers/specs/2026-08-28-discounts-design.md` §8 (and §4 for the arithmetic). Backend plan: `../hscowork-backend-platform/docs/superpowers/plans/2026-08-28-discounts-backend.md` — **its Tasks 1–9 must be merged and running locally before Task 0 here.**

## Global Constraints

- Generated types only: import `DiscountDto`, `CreateDiscountDto`, `UpdateDiscountDto`, `DiscountKind`, `DiscountStatus`, `QuoteDiscountDto`, `BookingDiscountDto`, `ChargeKind` from `@/lib/service/HsService`; never hand-write DTO shapes.
- Money display via `formatPriceHt` from `@/lib/format`; enum labels via `formatEnumLabel` unless a meta map exists.
- Server actions return `ActionState = { success?: boolean; error?: string }`; `revalidatePath` on success.
- Prettier: double quotes, no semicolons, 2-space indent (match existing files).
- Commit per task on branch `feat/discounts`.
- Validation of each task: `npm run lint && npm run build`, then a manual check in the running app against the local backend (`HS_SWAGGER_URL=http://localhost:3000/_docs/json`).

---

### Task 0: Regenerate the API client

**Files:**
- Modify (generated): `lib/service/HsService.ts`, `lib/service/index.ts`, `lib/service/_meta.ts`, `swagger.json`

- [ ] **Step 1:** With the backend running on `:3000`, run `npm run generate`.
- [ ] **Step 2:** Confirm the new surface exists:
  `grep -n "listDiscounts\|createDiscount\|updateDiscount\|archiveDiscount\|rateDiscountIds\|QuoteDiscountDto\|BookingDiscountDto" lib/service/HsService.ts | head -20` and `grep -n "getListDiscounts\|getCreateDiscount\|getUpdateDiscount\|getArchiveDiscount" lib/service/index.ts`.
  Note the exact wrapper names printed (the generator prefixes list/get wrappers with `get`; e.g. `createResourceRate` is exported as `createResourceRate`). Use those names in later tasks — the plan assumes `getListDiscounts`, `createDiscount`, `updateDiscount`, `archiveDiscount`.
- [ ] **Step 3:** `npm run build` passes (the `ChargeKind` union now includes `"discount"`; if any exhaustive `Record<ChargeKind, …>` breaks, add the key with label `"Discount"` — see Task 5).
- [ ] **Step 4:** Commit: `git add lib/service swagger.json && git commit -m "chore: regenerate client with discounts"`.

---

### Task 1: Shared discount arithmetic + meta

**Files:**
- Create: `lib/pricing/discount-math.ts`
- Create: `app/billing/discounts/discount-meta.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/pricing/discount-math.ts
  export interface DiscountValue { percentOff?: number | null; amountOffHt?: number | null }
  export interface DiscountLine { key: string; amountHt: number }
  export function applyDiscount(d: DiscountValue, lines: DiscountLine[], mainKey: string): { key: string; discountHt: number }[]
  export function totalDiscount(d: DiscountValue, lines: DiscountLine[], mainKey: string): number  // ≤ 0
  // discount-meta.ts
  export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string>
  export const DISCOUNT_KIND_HELP: Record<DiscountKind, string>
  export function formatDiscountValue(d: Pick<DiscountDto, "percentOff" | "amountOffHt">): string
  export function isInWindow(d: Pick<DiscountDto, "validFrom" | "validUntil">, today?: string): boolean
  ```

- [ ] **Step 1: Arithmetic (verbatim port of backend §4, 3-decimal rounding)**

```ts
// lib/pricing/discount-math.ts
/**
 * Mirror of the backend's discount-math.util (spec §4) for previews only —
 * the server figure is authoritative. Percent → every line; amount off →
 * the main line only, clamped at that line's amount.
 */
export interface DiscountValue {
  percentOff?: number | null
  amountOffHt?: number | null
}
export interface DiscountLine {
  key: string
  amountHt: number
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

export function applyDiscount(
  d: DiscountValue,
  lines: DiscountLine[],
  mainKey: string
): { key: string; discountHt: number }[] {
  if (d.percentOff !== null && d.percentOff !== undefined) {
    return lines
      .map((l) => ({ key: l.key, discountHt: -round3((l.amountHt * d.percentOff!) / 100) }))
      .filter((l) => l.discountHt !== 0)
  }
  const main = lines.find((l) => l.key === mainKey)
  if (!main || d.amountOffHt === null || d.amountOffHt === undefined) return []
  const discountHt = -round3(Math.min(d.amountOffHt, main.amountHt))
  return discountHt === 0 ? [] : [{ key: main.key, discountHt }]
}

export function totalDiscount(d: DiscountValue, lines: DiscountLine[], mainKey: string): number {
  return round3(applyDiscount(d, lines, mainKey).reduce((s, l) => s + l.discountHt, 0))
}
```

- [ ] **Step 2: Meta**

```ts
// app/billing/discounts/discount-meta.ts
import type { DiscountDto, DiscountKind } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"

export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string> = {
  plan: "Plan discount",
  resource_rate: "Resource rate discount",
  promo: "Promo code",
}

export const DISCOUNT_KIND_HELP: Record<DiscountKind, string> = {
  plan: "Chosen per membership. Reduces the cycle fee (and plan extras) on every future, non-invoiced cycle.",
  resource_rate: "Attached to billing plans. Every member on those plans pays less for the selected rates.",
  promo: "A code visitors type on the website. Applies to every public booking and plan request.",
}

export function formatDiscountValue(d: Pick<DiscountDto, "percentOff" | "amountOffHt">): string {
  if (d.percentOff !== null && d.percentOff !== undefined) return `${d.percentOff} %`
  if (d.amountOffHt !== null && d.amountOffHt !== undefined) return `${formatPriceHt(d.amountOffHt)} off`
  return "—"
}

/** Promo validity, inclusive, YYYY-MM-DD compare (Africa/Tunis dates from the API). */
export function isInWindow(
  d: Pick<DiscountDto, "validFrom" | "validUntil">,
  today = new Date().toISOString().slice(0, 10)
): boolean {
  return (!d.validFrom || d.validFrom <= today) && (!d.validUntil || d.validUntil >= today)
}
```

- [ ] **Step 3:** `npm run lint`. Commit: `git add lib/pricing app/billing/discounts && git commit -m "feat(discounts): arithmetic mirror and meta"`.

---

### Task 2: Billing › Discounts page (list, create, edit, archive)

**Files:**
- Create: `app/billing/discounts/page.tsx`, `table-section.tsx`, `discount-table.tsx`, `columns.tsx`, `add-discount-button.tsx`, `add-discount-form.tsx`, `actions.ts`, `section-cards.tsx`, `table-skeleton.tsx`
- Modify: `lib/navigation-config.ts:200-204` (add entry)

**Interfaces:**
- Consumes: `getListDiscounts`, `createDiscount`, `updateDiscount`, `archiveDiscount`, `getListPlans`, `getListResourceRates`, `getListResourceTypes` from `@/lib/service`; Task 1 helpers.
- Produces: route `/billing/discounts` with `?kind=&status=&page=&pageSize=`.

- [ ] **Step 1: `actions.ts`**

```ts
"use server"

import { revalidatePath } from "next/cache"
import { archiveDiscount, createDiscount, updateDiscount } from "@/lib/service"
import type { CreateDiscountDto, DiscountKind, UpdateDiscountDto } from "@/lib/service/HsService"

export type ActionState = { success?: boolean; error?: string }

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}
function num(formData: FormData, field: string): number | undefined {
  const raw = text(formData, field)
  if (raw === undefined) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}
function ids(formData: FormData, field: string): string[] {
  return formData.getAll(field).map((v) => String(v).trim()).filter(Boolean)
}

/** Shared by create and update: one value type, right targets for the kind. */
function readValueAndTargets(formData: FormData, kind: DiscountKind): { error?: string; data?: Partial<CreateDiscountDto> } {
  const valueType = text(formData, "valueType") // "percent" | "amount"
  const percentOff = valueType === "percent" ? num(formData, "percentOff") : undefined
  const amountOffHt = valueType === "amount" ? num(formData, "amountOffHt") : undefined
  if (percentOff === undefined && amountOffHt === undefined) {
    return { error: "Enter a percent off or an amount off" }
  }
  if (percentOff !== undefined && (percentOff <= 0 || percentOff > 100)) {
    return { error: "Percent off must be between 0 and 100" }
  }
  if (amountOffHt !== undefined && amountOffHt <= 0) {
    return { error: "Amount off must be greater than 0" }
  }
  const planIds = kind === "plan" ? ids(formData, "planIds") : []
  const resourceRateIds = kind === "resource_rate" ? ids(formData, "resourceRateIds") : []
  if (kind === "plan" && planIds.length === 0) return { error: "Pick at least one plan" }
  if (kind === "resource_rate" && resourceRateIds.length === 0) return { error: "Pick at least one resource rate" }
  const validFrom = kind === "promo" ? text(formData, "validFrom") : undefined
  const validUntil = kind === "promo" ? text(formData, "validUntil") : undefined
  if (validFrom && validUntil && validUntil < validFrom) return { error: "Valid until cannot be before valid from" }
  return { data: { percentOff, amountOffHt, planIds, resourceRateIds, validFrom, validUntil } }
}

export async function createDiscountAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const name = text(formData, "name")
    const code = text(formData, "code")
    const kind = text(formData, "kind") as DiscountKind | undefined
    if (!name) return { success: false, error: "Name is required" }
    if (!code) return { success: false, error: "Code is required" }
    if (!kind) return { success: false, error: "Kind is required" }
    const read = readValueAndTargets(formData, kind)
    if (read.error) return { success: false, error: read.error }
    const data: CreateDiscountDto = { name, code, kind, ...read.data }
    await createDiscount(data)
    revalidatePath("/billing/discounts")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create discount" }
  }
}

export async function updateDiscountAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    const kind = text(formData, "kind") as DiscountKind | undefined // hidden field; kind is immutable
    if (!id || !kind) return { success: false, error: "Discount ID is required" }
    const read = readValueAndTargets(formData, kind)
    if (read.error) return { success: false, error: read.error }
    const data: UpdateDiscountDto = { name: text(formData, "name"), code: text(formData, "code"), ...read.data }
    await updateDiscount(id, data)
    revalidatePath("/billing/discounts")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update discount" }
  }
}

export async function archiveDiscountAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Discount ID is required" }
    await archiveDiscount(id)
    revalidatePath("/billing/discounts")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to archive discount" }
  }
}
```

- [ ] **Step 2: `add-discount-form.tsx`** — copy `app/billing/resource-rates/add-resource-rate-form.tsx` and adapt:
  - Props: `{ isOpen, onClose, editingDiscount?: DiscountDto | null }`.
  - Local state: `kind` (`DiscountKind`, default `"plan"`, initialised from `editingDiscount?.kind`), `valueType` (`"percent" | "amount"`, from `editingDiscount?.amountOffHt != null ? "amount" : "percent"`), `selectedPlanIds`, `selectedRateIds`, loaded `plans: PlanDto[]`, `rates: ResourceRateDto[]`, `resourceTypeNames`.
  - On open: fetch `getListPlans({ limit: 100, offset: 0, sort: "ASC" })`, `getListResourceRates({ limit: 200, offset: 0, sort: "ASC" })`, `getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })`; seed selections from `editingDiscount.planIds` / `.resourceRateIds`.
  - Fields (top to bottom): Name (`Input name="name"`), Code (`Input name="code"` uppercased on blur, helper "Shown on invoices; visitors type promo codes on the website."), Kind — three `<label><input type="radio" name="kind" value=… /></label>` rows with `DISCOUNT_KIND_HELP` beneath; **in edit mode** render the kind as the read-only muted box (same pattern as the rate slot box) plus `<input type="hidden" name="kind" value={editingDiscount.kind} />`.
  - Value: a two-button segmented toggle bound to `valueType` writing `<input type="hidden" name="valueType" value={valueType} />`, then either `Input name="percentOff" type="number" min=0.01 max=100 step=0.01` or `Input name="amountOffHt" type="number" min=0.001 step=0.001` with label "Amount off excl. VAT (TND)".
  - Targets: when `kind === "plan"` a checkbox list `name="planIds"` (plan name + `formatPriceHt(plan.priceHt)`); when `kind === "resource_rate"` a checkbox list `name="resourceRateIds"` grouped by `resourceTypeNames[rate.resourceTypeId]`, each row `rate.name · RATE_INTERVAL_LABELS[rate.intervalType]{isWeekendRate ? " · weekend" : ""}` + `formatPriceHt(rate.priceHt)` (import `RATE_INTERVAL_LABELS` from `../resource-rates/rate-meta`); when `kind === "promo"` two `Input type="date"` fields `validFrom` / `validUntil` with helper "Leave blank for no limit. Promo codes apply to every resource and plan on the website."
  - Drawer title "Add Discount" / "Edit Discount"; submit label "Create Discount" / "Update"; toasts "Discount created" / "Discount updated"; same `createNotifiedRef` / `updateNotifiedRef` guards.

- [ ] **Step 3: `columns.tsx`**

```ts
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Archive, Edit } from "lucide-react"
import type { DiscountDto } from "@/lib/service/HsService"
import { formatDate } from "@/lib/format"
import { DISCOUNT_KIND_LABELS, formatDiscountValue, isInWindow } from "./discount-meta"

interface ColumnsProps {
  onEdit: (discount: DiscountDto) => void
  onArchive: (discount: DiscountDto) => void
  planNames?: Record<string, string>
  rateNames?: Record<string, string>
}

export const createColumns = ({ onEdit, onArchive, planNames = {}, rateNames = {} }: ColumnsProps): ColumnDef<DiscountDto>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.code}</code>
        <span className="text-xs text-muted-foreground">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "kind",
    header: "Kind",
    cell: ({ row }) => <Badge variant="secondary" className="border-0">{DISCOUNT_KIND_LABELS[row.original.kind]}</Badge>,
  },
  {
    id: "value",
    header: "Value",
    cell: ({ row }) => <span className="tabular-nums">{formatDiscountValue(row.original)}</span>,
  },
  {
    id: "appliesTo",
    header: "Applies to",
    cell: ({ row }) => {
      const d = row.original
      const names =
        d.kind === "plan" ? d.planIds.map((id) => planNames[id] ?? "…")
        : d.kind === "resource_rate" ? d.resourceRateIds.map((id) => rateNames[id] ?? "…")
        : ["All resources and plans (website)"]
      return (
        <div className="flex max-w-[360px] flex-wrap gap-1">
          {names.map((n, i) => <Badge key={`${n}-${i}`} variant="outline">{n}</Badge>)}
        </div>
      )
    },
  },
  {
    id: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const d = row.original
      if (d.kind !== "promo") return <span className="text-muted-foreground">—</span>
      const range = `${d.validFrom ? formatDate(d.validFrom) : "…"} → ${d.validUntil ? formatDate(d.validUntil) : "…"}`
      return (
        <div className="flex items-center gap-2 text-sm">
          <span>{range}</span>
          {!isInWindow(d) && <Badge variant="outline" className="border-0 bg-orange-100 text-orange-800">Outside window</Badge>}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status === "active"
        ? <Badge className="border-0 bg-emerald-100 text-emerald-800">Active</Badge>
        : <Badge variant="outline">Archived</Badge>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)} disabled={row.original.status === "archived"}>
          <Edit className="h-4 w-4" /><span className="sr-only">Edit</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onArchive(row.original)} disabled={row.original.status === "archived"}>
          <Archive className="h-4 w-4" /><span className="sr-only">Archive</span>
        </Button>
      </div>
    ),
  },
]
```

- [ ] **Step 4: `table-section.tsx`** — clone the resource-rates one: read `page`, `pageSize`, `kind`, `status`; query `{ limit, offset, sort: "ASC", kind, status }` via `getListDiscounts`; build `planNames` from `getListPlans({ limit: 100, … })` and `rateNames` from `getListResourceRates({ limit: 200, … })` (`rate.name`); render `<DiscountTable data totalCount planNames rateNames activeKind activeStatus />`.

- [ ] **Step 5: `discount-table.tsx`** — clone `resource-rate-table.tsx`: `editingDiscount` state + `AddDiscountForm`; `onArchive` opens a shadcn `AlertDialog` ("Archive {code}? Existing memberships and charges keep it; it can no longer be assigned.") whose confirm calls `archiveDiscountAction` through a tiny `<form action>` and toasts "Discount archived". Filter chips row above the table for kind (`All / Plan / Resource rate / Promo`) and status (`Active / Archived`) that push `?kind=&status=` via `useRouter().replace` (copy the `activeResourceTypeId` filter idiom from the rates table).

- [ ] **Step 6: `page.tsx`, `add-discount-button.tsx`, `section-cards.tsx`, `table-skeleton.tsx`** — clone the rate versions; title "Discounts"; button "Add Discount"; cards: Total active, Plan discounts, Rate discounts, Promo codes (in window) — computed from `getListDiscounts({ limit: 1000, offset: 0, sort: "ASC" })`.

- [ ] **Step 7: Navigation** — in `lib/navigation-config.ts` after the `Resource rates` entry add `{ title: "Discounts", url: "/billing/discounts", icon: BadgePercent }` (import `BadgePercent` from `lucide-react`).

- [ ] **Step 8: Verify** — `npm run lint && npm run build`; in the app: create one of each kind (promo with a window), edit a value, archive one, filter by kind, confirm names resolve in "Applies to". Error paths: code reused → toast shows the backend `discount_code_taken` detail.

- [ ] **Step 9: Commit** — `git add app/billing/discounts lib/navigation-config.ts && git commit -m "feat(billing): discounts page"`.

---

### Task 3: Plan form — rate discounts

**Files:**
- Modify: `app/space/plan/add-plan-form.tsx` (new checkbox list after the Extras block, ~line 248)
- Modify: `app/space/plan/actions.ts` (`rateDiscountIds` on create + update, next to `extraIds`, line ~49 and the update equivalent)
- Modify: `app/space/plan/columns.tsx` (chip count)

- [ ] **Step 1: Form** — add state `rateDiscounts: DiscountDto[]`, `selectedRateDiscountIds: string[]` (seed from `editingPlan?.rateDiscounts?.map((d) => d.id)`), fetch in the open effect: `getListDiscounts({ limit: 200, offset: 0, sort: "ASC", kind: "resource_rate", status: "active" })`. Render (copy the Extras block shape):

```tsx
<div className="grid gap-2">
  <Label>Rate discounts</Label>
  <p className="text-xs text-muted-foreground">
    Members on this plan pay less for the selected rates. Applies immediately to all active memberships — no plan clone.
  </p>
  {rateDiscounts.length === 0 ? (
    <p className="text-sm text-muted-foreground">No resource-rate discounts yet.</p>
  ) : (
    <div className="grid gap-2 rounded-md border border-input p-3">
      {rateDiscounts.map((d) => (
        <label key={d.id} className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="rateDiscountIds" value={d.id}
            checked={selectedRateDiscountIds.includes(d.id)}
            onChange={() => toggleRateDiscount(d.id)}
            className="mt-0.5 h-4 w-4 rounded border-input" />
          <span>
            <code className="rounded bg-muted px-1 text-xs">{d.code}</code> {d.name}
            <span className="block text-xs text-muted-foreground">{formatDiscountValue(d)}</span>
          </span>
        </label>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 2: Actions** — add `function rateDiscountIds(formData) { return formData.getAll("rateDiscountIds").map(String).filter(Boolean) }` and set `rateDiscountIds: rateDiscountIds(formData)` on both `CreatePlanDto` and `UpdatePlanDto` payloads.

- [ ] **Step 3: Columns** — in the plan columns add after Extras: `{ id: "rateDiscounts", header: "Rate discounts", cell: ({ row }) => { const n = row.original.rateDiscounts?.length ?? 0; return n ? <Badge variant="secondary">{n}</Badge> : <span className="text-muted-foreground">-</span> } }`.

- [ ] **Step 4: Verify** — attach a rate discount to a plan with active memberships; the response keeps the same plan id (no clone) and the chip shows 1. Commit: `git commit -am "feat(plans): grant resource-rate discounts"`.

---

### Task 4: Membership form — discount select + price preview

**Files:**
- Modify: `app/community/memberships/add-membership-form.tsx` (after the Deposit override block, ~line 318; edit-mode block)
- Modify: `app/community/memberships/actions.ts` (`discountId` on create ~line 57 and update ~line 84)
- Modify: `app/community/memberships/columns.tsx` (Discount column) and the membership details view if one exists (`grep -rn planSnapshot app/community/memberships`)
- Modify: the onboarding dialog (`grep -rn "onboard\|OnboardLeadDto" app/ components/` — the form that posts `POST /onboarding` with `opportunityId`/`startsAt`/`endsAt`) and the opportunities list/details (`app/community/opportunities/` or wherever `requestedPlanPriceHt` is rendered)

- [ ] **Step 1: Data** — state `discounts: DiscountDto[]`, `discountId: string` (seed `editingMembership?.discountId ?? ""`), `selectedExtraIds: string[]` (the extras checkboxes are currently uncontrolled — make them controlled so the preview knows which extras are selected). Fetch on open: `getListDiscounts({ limit: 200, offset: 0, sort: "ASC", status: "active" })`. Derive:

```ts
const eligibleDiscounts = discounts.filter((d) =>
  (d.kind === "plan" && !!selectedPlan && d.planIds.includes(selectedPlan.id)) ||
  (d.kind === "promo" && isInWindow(d))
)
const selectedDiscount = eligibleDiscounts.find((d) => d.id === discountId)
```

Reset `discountId` to `""` when the plan changes and the current discount is no longer eligible.

- [ ] **Step 2: Select** (create and edit modes):

```tsx
<div className="grid gap-2">
  <Label htmlFor="discountId">Discount</Label>
  <select id="discountId" name="discountId" className={selectClassName} value={discountId}
    onChange={(e) => setDiscountId(e.target.value)} disabled={!selectedPlan}>
    <option value="">{selectedPlan ? "No discount" : "Select a plan first"}</option>
    {eligibleDiscounts.map((d) => (
      <option key={d.id} value={d.id}>{d.code} — {formatDiscountValue(d)}{d.kind === "promo" ? " (promo)" : ""}</option>
    ))}
  </select>
  {selectedPlan && eligibleDiscounts.length === 0 && (
    <p className="text-xs text-muted-foreground">No discount is eligible for this plan.</p>
  )}
  {editingMembership && (
    <p className="text-xs text-muted-foreground">Changes apply to future, non-invoiced cycles only.</p>
  )}
</div>
```

- [ ] **Step 3: Price preview** (create mode, below the select; uses a `priceOverride` state mirrored from the override input via `onChange`):

```tsx
{selectedPlan && (
  <dl className="rounded-md border bg-muted/40 text-sm">
    <div className="flex justify-between px-3 py-2">
      <dt className="text-muted-foreground">Default price</dt>
      <dd className="tabular-nums">{formatPriceHt(basePriceHt)}</dd>
    </div>
    {selectedExtras.length > 0 && (
      <div className="flex justify-between border-t px-3 py-2">
        <dt className="text-muted-foreground">Extras</dt>
        <dd className="tabular-nums">{formatPriceHt(extrasHt)}</dd>
      </div>
    )}
    <div className="flex justify-between border-t px-3 py-2">
      <dt className="text-muted-foreground">Discount{selectedDiscount ? ` (${selectedDiscount.code})` : ""}</dt>
      <dd className="tabular-nums">{formatPriceHt(discountHt)}</dd>
    </div>
    <div className="flex justify-between border-t px-3 py-2 font-semibold">
      <dt>Price per cycle</dt>
      <dd className="tabular-nums">{formatPriceHt(basePriceHt + extrasHt + discountHt)}</dd>
    </div>
  </dl>
)}
```

with

```ts
const basePriceHt = priceOverride ?? selectedPlan?.priceHt ?? 0
const selectedExtras = (selectedPlan?.extras ?? []).filter((e) => selectedExtraIds.includes(e.id))
const extrasHt = selectedExtras.reduce((s, e) => s + e.priceHt, 0)
const discountHt = selectedDiscount
  ? totalDiscount(selectedDiscount, [{ key: "plan", amountHt: basePriceHt }, ...selectedExtras.map((e) => ({ key: `extra:${e.id}`, amountHt: e.priceHt }))], "plan")
  : 0
```

- [ ] **Step 4: Actions** — create: `discountId: text(formData, "discountId")`; update: `discountId: formData.has("discountId") ? (text(formData, "discountId") ?? null) : undefined` (empty select = clear → `null`; the generated `UpdateMembershipDto.discountId` is `string | null`). Update the JSDoc "Only the label and notes are patchable" to include the discount.

- [ ] **Step 5: Columns/details** — Discount column: `row.original.planSnapshot?.plan?.discount?.code` as a `<code>` chip or `-`. If a details dialog prints snapshot pricing, add a "Discount" row with `formatDiscountValue(snapshot.plan.discount)`.

- [ ] **Step 6: Onboarding — keep / replace / drop the requested code** (spec §5.4). In the onboarding dialog add, above the start date:

```tsx
<div className="grid gap-2">
  <Label>Discount code</Label>
  {opportunity.requestedDiscountCode ? (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
      Requested on the website: <code className="rounded bg-muted px-1">{opportunity.requestedDiscountCode}</code>
      <div className="mt-2 flex gap-4">
        <label className="flex items-center gap-2"><input type="radio" name="codeMode" value="keep" checked={codeMode === "keep"} onChange={() => setCodeMode("keep")} /> Keep</label>
        <label className="flex items-center gap-2"><input type="radio" name="codeMode" value="drop" checked={codeMode === "drop"} onChange={() => setCodeMode("drop")} /> Remove</label>
        <label className="flex items-center gap-2"><input type="radio" name="codeMode" value="replace" checked={codeMode === "replace"} onChange={() => setCodeMode("replace")} /> Replace</label>
      </div>
    </div>
  ) : null}
  {(codeMode === "replace" || !opportunity.requestedDiscountCode) && (
    <Input name="discountCodeInput" placeholder="e.g. 10LOYALTY" onChange={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()} />
  )}
  <input type="hidden" name="discountCode" value={codeMode === "keep" ? opportunity.requestedDiscountCode ?? "" : ""} />
  <p className="text-xs text-muted-foreground">Checked when the membership is created; an unknown or ineligible code is refused with the reason.</p>
</div>
```

`codeMode` state defaults to `"keep"` when a code was requested, else `"replace"`. The server action reads `text(formData, "codeMode")`: `keep` → `discountCode: text(formData, "discountCode")`; `replace` → `discountCode: text(formData, "discountCodeInput")`; `drop` → `discountCode: null`. Backend 422s (`discount_code_invalid`, `discount_not_eligible`) surface through the existing `ActionState.error` → inline red text + toast; staff pick **Remove** and resubmit.

- [ ] **Step 6b: Opportunities** — list column "Code" rendering `requestedDiscountCode` as a `<code>` chip (or `-`); details view row "Requested discount code"; the opportunity edit form gets a "Discount code" `Input name="requestedDiscountCode"` so staff can clear/correct it before onboarding (PATCH sends `null` when emptied).

- [ ] **Step 7: Verify** — create a membership with `10LOYALTY`; preview total equals the sum of the `plan_fee` + `discount` charges on Billing › Charges. Edit → clear the discount → next renew has no discount line. Commit: `git commit -am "feat(memberships): discount select and price preview"`.

---

### Task 5: Booking quote, booking details, charges labels

**Files:**
- Modify: `app/booking/bookings/booking-form-dialog.tsx:216-223`
- Modify: `app/booking/bookings/booking-details-dialog.tsx:214-216, 391-404`
- Modify: `app/billing/charges/charge-meta.ts:4` and any `Record<ChargeKind, string>` label map (`grep -rn "plan_fee" app/billing/charges app/billing/invoices`)

- [ ] **Step 1: Quote message** — widen the cast to `{ priceHt?: number | null; discount?: { code: string; amountHt: number } | null }` and build:

```ts
const discountNote = quote?.discount ? ` (${quote.discount.code}: ${formatPriceHt(quote.discount.amountHt)})` : ""
setQuoteMessage(
  price === null || price === undefined
    ? "Available — fully covered by credits."
    : isFree
      ? `Available — free (would have been ${formatPriceHt(price)} excl. VAT).`
      : `Available — ${formatPriceHt(price)} excl. VAT.${discountNote}`
)
```

- [ ] **Step 1b: Confirm dialog — keep / drop** — find the confirm action (`grep -rn "confirmBooking" app/booking`) and its dialog (the one that already takes `isFree`/`freeReason`). For a pending booking with `requestedDiscountCode`, add:

```tsx
{booking.requestedDiscountCode && (
  <label className="flex items-start gap-2 text-sm">
    <input type="checkbox" name="keepDiscountCode" defaultChecked className="mt-0.5 h-4 w-4 rounded border-input" />
    <span>
      Apply the requested code <code className="rounded bg-muted px-1">{booking.requestedDiscountCode}</code>
      <span className="block text-xs text-muted-foreground">Unchecked = confirm at the list price. Unknown or expired codes are refused.</span>
    </span>
  </label>
)}
```

Action: `discountCode: formData.get("keepDiscountCode") === "on" ? booking.requestedDiscountCode : null` (pass the code through a hidden `requestedDiscountCode` field). A 422 `discount_code_invalid` shows inline; staff untick and confirm again.

- [ ] **Step 2: Details pricing** — pending bookings show a "Requested code" row (`booking.requestedDiscountCode`, badge "awaiting confirmation"); confirmed ones show the applied discount. `booking.discount` is the snapshot (`BookingDiscountDto`: code + value, not the amount). The amount lives on the `discount` charge; the dialog already loads the booking's charges for the "Credits used"/pricing sections? Check: if charges are loaded (`grep -n getListCharges booking-details-dialog.tsx`), compute `discountHt = charges.filter((c) => c.kind === "discount").reduce((s, c) => s + c.amountHt, 0)`; otherwise show the code only. Insert between Room and Extras:

```tsx
{booking.discount && (
  <div className="flex justify-between border-t px-3 py-2">
    <dt className="text-muted-foreground">Discount ({booking.discount.code})</dt>
    <dd className="tabular-nums">{discountHt !== null ? formatPriceHt(discountHt) : formatDiscountValue(booking.discount)}</dd>
  </div>
)}
```

`booking.priceHt` is already net, so `totalHt` is unchanged — add a comment saying so.

- [ ] **Step 3: Charges** — `CHARGE_KINDS` gains `"discount"`; label maps gain `discount: "Discount"`; negative amounts already render via `formatPriceHt` (verify a `−` sign shows; if the formatter drops the sign, wrap with a red `text-destructive` class for negatives).

- [ ] **Step 4: Verify & commit** — quote a room as a member on a discounted plan; details show the code; charges list shows the negative row with the "Discount" label. `git commit -am "feat(bookings,charges): show discounts"`.

---

### Task 6: End-to-end check

- [ ] Use `/run` (project skill) with the backend seeded: walk the OfficeRnD scenario — create `10LOYALTY` (plan), `MEMBER5` (rate, attached to Part-time), `SUMMER26` (promo, this month); membership with `10LOYALTY` → charges; member booking → quote line; public site (public-booking-page plan) → booking request typing `SUMMER26` → pending booking shows the requested code → confirm keeping it → details + charges; a plan request with the code → opportunity shows it → onboarding with **Remove** → membership without a discount line. Note anything that differs from the spec in `docs/superpowers/plans/2026-08-28-discounts-admin.md` under a "Findings" heading and fix before merging.
- [ ] `npm run lint && npm run build`; open a PR from `feat/discounts`.

## Self-review

- Spec §8 items 1–5 → Tasks 2, 3, 4, 5, 6. Regeneration → Task 0. Arithmetic mirror → Task 1.
- Names used consistently: `formatDiscountValue`, `isInWindow`, `DISCOUNT_KIND_LABELS` (Task 1) in Tasks 2–5; `totalDiscount` (Task 1) in Task 4; wrapper names (`getListDiscounts`, `createDiscount`, `updateDiscount`, `archiveDiscount`) fixed in Task 0 Step 2 — adjust if the generator prints different names.
- Judgement calls flagged: charges availability in the details dialog (Task 5 Step 2); exact location of the onboarding dialog and opportunities pages (Task 4 Steps 6/6b); the confirm dialog file (Task 5 Step 1b).
