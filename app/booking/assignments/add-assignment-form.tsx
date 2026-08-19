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
import { getListResources, getListMemberships } from "@/lib/service"
import type { MembershipDto, ResourceDto } from "@/lib/service/HsService"
import { createAssignmentAction } from "./actions"
import { toast } from "sonner"

interface AddAssignmentFormProps {
  isOpen: boolean
  onClose: () => void
  resources?: ResourceDto[]
  memberships?: MembershipDto[]
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Creating..." : "Create Assignment"}
    </Button>
  )
}

export function AddAssignmentForm({
  isOpen,
  onClose,
  resources: seedResources,
  memberships: seedMemberships,
}: Readonly<AddAssignmentFormProps>) {
  const [state, formAction] = useActionState(createAssignmentAction, {})
  const [resources, setResources] = useState<ResourceDto[]>(seedResources ?? [])
  const [memberships, setMemberships] = useState<MembershipDto[]>(seedMemberships ?? [])
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    notifiedRef.current = false

    // The page-level Add button renders this form with no seed data, so the
    // lookups are fetched here rather than threaded through every caller.
    if ((seedResources ?? []).length > 0 && (seedMemberships ?? []).length > 0) {
      setResources(seedResources ?? [])
      setMemberships(seedMemberships ?? [])
      return
    }

    let cancelled = false
    Promise.all([
      getListResources({ limit: 100, offset: 0, sort: "ASC" }),
      getListMemberships({ limit: 100, offset: 0, sort: "ASC" }),
    ])
      .then(([resourcePage, membershipPage]) => {
        if (cancelled) return
        setResources((resourcePage.results ?? []) as ResourceDto[])
        setMemberships((membershipPage.results ?? []) as MembershipDto[])
      })
      .catch((error) => console.error("Failed to load assignment options", error))

    return () => {
      cancelled = true
    }
  }, [isOpen, seedResources, seedMemberships])

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success("Assignment created")
      onClose()
    } else if (state.error && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error(state.error)
    }
  }, [state.success, state.error, onClose])

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
            <DrawerTitle>Add New Assignment</DrawerTitle>
            <DrawerDescription>
              Allocate a resource to a membership for a period.
            </DrawerDescription>
          </DrawerHeader>

          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="resourceId">Resource</Label>
                  <select id="resourceId" name="resourceId" className={selectClassName} required>
                    <option value="">Select resource</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="membershipId">Membership</Label>
                  <select id="membershipId" name="membershipId" className={selectClassName} required>
                    <option value="">Select membership</option>
                    {memberships.map((membership) => (
                      <option key={membership.id} value={membership.id}>
                        {membership.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Starts at</Label>
                  <Input id="startsAt" name="startsAt" type="date" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endsAt">Ends at</Label>
                  <Input id="endsAt" name="endsAt" type="date" />
                  <p className="text-xs text-muted-foreground">
                    Optional planned end. Leave blank for open-ended.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {state.error && <div className="text-sm text-red-600">{state.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton />
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
