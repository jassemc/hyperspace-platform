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
import type { CompanyDto } from "@/lib/service/HsService"
import { createCompanyAction, updateCompanyAction } from "./actions"
import { toast } from "sonner"

interface AddCompanyFormProps {
  isOpen: boolean
  onClose: () => void
  editingCompany?: CompanyDto | null
}

function SubmitButton({ editingCompany }: Readonly<{ editingCompany?: CompanyDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) {
      return editingCompany ? "Updating..." : "Creating..."
    }
    return editingCompany ? "Update" : "Create Company"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddCompanyForm({ isOpen, onClose, editingCompany }: Readonly<AddCompanyFormProps>) {
  const [createState, createFormAction] = useActionState(createCompanyAction, {})
  const [updateState, updateFormAction] = useActionState(updateCompanyAction, {})

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
      toast.success("Company created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Company updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const currentState = editingCompany ? updateState : createState
  const formAction = editingCompany ? updateFormAction : createFormAction
  const address = editingCompany?.billingAddress

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
            <DrawerTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DrawerTitle>
            <DrawerDescription>
              {editingCompany
                ? "Update CRM details for this company."
                : "Create a company account. Members can be attached to it as employees."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingCompany?.id || "create"} action={formAction} className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {editingCompany && (
                <input type="hidden" name="id" value={editingCompany.id} />
              )}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Acme Consulting SARL"
                    defaultValue={editingCompany?.name || ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    placeholder="1234567/A/M/000"
                    defaultValue={editingCompany?.taxId || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="billing@acme.tn"
                    defaultValue={editingCompany?.email || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+21622123456"
                    defaultValue={editingCompany?.phone || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://acme.tn"
                    defaultValue={editingCompany?.website || ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="enterprise, partner"
                    defaultValue={editingCompany?.tags?.join(", ") || ""}
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list.</p>
                </div>

                <div className="space-y-4 rounded-md border p-3">
                  <p className="text-sm font-medium">Billing address</p>
                  <div className="grid gap-2">
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      name="street"
                      placeholder="Rue Habib Bourguiba"
                      defaultValue={address?.street || ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Bizerte"
                        defaultValue={address?.city || ""}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zip">Zip</Label>
                      <Input
                        id="zip"
                        name="zip"
                        placeholder="7000"
                        defaultValue={address?.zip || ""}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        placeholder="Bizerte"
                        defaultValue={address?.state || ""}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        placeholder="Tunisia"
                        defaultValue={address?.country || ""}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Internal notes"
                    defaultValue={editingCompany?.description || ""}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
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
                <SubmitButton editingCompany={editingCompany} />
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
