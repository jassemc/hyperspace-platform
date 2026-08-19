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
import { getListResourceTypes, getListExtras } from "@/lib/service"
import type {
  ExtraDto,
  RateIntervalType,
  ResourceRateDto,
  ResourceTypeDto,
} from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { createResourceRateAction, updateResourceRateAction } from "./actions"
import {
  INTERVALS_BY_BOOKING_MODE,
  RATE_INTERVAL_LABELS,
  supportsWeekendVariant,
} from "./rate-meta"
import { toast } from "sonner"

interface AddResourceRateFormProps {
  isOpen: boolean
  onClose: () => void
  editingRate?: ResourceRateDto | null
  resourceTypeNames?: Record<string, string>
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton({ editingRate }: Readonly<{ editingRate?: ResourceRateDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingRate ? "Updating..." : "Creating..."
    return editingRate ? "Update" : "Create Rate"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddResourceRateForm({
  isOpen,
  onClose,
  editingRate,
  resourceTypeNames = {},
}: Readonly<AddResourceRateFormProps>) {
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeDto[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [extras, setExtras] = useState<ExtraDto[]>([])
  const [isLoadingExtras, setIsLoadingExtras] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState("")
  const [interval, setInterval] = useState<RateIntervalType>("hour")
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([])

  const [createState, createFormAction] = useActionState(createResourceRateAction, {})
  const [updateState, updateFormAction] = useActionState(updateResourceRateAction, {})

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      setSelectedTypeId(editingRate?.resourceTypeId ?? "")
      setInterval(editingRate?.intervalType ?? "hour")
      setSelectedExtraIds((editingRate?.extras ?? []).map((extra) => extra.id))
      fetchResourceTypes()
      fetchExtras()
    } else {
      setResourceTypes([])
      setExtras([])
      setSelectedExtraIds([])
    }
  }, [isOpen, editingRate])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Resource rate created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Resource rate updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const fetchResourceTypes = async () => {
    setIsLoadingTypes(true)
    try {
      const response = await getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" })
      setResourceTypes((response.results ?? []) as ResourceTypeDto[])
    } catch (error) {
      console.error("Failed to fetch resource types", error)
    } finally {
      setIsLoadingTypes(false)
    }
  }

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

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    )
  }

  // The API rejects an interval that does not fit the type's booking mode, so
  // only the valid ones are offered once a type is picked.
  const selectedType = resourceTypes.find((type) => type.id === selectedTypeId)
  const availableIntervals: RateIntervalType[] = selectedType
    ? INTERVALS_BY_BOOKING_MODE[selectedType.bookingMode]
    : (Object.keys(RATE_INTERVAL_LABELS) as RateIntervalType[])

  useEffect(() => {
    // Picking a type can invalidate the current interval; fall back to the first legal one.
    if (!editingRate && availableIntervals.length > 0 && !availableIntervals.includes(interval)) {
      setInterval(availableIntervals[0])
    }
  }, [availableIntervals, interval, editingRate])

  const currentState = editingRate ? updateState : createState
  const formAction = editingRate ? updateFormAction : createFormAction

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
            <DrawerTitle>{editingRate ? "Edit Resource Rate" : "Add New Resource Rate"}</DrawerTitle>
            <DrawerDescription>
              {editingRate
                ? "Update the pricing values for this rate."
                : "Create a shareable price option for one resource type."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingRate?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingRate && <input type="hidden" name="id" value={editingRate.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Meeting Room — hourly"
                    defaultValue={editingRate?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" placeholder="ROOM-H" defaultValue={editingRate?.code || ""} />
                  <p className="text-xs text-muted-foreground">
                    Becomes the line-item code on invoice exports.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Standard weekday pricing"
                    defaultValue={editingRate?.description || ""}
                  />
                </div>

                {/* The slot a rate occupies is fixed at creation: the update
                    schema accepts neither the type, the interval nor the
                    weekend flag. */}
                {editingRate ? (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {resourceTypeNames[editingRate.resourceTypeId] ?? "Resource type"}
                    </span>{" "}
                    · {RATE_INTERVAL_LABELS[editingRate.intervalType]}
                    {editingRate.isWeekendRate ? " · weekend" : ""}
                    <span className="block pt-1 text-xs">
                      Type, interval and weekend variant cannot be changed after creation.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="resourceTypeId">Resource type</Label>
                      <select
                        id="resourceTypeId"
                        name="resourceTypeId"
                        className={selectClassName}
                        value={selectedTypeId}
                        onChange={(e) => setSelectedTypeId(e.target.value)}
                        required
                        disabled={isLoadingTypes}
                      >
                        <option value="">
                          {isLoadingTypes ? "Loading types..." : "Select resource type"}
                        </option>
                        {resourceTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.bookingMode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="intervalType">Interval</Label>
                      <select
                        id="intervalType"
                        name="intervalType"
                        className={selectClassName}
                        value={interval}
                        onChange={(e) => setInterval(e.target.value as RateIntervalType)}
                        required
                      >
                        {availableIntervals.map((value) => (
                          <option key={value} value={value}>
                            {RATE_INTERVAL_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      {selectedType && (
                        <p className="text-xs text-muted-foreground">
                          Limited to what a {selectedType.bookingMode} booking mode allows.
                        </p>
                      )}
                    </div>
                    {supportsWeekendVariant(interval) && (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="isWeekendRate" className="h-4 w-4 rounded border-input" />
                        Weekend variant (overrides the standard rate on Sat/Sun)
                      </label>
                    )}
                  </>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="priceHt">Price excl. VAT (TND)</Label>
                  <Input
                    id="priceHt"
                    name="priceHt"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={editingRate?.priceHt ?? 0}
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
                    defaultValue={editingRate?.vatRate ?? 19}
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

                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingRate={editingRate} />
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
