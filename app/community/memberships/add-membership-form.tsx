"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getListMembers, getListCompanies, getListPlans } from "@/lib/service"
import type { CompanyDto, MemberDto, MembershipDto, PlanDto } from "@/lib/service/HsService"
import { formatDate, formatEnumLabel, formatPriceHt, formatVatRate } from "@/lib/format"
import { benefitLabel } from "@/lib/benefits"
import { createMembershipAction, updateMembershipAction } from "./actions"
import { billingCycleLabel, membershipSnapshot } from "./membership-snapshot"
import { MEMBERSHIP_STATUS_CLASSES, MEMBERSHIP_STATUS_LABELS } from "./membership-status"
import { toast } from "sonner"

interface AddMembershipFormProps {
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

/** Same rhythm as a field in the add drawer, visibly inert. */
const readOnlyClassName =
  "flex min-h-10 w-full items-center rounded-md border border-input bg-muted/40 px-3 py-2 text-sm"

function ReadOnlyField({
  label,
  hint,
  children,
}: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className={readOnlyClassName}>{children}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** A row of the frozen terms table. */
function Term({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b px-3 py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  )
}

function SubmitButton({ editingMembership }: Readonly<{ editingMembership?: MembershipDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingMembership ? "Updating..." : "Creating..."
    return editingMembership ? "Update" : "Create Membership"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddMembershipForm({
  isOpen,
  onClose,
  editingMembership,
  memberNames: seedMemberNames,
  companyNames: seedCompanyNames,
  plans: seedPlans,
}: Readonly<AddMembershipFormProps>) {
  const [memberNames, setMemberNames] = useState<Record<string, string>>(seedMemberNames ?? {})
  const [companyNames, setCompanyNames] = useState<Record<string, string>>(seedCompanyNames ?? {})
  const [plans, setPlans] = useState<PlanDto[]>(seedPlans ?? [])
  const [createState, createFormAction] = useActionState(createMembershipAction, {})
  const [updateState, updateFormAction] = useActionState(updateMembershipAction, {})
  const [customerKind, setCustomerKind] = useState<CustomerKind>("member")
  const [planId, setPlanId] = useState("")

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      setCustomerKind(editingMembership?.companyId ? "company" : "member")
      setPlanId(editingMembership?.planId ?? "")
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
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Membership created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Membership updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const selectedPlan = plans.find((plan) => plan.id === planId)
  const currentState = editingMembership ? updateState : createState
  const formAction = editingMembership ? updateFormAction : createFormAction

  // What the membership actually runs on, rather than what the catalog says today.
  const snapshot = membershipSnapshot(editingMembership ?? ({ planSnapshot: {} } as MembershipDto))
  const cycle = billingCycleLabel(snapshot.plan)
  const planCode = snapshot.plan?.code
  const customerName = editingMembership?.companyId
    ? companyNames[editingMembership.companyId]
    : editingMembership?.memberId
      ? memberNames[editingMembership.memberId]
      : null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[440px] ml-auto">
        <div className="flex h-full flex-col">
          <div className="flex justify-end p-4 pb-0">
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>

          <DrawerHeader className="px-6 pb-4">
            <DrawerTitle>{editingMembership ? "Edit Membership" : "Add New Membership"}</DrawerTitle>
            <DrawerDescription>
              {editingMembership
                ? "Only the label and notes can change; the terms are fixed to the plan snapshot."
                : "Subscribe a member or a company to a catalog plan."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingMembership?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingMembership && <input type="hidden" name="id" value={editingMembership.id} />}
              <div className="space-y-6">
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
                    create-only — the update schema takes name and notes alone.
                    On edit the same ground is shown, read-only, plus the
                    snapshot the membership actually bills on. */}
                {editingMembership ? (
                  <>
                    <ReadOnlyField label="Status">
                      <Badge
                        variant="secondary"
                        className={`${MEMBERSHIP_STATUS_CLASSES[editingMembership.status] ?? ""} border-0`}
                      >
                        {MEMBERSHIP_STATUS_LABELS[editingMembership.status] ?? editingMembership.status}
                      </Badge>
                    </ReadOnlyField>

                    <ReadOnlyField
                      label="Customer"
                      hint={`Charged to the ${editingMembership.billTo}.`}
                    >
                      {customerName ?? (
                        <span className="text-muted-foreground">Unknown customer</span>
                      )}
                    </ReadOnlyField>

                    <ReadOnlyField label="Plan" hint={planCode ? `Code ${planCode}` : undefined}>
                      {snapshot.plan?.name ?? (
                        <span className="text-muted-foreground">Not in the snapshot</span>
                      )}
                    </ReadOnlyField>

                    <div className="grid grid-cols-2 gap-3">
                      <ReadOnlyField label="Starts at">
                        {formatDate(editingMembership.startsAt)}
                      </ReadOnlyField>
                      <ReadOnlyField label="Ends at">
                        {editingMembership.endsAt ? (
                          formatDate(editingMembership.endsAt)
                        ) : (
                          <span className="text-muted-foreground">Open-ended</span>
                        )}
                      </ReadOnlyField>
                    </div>

                    {editingMembership.cancelledAt && (
                      <ReadOnlyField
                        label="Cancelled at"
                        hint="It keeps running until the last active day above."
                      >
                        {formatDate(editingMembership.cancelledAt)}
                      </ReadOnlyField>
                    )}

                    {/* The contract it bills on. The catalog plan may have been
                        repriced or archived since; none of that reaches a
                        membership already sold, so this is the figure that counts. */}
                    <div className="grid gap-2">
                      <Label>Plan snapshot</Label>
                      <div className="rounded-md border text-sm">
                        <Term
                          label="Price (HT)"
                          value={formatPriceHt(snapshot.plan?.priceHt)}
                        />
                        <Term label="VAT" value={formatVatRate(snapshot.plan?.vatRate)} />
                        <Term label="Deposit" value={formatPriceHt(snapshot.plan?.deposit)} />
                        {cycle && <Term label="Billing cycle" value={cycle} />}
                        {snapshot.plan?.kind && (
                          <Term label="Kind" value={formatEnumLabel(snapshot.plan.kind)} />
                        )}
                        <Term
                          label="Notice period"
                          value={
                            snapshot.plan?.cancellationDays
                              ? `${snapshot.plan.cancellationDays} days`
                              : "None"
                          }
                        />
                        {snapshot.snapshotAt && (
                          <Term label="Taken" value={formatDate(snapshot.snapshotAt)} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Frozen at creation. Later changes to the catalog plan do not
                        reach this membership.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label>Extras</Label>
                      {snapshot.extras.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No extras were taken with this membership.
                        </p>
                      ) : (
                        <div className="rounded-md border text-sm">
                          {snapshot.extras.map((extra) => (
                            <Term
                              key={extra.extraId}
                              label={extra.name}
                              value={
                                <>
                                  {formatPriceHt(extra.priceHt)}
                                  <span className="block text-xs text-muted-foreground">
                                    VAT {formatVatRate(extra.vatRate)}
                                    {extra.deposit
                                      ? ` · deposit ${formatPriceHt(extra.deposit)}`
                                      : ""}
                                  </span>
                                </>
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>Included benefits</Label>
                      {snapshot.benefits.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          This plan grants no benefits.
                        </p>
                      ) : (
                        <ul className="grid gap-1 rounded-md border bg-muted/40 p-3">
                          {snapshot.benefits.map((benefit, index) => (
                            // Snapshot benefits carry no id of their own, and the
                            // list is a frozen copy that never reorders.
                            <li key={index} className="text-sm text-muted-foreground">
                              {benefitLabel(benefit)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <>
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

                    <div className="grid gap-2">
                      <Label htmlFor="planId">Plan</Label>
                      <select
                        id="planId"
                        name="planId"
                        className={selectClassName}
                        value={planId}
                        onChange={(e) => setPlanId(e.target.value)}
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

                    <div className="grid gap-2">
                      <Label htmlFor="priceHt">Price override (TND)</Label>
                      <Input
                        id="priceHt"
                        name="priceHt"
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder={selectedPlan ? String(selectedPlan.priceHt) : "Plan price"}
                      />
                      <p className="text-xs text-muted-foreground">
                        Overrides the plan price for this membership only.
                      </p>
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

                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingMembership={editingMembership} />
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
