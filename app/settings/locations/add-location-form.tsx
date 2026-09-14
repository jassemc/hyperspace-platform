"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
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
import type { ClosedDayDto, LocationDto } from "@/lib/service/HsService"
import { createLocationAction, updateLocationAction } from "./actions"
import { DAY_LABELS, WEEK_DAYS, type WeekDay } from "./location-meta"
import { toast } from "sonner"
import { DEFAULT_TIMEZONE } from "@/lib/timezone"

interface AddLocationFormProps {
  isOpen: boolean
  onClose: () => void
  editingLocation?: LocationDto | null
}

interface ClosureRow {
  from: string
  to: string
  description: string
}

function SubmitButton({ editingLocation }: Readonly<{ editingLocation?: LocationDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingLocation ? "Updating..." : "Creating..."
    return editingLocation ? "Update" : "Create Location"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddLocationForm({ isOpen, onClose, editingLocation }: Readonly<AddLocationFormProps>) {
  const [createState, createFormAction] = useActionState(createLocationAction, {})
  const [updateState, updateFormAction] = useActionState(updateLocationAction, {})
  const [closures, setClosures] = useState<ClosureRow[]>([])

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      setClosures(
        (editingLocation?.closedDays ?? []).map((day: ClosedDayDto) => ({
          from: day.from,
          to: day.to,
          description: day.description,
        }))
      )
    } else {
      setClosures([])
    }
  }, [isOpen, editingLocation])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Location created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Location updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const updateClosure = (index: number, patch: Partial<ClosureRow>) => {
    setClosures((previous) =>
      previous.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    )
  }

  /** The form edits the first window of each day; extra windows are preserved by the API only if untouched. */
  const dayWindow = (day: WeekDay) => editingLocation?.openingHours?.[day]?.[0]

  const currentState = editingLocation ? updateState : createState
  const formAction = editingLocation ? updateFormAction : createFormAction

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
            <DrawerTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DrawerTitle>
            <DrawerDescription>
              {editingLocation
                ? "Update this site's details and opening hours."
                : "Locations hold resources and gate when they can be booked."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingLocation?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingLocation && <input type="hidden" name="id" value={editingLocation.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Bizerte" defaultValue={editingLocation?.name || ""} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    name="timezone"
                    placeholder={DEFAULT_TIMEZONE}
                    defaultValue={editingLocation?.timezone || DEFAULT_TIMEZONE}
                  />
                  <p className="text-xs text-muted-foreground">
                    IANA name. Defaults to {DEFAULT_TIMEZONE}.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Address</Label>
                  <div className="grid gap-2 rounded-md border border-input p-3">
                    <Input name="street" placeholder="Street" defaultValue={editingLocation?.address?.street || ""} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="zip" placeholder="ZIP" defaultValue={editingLocation?.address?.zip || ""} />
                      <Input name="city" placeholder="City" defaultValue={editingLocation?.address?.city || ""} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="state" placeholder="State" defaultValue={editingLocation?.address?.state || ""} />
                      <Input name="country" placeholder="Country" defaultValue={editingLocation?.address?.country || ""} />
                    </div>
                    <Input
                      name="formattedAddress"
                      placeholder="Full display address (overrides the parts above)"
                      defaultValue={editingLocation?.address?.formattedAddress || ""}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        name="latitude"
                        type="number"
                        step="0.0001"
                        placeholder="Latitude"
                        defaultValue={editingLocation?.address?.latitude ?? ""}
                      />
                      <Input
                        name="longitude"
                        type="number"
                        step="0.0001"
                        placeholder="Longitude"
                        defaultValue={editingLocation?.address?.longitude ?? ""}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Opening hours</Label>
                  <div className="grid gap-2 rounded-md border border-input p-3">
                    {WEEK_DAYS.map((day) => (
                      <div key={day} className="grid grid-cols-[5rem_1fr_1fr] items-center gap-2">
                        <span className="text-sm">{DAY_LABELS[day]}</span>
                        <Input
                          name={`${day}Open`}
                          type="time"
                          defaultValue={dayWindow(day)?.open ?? ""}
                          aria-label={`${DAY_LABELS[day]} opening time`}
                        />
                        <Input
                          name={`${day}Close`}
                          type="time"
                          defaultValue={dayWindow(day)?.close ?? ""}
                          aria-label={`${DAY_LABELS[day]} closing time`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave a day blank to mark it closed. One window per day; split shifts need the API directly.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Closures</Label>
                  {closures.map((row, index) => (
                    <div key={index} className="grid gap-2 rounded-md border border-input p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {/* In place, not portalled: inside the vaul drawer a
                            portalled calendar renders but eats every click. */}
                        <DateField
                          name="closedFrom"
                          value={row.from}
                          onChange={(from) => updateClosure(index, { from })}
                          placeholder="Closed from"
                          aria-label="Closed from"
                          portalled={false}
                        />
                        <DateField
                          name="closedTo"
                          value={row.to}
                          onChange={(to) => updateClosure(index, { to })}
                          min={row.from}
                          placeholder="Closed until"
                          aria-label="Closed until"
                          portalled={false}
                        />
                      </div>
                      <Input
                        name="closedDescription"
                        placeholder="Independence Day"
                        value={row.description}
                        onChange={(e) => updateClosure(index, { description: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-self-start text-destructive"
                        onClick={() => setClosures((previous) => previous.filter((_, i) => i !== index))}
                      >
                        Remove closure
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setClosures((previous) => [...previous, { from: "", to: "", description: "" }])}
                  >
                    Add closure
                  </Button>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editingLocation ? editingLocation.active : true}
                    className="h-4 w-4 rounded border-input"
                  />
                  Active
                </label>

                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingLocation={editingLocation} />
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
