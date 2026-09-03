"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { BookingDto } from "@/lib/service/HsService"
import { cancelBookingAction, confirmBookingAction, markNoShowAction } from "./actions"

export type BookingMutationKind = "confirm" | "cancel" | "no_show"

/**
 * Why a booking cannot be flagged as a no-show right now, or null when it
 * can. Mirrors the API's own rules (only confirmed/pending rows, and only
 * once the start time has passed) so the menu is disabled with a reason
 * instead of round-tripping to a 422.
 */
export function noShowBlocker(booking: BookingDto, now: Date = new Date()): string | null {
  if (booking.status === "no_show") return "Already marked as a no-show"
  if (booking.status === "cancelled") return "Cancelled bookings cannot be a no-show"
  if (new Date(booking.startsAt) > now) return "The booking has not started yet"
  return null
}

/**
 * The API's problem types for this flow, in the UI's words. Anything
 * else falls through to the server's own message.
 */
function messageFor(result: { error?: string; problemType?: string }, fallback: string): string {
  if (result.problemType === "no_show_requires_staff") {
    return "Only staff can flag a no-show."
  }
  if (result.problemType === "no_show_before_start") {
    return "A booking can only be flagged as a no-show after its start time."
  }
  return result.error ?? fallback
}

/**
 * Confirm / cancel / no-show for one booking, shared by the row menu and
 * the details dialog so the two cannot drift. Resolves to true on success
 * so a caller can close whatever it had open.
 */
export function useBookingMutations(booking: BookingDto) {
  const router = useRouter()
  const [pending, setPending] = useState<BookingMutationKind | null>(null)
  const label = booking.title || "This booking"

  const run = async (
    kind: BookingMutationKind,
    action: typeof confirmBookingAction,
    done: string,
    failed: string
  ): Promise<boolean> => {
    setPending(kind)
    try {
      const formData = new FormData()
      formData.set("id", booking.id)
      const result = await action({}, formData)
      if (result.success) {
        toast.success(`${label} ${done}`)
        router.refresh()
        return true
      }
      toast.error(messageFor(result, failed))
      return false
    } finally {
      setPending(null)
    }
  }

  const noShowHint = noShowBlocker(booking)

  return {
    label,
    pending,
    canConfirm: booking.status === "pending",
    canCancel: booking.status !== "cancelled" && booking.status !== "no_show",
    canMarkNoShow: noShowHint === null,
    /** Set only when `canMarkNoShow` is false; suitable as a tooltip. */
    noShowHint: noShowHint ?? undefined,
    confirm: () => run("confirm", confirmBookingAction, "confirmed", "Failed to confirm"),
    cancel: () => run("cancel", cancelBookingAction, "cancelled", "Failed to cancel"),
    markNoShow: () =>
      run("no_show", markNoShowAction, "marked as a no-show", "Failed to mark as no-show"),
  }
}
