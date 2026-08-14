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
import { getListResourceTypes, getListLocations } from "@/lib/service"
import type { ResourceTypeDto, ResourceDto, ListResourceTypesParams, LocationDto } from "@/lib/service/HsService"
import { createResourceAction, updateResourceAction } from "./actions"
import { toast } from "sonner"

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
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeDto[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedType, setSelectedType] = useState("")

  const [createState, createFormAction] = useActionState(createResourceAction, {})
  const [updateState, updateFormAction] = useActionState(updateResourceAction, {})

  // Prevent duplicate toasts in StrictMode and across re-renders
  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  // Reset notification guards when the drawer opens
  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
    }
  }, [isOpen])

  // Close drawer and toast on successful action; toast errors when present (create)
  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Resource created")
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
      toast.success("Resource updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  // Reset form state when drawer opens/closes or editing resource changes
  useEffect(() => {
    if (isOpen) {
      // Set selected type and location when drawer opens for editing
      setSelectedType(editingResource?.resourceTypeId || "")
      setSelectedLocation(editingResource?.locationId || "")
    } else {
      // Reset states when drawer closes
      setResourceTypes([])
      setSelectedType("")
      setLocations([])
      setSelectedLocation("")
    }
  }, [isOpen, editingResource])

  // Fetch locations and resource types when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchLocations()
      fetchResourceTypes()
    }
  }, [isOpen])

  const fetchLocations = async () => {
    setIsLoadingLocations(true)
    try {
      const response = await getListLocations({
        limit: 100,
        offset: 0,
        sort: "ASC"
      })
      const results = response.results || []
      setLocations(results)
      // With a single location there is nothing to choose, so lock it in.
      if (results.length === 1) {
        setSelectedLocation(results[0].id)
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const fetchResourceTypes = async () => {
    setIsLoadingTypes(true)
    try {
      const query: ListResourceTypesParams = {
        limit: 100,
        offset: 0,
        sort: "ASC"
      }
      const response = await getListResourceTypes(query)
      setResourceTypes(response.results || [])
    } catch (err) {
      console.error("Failed to fetch resource types:", err)
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const currentState = editingResource ? updateState : createState
  const formAction = editingResource ? updateFormAction : createFormAction

  // Only one location to pick from: preselect it and take the choice away.
  const isLocationLocked = locations.length === 1 && selectedLocation !== ""

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
          
          <form key={editingResource?.id || 'create'} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingResource && (
                <input type="hidden" name="id" value={editingResource.id} />
              )}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="locationId">Location</Label>
                  {/* A disabled select is not submitted, so carry the locked value separately. */}
                  {isLocationLocked && (
                    <input type="hidden" name="locationId" value={selectedLocation} />
                  )}
                  <select
                    id="locationId"
                    name="locationId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    required
                    disabled={isLoadingLocations || isLocationLocked}
                  >
                    <option value="">{isLoadingLocations ? "Loading locations..." : "Select location"}</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <Label htmlFor="resourceTypeId">Type</Label>
                  <select
                    id="resourceTypeId"
                    name="resourceTypeId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    required
                    disabled={isLoadingTypes}
                  >
                    <option value="">{isLoadingTypes ? "Loading types..." : "Select resource type"}</option>
                    {resourceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.slug})
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
                {currentState.error && (
                  <div className="text-sm text-red-600">
                    {currentState.error}
                  </div>
                )}
              </div>
            </div>
            
            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
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
