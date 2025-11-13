"use client"

import { useState, useEffect, useActionState, useRef } from "react"
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
import type { ResourceTypeDto } from "@/lib/service/HsService"
import { createResourceTypeAction, updateResourceTypeAction } from "./actions"
import { toast } from "sonner"

interface AddResourceTypeFormProps {
  isOpen: boolean
  onClose: () => void
  editingResourceType?: ResourceTypeDto | null
}

function SubmitButton({ editingResourceType }: Readonly<{ editingResourceType?: ResourceTypeDto | null }>) {
  const { pending } = useFormStatus()
  
  const getButtonText = () => {
    if (pending) {
      return editingResourceType ? "Updating..." : "Creating..."
    }
    return editingResourceType ? "Update" : "Create Resource Type"
  }
  
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddResourceTypeForm({ isOpen, onClose, editingResourceType }: Readonly<AddResourceTypeFormProps>) {
  const [canBook, setCanBook] = useState(editingResourceType?.canBook ?? false)
  const [canAssign, setCanAssign] = useState(editingResourceType?.canAssign ?? false)

  const [createState, createFormAction] = useActionState(createResourceTypeAction, {})
  const [updateState, updateFormAction] = useActionState(updateResourceTypeAction, {})

  // Prevent duplicate toasts in StrictMode and across re-renders
  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  // Reset notification guards when the drawer opens
  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      setCanBook(editingResourceType?.canBook ?? false)
      setCanAssign(editingResourceType?.canAssign ?? false)
    }
  }, [isOpen, editingResourceType])

  // Close drawer and toast on successful action; toast errors when present (create)
  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Resource type created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  // Close drawer and toast on successful action; toast errors when present (update)
  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Resource type updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  // Reset form state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setCanBook(false)
      setCanAssign(false)
    }
  }, [isOpen])

  const currentState = editingResourceType ? updateState : createState
  const formAction = editingResourceType ? updateFormAction : createFormAction

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[400px] ml-auto">
        <div className="flex h-full flex-col">
          {/* Close button at the very top */}
          <div className="flex justify-end p-4 pb-0">
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
          
          <DrawerHeader className="px-6 pb-4">
            <DrawerTitle>{editingResourceType ? "Edit Resource Type" : "Add New Resource Type"}</DrawerTitle>
            <DrawerDescription>
              {editingResourceType ? "Update the resource type details." : "Create a new resource type for your space."}
            </DrawerDescription>
          </DrawerHeader>
          
          <form key={editingResourceType?.id || 'create'} action={formAction} className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {editingResourceType && (
                <input type="hidden" name="id" value={editingResourceType.id} />
              )}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Resource type name"
                    defaultValue={editingResourceType?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Resource type description"
                    defaultValue={editingResourceType?.description || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type Key</Label>
                  <Input
                    id="type"
                    name="type"
                    placeholder="meeting_room"
                    defaultValue={editingResourceType?.type || ""}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Unique key (e.g., meeting_room, office)</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    name="icon"
                    placeholder="fa-building"
                    defaultValue={editingResourceType?.icon || ""}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Icon class name (e.g., fa-building)</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="canBook">Can Book</Label>
                  <select
                    id="canBook"
                    name="canBook"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={canBook ? "true" : "false"}
                    onChange={(e) => setCanBook(e.target.value === "true")}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {canBook ? (
                  <div className="grid gap-2">
                    <Label htmlFor="bookingMode">Booking Mode</Label>
                    <select
                      id="bookingMode"
                      name="bookingMode"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={editingResourceType?.bookingMode || "DATE"}
                    >
                      <option value="DATE">Date</option>
                      <option value="TIME">Time</option>
                    </select>
                  </div>
                ) : (
                  <input type="hidden" name="bookingMode" value={editingResourceType?.bookingMode || "DATE"} />
                )}
                <div className="grid gap-2">
                  <Label htmlFor="canAssign">Can Assign</Label>
                  <select
                    id="canAssign"
                    name="canAssign"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={canAssign ? "true" : "false"}
                    onChange={(e) => setCanAssign(e.target.value === "true")}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {currentState.error && (
                  <div className="text-sm text-red-600">
                    {currentState.error}
                  </div>
                )}
              </div>
            </div>
            
            <DrawerFooter className="border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingResourceType={editingResourceType} />
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

