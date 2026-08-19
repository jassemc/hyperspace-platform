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

export type ActionState = {
  success?: boolean
  error?: string
  /** Set by the dry-run check so the form can show the quote before committing. */
  quote?: unknown
}

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
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

  if (!resourceId) return { error: "Select a resource" }
  if (!startsAt) return { error: "Start time is required" }
  if (!endsAt) return { error: "End time is required" }
  if (new Date(endsAt) <= new Date(startsAt)) {
    return { error: "The end time must be after the start time" }
  }
  // The customer is a member XOR a company.
  if (memberId && companyId) {
    return { error: "A booking belongs to a member or a company, not both" }
  }

  return {
    resourceId,
    memberId,
    companyId,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "The booking is not valid",
    }
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create booking",
    }
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
      title: text(formData, "title"),
      notes: text(formData, "notes"),
      status: formData.get("markNoShow") === "on" ? "no_show" : undefined,
    }

    await updateBooking(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update booking",
    }
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm booking",
    }
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel booking",
    }
  }
}
