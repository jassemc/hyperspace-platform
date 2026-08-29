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
import { getListPlans, getListResourceRates, getListResourceTypes } from "@/lib/service"
import type {
  DiscountDto,
  DiscountKind,
  PlanDto,
  ResourceRateDto,
  ResourceTypeDto,
} from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { createDiscountAction, updateDiscountAction } from "./actions"
import { DISCOUNT_KIND_HELP, DISCOUNT_KIND_LABELS } from "./discount-meta"
import { RATE_INTERVAL_LABELS } from "../resource-rates/rate-meta"
import { toast } from "sonner"

interface AddDiscountFormProps {
  isOpen: boolean
  onClose: () => void
  editingDiscount?: DiscountDto | null
}

const DISCOUNT_KINDS: DiscountKind[] = ["plan", "resource_rate"]

function SubmitButton({ editingDiscount }: Readonly<{ editingDiscount?: DiscountDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingDiscount ? "Updating..." : "Creating..."
    return editingDiscount ? "Update" : "Create Discount"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddDiscountForm({
  isOpen,
  onClose,
  editingDiscount,
}: Readonly<AddDiscountFormProps>) {
  const [plans, setPlans] = useState<PlanDto[]>([])
  const [rates, setRates] = useState<ResourceRateDto[]>([])
  const [resourceTypeNames, setResourceTypeNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [kind, setKind] = useState<DiscountKind>("plan")
  const [valueType, setValueType] = useState<"percent" | "amount">("percent")
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])
  const [selectedRateIds, setSelectedRateIds] = useState<string[]>([])
  const [appliesToAll, setAppliesToAll] = useState(false)
  const [isPublic, setIsPublic] = useState(false)

  const [createState, createFormAction] = useActionState(createDiscountAction, {})
  const [updateState, updateFormAction] = useActionState(updateDiscountAction, {})

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      setKind(editingDiscount?.kind ?? "plan")
      setValueType(editingDiscount?.amountOffHt != null ? "amount" : "percent")
      setSelectedPlanIds(editingDiscount?.planIds ?? [])
      setSelectedRateIds(editingDiscount?.resourceRateIds ?? [])
      setAppliesToAll(editingDiscount?.appliesToAll ?? false)
      setIsPublic(editingDiscount?.isPublic ?? false)
      fetchPlans()
      fetchRates()
      fetchResourceTypes()
    } else {
      setPlans([])
      setRates([])
      setResourceTypeNames({})
    }
  }, [isOpen, editingDiscount])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Discount created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Discount updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const fetchPlans = async () => {
    setIsLoading(true)
    try {
      const response = await getListPlans({ limit: 100, offset: 0, sort: "ASC" })
      setPlans((response.results ?? []) as PlanDto[])
    } catch (error) {
      console.error("Failed to fetch plans", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRates = async () => {
    try {
      const response = await getListResourceRates({ limit: 100, offset: 0, sort: "ASC" })
      setRates((response.results ?? []) as ResourceRateDto[])
    } catch (error) {
      console.error("Failed to fetch resource rates", error)
    }
  }

  const fetchResourceTypes = async () => {
    try {
      const response = await getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })
      const names: Record<string, string> = {}
      for (const type of (response.results ?? []) as ResourceTypeDto[]) {
        names[type.id] = type.name
      }
      setResourceTypeNames(names)
    } catch (error) {
      console.error("Failed to fetch resource types", error)
    }
  }

  const togglePlan = (id: string) => {
    setSelectedPlanIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    )
  }

  const toggleRate = (id: string) => {
    setSelectedRateIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    )
  }

  const ratesByType = rates.reduce<Record<string, ResourceRateDto[]>>((groups, rate) => {
    const key = resourceTypeNames[rate.resourceTypeId] ?? "Other"
    groups[key] = groups[key] ?? []
    groups[key].push(rate)
    return groups
  }, {})

  // Seeded ids the fetched list no longer carries — dropped, archived, or a
  // page that only loaded the first N. Kept as disabled, checked rows plus a
  // hidden input, so an unrelated edit to this discount never revokes them.
  const missingPlanIds = (editingDiscount?.planIds ?? []).filter(
    (id) => !plans.some((plan) => plan.id === id)
  )
  const missingRateIds = (editingDiscount?.resourceRateIds ?? []).filter(
    (id) => !rates.some((rate) => rate.id === id)
  )

  const currentState = editingDiscount ? updateState : createState
  const formAction = editingDiscount ? updateFormAction : createFormAction

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
            <DrawerTitle>{editingDiscount ? "Edit Discount" : "Add Discount"}</DrawerTitle>
            <DrawerDescription>
              {editingDiscount
                ? "Update the value and targets for this discount."
                : "Create a plan or resource-rate discount."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingDiscount?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingDiscount && <input type="hidden" name="id" value={editingDiscount.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Loyalty 10 %"
                    defaultValue={editingDiscount?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="10LOYALTY"
                    defaultValue={editingDiscount?.code || ""}
                    onBlur={(e) => {
                      e.target.value = e.target.value.toUpperCase()
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown on invoices; typed as a discount code on the website.
                  </p>
                </div>

                {/* Kind sets which targets are relevant and is immutable after
                    creation, since it decides how the discount attaches. */}
                {editingDiscount ? (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {DISCOUNT_KIND_LABELS[editingDiscount.kind]}
                    </span>
                    <span className="block pt-1 text-xs">
                      Kind cannot be changed after creation.
                    </span>
                    <input type="hidden" name="kind" value={editingDiscount.kind} />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label>Kind</Label>
                    <div className="grid gap-2">
                      {DISCOUNT_KINDS.map((value) => (
                        <label key={value} className="flex flex-col gap-0.5 rounded-md border border-input p-2 text-sm">
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="kind"
                              value={value}
                              checked={kind === value}
                              onChange={() => {
                                setKind(value)
                                if (value !== "plan") setIsPublic(false)
                              }}
                              className="h-4 w-4"
                            />
                            {DISCOUNT_KIND_LABELS[value]}
                          </span>
                          <span className="pl-6 text-xs text-muted-foreground">{DISCOUNT_KIND_HELP[value]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2 rounded-md border border-input p-2 text-sm">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={isPublic}
                    disabled={kind !== "plan"}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input"
                  />
                  <span>
                    Show on the website
                    <span className="block text-xs text-muted-foreground">
                      {kind === "plan"
                        ? "Displayed as a public offer on the pricing pages and public booking wizard."
                        : "Only plan discounts can be shown on the website"}
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 rounded-md border border-input p-2 text-sm">
                  <input
                    type="checkbox"
                    name="appliesToAll"
                    checked={appliesToAll}
                    onChange={(e) => setAppliesToAll(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input"
                  />
                  <span>
                    {kind === "resource_rate" ? "Applies to all rates" : "Applies to all plans"}
                    <span className="block text-xs text-muted-foreground">
                      Targets every {kind === "resource_rate" ? "resource rate" : "plan"} without maintaining a list below.
                    </span>
                  </span>
                </label>

                <div className="grid gap-2">
                  <Label>Value</Label>
                  <div className="inline-flex w-fit rounded-md border border-input p-0.5">
                    <button
                      type="button"
                      onClick={() => setValueType("percent")}
                      className={`rounded px-3 py-1.5 text-sm ${valueType === "percent" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Percent off
                    </button>
                    <button
                      type="button"
                      onClick={() => setValueType("amount")}
                      className={`rounded px-3 py-1.5 text-sm ${valueType === "amount" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Amount off
                    </button>
                  </div>
                  <input type="hidden" name="valueType" value={valueType} />
                  {valueType === "percent" ? (
                    <Input
                      id="percentOff"
                      name="percentOff"
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      defaultValue={editingDiscount?.percentOff ?? ""}
                      placeholder="10"
                    />
                  ) : (
                    <div className="grid gap-1">
                      <Label htmlFor="amountOffHt">Amount off excl. VAT (TND)</Label>
                      <Input
                        id="amountOffHt"
                        name="amountOffHt"
                        type="number"
                        min="0.001"
                        step="0.001"
                        defaultValue={editingDiscount?.amountOffHt ?? ""}
                        placeholder="15"
                      />
                    </div>
                  )}
                </div>

                {kind === "plan" && !appliesToAll && (
                  <div className="grid gap-2">
                    <Label>Plans</Label>
                    {isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading plans...</p>
                    ) : plans.length === 0 && missingPlanIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No plans defined yet.</p>
                    ) : (
                      <div className="grid gap-2 rounded-md border border-input p-3">
                        {plans.map((plan) => (
                          <label key={plan.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="planIds"
                              value={plan.id}
                              checked={selectedPlanIds.includes(plan.id)}
                              onChange={() => togglePlan(plan.id)}
                              className="mt-0.5 h-4 w-4 rounded border-input"
                            />
                            <span>
                              {plan.name}
                              <span className="block text-xs text-muted-foreground">
                                {formatPriceHt(plan.priceHt)}
                              </span>
                            </span>
                          </label>
                        ))}
                        {missingPlanIds.map((id) => (
                          <label
                            key={id}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <input
                              type="checkbox"
                              checked
                              disabled
                              readOnly
                              className="mt-0.5 h-4 w-4 rounded border-input"
                            />
                            <span>{id} (not in list — kept)</span>
                            <input type="hidden" name="planIds" value={id} />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {kind === "resource_rate" && !appliesToAll && (
                  <div className="grid gap-2">
                    <Label>Resource rates</Label>
                    {rates.length === 0 && missingRateIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No resource rates defined yet.</p>
                    ) : (
                      <div className="grid gap-3 rounded-md border border-input p-3">
                        {Object.entries(ratesByType).map(([typeName, typeRates]) => (
                          <div key={typeName} className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">{typeName}</span>
                            {typeRates.map((rate) => (
                              <label key={rate.id} className="flex items-start gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  name="resourceRateIds"
                                  value={rate.id}
                                  checked={selectedRateIds.includes(rate.id)}
                                  onChange={() => toggleRate(rate.id)}
                                  className="mt-0.5 h-4 w-4 rounded border-input"
                                />
                                <span>
                                  {rate.name} · {RATE_INTERVAL_LABELS[rate.intervalType]}
                                  {rate.isWeekendRate ? " · weekend" : ""}
                                  <span className="block text-xs text-muted-foreground">
                                    {formatPriceHt(rate.priceHt)}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        ))}
                        {missingRateIds.length > 0 && (
                          <div className="grid gap-1.5">
                            {missingRateIds.map((id) => (
                              <label
                                key={id}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <input
                                  type="checkbox"
                                  checked
                                  disabled
                                  readOnly
                                  className="mt-0.5 h-4 w-4 rounded border-input"
                                />
                                <span>{id} (not in list — kept)</span>
                                <input type="hidden" name="resourceRateIds" value={id} />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="validFrom">Valid from</Label>
                    <Input
                      id="validFrom"
                      name="validFrom"
                      type="date"
                      defaultValue={editingDiscount?.validFrom ?? ""}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="validUntil">Valid until</Label>
                    <Input
                      id="validUntil"
                      name="validUntil"
                      type="date"
                      defaultValue={editingDiscount?.validUntil ?? ""}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Leave blank for no limit.</p>
                </div>

                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingDiscount={editingDiscount} />
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
