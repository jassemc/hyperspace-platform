"use client"

import { useEffect, useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateTimeField } from "@/components/ui/date-time-field"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { BookingDto, ResourceDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import {
  createBookingAction,
  updateBookingAction,
  validateBookingAction,
  type ActionState,
} from "./actions"
import { BOOKING_STATUS_LABELS } from "./booking-status"
import { BookingCustomerFields } from "./booking-customer-fields"
import { BookingSlotPicker, type SlotValue } from "./booking-slot-picker"
import { toast } from "sonner"

interface BookingFormDialogProps {
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
  /** Zone every wall-clock string in this form is written in. */
  timeZone: string
}

/**
 * The form's time fields take a local wall-clock string with no zone of
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
 * What the times start out as: the booking being edited, else the cell
 * that was clicked, else nothing. Shared by the initial state and the
 * reopen reset so the two cannot drift — the picker reads `value` once at
 * mount to choose its month and day, so seeding this only in the effect
 * would land it a render too late and lose the clicked column.
 */
function seedSlot(
  editingBooking: BookingDto | null | undefined,
  prefill: BookingFormDialogProps["prefill"],
  timeZone: string
): SlotValue | null {
  if (editingBooking) {
    return {
      startsAt: toLocalInput(editingBooking.startsAt, timeZone),
      endsAt: toLocalInput(editingBooking.endsAt, timeZone),
    }
  }
  if (prefill) {
    return {
      startsAt: toLocalInput(prefill.startsAt, timeZone),
      endsAt: toLocalInput(prefill.endsAt, timeZone),
    }
  }
  return null
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

export function BookingFormDialog({
  isOpen,
  onClose,
  editingBooking,
  resources: seedResources,
  prefill,
  timeZone,
}: Readonly<BookingFormDialogProps>) {
  const [createState, createFormAction] = useActionState(createBookingAction, {})
  const [updateState, updateFormAction] = useActionState(updateBookingAction, {})
  const [resourceId, setResourceId] = useState(
    editingBooking?.resourceId ?? prefill?.resourceId ?? ""
  )
  const [checking, setChecking] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)
  const [slot, setSlot] = useState<SlotValue | null>(() =>
    seedSlot(editingBooking, prefill, timeZone)
  )
  // The escape hatch: staff do book outside opening hours, and the API
  // allows it, so the availability grid must not be the only way in.
  const [manualTimes, setManualTimes] = useState(false)

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
      setManualTimes(false)
      setResourceId(editingBooking?.resourceId ?? prefill?.resourceId ?? "")
      setSlot(seedSlot(editingBooking, prefill, timeZone))
    }
  }, [isOpen, editingBooking, prefill, timeZone])

  useEffect(() => {
    // `onClose` is a plain closure in the real caller (booking-table.tsx),
    // not a `useCallback`, and this form stays mounted regardless of dialog
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

  const currentState = editingBooking ? updateState : createState
  const formAction = editingBooking ? updateFormAction : createFormAction

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBooking ? "Edit Booking" : "Add New Booking"}</DialogTitle>
          <DialogDescription>
            {editingBooking
              ? "Move it, relabel it or add notes. Changing the room stays a cancel-and-rebook."
              : "Book a resource for a member or a company."}
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          key={editingBooking?.id || "create"}
          action={formAction}
          className="space-y-6"
        >
          {editingBooking && <input type="hidden" name="id" value={editingBooking.id} />}
          {/* The time fields carry no zone of their own, so the server
              action needs to know which zone these wall-clock strings were
              written in — see actions.ts:toUtcIso. Emitted once, outside
              the manual/picker branch: a second input of the same name
              would leave `FormData.get` reading whichever came first. */}
          <input type="hidden" name="timeZone" value={timeZone} />

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Team stand-up"
              defaultValue={editingBooking?.title || ""}
            />
          </div>

          <BookingCustomerFields
            resources={seedResources}
            resourceId={resourceId}
            onResourceChange={(id) => {
              setResourceId(id)
              // A slot picked in another room means nothing here.
              setSlot(null)
              invalidateQuote()
            }}
            prefillResourceName={prefill?.resourceName}
            disabled={Boolean(editingBooking)}
            onExtrasChange={invalidateQuote}
          />

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>When</Label>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => setManualTimes((previous) => !previous)}
              >
                {manualTimes ? "Back to available slots" : "Set times manually"}
              </Button>
            </div>

            {manualTimes ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Starts at</Label>
                  <DateTimeField
                    id="startsAt"
                    name="startsAt"
                    value={slot?.startsAt ?? ""}
                    onChange={(next) => {
                      setSlot((current) => ({
                        startsAt: next,
                        // A previously-picked end that the new start has
                        // now reached or passed is stale, not merely off
                        // the grid — keeping it selected would look valid
                        // right up until the server rejects it (an end
                        // equal to the new start is a zero-duration pair,
                        // not a real range). Same-shape strings compare
                        // correctly as-is.
                        endsAt:
                          current?.endsAt && current.endsAt <= next
                            ? ""
                            : (current?.endsAt ?? ""),
                      }))
                      invalidateQuote()
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endsAt">Ends at</Label>
                  <DateTimeField
                    id="endsAt"
                    name="endsAt"
                    value={slot?.endsAt ?? ""}
                    min={slot?.startsAt}
                    onChange={(next) => {
                      setSlot((current) => ({
                        startsAt: current?.startsAt ?? "",
                        endsAt: next,
                      }))
                      invalidateQuote()
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* DateTimeField writes its own hidden input under this
                    name, so these belong to the picker branch alone. */}
                <input type="hidden" name="startsAt" value={slot?.startsAt ?? ""} />
                <input type="hidden" name="endsAt" value={slot?.endsAt ?? ""} />
                <BookingSlotPicker
                  resourceId={resourceId}
                  timeZone={timeZone}
                  value={slot}
                  onChange={(next) => {
                    setSlot(next)
                    invalidateQuote()
                  }}
                  // The booking's own row would otherwise read as busy and
                  // hide the slot it already occupies.
                  excludeBookingId={editingBooking?.id}
                />
              </>
            )}
          </div>

          {editingBooking && (
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
          )}

          {!editingBooking && (
            <div className="grid gap-2">
              <Button type="button" variant="outline" onClick={runCheck} disabled={checking}>
                {checking ? "Checking..." : "Check availability & price"}
              </Button>
              {quoteMessage && (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{quoteMessage}</p>
              )}
            </div>
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

          <DialogFooter className="border-t pt-4">
            <div className="flex w-full gap-3">
              <SubmitButton
                editingBooking={editingBooking}
                // Both modes now carry times, and the manual branch can
                // hold half a pair (a start with its end cleared), so the
                // two fields are checked rather than the object.
                disabled={!slot?.startsAt || !slot?.endsAt}
              />
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
