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
import { getListExtras, getListPlanCategories } from "@/lib/service"
import type { ExtraDto, PlanCategoryDto, PlanDto, PlanKind } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
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
  const [kind, setKind] = useState<PlanKind>("recurring")
  const [extras, setExtras] = useState<ExtraDto[]>([])
  const [categories, setCategories] = useState<PlanCategoryDto[]>([])
  const [isLoadingExtras, setIsLoadingExtras] = useState(false)
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([])

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      setKind(editingPlan?.kind ?? "recurring")
      setSelectedExtraIds((editingPlan?.extras ?? []).map((extra) => extra.id))
      fetchExtras()
      fetchCategories()
    } else {
      setExtras([])
      setCategories([])
      setSelectedExtraIds([])
    }
  }, [isOpen, editingPlan])

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

  const fetchExtras = async () => {
    setIsLoadingExtras(true)
    try {
      const response = await getListExtras({ limit: 100, offset: 0, sort: "ASC" })
      setExtras((response.results ?? []) as ExtraDto[])
    } catch (error) {
      console.error("Failed to fetch extras", error)
    } finally {
      setIsLoadingExtras(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await getListPlanCategories({ limit: 100, offset: 0, sort: "ASC" })
      setCategories((response.results ?? []) as PlanCategoryDto[])
    } catch (error) {
      console.error("Failed to fetch plan categories", error)
    }
  }

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    )
  }

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
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={editingPlan?.categoryId ?? ""}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    The website service section this plan is sold under.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kind">Kind</Label>
                  <select
                    id="kind"
                    name="kind"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as PlanKind)}
                  >
                    <option value="recurring">Recurring</option>
                    <option value="one_off">One-off</option>
                  </select>
                </div>
                {/* Required for recurring plans, forbidden for one-off ones. */}
                {kind === "recurring" && (
                  <div className="grid gap-2">
                    <Label htmlFor="cycleMonths">Cycle months</Label>
                    <Input
                      id="cycleMonths"
                      name="cycleMonths"
                      type="number"
                      min="1"
                      defaultValue={editingPlan?.cycleMonths ?? 1}
                      required
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="priceHt">Price excl. VAT (TND)</Label>
                  <Input
                    id="priceHt"
                    name="priceHt"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={editingPlan?.priceHt ?? 0}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vatRate">VAT rate (%)</Label>
                  <Input
                    id="vatRate"
                    name="vatRate"
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={editingPlan?.vatRate ?? 19}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deposit">Deposit (TND)</Label>
                  <Input
                    id="deposit"
                    name="deposit"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={editingPlan?.deposit ?? 0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cancellationDays">Cancellation days</Label>
                  <Input
                    id="cancellationDays"
                    name="cancellationDays"
                    type="number"
                    min="0"
                    defaultValue={editingPlan?.cancellationDays ?? 0}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Extras</Label>
                  {(() => {
                    if (isLoadingExtras) {
                      return <p className="text-sm text-muted-foreground">Loading extras...</p>
                    }
                    if (extras.length === 0) {
                      return <p className="text-sm text-muted-foreground">No extras defined yet.</p>
                    }
                    return (
                      <div className="grid gap-2 rounded-md border border-input p-3">
                        {extras.map((extra) => (
                          <label key={extra.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="extraIds"
                              value={extra.id}
                              checked={selectedExtraIds.includes(extra.id)}
                              onChange={() => toggleExtra(extra.id)}
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
                    )
                  })()}
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
