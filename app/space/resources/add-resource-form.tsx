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
import { getListResourceTypes, getListLocations, getListAmenities, getListResourceRates, getListPlans } from "@/lib/service"
import type { ResourceTypeDto, ResourceDto, ListResourceTypesParams, LocationDto, AmenityDto, ResourceRateDto, PlanDto } from "@/lib/service/HsService"
import { ResourceImage } from "./resource-image"
import { createResourceAction, updateResourceAction } from "./actions"
import { toast } from "sonner"

interface AddResourceFormProps {
  isOpen: boolean
  onClose: () => void
  editingResource?: ResourceDto | null
}

interface AvailabilityRow {
  startDate: string
  endDate: string
}

/** ISO date-time from the API -> value a datetime-local input accepts. */
function toInputValue(iso?: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]
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
  const [amenities, setAmenities] = useState<AmenityDto[]>([])
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([])
  const [rates, setRates] = useState<ResourceRateDto[]>([])
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [selectedRateIds, setSelectedRateIds] = useState<string[]>([])
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const [plans, setPlans] = useState<PlanDto[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])

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
      setSelectedAmenityIds((editingResource?.amenities ?? []).map((amenity) => amenity.id))
      setSelectedRateIds((editingResource?.rates ?? []).map((rate) => rate.id))
      setSelectedPlanIds(editingResource?.targetPlanIds ?? [])
      setAvailability(
        (editingResource?.availability ?? []).map((period) => ({
          startDate: toInputValue(period.startDate),
          endDate: toInputValue(period.endDate),
        }))
      )
    } else {
      // Reset states when drawer closes
      setResourceTypes([])
      setSelectedType("")
      setLocations([])
      setSelectedLocation("")
      setAmenities([])
      setSelectedAmenityIds([])
      setRates([])
      setSelectedRateIds([])
      setPlans([])
      setSelectedPlanIds([])
      setAvailability([])
    }
  }, [isOpen, editingResource])

  // Fetch locations, resource types and amenities when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchLocations()
      fetchResourceTypes()
      fetchAmenities()
      fetchPlans()
    }
  }, [isOpen])

  // Rates attach only to resources of their exact type, so reload on type change.
  useEffect(() => {
    if (!isOpen) return
    if (!selectedType) {
      setRates([])
      setSelectedRateIds([])
      return
    }
    fetchRates(selectedType)
  }, [isOpen, selectedType])

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

  const fetchAmenities = async () => {
    setIsLoadingAmenities(true)
    try {
      const response = await getListAmenities({ limit: 100, offset: 0, sort: "ASC" })
      setAmenities((response.results ?? []) as AmenityDto[])
    } catch (err) {
      console.error("Failed to fetch amenities:", err)
    } finally {
      setIsLoadingAmenities(false)
    }
  }

  const fetchPlans = async () => {
    setIsLoadingPlans(true)
    try {
      const response = await getListPlans({ limit: 100, offset: 0, sort: "ASC" })
      setPlans((response.results ?? []) as PlanDto[])
    } catch (err) {
      console.error("Failed to fetch plans:", err)
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const fetchRates = async (resourceTypeId: string) => {
    setIsLoadingRates(true)
    try {
      const response = await getListResourceRates({ limit: 100, offset: 0, sort: "ASC", resourceTypeId })
      const results = (response.results ?? []) as ResourceRateDto[]
      setRates(results)
      // Drop any rate that does not belong to the newly selected type.
      setSelectedRateIds((previous) => previous.filter((id) => results.some((rate) => rate.id === id)))
    } catch (err) {
      console.error("Failed to fetch resource rates:", err)
    } finally {
      setIsLoadingRates(false)
    }
  }

  const addAvailabilityRow = () => {
    setAvailability((previous) => [...previous, { startDate: "", endDate: "" }])
  }

  const updateAvailabilityRow = (index: number, patch: Partial<AvailabilityRow>) => {
    setAvailability((previous) =>
      previous.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    )
  }

  const removeAvailabilityRow = (index: number) => {
    setAvailability((previous) => previous.filter((_, rowIndex) => rowIndex !== index))
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

                <div className="grid gap-2">
                  <Label>Amenities</Label>
                  {(() => {
                    if (isLoadingAmenities) {
                      return <p className="text-sm text-muted-foreground">Loading amenities...</p>
                    }
                    if (amenities.length === 0) {
                      return <p className="text-sm text-muted-foreground">No amenities available.</p>
                    }
                    return (
                      <div className="grid gap-2 rounded-md border border-input p-3">
                        {amenities.map((amenity) => (
                          <label key={amenity.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="amenityIds"
                              value={amenity.id}
                              checked={selectedAmenityIds.includes(amenity.id)}
                              onChange={() =>
                                setSelectedAmenityIds((previous) => toggleId(previous, amenity.id))
                              }
                              className="h-4 w-4 rounded border-input"
                            />
                            <span>{amenity.name}</span>
                          </label>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                <div className="grid gap-2">
                  <Label>Rates</Label>
                  {(() => {
                    if (!selectedType) {
                      return <p className="text-sm text-muted-foreground">Select a resource type to see its rates.</p>
                    }
                    if (isLoadingRates) {
                      return <p className="text-sm text-muted-foreground">Loading rates...</p>
                    }
                    if (rates.length === 0) {
                      return <p className="text-sm text-muted-foreground">No rates defined for this type.</p>
                    }
                    return (
                      <div className="grid gap-2 rounded-md border border-input p-3">
                        {rates.map((rate) => (
                          <label key={rate.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="rateIds"
                              value={rate.id}
                              checked={selectedRateIds.includes(rate.id)}
                              onChange={() =>
                                setSelectedRateIds((previous) => toggleId(previous, rate.id))
                              }
                              className="mt-0.5 h-4 w-4 rounded border-input"
                            />
                            <span>
                              {rate.name}
                              <span className="block text-xs text-muted-foreground">
                                {rate.priceHt} TND / {rate.intervalType.replaceAll("_", " ")}
                                {rate.isWeekendRate ? " (weekend)" : ""}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                <div className="grid gap-2">
                  <Label>Sold under</Label>
                  {(() => {
                    if (isLoadingPlans) {
                      return <p className="text-sm text-muted-foreground">Loading plans...</p>
                    }
                    if (plans.length === 0) {
                      return <p className="text-sm text-muted-foreground">No plans defined yet.</p>
                    }
                    return (
                      <div className="grid gap-2 rounded-md border border-input p-3">
                        {plans.map((plan) => (
                          <label key={plan.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="targetPlanIds"
                              value={plan.id}
                              checked={selectedPlanIds.includes(plan.id)}
                              onChange={() =>
                                setSelectedPlanIds((previous) => toggleId(previous, plan.id))
                              }
                              className="mt-0.5 h-4 w-4 rounded border-input"
                            />
                            <span>
                              {plan.name}
                              {plan.category?.name && (
                                <span className="block text-xs text-muted-foreground">
                                  {plan.category.name}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )
                  })()}
                  <p className="text-xs text-muted-foreground">
                    Drives the public catalog and per-plan availability counts. A link only —
                    nothing is assigned automatically.
                  </p>
                </div>

                {/* The photo has its own endpoint and needs an existing resource. */}
                {editingResource && (
                  <ResourceImage
                    resourceId={editingResource.id}
                    imageUrl={editingResource.imageUrl}
                  />
                )}

                <div className="grid gap-2">
                  <Label>Availability</Label>
                  <p className="text-xs text-muted-foreground">
                    Periods the resource can be booked. Leave empty for always available;
                    leave an end date empty for indefinite.
                  </p>
                  {availability.map((row, index) => (
                    // Rows are positional: the action pairs start/end by index.
                    <div key={index} className="grid gap-2 rounded-md border border-input p-3">
                      <div className="grid gap-1">
                        <Label htmlFor={`availabilityStart-${index}`} className="text-xs">From</Label>
                        <Input
                          id={`availabilityStart-${index}`}
                          name="availabilityStart"
                          type="datetime-local"
                          value={row.startDate}
                          onChange={(e) => updateAvailabilityRow(index, { startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor={`availabilityEnd-${index}`} className="text-xs">Until</Label>
                        <Input
                          id={`availabilityEnd-${index}`}
                          name="availabilityEnd"
                          type="datetime-local"
                          value={row.endDate}
                          onChange={(e) => updateAvailabilityRow(index, { endDate: e.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-self-start text-destructive"
                        onClick={() => removeAvailabilityRow(index)}
                      >
                        Remove period
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addAvailabilityRow}>
                    Add period
                  </Button>
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
