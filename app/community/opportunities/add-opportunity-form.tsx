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
import { getListMembers, getListPlans } from "@/lib/service"
import type { MemberDto, OpportunityDto, PlanDto } from "@/lib/service/HsService"
import { apiNumber, apiString } from "@/lib/api-value"
import { formatPriceHt } from "@/lib/format"
import { createOpportunityAction, updateOpportunityAction } from "./actions"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_INTEREST_VALUES,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_VALUES,
} from "./opportunity-meta"
import { toast } from "sonner"

interface AddOpportunityFormProps {
  isOpen: boolean
  onClose: () => void
  editingOpportunity?: OpportunityDto | null
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

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
  editingOpportunity,
}: Readonly<AddOpportunityFormProps>) {
  const [createState, createFormAction] = useActionState(createOpportunityAction, {})
  const [updateState, updateFormAction] = useActionState(updateOpportunityAction, {})
  const [members, setMembers] = useState<MemberDto[]>([])
  const [plans, setPlans] = useState<PlanDto[]>([])

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    createNotifiedRef.current = false
    updateNotifiedRef.current = false

    let cancelled = false
    Promise.all([
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListPlans({ limit: 100, offset: 0, sort: "ASC" }),
    ])
      .then(([memberPage, planPage]) => {
        if (cancelled) return
        setMembers((memberPage.results ?? []) as MemberDto[])
        setPlans((planPage.results ?? []) as PlanDto[])
      })
      .catch((error) => console.error("Failed to load opportunity options", error))

    return () => {
      cancelled = true
    }
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

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[420px] ml-auto">
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
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="memberId">Member</Label>
                  <select
                    id="memberId"
                    name="memberId"
                    className={selectClassName}
                    defaultValue={editingOpportunity?.memberId || ""}
                    required
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
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
                    defaultValue={editingOpportunity?.stage || "new"}
                  >
                    {OPPORTUNITY_STAGE_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {OPPORTUNITY_STAGE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expectedValue">Expected value (TND)</Label>
                  <Input
                    id="expectedValue"
                    name="expectedValue"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={apiNumber(editingOpportunity?.expectedValue) ?? ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="requestedPlanId">Requested plan</Label>
                  <select
                    id="requestedPlanId"
                    name="requestedPlanId"
                    className={selectClassName}
                    defaultValue={apiString(editingOpportunity?.requestedPlanId) ?? ""}
                  >
                    <option value="">None</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatPriceHt(plan.priceHt)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="requestedPlanPriceHt">Quoted price (TND)</Label>
                  <Input
                    id="requestedPlanPriceHt"
                    name="requestedPlanPriceHt"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={apiNumber(editingOpportunity?.requestedPlanPriceHt) ?? ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Overrides the plan price in the quote.
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
