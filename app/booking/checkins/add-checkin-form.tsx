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

/** Now, in the `datetime-local` shape (local time, minute precision). */
function localNow(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/** A `datetime-local` value as an ISO instant, converted in the browser's zone. */
function toInstant(local: string): string {
  return local ? new Date(local).toISOString() : ""
}

function SubmitButton({ disabled = false }: Readonly<{ disabled?: boolean }>) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled} className="flex-1">
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
  // The visit's window. From starts at now so the live "check in" flow is
  // unchanged; To stays blank to leave the check-in open.
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const notifiedRef = useRef(false)

  const windowError = from && to && to <= from ? "The end must be after the start" : null

  useEffect(() => {
    if (isOpen) {
      notifiedRef.current = false
      setFrom(localNow())
      setTo("")
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
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    type="datetime-local"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    When the visit started. Entitlements and opening hours apply at this time.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    type="datetime-local"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                    aria-invalid={windowError ? true : undefined}
                    aria-describedby="to-hint"
                  />
                  <p id="to-hint" className={`text-xs ${windowError ? "text-red-600" : "text-muted-foreground"}`}>
                    {windowError ?? "Optional. Leave blank to keep the check-in open."}
                  </p>
                </div>

                {/* The server action gets instants; a bare local value would
                    be parsed in the server's zone instead of the user's. */}
                <input type="hidden" name="checkedInAt" value={toInstant(from)} />
                <input type="hidden" name="checkedOutAt" value={toInstant(to)} />

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
                <SubmitButton disabled={windowError !== null} />
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
