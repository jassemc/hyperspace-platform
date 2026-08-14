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
import type { MemberDto, MemberKindHint, MemberSegment } from "@/lib/service/HsService"
import { createMemberAction, updateMemberAction } from "./actions"
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

interface AddMemberFormProps {
  isOpen: boolean
  onClose: () => void
  editingMember?: MemberDto | null
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

export function AddMemberForm({ isOpen, onClose, editingMember }: Readonly<AddMemberFormProps>) {
  const [createState, createFormAction] = useActionState(createMemberAction, {})
  const [updateState, updateFormAction] = useActionState(updateMemberAction, {})

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
      toast.success("Member created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Member updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  const currentState = editingMember ? updateState : createState
  const formAction = editingMember ? updateFormAction : createFormAction

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
            <DrawerTitle>{editingMember ? "Edit Member" : "Add New Member"}</DrawerTitle>
            <DrawerDescription>
              {editingMember
                ? "Update CRM details for this person."
                : "Create a CRM contact. Status is derived from kind and memberships."}
            </DrawerDescription>
          </DrawerHeader>

          <form key={editingMember?.id || "create"} action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingMember && (
                <input type="hidden" name="id" value={editingMember.id} />
              )}
              <div className="space-y-6">
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
                <div className="grid gap-2">
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
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Status <span className="font-medium text-foreground">{editingMember.status}</span> is
                    derived and cannot be edited here.
                    {editingMember.hasPortalAccess ? " Portal access is linked." : " No portal access yet."}
                  </div>
                )}
                {currentState.error && (
                  <div className="text-sm text-red-600">
                    {currentState.error}
                  </div>
                )}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingMember={editingMember} />
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
