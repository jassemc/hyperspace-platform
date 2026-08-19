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
import { getListAmenities } from "@/lib/service"
import type { AmenityDto, ExtraDto } from "@/lib/service/HsService"
import { createExtraAction, updateExtraAction } from "./actions"
import { toast } from "sonner"

interface AddExtraFormProps {
  isOpen: boolean
  onClose: () => void
  editingExtra?: ExtraDto | null
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton({ editingExtra }: Readonly<{ editingExtra?: ExtraDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingExtra ? "Updating..." : "Creating..."
    return editingExtra ? "Update" : "Create Extra"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddExtraForm({ isOpen, onClose, editingExtra }: Readonly<AddExtraFormProps>) {
  const [createState, createFormAction] = useActionState(createExtraAction, {})
  const [updateState, updateFormAction] = useActionState(updateExtraAction, {})
  const [amenities, setAmenities] = useState<AmenityDto[]>([])
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false)

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      fetchAmenities()
    } else {
      setAmenities([])
    }
  }, [isOpen])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Extra created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Extra updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const fetchAmenities = async () => {
    setIsLoadingAmenities(true)
    try {
      const response = await getListAmenities({ limit: 100, offset: 0, sort: "ASC" })
      setAmenities((response.results ?? []) as AmenityDto[])
    } catch (error) {
      console.error("Failed to fetch amenities", error)
    } finally {
      setIsLoadingAmenities(false)
    }
  }

  const currentState = editingExtra ? updateState : createState
  const formAction = editingExtra ? updateFormAction : createFormAction

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
            <DrawerTitle>{editingExtra ? "Edit Extra" : "Add New Extra"}</DrawerTitle>
            <DrawerDescription>
              {editingExtra
                ? "Update this add-on's pricing."
                : "Extras are add-ons sold alongside plans and resource rates."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingExtra?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingExtra && <input type="hidden" name="id" value={editingExtra.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Locker" defaultValue={editingExtra?.name || ""} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Personal storage locker"
                    defaultValue={editingExtra?.description || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priceHt">Price excl. VAT (TND)</Label>
                  <Input
                    id="priceHt"
                    name="priceHt"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={editingExtra?.priceHt ?? 0}
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
                    defaultValue={editingExtra?.vatRate ?? 19}
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
                    defaultValue={editingExtra?.deposit ?? 0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amenityId">Amenity</Label>
                  <select
                    id="amenityId"
                    name="amenityId"
                    className={selectClassName}
                    defaultValue={editingExtra?.amenityId || ""}
                    disabled={isLoadingAmenities}
                  >
                    <option value="">{isLoadingAmenities ? "Loading amenities..." : "None"}</option>
                    {amenities.map((amenity) => (
                      <option key={amenity.id} value={amenity.id}>
                        {amenity.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Optional link to the shared vocabulary, for a consistent name and icon.
                  </p>
                </div>
                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingExtra={editingExtra} />
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
