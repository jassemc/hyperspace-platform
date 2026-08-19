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
import { getListMemberships, getListResourceTypes } from "@/lib/service"
import type { MembershipDto, ResourceTypeDto } from "@/lib/service/HsService"
import { grantCreditAction } from "./actions"
import { toast } from "sonner"

interface AddCreditFormProps {
  isOpen: boolean
  onClose: () => void
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Granting..." : "Grant Credit"}
    </Button>
  )
}

export function AddCreditForm({ isOpen, onClose }: Readonly<AddCreditFormProps>) {
  const [state, formAction] = useActionState(grantCreditAction, {})
  const [memberships, setMemberships] = useState<MembershipDto[]>([])
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeDto[]>([])
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    notifiedRef.current = false

    let cancelled = false
    Promise.all([
      getListMemberships({ limit: 100, offset: 0, sort: "ASC" }),
      getListResourceTypes({ limit: 100, offset: 0, sort: "ASC" }),
    ])
      .then(([membershipPage, typePage]) => {
        if (cancelled) return
        setMemberships((membershipPage.results ?? []) as MembershipDto[])
        setResourceTypes((typePage.results ?? []) as ResourceTypeDto[])
      })
      .catch((error) => console.error("Failed to load credit options", error))

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success("Credit granted")
      onClose()
    } else if (state.error && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error(state.error)
    }
  }, [state.success, state.error, onClose])

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
            <DrawerTitle>Grant Credit</DrawerTitle>
            <DrawerDescription>
              Adds credit to a membership. Consumption is recorded automatically by bookings and
              check-ins.
            </DrawerDescription>
          </DrawerHeader>

          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-6">
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
                  <Label htmlFor="creditType">Credit type</Label>
                  <Input id="creditType" name="creditType" placeholder="meeting_room_hours" required />
                  <p className="text-xs text-muted-foreground">
                    Free-form key, matched when credits are spent.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" type="number" min="1" step="1" defaultValue={1} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="resourceTypeId">Limit to resource type</Label>
                  <select id="resourceTypeId" name="resourceTypeId" className={selectClassName}>
                    <option value="">Any resource type</option>
                    {resourceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiresAt">Expires at</Label>
                  <Input id="expiresAt" name="expiresAt" type="date" />
                  <p className="text-xs text-muted-foreground">Leave blank for credit that never lapses.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input id="reason" name="reason" placeholder="Goodwill gesture" />
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
