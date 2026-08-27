"use server"

import { revalidatePath } from "next/cache"
import {
  createBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  validateBooking,
} from "@/lib/service"
import type { CreateBookingDto, UpdateBookingDto } from "@/lib/service/HsService"
import { wallClockToUtcMs } from "@/lib/slots"

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
 * A `datetime-local` value ("2026-08-26T09:00") has no zone of its own.
 * `new Date(value)` therefore parses it in *this process's* zone — fine
 * for the plain Add-booking button, wrong for a cell clicked on a grid
 * whose location is elsewhere: the same wall-clock string means a
 * different instant depending on where the server happens to run.
 * When the form supplies the grid's zone (the calendar's click-to-book
 * path), convert through it instead; otherwise fall back to the
 * previous behaviour so the zone-less path is unchanged.
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

  return {
    resourceId,
    memberId,
    companyId,
    startsAt: startsAtUtc,
    endsAt: endsAtUtc,
    title: text(formData, "title"),
    notes: text(formData, "notes"),
    extraIds: formData.getAll("extraIds").map(String).filter(Boolean),
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
 * Only the label, notes and a no-show mark are patchable; times are fixed, and
 * confirming or cancelling goes through their own endpoints.
 */
export async function updateBookingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Booking ID is required" }

    const data: UpdateBookingDto = {
      title: clearableText(formData, "title"),
      notes: clearableText(formData, "notes"),
      status: formData.get("markNoShow") === "on" ? "no_show" : undefined,
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

    await confirmBooking(id)
    revalidate()
    return { success: true }
  } catch (error) {
    return problem(error, "Failed to confirm booking")
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
