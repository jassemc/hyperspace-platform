"use client"

import { useEffect, useActionState, useRef, useState } from "react"
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
import type { MemberDto, MemberKindHint, MemberSegment } from "@/lib/service/HsService"
import { createMemberAction, updateMemberAction } from "./actions"
import type { ActionState } from "@/lib/action-state"
import { toast } from "sonner"

const KIND_HINT_OPTIONS: { value: MemberKindHint; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "visitor", label: "Visitor" },
  { value: "member", label: "Member" },
]

const SEGMENT_OPTIONS: { value: MemberSegment; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "freelancer", label: "Freelancer" },
  { value: "remote_employee", label: "Remote employee" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "company_team", label: "Company team" },
  { value: "visiting_professional", label: "Visiting professional" },
  { value: "other", label: "Other" },
]

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

interface MemberFormDialogProps {
  isOpen: boolean
  onClose: () => void
  editingMember?: MemberDto | null
  companies?: { id: string; name: string }[]
}

function messageFor(state: ActionState, fallback: string): string {
  if (state.problemType === "member_company_role_requires_company") {
    return "Billing and contact roles need an employer. Pick a company first."
  }
  if (state.problemType === "company_not_found") return "That company no longer exists."
  return state.error ?? fallback
}

function SubmitButton({ editingMember }: Readonly<{ editingMember?: MemberDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) {
      return editingMember ? "Updating..." : "Creating..."
    }
    return editingMember ? "Update" : "Create Member"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function MemberFormDialog({
  isOpen,
  onClose,
  editingMember,
  companies,
}: Readonly<MemberFormDialogProps>) {
  const [createState, createFormAction] = useActionState(createMemberAction, {})
  const [updateState, updateFormAction] = useActionState(updateMemberAction, {})
  const [companyId, setCompanyId] = useState("")

  const companyOptions = companies ?? []
  const currentEmployer = editingMember?.company
  // An employer past the first hundred companies must still be selectable,
  // or saving would silently detach the member.
  const options =
    currentEmployer && !companyOptions.some((c) => c.id === currentEmployer.id)
      ? [currentEmployer, ...companyOptions]
      : companyOptions

  // The last state object each notify effect has already reacted to.
  // `useActionState` hands back a fresh object on every dispatch, so
  // identity — not a boolean flag — is what tells a real submission apart
  // from an unrelated re-render.
  const lastCreateStateRef = useRef<ActionState | null>(null)
  const lastUpdateStateRef = useRef<ActionState | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCompanyId(editingMember?.companyId ?? "")
    }
  }, [isOpen, editingMember])

  useEffect(() => {
    if (createState === lastCreateStateRef.current) return
    lastCreateStateRef.current = createState

    if (createState.success) {
      toast.success("Member created")
      onClose()
    } else if (createState.error) {
      toast.error(messageFor(createState, "Failed to create member"))
    }
  }, [createState, onClose])

  useEffect(() => {
    if (updateState === lastUpdateStateRef.current) return
    lastUpdateStateRef.current = updateState

    if (updateState.success) {
      toast.success("Member updated")
      onClose()
    } else if (updateState.error) {
      toast.error(messageFor(updateState, "Failed to update member"))
    }
  }, [updateState, onClose])

  const currentState = editingMember ? updateState : createState
  const formAction = editingMember ? updateFormAction : createFormAction

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editingMember ? "Edit Member" : "Add New Member"}</DialogTitle>
          <DialogDescription>
            {editingMember ? "Update their details or employer." : "Add someone to the community directory."}
          </DialogDescription>
        </DialogHeader>
        <form key={editingMember?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
          {/* Only this body scrolls; the header above and the footer below stay pinned. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-1 pr-2">
            {editingMember && <input type="hidden" name="id" value={editingMember.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Mohamed Ali May"
                  defaultValue={editingMember?.fullName || ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="member@example.com"
                  defaultValue={editingMember?.email || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+21622123456"
                  defaultValue={editingMember?.phone || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kindHint">Kind</Label>
                <select
                  id="kindHint"
                  name="kindHint"
                  className={selectClassName}
                  defaultValue={editingMember?.kindHint || "lead"}
                >
                  {KIND_HINT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyId">Employer</Label>
                {/* Employment moves via PUT /members/:id/company; the action
                    only calls it when this value actually changed. */}
                {editingMember && (
                  <input type="hidden" name="previousCompanyId" value={editingMember.companyId ?? ""} />
                )}
                <select
                  id="companyId"
                  name="companyId"
                  className={selectClassName}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  <option value="">Solo (no company)</option>
                  {options.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="segment">Segment</Label>
                <select
                  id="segment"
                  name="segment"
                  className={selectClassName}
                  defaultValue={editingMember?.segment || ""}
                >
                  <option value="">None</option>
                  {SEGMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Both roles are company-scoped and rejected without an employer. */}
              {companyId && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Company roles</Label>
                  <div className="grid gap-2 rounded-md border border-input p-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="isBillingPerson"
                        defaultChecked={editingMember?.isBillingPerson || false}
                        className="h-4 w-4 rounded border-input"
                      />
                      Receives the company&apos;s invoices
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="isContactPerson"
                        defaultChecked={editingMember?.isContactPerson || false}
                        className="h-4 w-4 rounded border-input"
                      />
                      Is the company&apos;s contact person
                    </label>
                  </div>
                </div>
              )}
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="vip, founder"
                  defaultValue={(editingMember?.tags ?? []).join(", ")}
                />
                <p className="text-xs text-muted-foreground">Comma separated.</p>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Internal notes"
                  defaultValue={editingMember?.notes || ""}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              {editingMember && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground sm:col-span-2">
                  Status <span className="font-medium text-foreground">{editingMember.status}</span> is
                  derived from membership activity.
                  {editingMember.statusOverride
                    ? ` It is currently pinned to "${editingMember.statusOverride}".`
                    : " Use the status action in the table to pin it."}
                </div>
              )}
            </div>
            {currentState.error && (
              <div className="text-sm text-red-600">{messageFor(currentState, "The member could not be saved.")}</div>
            )}
          </div>
          <DialogFooter className="mt-4 shrink-0 border-t pt-4">
            <div className="flex w-full gap-3">
              <SubmitButton editingMember={editingMember} />
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
