"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { ExtraTagPicker } from "@/components/extra-tag-picker"
import { Input } from "@/components/ui/input"
import { DateField } from "@/components/ui/date-field"
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
import type {
  ExtraDto,
  OpportunityDto,
  RequestedExtraDto,
} from "@/lib/service/HsService"
import type { OpportunityOptions } from "./use-opportunity-options"
import { apiNumber, apiString } from "@/lib/api-value"
import { formatPriceHt } from "@/lib/format"
import { createOpportunityAction, updateOpportunityAction } from "./actions"
import { benefitLabel } from "@/lib/benefits"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_INTEREST_VALUES,
  OPPORTUNITY_STAGE_EDITABLE_VALUES,
  OPPORTUNITY_STAGE_LABELS,
} from "./opportunity-meta"
import { toast } from "sonner"

interface AddOpportunityFormProps {
  isOpen: boolean
  onClose: () => void
  /** Loaded by the caller before opening, so no select starts out empty. */
  options: OpportunityOptions
  editingOpportunity?: OpportunityDto | null
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"

function SubmitButton({ editingOpportunity }: Readonly<{ editingOpportunity?: OpportunityDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingOpportunity ? "Updating..." : "Creating..."
    return editingOpportunity ? "Update" : "Create Opportunity"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddOpportunityForm({
  isOpen,
  onClose,
  options,
  editingOpportunity,
}: Readonly<AddOpportunityFormProps>) {
  const { members, plans, resources } = options
  const [createState, createFormAction] = useActionState(createOpportunityAction, {})
  const [updateState, updateFormAction] = useActionState(updateOpportunityAction, {})
  // Controlled rather than defaultValue: the plan drives which add-ons are
  // offered, and the selection has to survive that changing.
  const [memberId, setMemberId] = useState(editingOpportunity?.memberId ?? "")
  const [planId, setPlanId] = useState(apiString(editingOpportunity?.requestedPlanId) ?? "")
  const [resourceId, setResourceId] = useState(
    apiString(editingOpportunity?.requestedResourceId) ?? ""
  )
  const [extraIds, setExtraIds] = useState<string[]>(
    editingOpportunity?.requestedExtras?.map((extra) => extra.extraId) ?? []
  )
  const [quotedPrice, setQuotedPrice] = useState(
    apiNumber(editingOpportunity?.requestedPlanPriceHt)?.toString() ?? ""
  )
  // The day they asked for; DateField is controlled and posts it hidden.
  const [requestedDate, setRequestedDate] = useState(
    apiString(editingOpportunity?.requestedDate) ?? ""
  )

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    createNotifiedRef.current = false
    updateNotifiedRef.current = false
  }, [isOpen])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Opportunity created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Opportunity updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const currentState = editingOpportunity ? updateState : createState
  const formAction = editingOpportunity ? updateFormAction : createFormAction

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null
  const planExtras: ExtraDto[] = selectedPlan?.extras ?? []
  // Onboarding assigns desks and offices; bookable spaces are refused. Each
  // resource carries its type, so knowing that costs nothing.
  const assignableResources = resources.filter(
    (resource) => resource.resourceType?.canAssign
  )

  // Stored by value, the way a website plan request stores them.
  const selectedExtras: RequestedExtraDto[] = planExtras
    .filter((extra) => extraIds.includes(extra.id))
    .map((extra) => ({
      extraId: extra.id,
      name: extra.name,
      priceHt: extra.priceHt,
      vatRate: extra.vatRate,
    }))

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.priceHt, 0)

  // What the deal is worth: the plan fee actually quoted, plus the add-ons that
  // bill alongside it. Typing a third number by hand only invited it to drift
  // from the two it is made of.
  const planFee = quotedPrice.trim()
    ? Number(quotedPrice)
    : (selectedPlan?.priceHt ?? null)
  const expectedValue =
    planFee === null || Number.isNaN(planFee) ? null : planFee + extrasTotal

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[460px] ml-auto">
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
            <DrawerTitle>
              {editingOpportunity ? "Edit Opportunity" : "Add New Opportunity"}
            </DrawerTitle>
            <DrawerDescription>
              {editingOpportunity
                ? "Move it through the pipeline as the conversation progresses."
                : "Track a lead's interest from first contact to won or lost."}
            </DrawerDescription>
          </DrawerHeader>

          <form
            key={editingOpportunity?.id || "create"}
            action={formAction}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingOpportunity && <input type="hidden" name="id" value={editingOpportunity.id} />}
              <input type="hidden" name="requestedExtras" value={JSON.stringify(selectedExtras)} />
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="memberId">Member</Label>
                  <select
                    id="memberId"
                    name="memberId"
                    className={selectClassName}
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                    disabled={Boolean(editingOpportunity)}
                    required={!editingOpportunity}
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                  {editingOpportunity && (
                    <p className="text-xs text-muted-foreground">
                      An opportunity stays with the member it was opened for.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="interest">Interest</Label>
                  <select
                    id="interest"
                    name="interest"
                    className={selectClassName}
                    defaultValue={editingOpportunity?.interest || "coworking"}
                    required
                  >
                    {OPPORTUNITY_INTEREST_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {OPPORTUNITY_INTEREST_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stage">Stage</Label>
                  <select
                    id="stage"
                    name="stage"
                    className={selectClassName}
                    defaultValue={
                      editingOpportunity?.stage === "won" ? "quote" : editingOpportunity?.stage || "new"
                    }
                  >
                    {OPPORTUNITY_STAGE_EDITABLE_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {OPPORTUNITY_STAGE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Won is set by converting the lead, not from here.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="requestedPlanId">Requested plan</Label>
                  <select
                    id="requestedPlanId"
                    name="requestedPlanId"
                    className={selectClassName}
                    value={planId}
                    onChange={(event) => {
                      setPlanId(event.target.value)
                      // Add-ons belong to a plan; the old ones would be refused.
                      setExtraIds([])
                    }}
                  >
                    <option value="">None</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatPriceHt(plan.priceHt)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlan && selectedPlan.benefits.length > 0 && (
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs font-medium">Included with this plan</p>
                    <ul className="pt-2 space-y-1">
                      {selectedPlan.benefits.map((benefit) => (
                        <li key={benefit.id} className="text-xs text-muted-foreground">
                          {benefitLabel(benefit)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedPlan && (
                  <div className="grid gap-2">
                    <Label>Paid add-ons</Label>
                    {planExtras.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        This plan offers no add-ons.
                      </p>
                    ) : (
                      <ExtraTagPicker
                        extras={planExtras}
                        value={extraIds}
                        onChange={setExtraIds}
                      />
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="requestedResourceId">Requested space</Label>
                  <select
                    id="requestedResourceId"
                    name="requestedResourceId"
                    className={selectClassName}
                    value={resourceId}
                    onChange={(event) => setResourceId(event.target.value)}
                  >
                    <option value="">None</option>
                    {assignableResources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Assignable desks and offices. Converting holds this space from
                    day one; leave it unset and assign one later.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="requestedPlanPriceHt">Quoted price (TND)</Label>
                  <Input
                    id="requestedPlanPriceHt"
                    name="requestedPlanPriceHt"
                    type="number"
                    min="0"
                    step="0.001"
                    value={quotedPrice}
                    onChange={(event) => setQuotedPrice(event.target.value)}
                    placeholder={
                      selectedPlan ? String(selectedPlan.priceHt) : "Plan price"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    The plan fee for this lead. Empty means the plan&apos;s own
                    price. Add-ons bill on top of it.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expectedValue">Expected value (TND)</Label>
                  <Input
                    id="expectedValue"
                    type="text"
                    value={expectedValue === null ? "" : formatPriceHt(expectedValue)}
                    placeholder="Pick a plan below"
                    disabled
                    readOnly
                  />
                  {/* Disabled inputs submit nothing, so the figure travels here. */}
                  <input
                    type="hidden"
                    name="expectedValue"
                    value={expectedValue ?? ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    {expectedValue === null
                      ? "Set by the requested plan and its add-ons."
                      : `Quoted plan fee${
                          selectedExtras.length > 0
                            ? ` + ${selectedExtras.length} add-on${
                                selectedExtras.length > 1 ? "s" : ""
                              } (${formatPriceHt(extrasTotal)})`
                            : ""
                        }.`}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="requestedDate">Requested date</Label>
                  {/* In place, not portalled: inside the vaul drawer a portalled
                      calendar renders but eats every click (see convert-lead-form). */}
                  <DateField
                    id="requestedDate"
                    name="requestedDate"
                    value={requestedDate}
                    onChange={setRequestedDate}
                    placeholder="No date"
                    clearable
                    portalled={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    The day they asked for — a trial day, a meeting, a move-in. A wish
                    to confirm, not a booking.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="requestedDiscountCode">Discount code</Label>
                  <Input
                    id="requestedDiscountCode"
                    name="requestedDiscountCode"
                    placeholder="What the visitor typed, if anything"
                    defaultValue={apiString(editingOpportunity?.requestedDiscountCode) ?? ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Never validated or priced here — staff keep, clear or correct it
                    before converting the lead.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    name="source"
                    placeholder="Website, referral, walk-in"
                    defaultValue={apiString(editingOpportunity?.source) ?? ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    defaultValue={apiString(editingOpportunity?.notes) ?? ""}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingOpportunity={editingOpportunity} />
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
