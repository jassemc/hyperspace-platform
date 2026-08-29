"use server"

import { revalidatePath } from "next/cache"
import {
  createBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  validateBooking,
  getResource,
  getListCredits,
} from "@/lib/service"
import type {
  ConfirmBookingDto,
  CreateBookingDto,
  CreditTransactionDto,
  ResourceDto,
  UpdateBookingDto,
} from "@/lib/service/HsService"
import { wallClockToUtcMs } from "@/lib/slots"
import { pageResult } from "@/lib/search-params"

export type ActionState = {
  success?: boolean
  error?: string
  /** RFC 9457 `type`, e.g. "booking_conflict" — so the UI can react, not just report. */
  problemType?: string
  status?: number
  /** Set by the dry-run check so the form can show the quote before committing. */
  quote?: unknown
}

/**
 * The generated client throws HttpError, whose `.message` is
 * `Status Code ${status}: ${detail}` — prefixed, not the bare detail —
 * and whose `.error` keeps the full RFC 9457 payload. Only `.message`
 * was being read, so a conflict was indistinguishable from a validation
 * failure and nothing could respond to it.
 */
function problem(error: unknown, fallback: string): ActionState {
  const http = error as { message?: string; status?: number; error?: { type?: string } }
  return {
    success: false,
    error: http?.message || fallback,
    problemType: http?.error?.type,
    status: http?.status,
  }
}

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/**
 * Like `text`, but an emptied field stays an empty string instead of
 * vanishing. PATCH /bookings assigns on `!== undefined`, so `undefined`
 * means "leave it alone" — which made clearing a note a silent no-op.
 */
function clearableText(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" ? value.trim() : undefined
}

/**
 * A wall-clock value ("2026-08-26T09:00") has no zone of its own.
 * `new Date(value)` therefore parses it in *this process's* zone, which
 * makes the same string mean a different instant depending on where the
 * server happens to run. The form now writes a hidden `timeZone` on
 * every submission (booking-form-dialog.tsx emits it unconditionally),
 * so the zone-less branch below is unreachable from this app; it stays
 * as a guard for a hand-rolled or partial FormData rather than silently
 * throwing, and costs nothing.
 */
function toUtcIso(value: string, timeZone: string | undefined): string {
  if (timeZone) {
    const [date, hhmm] = value.split("T")
    if (date && hhmm) {
      return new Date(wallClockToUtcMs(date, hhmm.slice(0, 5), timeZone)).toISOString()
    }
  }
  return new Date(value).toISOString()
}

function revalidate() {
  revalidatePath("/booking/bookings")
}

function bookingPayload(formData: FormData): CreateBookingDto | { error: string } {
  const resourceId = text(formData, "resourceId")
  const startsAt = text(formData, "startsAt")
  const endsAt = text(formData, "endsAt")
  const memberId = text(formData, "memberId")
  const companyId = text(formData, "companyId")
  // Written unconditionally by the form — see booking-form-dialog.tsx.
  const timeZone = text(formData, "timeZone")

  if (!resourceId) return { error: "Select a resource" }
  if (!startsAt) return { error: "Start time is required" }
  if (!endsAt) return { error: "End time is required" }

  const startsAtUtc = toUtcIso(startsAt, timeZone)
  const endsAtUtc = toUtcIso(endsAt, timeZone)
  if (new Date(endsAtUtc) <= new Date(startsAtUtc)) {
    return { error: "The end time must be after the start time" }
  }
  // The customer is a member XOR a company — the API refuses both AND
  // neither, so the form has to as well. Neither was reachable through
  // the "walk-in" option, which always 422'd.
  if (memberId && companyId) {
    return { error: "A booking belongs to a member or a company, not both" }
  }
  if (!memberId && !companyId) {
    return { error: "Select a member or a company" }
  }
  const isFree = formData.get("isFree") === "on"
  const freeReason = text(formData, "freeReason")
  if (isFree && !freeReason) return { error: "Pick a reason for the free booking" }

  return {
    resourceId,
    memberId,
    companyId,
    startsAt: startsAtUtc,
    endsAt: endsAtUtc,
    title: text(formData, "title"),
    notes: text(formData, "notes"),
    extraIds: formData.getAll("extraIds").map(String).filter(Boolean),
    isFree,
    freeReason: isFree ? (freeReason as CreateBookingDto["freeReason"]) : undefined,
  }
}

/** Dry run: prices the booking and surfaces conflicts without creating it. */
export async function validateBookingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const payload = bookingPayload(formData)
    if ("error" in payload) return { success: false, error: payload.error }

    const quote = await validateBooking(payload)
    return { success: true, quote }
  } catch (error) {
    return problem(error, "The booking is not valid")
  }
}

export async function createBookingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const payload = bookingPayload(formData)
    if ("error" in payload) return { success: false, error: payload.error }

    await createBooking(payload)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to create booking")
  }
}

/**
 * Title, notes, a no-show mark, and — when both times are present — a
 * reschedule. Confirming and cancelling keep their own endpoints.
 */
export async function updateBookingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Booking ID is required" }

    const startsAt = text(formData, "startsAt")
    const endsAt = text(formData, "endsAt")
    const timeZone = text(formData, "timeZone")

    // Both or neither. The API refuses one alone with
    // `reschedule_requires_both`, so failing here saves a round trip and
    // says it in the form's own words.
    if (Boolean(startsAt) !== Boolean(endsAt)) {
      return { success: false, error: "Pick both a start and an end time" }
    }
    if (startsAt && endsAt) {
      const startUtc = toUtcIso(startsAt, timeZone)
      const endUtc = toUtcIso(endsAt, timeZone)
      if (new Date(endUtc) <= new Date(startUtc)) {
        return { success: false, error: "The end time must be after the start time" }
      }
    }

    const data: UpdateBookingDto = {
      // `clearableText`, not `text`: an emptied note must reach the API
      // as "" so it actually clears — see the helper above.
      title: clearableText(formData, "title"),
      notes: clearableText(formData, "notes"),
      status: formData.get("markNoShow") === "on" ? "no_show" : undefined,
      startsAt: startsAt ? toUtcIso(startsAt, timeZone) : undefined,
      endsAt: endsAt ? toUtcIso(endsAt, timeZone) : undefined,
      // Only when the picker was rendered: `[]` then means "remove all",
      // whereas a form without it must leave the extras alone.
      extraIds:
        formData.get("extrasEdited") === "1"
          ? formData.getAll("extraIds").map(String).filter(Boolean)
          : undefined,
    }

    await updateBooking(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to update booking")
  }
}

export async function confirmBookingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Booking ID is required" }

    const isFree = formData.get("isFree") === "on"
    const freeReason = text(formData, "freeReason")
    if (isFree && !freeReason) return { success: false, error: "Pick a reason for the free booking" }
    // Absent field = no requested code, nothing to send. Present but empty =
    // staff unticked "apply the requested code", so the API must drop it —
    // that has to reach the body as an explicit `null`, not a missing key.
    const discountCodeField = formData.get("discountCode")
    const discountCode = typeof discountCodeField === "string" ? discountCodeField.trim() || null : undefined
    await confirmBooking(id, {
      ...(isFree ? { isFree, freeReason: freeReason as ConfirmBookingDto["freeReason"] } : {}),
      ...(discountCode !== undefined ? { discountCode } : {}),
    })
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to confirm booking")
  }
}

/**
 * Flags a past booking as a no-show. PATCH /bookings is the only route
 * that writes this status; the API itself refuses members
 * (`no_show_requires_staff`) and future bookings (`no_show_before_start`).
 */
export async function markNoShowAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Booking ID is required" }

    await updateBooking(id, { status: "no_show" })
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to mark as no-show")
  }
}

export async function cancelBookingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Booking ID is required" }

    await cancelBooking(id)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to cancel booking")
  }
}

export type BookingDetails = {
  /** Null when the room could not be loaded (deleted, or the request failed). */
  resource: ResourceDto | null
  /** Consumption rows linked to the booking; empty when it was paid in money. */
  credits: CreditTransactionDto[]
  /** Set when either read failed, so the dialog can say so instead of showing blanks. */
  error?: string
}

/**
 * The booking row only carries `resource: { id, name }` and nothing
 * about credits, so the details dialog fetches both on open. The two
 * reads are independent and fail independently — a missing photo must
 * not hide the credit ledger and vice versa.
 */
export async function getBookingDetailsAction(
  bookingId: string,
  resourceId: string
): Promise<BookingDetails> {
  const [resource, credits] = await Promise.allSettled([
    getResource(resourceId),
    getListCredits({ bookingId, kind: "consumption", offset: 0, limit: 100, sort: "ASC" }),
  ])
  const failed = [resource, credits].filter((r) => r.status === "rejected")
  return {
    resource: resource.status === "fulfilled" ? resource.value : null,
    credits: credits.status === "fulfilled" ? pageResult<CreditTransactionDto>(credits.value).results : [],
    error: failed.length ? "Some details could not be loaded" : undefined,
  }
}
