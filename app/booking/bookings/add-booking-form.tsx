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
import { getListResources, getListMembers, getListCompanies } from "@/lib/service"
import type { BookingDto, CompanyDto, MemberDto, ResourceDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { createBookingAction, updateBookingAction, validateBookingAction } from "./actions"
import { BOOKING_STATUS_LABELS } from "./booking-status"
import { toast } from "sonner"

interface AddBookingFormProps {
  isOpen: boolean
  onClose: () => void
  editingBooking?: BookingDto | null
  resources?: ResourceDto[]
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
}

type CustomerKind = "member" | "company" | "none"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton({ editingBooking }: Readonly<{ editingBooking?: BookingDto | null }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingBooking ? "Updating..." : "Creating..."
    return editingBooking ? "Update" : "Create Booking"
  }

  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddBookingForm({
  isOpen,
  onClose,
  editingBooking,
  resources: seedResources,
  memberNames: seedMemberNames,
  companyNames: seedCompanyNames,
}: Readonly<AddBookingFormProps>) {
  const [resources, setResources] = useState<ResourceDto[]>(seedResources ?? [])
  const [memberNames, setMemberNames] = useState<Record<string, string>>(seedMemberNames ?? {})
  const [companyNames, setCompanyNames] = useState<Record<string, string>>(seedCompanyNames ?? {})
  const [createState, createFormAction] = useActionState(createBookingAction, {})
  const [updateState, updateFormAction] = useActionState(updateBookingAction, {})
  const [customerKind, setCustomerKind] = useState<CustomerKind>("member")
  const [resourceId, setResourceId] = useState("")
  const [checking, setChecking] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)

  const formRef = useRef<HTMLFormElement>(null)
  const createNotifiedRef = useRef(false)
  const updateNotifiedRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      createNotifiedRef.current = false
      updateNotifiedRef.current = false
      setQuoteMessage(null)
      setResourceId(editingBooking?.resourceId ?? "")
      setCustomerKind(editingBooking?.companyId ? "company" : "member")
    }
  }, [isOpen, editingBooking])

  // The page-level Add button renders this form with no seed data, so the
  // lookups are fetched here rather than threaded through every caller.
  useEffect(() => {
    if (!isOpen) return
    if ((seedResources ?? []).length > 0) return

    let cancelled = false
    Promise.all([
      getListResources({ limit: 100, offset: 0, sort: "ASC" }),
      getListMembers({ limit: 100, offset: 0, sort: "ASC" }),
      getListCompanies({ limit: 100, offset: 0, sort: "ASC" }),
    ])
      .then(([resourcePage, memberPage, companyPage]) => {
        if (cancelled) return
        setResources((resourcePage.results ?? []) as ResourceDto[])
        setMemberNames(
          Object.fromEntries(
            ((memberPage.results ?? []) as MemberDto[]).map((m) => [m.id, m.fullName])
          )
        )
        setCompanyNames(
          Object.fromEntries(
            ((companyPage.results ?? []) as CompanyDto[]).map((c) => [c.id, c.name])
          )
        )
      })
      .catch((error) => console.error("Failed to load booking options", error))

    return () => {
      cancelled = true
    }
  }, [isOpen, seedResources])

  useEffect(() => {
    if (createState.success && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.success("Booking created")
      onClose()
    } else if (createState.error && !createNotifiedRef.current) {
      createNotifiedRef.current = true
      toast.error(createState.error)
    }
  }, [createState.success, createState.error, onClose])

  useEffect(() => {
    if (updateState.success && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.success("Booking updated")
      onClose()
    } else if (updateState.error && !updateNotifiedRef.current) {
      updateNotifiedRef.current = true
      toast.error(updateState.error)
    }
  }, [updateState.success, updateState.error, onClose])

  /**
   * Dry run against POST /bookings/validate so conflicts and the price show up
   * before anything is written.
   */
  const runCheck = async () => {
    if (!formRef.current) return
    setChecking(true)
    setQuoteMessage(null)
    try {
      const result = await validateBookingAction({}, new FormData(formRef.current))
      if (result.success) {
        const quote = result.quote as { priceHt?: number | null } | undefined
        const price = quote?.priceHt
        setQuoteMessage(
          price === null || price === undefined
            ? "Available — fully covered by credits."
            : `Available — ${formatPriceHt(price)} excl. VAT.`
        )
      } else {
        setQuoteMessage(result.error ?? "The booking is not valid.")
      }
    } finally {
      setChecking(false)
    }
  }

  const selectedResource = resources.find((resource) => resource.id === resourceId)
  const availableExtras = (selectedResource?.rates ?? []).flatMap((rate) => rate.extras ?? [])
  const currentState = editingBooking ? updateState : createState
  const formAction = editingBooking ? updateFormAction : createFormAction

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[440px] ml-auto">
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
            <DrawerTitle>{editingBooking ? "Edit Booking" : "Add New Booking"}</DrawerTitle>
            <DrawerDescription>
              {editingBooking
                ? "Times and resource are fixed; the label, notes and status can change."
                : "Book a resource for a member or a company."}
            </DrawerDescription>
          </DrawerHeader>

          <form
            ref={formRef}
            key={editingBooking?.id || "create"}
            action={formAction}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {editingBooking && <input type="hidden" name="id" value={editingBooking.id} />}
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Team stand-up"
                    defaultValue={editingBooking?.title || ""}
                  />
                </div>

                {editingBooking ? (
                  <>
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      {new Date(editingBooking.startsAt).toLocaleString()} —{" "}
                      {new Date(editingBooking.endsAt).toLocaleString()}
                      <span className="block pt-1 text-xs">
                        Resource and times cannot be changed after creation.
                      </span>
                    </div>
                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <p className="text-sm">
                        Currently{" "}
                        <span className="font-medium">
                          {BOOKING_STATUS_LABELS[editingBooking.status] ?? editingBooking.status}
                        </span>
                        .
                      </p>
                      {/* The patch endpoint accepts only `no_show`; confirming
                          and cancelling have their own endpoints, driven by the
                          buttons in the table row. */}
                      {editingBooking.status !== "no_show" &&
                        new Date(editingBooking.startsAt) <= new Date() && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="markNoShow" className="h-4 w-4 rounded border-input" />
                            Mark as a no-show
                          </label>
                        )}
                      <p className="text-xs text-muted-foreground">
                        Use the confirm and cancel actions in the table to change status otherwise.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="resourceId">Resource</Label>
                      <select
                        id="resourceId"
                        name="resourceId"
                        className={selectClassName}
                        value={resourceId}
                        onChange={(e) => setResourceId(e.target.value)}
                        required
                      >
                        <option value="">Select resource</option>
                        {resources.map((resource) => (
                          <option key={resource.id} value={resource.id}>
                            {resource.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="customerKind">Customer type</Label>
                      <select
                        id="customerKind"
                        className={selectClassName}
                        value={customerKind}
                        onChange={(e) => setCustomerKind(e.target.value as CustomerKind)}
                      >
                        <option value="member">Member</option>
                        <option value="company">Company</option>
                        <option value="none">None (walk-in)</option>
                      </select>
                    </div>

                    {customerKind === "member" && (
                      <div className="grid gap-2">
                        <Label htmlFor="memberId">Member</Label>
                        <select id="memberId" name="memberId" className={selectClassName}>
                          <option value="">Select member</option>
                          {Object.entries(memberNames).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {customerKind === "company" && (
                      <div className="grid gap-2">
                        <Label htmlFor="companyId">Company</Label>
                        <select id="companyId" name="companyId" className={selectClassName}>
                          <option value="">Select company</option>
                          {Object.entries(companyNames).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="startsAt">Starts at</Label>
                      <Input id="startsAt" name="startsAt" type="datetime-local" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endsAt">Ends at</Label>
                      <Input id="endsAt" name="endsAt" type="datetime-local" required />
                    </div>

                    {availableExtras.length > 0 && (
                      <div className="grid gap-2">
                        <Label>Extras</Label>
                        <div className="grid gap-2 rounded-md border border-input p-3">
                          {availableExtras.map((extra) => (
                            <label key={extra.id} className="flex items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                name="extraIds"
                                value={extra.id}
                                className="mt-0.5 h-4 w-4 rounded border-input"
                              />
                              <span>
                                {extra.name}
                                <span className="block text-xs text-muted-foreground">
                                  {formatPriceHt(extra.priceHt)}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Offered by the rates attached to this resource.
                        </p>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Button type="button" variant="outline" onClick={runCheck} disabled={checking}>
                        {checking ? "Checking..." : "Check availability & price"}
                      </Button>
                      {quoteMessage && (
                        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{quoteMessage}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    defaultValue={editingBooking?.notes || ""}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {currentState.error && <div className="text-sm text-red-600">{currentState.error}</div>}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton editingBooking={editingBooking} />
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
