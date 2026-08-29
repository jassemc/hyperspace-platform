"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getListMembers, getListCompanies, getListPlans, getListDiscounts, getDiscount } from "@/lib/service"
import type {
  CompanyDto,
  DiscountDto,
  MemberDto,
  MembershipDiscountDto,
  MembershipDto,
  PlanDto,
} from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { formatDiscountValue, isInWindow } from "@/app/billing/discounts/discount-meta"
import { totalDiscount } from "@/lib/pricing/discount-math"
import { createMembershipAction, updateMembershipAction } from "./actions"
import type { ActionState } from "@/lib/action-state"
import { toast } from "sonner"

interface MembershipFormDialogProps {
  isOpen: boolean
  onClose: () => void
  editingMembership?: MembershipDto | null
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
  plans?: PlanDto[]
}

type CustomerKind = "member" | "company"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

/**
 * Labels the option for a membership's assigned discount that fell out of
 * the fetched active/eligible list. `resolved` (a real backend record, from
 * either fetch) is the only source trusted to call it "no longer eligible" —
 * a loading state or a failed lookup falls back to the frozen snapshot, or
 * worst case the bare id, so the option — and the value it keeps matched —
 * never depends on a network round trip succeeding.
 */
function assignedDiscountLabel(
  resolved: Pick<DiscountDto, "code" | "percentOff" | "amountOffHt"> | null,
  snapshot: Pick<MembershipDiscountDto, "code" | "percentOff" | "amountOffHt"> | null | undefined,
  id: string
): string {
  if (resolved) return `${resolved.code} — ${formatDiscountValue(resolved)} (no longer eligible)`
  if (snapshot?.code) return `${snapshot.code} — ${formatDiscountValue(snapshot)}`
  return id
}

function messageFor(state: ActionState, fallback: string): string {
  switch (state.problemType) {
    case "customer_xor_violation":
      return "Pick a member or a company, not both."
    case "plan_archived":
      return "That plan is archived and cannot be sold."
    case "membership_before_company_start":
      return "The membership cannot start before the company does."
    case "membership_end_before_start":
      return "The end date is before the start date."
    case "extra_not_on_plan":
      return "One of the extras is not offered on this plan."
    default:
      return state.error ?? fallback
  }
}

function SubmitButton({
  editingMembership,
  disabled,
}: Readonly<{ editingMembership?: MembershipDto | null; disabled?: boolean }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingMembership ? "Updating..." : "Creating..."
    return editingMembership ? "Update" : "Create Membership"
  }

  return (
    <Button type="submit" disabled={pending || disabled} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function MembershipFormDialog({
  isOpen,
  onClose,
  editingMembership,
  memberNames: seedMemberNames,
  companyNames: seedCompanyNames,
  plans: seedPlans,
}: Readonly<MembershipFormDialogProps>) {
  const [memberNames, setMemberNames] = useState<Record<string, string>>(seedMemberNames ?? {})
  const [companyNames, setCompanyNames] = useState<Record<string, string>>(seedCompanyNames ?? {})
  const [plans, setPlans] = useState<PlanDto[]>(seedPlans ?? [])
  const [createState, createFormAction] = useActionState(createMembershipAction, {})
  const [updateState, updateFormAction] = useActionState(updateMembershipAction, {})
  const [customerKind, setCustomerKind] = useState<CustomerKind>("member")
  const [planId, setPlanId] = useState("")
  const [discounts, setDiscounts] = useState<DiscountDto[]>([])
  const [discountId, setDiscountId] = useState("")
  // The membership's own discount, fetched by id when it isn't in the
  // active/eligible list above (archived, expired, or unhooked from the
  // plan) — without it the seeded discountId has no matching <option>.
  const [assignedDiscount, setAssignedDiscount] = useState<DiscountDto | null>(null)
  const [discountsLoading, setDiscountsLoading] = useState(false)
  const [discountsError, setDiscountsError] = useState(false)
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([])
  const [priceOverride, setPriceOverride] = useState<number | undefined>(undefined)

  // The last state object each notify effect has already reacted to.
  // `useActionState` hands back a fresh object on every dispatch, so
  // identity — not a boolean flag — is what tells a real submission apart
  // from an unrelated re-render.
  const lastCreateStateRef = useRef<ActionState | null>(null)
  const lastUpdateStateRef = useRef<ActionState | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCustomerKind(editingMembership?.companyId ? "company" : "member")
      setPlanId(editingMembership?.planId ?? "")
      setDiscountId(editingMembership?.discountId ?? "")
      setSelectedExtraIds([])
      setPriceOverride(undefined)
      setAssignedDiscount(null)
      setDiscountsError(false)
    }
  }, [isOpen, editingMembership])

  // Discounts are scoped to a plan (or applied to every plan, with an
  // optional validity window), so the whole active catalog is fetched once
  // per open and filtered client-side against whichever plan is selected.
  // An edit's own discount may have fallen out of that list (archived,
  // expired, or detached from the plan) — it is fetched separately by id
  // so the select usually has a matching option
  // straight from the backend. Either request can still fail outright
  // (network, 5xx): that must never cost the membership its discount, so a
  // snapshot-derived fallback option (built below, from `editingMembership`
  // alone) covers that case regardless of what these two requests do.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const assignedId = editingMembership?.discountId ?? null

    setDiscountsLoading(true)
    setDiscountsError(false)
    // 100 is the API's page cap; 200 was a permanent 422.
    getListDiscounts({ limit: 100, offset: 0, sort: "ASC", status: "active" })
      .then(async (page) => {
        if (cancelled) return
        const list = (page.results ?? []) as DiscountDto[]
        setDiscounts(list)

        if (assignedId && !list.some((d) => d.id === assignedId)) {
          try {
            const discount = await getDiscount(assignedId)
            if (!cancelled) setAssignedDiscount(discount as DiscountDto)
          } catch (error) {
            console.error("Failed to load the assigned discount", error)
            if (!cancelled) setDiscountsError(true)
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load discounts", error)
        if (!cancelled) setDiscountsError(true)
      })
      .finally(() => {
        if (!cancelled) setDiscountsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, editingMembership])

  // The page-level Add button renders this form with no seed data, so the
  // lookups are fetched here rather than threaded through every caller.
  useEffect(() => {
    if (!isOpen) return
    if ((seedPlans ?? []).length > 0) return

    let cancelled = false
    Promise.all([
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
      getListPlans({ limit: 100, offset: 0, sort: "ASC" }),
    ])
      .then(([memberPage, companyPage, planPage]) => {
        if (cancelled) return
        setMemberNames(
          Object.fromEntries(
            ((memberPage.results ?? []) as MemberDto[]).map((m) => [m.id, m.fullName])
          )
        )
        setCompanyNames(
          Object.fromEntries(
            ((companyPage.results ?? []) as CompanyDto[]).map((c) => [c.id, c.name])
          )
        )
        setPlans((planPage.results ?? []) as PlanDto[])
      })
      .catch((error) => console.error("Failed to load membership options", error))

    return () => {
      cancelled = true
    }
  }, [isOpen, seedPlans])

  useEffect(() => {
    if (createState === lastCreateStateRef.current) return
    lastCreateStateRef.current = createState

    if (createState.success) {
      toast.success("Membership created")
      onClose()
    } else if (createState.error) {
      toast.error(messageFor(createState, "Failed to create membership"))
    }
  }, [createState, onClose])

  useEffect(() => {
    if (updateState === lastUpdateStateRef.current) return
    lastUpdateStateRef.current = updateState

    if (updateState.success) {
      toast.success("Membership updated")
      onClose()
    } else if (updateState.error) {
      toast.error(messageFor(updateState, "Failed to update membership"))
    }
  }, [updateState, onClose])

  const selectedPlan = plans.find((plan) => plan.id === planId)
  const currentState = editingMembership ? updateState : createState
  const formAction = editingMembership ? updateFormAction : createFormAction

  // Only plan-kind discounts ever fit a membership; a discount fits when it
  // applies to every plan or lists this one, and is inside its validity
  // window (any kind may carry one now).
  const eligibleDiscounts = discounts.filter(
    (d) =>
      d.kind === "plan" &&
      (d.appliesToAll || (!!selectedPlan && d.planIds.includes(selectedPlan.id))) &&
      isInWindow(d)
  )
  const selectedDiscount = eligibleDiscounts.find((d) => d.id === discountId)

  // Edit mode only: the membership's own discount, when it fell out of
  // `eligibleDiscounts` above — rendered as its own option so the seeded
  // discountId always has somewhere to land instead of a save silently
  // resolving to whatever option a mismatched value happens to fall back
  // to. `resolved` prefers real backend data (from either fetch, including
  // one merely excluded from eligibility) over the frozen snapshot; the
  // label only claims "no longer eligible" once `resolved` confirms it —
  // otherwise this still has to produce *an* option (snapshot code, or
  // worst case the bare id) so the value round-trips even when both
  // network requests failed outright.
  const assignedDiscountId = editingMembership?.discountId ?? null
  const assignedResolved =
    (assignedDiscountId && discounts.find((d) => d.id === assignedDiscountId)) ||
    (assignedDiscountId && assignedDiscount?.id === assignedDiscountId ? assignedDiscount : null) ||
    null
  const snapshotDiscount = editingMembership?.discount
  const assignedFallback =
    assignedDiscountId && !eligibleDiscounts.some((d) => d.id === assignedDiscountId)
      ? {
          id: assignedDiscountId,
          label: assignedDiscountLabel(assignedResolved, snapshotDiscount, assignedDiscountId),
        }
      : null

  // Mirrors the create-only preview below; edit mode never renders it since
  // the plan fee and extras are frozen in the snapshot already.
  const basePriceHt = priceOverride ?? selectedPlan?.priceHt ?? 0
  const selectedExtras = (selectedPlan?.extras ?? []).filter((e) => selectedExtraIds.includes(e.id))
  const extrasHt = selectedExtras.reduce((s, e) => s + e.priceHt, 0)
  const discountHt = selectedDiscount
    ? totalDiscount(
        selectedDiscount,
        [
          { key: "plan", amountHt: basePriceHt },
          ...selectedExtras.map((e) => ({ key: `extra:${e.id}`, amountHt: e.priceHt })),
        ],
        "plan"
      )
    : 0

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editingMembership ? "Edit Membership" : "Add New Membership"}</DialogTitle>
          <DialogDescription>
            {editingMembership
              ? "Only the label, notes and discount can change; the terms are fixed to the plan snapshot."
              : "Subscribe a member or a company to a catalog plan."}
          </DialogDescription>
        </DialogHeader>
        <form key={editingMembership?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
          {/* Only this body scrolls; the header above and the footer below stay pinned. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-1 pr-2">
            {editingMembership && <input type="hidden" name="id" value={editingMembership.id} />}

            <div className="grid gap-2">
              <Label htmlFor="name">Label</Label>
              <Input
                id="name"
                name="name"
                placeholder="Falls back to the plan name"
                defaultValue={editingMembership?.name || ""}
              />
            </div>

            {/* The terms are snapshotted at creation, so everything below is
                create-only — the update schema takes name, notes and discount
                alone. Details owns the frozen snapshot display. */}
            {editingMembership ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="discountId">Discount</Label>
                  <select
                    id="discountId"
                    name="discountId"
                    className={selectClassName}
                    value={discountId}
                    onChange={(e) => setDiscountId(e.target.value)}
                  >
                    <option value="">No discount</option>
                    {assignedFallback && (
                      <option key={assignedFallback.id} value={assignedFallback.id}>
                        {assignedFallback.label}
                      </option>
                    )}
                    {eligibleDiscounts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {formatDiscountValue(d)}
                        {d.appliesToAll ? " (all plans)" : ""}
                      </option>
                    ))}
                  </select>
                  {eligibleDiscounts.length === 0 && !assignedFallback && (
                    <p className="text-xs text-muted-foreground">
                      No discount is eligible for this plan.
                    </p>
                  )}
                  {discountsError && (
                    <p className="text-xs text-amber-600">
                      Couldn&apos;t load discounts — the current discount is kept.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Changes apply to future, non-invoiced cycles only.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Terms are fixed to the plan snapshot. Open Details to see them.
                </p>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="customerKind">Customer type</Label>
                    <select
                      id="customerKind"
                      className={selectClassName}
                      value={customerKind}
                      onChange={(e) => setCustomerKind(e.target.value as CustomerKind)}
                    >
                      <option value="member">Member</option>
                      <option value="company">Company</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      A membership belongs to a member or a company, never both.
                    </p>
                  </div>

                  {customerKind === "member" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="memberId">Member</Label>
                      <select id="memberId" name="memberId" className={selectClassName} required>
                        <option value="">Select member</option>
                        {Object.entries(memberNames).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="companyId">Company</Label>
                      <select id="companyId" name="companyId" className={selectClassName} required>
                        <option value="">Select company</option>
                        {Object.entries(companyNames).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="planId">Plan</Label>
                    <select
                      id="planId"
                      name="planId"
                      className={selectClassName}
                      value={planId}
                      onChange={(e) => {
                        const nextPlanId = e.target.value
                        const nextPlan = plans.find((plan) => plan.id === nextPlanId)
                        setPlanId(nextPlanId)
                        // Extras and the discount both belong to the old
                        // plan; carrying them over would offer stale, or
                        // now-ineligible, options.
                        setSelectedExtraIds([])
                        setDiscountId((current) => {
                          const stillEligible = discounts.some(
                            (d) =>
                              d.id === current &&
                              d.kind === "plan" &&
                              (d.appliesToAll || (!!nextPlan && d.planIds.includes(nextPlan.id))) &&
                              isInWindow(d)
                          )
                          return stillEligible ? current : ""
                        })
                      }}
                      required
                    >
                      <option value="">Select plan</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} — {formatPriceHt(plan.priceHt)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discountId">Discount</Label>
                    <select
                      id="discountId"
                      name="discountId"
                      className={selectClassName}
                      value={discountId}
                      onChange={(e) => setDiscountId(e.target.value)}
                      disabled={!selectedPlan}
                    >
                      <option value="">{selectedPlan ? "No discount" : "Select a plan first"}</option>
                      {eligibleDiscounts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} — {formatDiscountValue(d)}
                          {d.appliesToAll ? " (all plans)" : ""}
                        </option>
                      ))}
                    </select>
                    {selectedPlan && eligibleDiscounts.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No discount is eligible for this plan.
                      </p>
                    )}
                  </div>
                </div>

                {selectedPlan && (selectedPlan.extras ?? []).length > 0 && (
                  <div className="grid gap-2">
                    <Label>Plan extras</Label>
                    <div className="grid gap-2 rounded-md border border-input p-3">
                      {(selectedPlan.extras ?? []).map((extra) => (
                        <label key={extra.id} className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="extraIds"
                            value={extra.id}
                            checked={selectedExtraIds.includes(extra.id)}
                            onChange={(e) =>
                              setSelectedExtraIds((current) =>
                                e.target.checked
                                  ? [...current, extra.id]
                                  : current.filter((id) => id !== extra.id)
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-input"
                          />
                          <span>
                            {extra.name}
                            <span className="block text-xs text-muted-foreground">
                              {formatPriceHt(extra.priceHt)}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="startsAt">Starts at</Label>
                    <Input id="startsAt" name="startsAt" type="date" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endsAt">Ends at</Label>
                    <Input id="endsAt" name="endsAt" type="date" />
                    <p className="text-xs text-muted-foreground">
                      Last active day, inclusive. Leave blank for open-ended.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="priceHt">Price override (TND)</Label>
                    <Input
                      id="priceHt"
                      name="priceHt"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder={selectedPlan ? String(selectedPlan.priceHt) : "Plan price"}
                      onChange={(e) => {
                        const raw = e.target.value
                        setPriceOverride(raw === "" ? undefined : Number(raw))
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deposit">Deposit override (TND)</Label>
                    <Input
                      id="deposit"
                      name="deposit"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder={selectedPlan ? String(selectedPlan.deposit) : "Plan deposit"}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="setupFee">Setup fee (HT)</Label>
                    <Input
                      id="setupFee"
                      name="setupFee"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Plan default"
                    />
                  </div>
                </div>

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
                      <dt className="text-muted-foreground">
                        Discount{selectedDiscount ? ` (${selectedDiscount.code})` : ""}
                      </dt>
                      <dd className="tabular-nums">{formatPriceHt(discountHt)}</dd>
                    </div>
                    <div className="flex justify-between border-t px-3 py-2 font-semibold">
                      <dt>Price per cycle</dt>
                      <dd className="tabular-nums">
                        {formatPriceHt(basePriceHt + extrasHt + discountHt)}
                      </dd>
                    </div>
                  </dl>
                )}
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editingMembership?.notes || ""}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {currentState.error && (
              <div className="text-sm text-red-600">
                {messageFor(currentState, "The membership could not be saved.")}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 shrink-0 border-t pt-4">
            <div className="flex w-full gap-3">
              <SubmitButton
                editingMembership={editingMembership}
                // A save before this settles could submit a discountId
                // with no matching option — see the discount-fetch effect.
                disabled={Boolean(editingMembership) && discountsLoading}
              />
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
