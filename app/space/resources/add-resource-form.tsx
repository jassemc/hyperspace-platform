"use client"

import { useState, useEffect, useActionState } from "react"
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
import { getResourceTypes } from "@/lib/service"
import type { ResourceTypeDto, ResourceDto } from "@/lib/service/HsService"
import { createResourceAction, updateResourceAction } from "./actions"

interface AddResourceFormProps {
  isOpen: boolean
  onClose: () => void
  editingResource?: ResourceDto | null
}

function SubmitButton({ editingResource }: Readonly<{ editingResource?: ResourceDto | null }>) {
  const { pending } = useFormStatus()
  
  const getButtonText = () => {
    if (pending) {
      return editingResource ? "Updating..." : "Creating..."
    }
    return editingResource ? "Update" : "Create Resource"
  }
  
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddResourceForm({ isOpen, onClose, editingResource }: Readonly<AddResourceFormProps>) {
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeDto[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [selectedType, setSelectedType] = useState(editingResource?.type || "")

  const [createState, createFormAction] = useActionState(createResourceAction, {})
  const [updateState, updateFormAction] = useActionState(updateResourceAction, {})

  // Close drawer on successful action
  useEffect(() => {
    if (createState.success || updateState.success) {
      onClose()
    }
  }, [createState.success, updateState.success, onClose])

  // Reset form state when drawer opens/closes or editing resource changes
  useEffect(() => {
    if (isOpen) {
      // Set selected type when drawer opens for editing
      setSelectedType(editingResource?.type || "")
    } else {
      // Reset states when drawer closes
      setResourceTypes([])
      setSelectedType("")
    }
  }, [isOpen, editingResource])

  // Fetch resource types when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchResourceTypes()
    }
  }, [isOpen])

  const fetchResourceTypes = async () => {
    setIsLoadingTypes(true)
    try {
      const response = await getResourceTypes({
        limit: 100,
        offset: 0,
        sort: "ASC"
      })
      setResourceTypes(response.results || [])
    } catch (err) {
      console.error("Failed to fetch resource types:", err)
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const currentState = editingResource ? updateState : createState
  const formAction = editingResource ? updateFormAction : createFormAction

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
            <DrawerTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DrawerTitle>
            <DrawerDescription>
              {editingResource ? "Update the resource details." : "Create a new resource for your space."}
            </DrawerDescription>
          </DrawerHeader>
          
          <form key={editingResource?.id || 'create'} action={formAction} className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {editingResource && (
                <input type="hidden" name="id" value={editingResource.id} />
              )}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Resource name"
                    defaultValue={editingResource?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Resource description"
                    defaultValue={editingResource?.description || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    required
                    disabled={isLoadingTypes}
                  >
                    <option value="">{isLoadingTypes ? "Loading types..." : "Select resource type"}</option>
                    {resourceTypes.map((type) => (
                      <option key={type.id} value={type.type}>
                        {type.name} ({type.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="Number of people"
                    defaultValue={editingResource?.capacity || 1}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={editingResource?.status || "AVAILABLE"}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="AVAILABLE_SOON">Available Soon</option>
                    <option value="RESERVED">Reserved</option>
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
                <SubmitButton editingResource={editingResource} />
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
