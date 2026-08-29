"use client"

import { useEffect, useActionState, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CompanyDto } from "@/lib/service/HsService"
import { createCompanyAction, updateCompanyAction, type ActionState } from "./actions"
import { toast } from "sonner"

interface CompanyFormDialogProps {
  isOpen: boolean
  onClose: () => void
  editingCompany?: CompanyDto | null
}

function messageFor(state: ActionState, fallback: string): string {
  if (state.problemType === "company_not_found") return "That company no longer exists."
  return state.error ?? fallback
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

export function CompanyFormDialog({ isOpen, onClose, editingCompany }: Readonly<CompanyFormDialogProps>) {
  const [createState, createFormAction] = useActionState(createCompanyAction, {})
  const [updateState, updateFormAction] = useActionState(updateCompanyAction, {})

  // The last state object each notify effect has already reacted to.
  // `useActionState` hands back a fresh object on every dispatch, so
  // identity — not a boolean flag — is what tells a real submission apart
  // from an unrelated re-render.
  const lastCreateStateRef = useRef<ActionState | null>(null)
  const lastUpdateStateRef = useRef<ActionState | null>(null)

  useEffect(() => {
    if (createState === lastCreateStateRef.current) return
    lastCreateStateRef.current = createState

    if (createState.success) {
      toast.success("Company created")
      onClose()
    } else if (createState.error) {
      toast.error(messageFor(createState, "Failed to create company"))
    }
  }, [createState, onClose])

  useEffect(() => {
    if (updateState === lastUpdateStateRef.current) return
    lastUpdateStateRef.current = updateState

    if (updateState.success) {
      toast.success("Company updated")
      onClose()
    } else if (updateState.error) {
      toast.error(messageFor(updateState, "Failed to update company"))
    }
  }, [updateState, onClose])

  const currentState = editingCompany ? updateState : createState
  const formAction = editingCompany ? updateFormAction : createFormAction
  const address = editingCompany?.billingAddress

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {editingCompany
              ? "Update CRM details for this company."
              : "Create a company account. Members can be attached to it as employees."}
          </DialogDescription>
        </DialogHeader>
        <form key={editingCompany?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
          {/* Only this body scrolls; the header above and the footer below stay pinned. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-1 pr-2">
            {editingCompany && <input type="hidden" name="id" value={editingCompany.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={editingCompany?.startDate?.slice(0, 10) ?? ""}
                />
                <p className="text-xs text-muted-foreground">Memberships cannot start before this.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billingName">Billing name</Label>
                <Input
                  id="billingName"
                  name="billingName"
                  defaultValue={editingCompany?.billingName ?? ""}
                  placeholder="If invoices need a different name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registrationNumber">Registration number</Label>
                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  defaultValue={editingCompany?.registrationNumber ?? ""}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="enterprise, partner"
                  defaultValue={editingCompany?.tags?.join(", ") || ""}
                />
                <p className="text-xs text-muted-foreground">Comma-separated list.</p>
              </div>

              <div className="space-y-4 rounded-md border p-3 sm:col-span-2">
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

              <div className="grid gap-2 sm:col-span-2">
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
            </div>
            {currentState.error && (
              <div className="text-sm text-red-600">{messageFor(currentState, "The company could not be saved.")}</div>
            )}
          </div>
          <DialogFooter className="mt-4 shrink-0 border-t pt-4">
            <div className="flex w-full gap-3">
              <SubmitButton editingCompany={editingCompany} />
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
