"use client"

import { useEffect, useActionState, useRef } from "react"
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
import type { PlanDto } from "@/lib/service/HsService"
import { createPlanAction, updatePlanAction } from "./actions"
import { toast } from "sonner"

interface AddPlanFormProps {
  isOpen: boolean
  onClose: () => void
  editingPlan?: PlanDto | null
}

function SubmitButton({ editingPlan }: Readonly<{ editingPlan?: PlanDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingPlan ? "Updating..." : "Creating..."
    return editingPlan ? "Update" : "Create Plan"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddPlanForm({ isOpen, onClose, editingPlan }: Readonly<AddPlanFormProps>) {
  const [createState, createFormAction] = useActionState(createPlanAction, {})
  const [updateState, updateFormAction] = useActionState(updatePlanAction, {})

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Plan created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Plan updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const currentState = editingPlan ? updateState : createState
  const formAction = editingPlan ? updateFormAction : createFormAction

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
            <DrawerTitle>{editingPlan ? "Edit Plan" : "Add New Plan"}</DrawerTitle>
            <DrawerDescription>
              {editingPlan ? "Update the catalog plan details." : "Create a new membership plan for your catalog."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingPlan?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingPlan && <input type="hidden" name="id" value={editingPlan.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Full time +" defaultValue={editingPlan?.name || ""} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" placeholder="FT_PLUS" defaultValue={editingPlan?.code || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kind">Kind</Label>
                  <select id="kind" name="kind" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editingPlan?.kind || "recurring"}>
                    <option value="recurring">Recurring</option>
                    <option value="one_off">One-off</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cycleMonths">Cycle months</Label>
                  <Input id="cycleMonths" name="cycleMonths" type="number" min="1" defaultValue={editingPlan?.cycleMonths || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priceHtMillimes">Price (millimes)</Label>
                  <Input id="priceHtMillimes" name="priceHtMillimes" type="number" min="0" defaultValue={editingPlan?.priceHtMillimes || 0} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vatRateBp">VAT (basis points)</Label>
                  <Input id="vatRateBp" name="vatRateBp" type="number" min="0" defaultValue={editingPlan?.vatRateBp || 1900} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="depositMillimes">Deposit (millimes)</Label>
                  <Input id="depositMillimes" name="depositMillimes" type="number" min="0" defaultValue={editingPlan?.depositMillimes || 0} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cancellationDays">Cancellation days</Label>
                  <Input id="cancellationDays" name="cancellationDays" type="number" min="0" defaultValue={editingPlan?.cancellationDays || 0} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea id="description" name="description" rows={3} defaultValue={editingPlan?.description || ""} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="hidden" defaultChecked={editingPlan?.hidden || false} />
                  Hidden
                </label>
                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingPlan={editingPlan} />
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
