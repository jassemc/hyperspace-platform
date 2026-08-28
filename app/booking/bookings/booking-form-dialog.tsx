"use client"

import { useCallback, useEffect, useActionState, useMemo, useRef, useState } from "react"
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
import { NativeSelect } from "@/components/ui/native-select"
import type { BookingDto, ResourceDto } from "@/lib/service/HsService"
import { formatPriceHt } from "@/lib/format"
import { toWallClock } from "@/lib/slots"
import {
  createBookingAction,
  updateBookingAction,
  validateBookingAction,
  type ActionState,
} from "./actions"
import { BOOKING_STATUS_LABELS } from "./booking-status"
import { BookingCustomerFields } from "./booking-customer-fields"
import { BookingSlotPicker, type SlotValue } from "./booking-slot-picker"
import { FREE_REASON_LABELS } from "./free-reason"
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
 * What the times start out as: the booking being edited, else the cell
 * that was clicked, else nothing. Shared by the initial state and the
 * reopen reset so the two cannot drift — the picker reads `value` once at
 * mount to choose its month and day, so seeding this only in the effect
 * would land it a render too late and lose the clicked column.
 *
 * Converted into the GRID's zone, not the browser's: the time fields
 * carry no zone of their own, so a browser-local reading would show a
 * different time than the cell that was clicked. `toWallClock` is the
 * same helper the slot picker writes its values with — `timesChanged`
 * compares the two, and a second implementation that disagreed by one
 * character would make every metadata edit post a window.
 */
function seedSlot(
  editingBooking: BookingDto | null | undefined,
  prefill: BookingFormDialogProps["prefill"],
  timeZone: string
): SlotValue | null {
  if (editingBooking) {
    return {
      startsAt: toWallClock(editingBooking.startsAt, timeZone),
      endsAt: toWallClock(editingBooking.endsAt, timeZone),
    }
  }
  if (prefill) {
    return {
      startsAt: toWallClock(prefill.startsAt, timeZone),
      endsAt: toWallClock(prefill.endsAt, timeZone),
    }
  }
  return null
}

/**
 * What `ActionState.problemType` exists for. Neither of these is a
 * validation failure — nothing about the form is wrong — and the API's raw
 * detail ("Status Code 409: ...") says nothing about what to do next.
 * Everything else falls through to the server's own message.
 */
function messageFor(state: ActionState, fallback: string): string {
  if (state.problemType === "booking_conflict") {
    return "That slot was just taken. Pick another time or another room."
  }
  if (state.problemType === "booking_not_reschedulable") {
    // Reachable when a move is combined with a no-show mark, or when the
    // row is already cancelled: the API refuses to reschedule anything
    // that is not confirmed or pending.
    return "This booking's status does not allow moving it. Cancel and rebook instead."
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
  const [checkTick, setCheckTick] = useState(0)
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)
  const [slot, setSlot] = useState<SlotValue | null>(() =>
    seedSlot(editingBooking, prefill, timeZone)
  )
  // The escape hatch: staff do book outside opening hours, and the API
  // allows it, so the availability grid must not be the only way in.
  const [manualTimes, setManualTimes] = useState(false)
  // Create only — see the checkbox below. Affects the quote message, so
  // it also has to invalidate the dry run.
  const [isFree, setIsFree] = useState(false)

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
      setIsFree(false)
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
  // Monotonic guard: a slow response must not paint its quote over a
  // newer request's answer.
  const checkSeq = useRef(0)
  const runCheck = useCallback(async () => {
    if (!formRef.current) return
    const seq = ++checkSeq.current
    setChecking(true)
    setQuoteMessage(null)
    try {
      const result = await validateBookingAction({}, new FormData(formRef.current))
      if (seq !== checkSeq.current) return
      if (result.success) {
        const quote = result.quote as { priceHt?: number | null } | undefined
        const price = quote?.priceHt
        setQuoteMessage(
          price === null || price === undefined
            ? "Available — fully covered by credits."
            : isFree
              ? `Available — free (would have been ${formatPriceHt(price)} excl. VAT).`
              : `Available — ${formatPriceHt(price)} excl. VAT.`
        )
      } else {
        setQuoteMessage(messageFor(result, "The booking is not valid."))
      }
    } finally {
      if (seq === checkSeq.current) setChecking(false)
    }
  }, [isFree])

  /**
   * The quote describes one exact resource, slot and set of extras. Once
   * any of them moves it is answering a question nobody asked any more,
   * so it goes rather than sitting there looking green.
   */
  const invalidateQuote = () => {
    setQuoteMessage(null)
    // Also the re-check trigger: the debounced effect below keys on this.
    setCheckTick((tick) => tick + 1)
  }

  /**
   * One half of the manual pair. Kept as a merged draft so a part-typed
   * entry survives on screen, but collapsed back to `null` the moment
   * both halves are empty rather than lingering as an object of two
   * empty strings.
   */
  const updateHalf = (half: "startsAt" | "endsAt", next: string) => {
    setSlot((current) => {
      const startsAt = half === "startsAt" ? next : (current?.startsAt ?? "")
      let endsAt = half === "endsAt" ? next : (current?.endsAt ?? "")
      // A previously-picked end that the new start has now reached or
      // passed is stale, not merely off the grid — keeping it selected
      // would look valid right up until the server rejects it (an end
      // equal to the new start is a zero-duration pair, not a real
      // range). Same-shape strings compare correctly as-is.
      if (half === "startsAt" && endsAt && endsAt <= next) endsAt = ""
      return startsAt || endsAt ? { startsAt, endsAt } : null
    })
    invalidateQuote()
  }

  const currentState = editingBooking ? updateState : createState
  const formAction = editingBooking ? updateFormAction : createFormAction

  // The manual fields edit a *draft*: either half can be empty while the
  // user is part-way through one. A half-empty pair is not a SlotValue and
  // must not leave this component — BookingSlotPicker seeds its month from
  // `value?.startsAt ?? today`, and `??` does not catch "", so an empty
  // half would make `monthOf("")` produce "" and its fetch effect reach
  // `new Date(NaN).toISOString()`. That throws inside a useEffect, which
  // React unwinds to the nearest error boundary — the whole bookings page,
  // not just this dialog. Reachable in three clicks: toggle to manual, set
  // "Ends at" first, toggle back.
  const committedSlot = slot?.startsAt && slot.endsAt ? slot : null

  // The dry run fires itself: any change to the resource, the times or
  // the extras (checkTick — bumped by invalidateQuote) re-checks after a
  // beat, instead of a button nobody pressed until the 409. Create only:
  // the edit branch has no dry run — see the gate at the quote line.
  useEffect(() => {
    if (editingBooking || !resourceId || !committedSlot) return
    const id = setTimeout(runCheck, 600)
    return () => clearTimeout(id)
  }, [editingBooking, resourceId, committedSlot, checkTick, runCheck])

  // The window this booking already has, produced by the very same helper
  // that seeds `slot`, so minute-truncation cannot read as a change.
  const baselineSlot = useMemo(
    () => (editingBooking ? seedSlot(editingBooking, undefined, timeZone) : null),
    [editingBooking, timeZone]
  )

  /**
   * Whether to post `startsAt`/`endsAt` at all.
   *
   * Create always does. Edit posts them ONLY when the window actually
   * moved, because the API treats any supplied window as a reschedule and
   * a reschedule is not free: it re-quotes the room at *today's* rate card
   * (only extras are frozen), re-runs credit consumption against the live
   * balance, and 409s outright on a booking that is cancelled or being
   * marked no-show. Posting the unchanged window on a title edit would
   * silently re-price the booking and break the no-show checkbox, which
   * lives in this same form.
   */
  const timesChanged =
    committedSlot !== null &&
    (baselineSlot === null ||
      committedSlot.startsAt !== baselineSlot.startsAt ||
      committedSlot.endsAt !== baselineSlot.endsAt)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
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
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Only this body scrolls; the header above and the footer's
              submit below stay pinned. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-1 pr-2">
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

          <div className="grid gap-3" role="group" aria-labelledby="booking-when-label">
            <div className="flex items-center justify-between">
              {/* A group heading, not a control label: it names the
                  picker-or-manual pair below, which is a region rather
                  than a single field. */}
              <span id="booking-when-label" className="text-sm font-medium leading-none">
                When
              </span>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => setManualTimes((previous) => !previous)}
              >
                {manualTimes ? "Back to available slots" : "Set times manually"}
              </Button>
            </div>

            {/* An edit that moves the window is a reschedule, and a
                reschedule re-quotes the room at TODAY's rate card (only
                the extras stay frozen), so the customer can end up owing
                a different amount. The dry run cannot say so here — it is
                gated off on the edit branch below — so the form does. */}
            {editingBooking && (
              <p className="text-sm text-muted-foreground">
                Changing the times re-prices the booking at current rates.
              </p>
            )}

            {/* The ONLY emitters of these two names in this form. They sit
                outside the manual/picker branch so there is exactly one of
                each in either mode, and so a single condition decides
                whether the submission is a reschedule at all — see
                `timesChanged`. The manual DateTimeFields below therefore
                carry deliberately inert names: DateTimeField always writes
                a hidden input of its own, and a second `startsAt` would
                leave `FormData.get` reading whichever came first. */}
            {timesChanged && (
              <>
                <input type="hidden" name="startsAt" value={committedSlot?.startsAt ?? ""} />
                <input type="hidden" name="endsAt" value={committedSlot?.endsAt ?? ""} />
              </>
            )}

            {manualTimes ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Starts at</Label>
                  <DateTimeField portalled={false}
                    id="startsAt"
                    name="startsAt__manual"
                    value={slot?.startsAt ?? ""}
                    onChange={(next) => updateHalf("startsAt", next)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endsAt">Ends at</Label>
                  <DateTimeField portalled={false}
                    id="endsAt"
                    name="endsAt__manual"
                    value={slot?.endsAt ?? ""}
                    min={slot?.startsAt}
                    onChange={(next) => updateHalf("endsAt", next)}
                  />
                </div>
              </>
            ) : (
              <BookingSlotPicker
                resourceId={resourceId}
                timeZone={timeZone}
                value={committedSlot}
                onChange={(next) => {
                  setSlot(next)
                  invalidateQuote()
                }}
                // The booking's own row would otherwise read as busy and
                // hide the slot it already occupies.
                excludeBookingId={editingBooking?.id}
              />
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

          {/* Create only, deliberately. POST /bookings/validate takes a
              CreateBookingDto and has no `excludeBookingId` (only
              GET /resources/{id}/availability does), so a dry run on an
              edit would be checked against a grid that still contains the
              booking's own row — and the commonest reschedule, nudging a
              window by half an hour, overlaps itself. It would report a
              conflict that does not exist. Left gated until the endpoint
              can exclude the booking being moved. */}
          {!editingBooking && (
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isFree"
                  className="h-4 w-4 rounded border-input"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked)
                    invalidateQuote()
                  }}
                />
                Free booking (no credits, no charges)
              </label>
              {isFree && (
                <div className="grid gap-2">
                  <Label htmlFor="freeReason">Reason</Label>
                  <NativeSelect id="freeReason" name="freeReason" required defaultValue="partnership">
                    {Object.entries(FREE_REASON_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {checking && (
                <p className="text-xs text-muted-foreground">Checking availability…</p>
              )}
              {!checking && quoteMessage && (
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

          </div>

          <DialogFooter className="mt-4 shrink-0 border-t pt-4">
            <div className="flex w-full gap-3">
              <SubmitButton
                editingBooking={editingBooking}
                // The manual branch can hold half a pair (a start with its
                // end cleared), which `committedSlot` already refuses.
                disabled={!committedSlot}
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
