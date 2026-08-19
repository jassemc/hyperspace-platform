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
import type { AmenityDto } from "@/lib/service/HsService"
import { createAmenityAction, updateAmenityAction } from "./actions"
import { toast } from "sonner"

interface AddAmenityFormProps {
  isOpen: boolean
  onClose: () => void
  editingAmenity?: AmenityDto | null
}

function SubmitButton({ editingAmenity }: Readonly<{ editingAmenity?: AmenityDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingAmenity ? "Updating..." : "Creating..."
    return editingAmenity ? "Update" : "Create Amenity"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddAmenityForm({ isOpen, onClose, editingAmenity }: Readonly<AddAmenityFormProps>) {
  const [createState, createFormAction] = useActionState(createAmenityAction, {})
  const [updateState, updateFormAction] = useActionState(updateAmenityAction, {})

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
      toast.success("Amenity created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Amenity updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const currentState = editingAmenity ? updateState : createState
  const formAction = editingAmenity ? updateFormAction : createFormAction

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[400px] ml-auto">
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
            <DrawerTitle>{editingAmenity ? "Edit Amenity" : "Add New Amenity"}</DrawerTitle>
            <DrawerDescription>
              {editingAmenity
                ? "Update this amenity in the shared vocabulary."
                : "Amenities are the shared vocabulary attached to resources and extras."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingAmenity?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingAmenity && <input type="hidden" name="id" value={editingAmenity.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Projector"
                    defaultValue={editingAmenity?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="projector"
                    defaultValue={editingAmenity?.slug || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Stable machine identifier. Derived from the name when left blank.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    name="icon"
                    placeholder="projector"
                    defaultValue={editingAmenity?.icon || ""}
                  />
                </div>
                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingAmenity={editingAmenity} />
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
