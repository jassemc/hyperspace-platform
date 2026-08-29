"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
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
import { getListMembers, getListLocations } from "@/lib/service"
import type { LocationDto, MemberDto } from "@/lib/service/HsService"
import { checkInAction } from "./actions"
import { toast } from "sonner"

interface AddCheckinFormProps {
  /** Opened from a member's page: the member select starts on them. */
  defaultMemberId?: string
  isOpen: boolean
  onClose: () => void
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Checking in..." : "Check in"}
    </Button>
  )
}

export function AddCheckinForm({ isOpen, onClose, defaultMemberId }: Readonly<AddCheckinFormProps>) {
  const [state, formAction] = useActionState(checkInAction, {})
  const [members, setMembers] = useState<MemberDto[]>([])
  // Controlled: the options arrive after mount, and a defaultValue set
  // before they exist is dropped by the browser.
  const [memberId, setMemberId] = useState(defaultMemberId ?? "")
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      notifiedRef.current = false
      loadOptions()
    } else {
      setMembers([])
      setLocations([])
    }
  }, [isOpen])

  useEffect(() => {
    if (state.success && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success("Checked in")
      onClose()
    } else if (state.error && !notifiedRef.current) {
      notifiedRef.current = true
      toast.error(state.error)
    }
  }, [state.success, state.error, onClose])

  const loadOptions = async () => {
    setIsLoading(true)
    try {
      const [memberPage, locationPage] = await Promise.all([
        getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
        getListLocations({ limit: 100, offset: 0, sort: "ASC" }),
      ])
      setMembers((memberPage.results ?? []) as MemberDto[])
      setLocations((locationPage.results ?? []) as LocationDto[])
    } catch (error) {
      console.error("Failed to load check-in options", error)
    } finally {
      setIsLoading(false)
    }
  }

  // The API infers the location when exactly one active site exists.
  const activeLocations = locations.filter((location) => location.active)

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
            <DrawerTitle>Check a member in</DrawerTitle>
            <DrawerDescription>Records a presence interval at a location.</DrawerDescription>
          </DrawerHeader>

          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="memberId">Member</Label>
                  <select
                    id="memberId"
                    name="memberId"
                    className={selectClassName}
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    <option value="">{isLoading ? "Loading members..." : "Select member"}</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="locationId">Location</Label>
                  <select id="locationId" name="locationId" className={selectClassName} disabled={isLoading}>
                    <option value="">
                      {activeLocations.length === 1 ? "Inferred automatically" : "Select location"}
                    </option>
                    {activeLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Optional when exactly one active location exists.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="force">Override</Label>
                  <select id="force" name="force" className={selectClassName} defaultValue="">
                    <option value="">None — use the member&apos;s entitlements</option>
                    <option value="visitor">Visitor</option>
                    <option value="trial">Trial</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Staff-only. Records the visit with no entitlement or credit behind it.
                  </p>
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
