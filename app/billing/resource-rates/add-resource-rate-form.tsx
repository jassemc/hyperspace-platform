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
import { getListResources } from "@/lib/service"
import type { ResourceDto, ResourceRateDto } from "@/lib/service/HsService"
import { createResourceRateAction, updateResourceRateAction } from "./actions"
import { toast } from "sonner"

interface AddResourceRateFormProps {
  isOpen: boolean
  onClose: () => void
  editingRate?: ResourceRateDto | null
}

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

export function AddResourceRateForm({ isOpen, onClose, editingRate }: Readonly<AddResourceRateFormProps>) {
  const [resources, setResources] = useState<ResourceDto[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [createState, createFormAction] = useActionState(createResourceRateAction, {})
  const [updateState, updateFormAction] = useActionState(updateResourceRateAction, {})

  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      fetchResources()
    }
  }, [isOpen])

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

  const fetchResources = async () => {
    setIsLoadingResources(true)
    try {
      const response = await getListResources({ limit: 100, offset: 0, sort: "ASC" })
      setResources(response.results || [])
    } catch (error) {
      console.error("Failed to fetch resources", error)
    } finally {
      setIsLoadingResources(false)
    }
  }

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
              {editingRate ? "Update the pricing values for this rate entry." : "Create a new resource pricing rate."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingRate?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingRate && <input type="hidden" name="id" value={editingRate.id} />}
              <div className="space-y-6">
                {!editingRate && (
                  <div className="grid gap-2">
                    <Label htmlFor="resourceId">Resource</Label>
                    <select id="resourceId" name="resourceId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required disabled={isLoadingResources}>
                      <option value="">{isLoadingResources ? "Loading resources..." : "Select resource"}</option>
                      {resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!editingRate && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="rateType">Rate type</Label>
                      <select id="rateType" name="rateType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="hourly" required>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="audience">Audience</Label>
                      <select id="audience" name="audience" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="member" required>
                        <option value="member">Member</option>
                        <option value="visitor">Visitor</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="priceHtMillimes">Price (millimes)</Label>
                  <Input id="priceHtMillimes" name="priceHtMillimes" type="number" min="0" defaultValue={editingRate?.priceHtMillimes || 0} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vatRateBp">VAT (basis points)</Label>
                  <Input id="vatRateBp" name="vatRateBp" type="number" min="0" defaultValue={editingRate?.vatRateBp || 1900} />
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
