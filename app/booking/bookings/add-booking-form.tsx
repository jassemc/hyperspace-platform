"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateTimeField } from "@/components/ui/date-time-field"
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
import { formatDateTime, formatPriceHt } from "@/lib/format"
import {
  createBookingAction,
  updateBookingAction,
  validateBookingAction,
  type ActionState,
} from "./actions"
import { BOOKING_STATUS_LABELS } from "./booking-status"
import { toast } from "sonner"

interface AddBookingFormProps {
  isOpen: boolean
  onClose: () => void
  editingBooking?: BookingDto | null
  resources?: ResourceDto[]
  /** Set when opened from a calendar cell. */
  prefill?: {
    resourceId: string
    startsAt: string
    endsAt: string
    /** Read off the calendar payload so the select never flashes blank. */
    resourceName?: string
  }
  /** Zone the datetime-local inputs are written in. Required with prefill. */
  timeZone?: string
}

/**
 * `datetime-local` inputs take a local wall-clock string with no zone of
 * their own, so an instant is converted into the grid's zone here rather
 * than the browser's — otherwise the field would silently show a
 * different time than the cell the user clicked.
 */
function toLocalInput(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso))
  return parts.replace(" ", "T")
}

/**
 * The one reaction `ActionState.problemType` exists for. A conflict is not
 * a validation failure: nothing about the form is wrong, someone else took
 * the slot in between, and the API's raw detail ("Status Code 409: ...")
 * does not say to pick another time. Everything else falls through to the
 * server's own message.
 */
function messageFor(state: ActionState, fallback: string): string {
  if (state.problemType === "booking_conflict") {
    return "That slot was just taken. Pick another time or another room."
  }
  return state.error ?? fallback
}

type CustomerKind = "member" | "company"

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

function SubmitButton({
  editingBooking,
  disabled = false,
}: Readonly<{ editingBooking?: BookingDto | null; disabled?: boolean }>) {
  const { pending } = useFormStatus()

  const getButtonText = () => {
    if (pending) return editingBooking ? "Updating..." : "Creating..."
    return editingBooking ? "Update" : "Create Booking"
  }

  return (
    <Button type="submit" disabled={pending || disabled} className="flex-1">
      {getButtonText()}
    </Button>
  )
}

export function AddBookingForm({
  isOpen,
  onClose,
  editingBooking,
  resources: seedResources,
  prefill,
  timeZone,
}: Readonly<AddBookingFormProps>) {
  const [resources, setResources] = useState<ResourceDto[]>(seedResources ?? [])
  const [memberNames, setMemberNames] = useState<Record<string, string>>({})
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({})
  const [createState, createFormAction] = useActionState(createBookingAction, {})
  const [updateState, updateFormAction] = useActionState(updateBookingAction, {})
  const [customerKind, setCustomerKind] = useState<CustomerKind>("member")
  const [resourceId, setResourceId] = useState("")
  const [checking, setChecking] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")

  const formRef = useRef<HTMLFormElement>(null)
  // The last state object each notify effect has already reacted to.
  // `useActionState` hands back a fresh object on every dispatch, so
  // identity — not `isOpen` — is what tells a real submission apart
  // from an unrelated re-render; see the effects below.
  const lastCreateStateRef = useRef<ActionState | null>(null)
  const lastUpdateStateRef = useRef<ActionState | null>(null)

  useEffect(() => {
    if (isOpen) {
      setQuoteMessage(null)
      setResourceId(editingBooking?.resourceId ?? prefill?.resourceId ?? "")
      setCustomerKind(editingBooking?.companyId ? "company" : "member")
      setStartsAt(prefill && timeZone ? toLocalInput(prefill.startsAt, timeZone) : "")
      setEndsAt(prefill && timeZone ? toLocalInput(prefill.endsAt, timeZone) : "")
    }
  }, [isOpen, editingBooking, prefill, timeZone])

  // The page-level Add button renders this form with no seed data, so the
  // lookups are fetched here rather than threaded through every caller.
  useEffect(() => {
    if (!isOpen) return
    if ((seedResources ?? []).length > 0) return

    let cancelled = false
    Promise.all([
      // A resource whose type cannot be booked would be refused by the
      // API, so it is never offered.
      getListResources({ limit: 100, offset: 0, sort: "ASC", canBook: true }),
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
    // `onClose` is a plain closure in the real caller (booking-table.tsx),
    // not a `useCallback`, and this form stays mounted regardless of drawer
    // visibility there — so an unrelated re-render (e.g. another row's
    // confirm/cancel revalidating the page) can hand this effect a new
    // `onClose` while `createState` is untouched. React re-runs the effect
    // on that alone; guard on the state object itself, since only a new
    // dispatch produces a new one — a second identical failure still must
    // toast, which an error-message comparison would miss.
    if (createState === lastCreateStateRef.current) return
    lastCreateStateRef.current = createState

    if (createState.success) {
      toast.success("Booking created")
      onClose()
    } else if (createState.error) {
      toast.error(messageFor(createState, "Failed to create booking"))
    }
  }, [createState, onClose])

  useEffect(() => {
    // Same reasoning as the create effect above.
    if (updateState === lastUpdateStateRef.current) return
    lastUpdateStateRef.current = updateState

    if (updateState.success) {
      toast.success("Booking updated")
      onClose()
    } else if (updateState.error) {
      toast.error(messageFor(updateState, "Failed to update booking"))
    }
  }, [updateState, onClose])

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
        setQuoteMessage(messageFor(result, "The booking is not valid."))
      }
    } finally {
      setChecking(false)
    }
  }

  /**
   * The quote describes one exact resource, slot and set of extras. Once
   * any of them moves it is answering a question nobody asked any more,
   * so it goes rather than sitting there looking green.
   */
  const invalidateQuote = () => setQuoteMessage(null)

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
                      {formatDateTime(editingBooking.startsAt, timeZone ?? "UTC")}
                      <span className="block pt-1 text-xs">
                        Resource and times cannot be changed. Use the details
                        action in the table to see the whole booking.
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
                        onChange={(e) => {
                          setResourceId(e.target.value)
                          invalidateQuote()
                        }}
                        required
                      >
                        <option value="">Select resource</option>
                        {/* The calendar payload already named this room; show it
                            immediately instead of a blank value until the full
                            resource list (fetched below) resolves. */}
                        {prefill?.resourceName &&
                          !resources.some((resource) => resource.id === prefill.resourceId) && (
                            <option value={prefill.resourceId}>{prefill.resourceName}</option>
                          )}
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
                      </select>
                    </div>

                    {customerKind === "member" && (
                      <div className="grid gap-2">
                        <Label htmlFor="memberId">Member</Label>
                        <select id="memberId" name="memberId" className={selectClassName} required>
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
                        <select id="companyId" name="companyId" className={selectClassName} required>
                          <option value="">Select company</option>
                          {Object.entries(companyNames).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* datetime-local carries no zone of its own, so the server
                        action needs to know which zone these wall-clock
                        strings were written in — see actions.ts:bookingPayload. */}
                    {prefill && timeZone && (
                      <input type="hidden" name="timeZone" value={timeZone} />
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="startsAt">Starts at</Label>
                      <DateTimeField
                        id="startsAt"
                        name="startsAt"
                        value={startsAt}
                        onChange={(next) => {
                          setStartsAt(next)
                          // A previously-picked end that the new start has
                          // now passed is stale, not merely off the grid —
                          // keeping it selected would look valid right up
                          // until the server rejects it. Same-shape strings
                          // compare correctly as-is.
                          if (endsAt && endsAt < next) {
                            setEndsAt("")
                          }
                          invalidateQuote()
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endsAt">Ends at</Label>
                      <DateTimeField
                        id="endsAt"
                        name="endsAt"
                        value={endsAt}
                        onChange={(next) => {
                          setEndsAt(next)
                          invalidateQuote()
                        }}
                        min={startsAt}
                      />
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
                                onChange={invalidateQuote}
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

                {currentState.error && (
                  <div className="text-sm text-red-600">
                    {messageFor(currentState, "The booking could not be saved.")}
                  </div>
                )}
              </div>
            </div>

            <DrawerFooter className="shrink-0 border-t pt-4 px-6 pb-6">
              <div className="flex gap-3">
                <SubmitButton
                  editingBooking={editingBooking}
                  // The edit branch has no time fields at all, so this only
                  // ever applies to a create submission.
                  disabled={!editingBooking && (!startsAt || !endsAt)}
                />
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
