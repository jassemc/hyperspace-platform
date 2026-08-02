"use client"

import React, { useEffect, useState } from "react"
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
import { Plus, X } from "lucide-react"
import type { MemberDto, PlanDto } from "@/lib/service/HsService"
import {
  listCompanyMemberOptions,
  listPlanOptions,
  subscribeMemberToPlanAction,
} from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

function formatPrice(millimes: number) {
  return `${(millimes / 1000).toLocaleString("en-US")} TND`
}

/** Opens the date picker explicitly, since the drawer swallows the click that would. */
function openNativePicker(event: React.MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget
  if (typeof input.showPicker !== "function") return

  try {
    input.showPicker()
  } catch {
    // Thrown when the call is not tied to a user gesture; typing still works.
  }
}

export function SubscribePlanButton({ companyId }: Readonly<{ companyId: string }>) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [plans, setPlans] = useState<PlanDto[]>([])
  const [members, setMembers] = useState<MemberDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setIsLoading(true)
    Promise.all([listPlanOptions(), listCompanyMemberOptions(companyId)])
      .then(([planResults, memberResults]) => {
        if (cancelled) return
        setPlans(planResults)
        setMembers(memberResults)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, companyId])

  const onSubmit = async (formData: FormData) => {
    setIsSaving(true)
    try {
      formData.append("companyId", companyId)
      const result = await subscribeMemberToPlanAction({}, formData)

      if (result.success) {
        toast.success("Membership created")
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to subscribe to plan")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const hasMembers = members.length > 0

  const getMemberPlaceholder = () => {
    if (isLoading) return "Loading members..."
    return hasMembers ? "Select a member" : "No members in this company"
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Subscribe to Plan
      </Button>

      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
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
              <DrawerTitle>Subscribe to Plan</DrawerTitle>
              <DrawerDescription>
                Creates a membership for one member of this company. Plan terms are frozen at
                creation time.
              </DrawerDescription>
            </DrawerHeader>

            <form action={onSubmit} className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="memberId">Member</Label>
                    <select
                      id="memberId"
                      name="memberId"
                      className={selectClassName}
                      required
                      disabled={isLoading || !hasMembers}
                    >
                      <option value="">{getMemberPlaceholder()}</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName}
                          {member.email ? ` — ${member.email}` : ""}
                        </option>
                      ))}
                    </select>
                    {!isLoading && !hasMembers && (
                      <p className="text-xs text-muted-foreground">
                        Attach a member on the Members tab before subscribing to a plan.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="planId">Plan</Label>
                    <select
                      id="planId"
                      name="planId"
                      className={selectClassName}
                      required
                      disabled={isLoading}
                    >
                      <option value="">{isLoading ? "Loading plans..." : "Select a plan"}</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} — {formatPrice(plan.priceHtMillimes)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="startsAt">Starts at</Label>
                    <Input
                      id="startsAt"
                      name="startsAt"
                      type="date"
                      required
                      // vaul treats every pointerdown in a left/right drawer as a
                      // potential drag and captures the pointer, so the browser
                      // never opens the native calendar on its own.
                      data-vaul-no-drag
                      onClick={openNativePicker}
                    />
                    <p className="text-xs text-muted-foreground">
                      First day of the membership, in Africa/Tunis business dates.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      placeholder="Internal notes"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <DrawerFooter className="border-t pt-4 px-6 pb-6">
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSaving || !hasMembers} className="flex-1">
                    {isSaving ? "Subscribing..." : "Subscribe"}
                  </Button>
                  <DrawerClose asChild>
                    <Button type="button" variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
