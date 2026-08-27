"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { BookingDto } from "@/lib/service/HsService"
import { cancelBookingAction, confirmBookingAction } from "./actions"

/**
 * Confirm / cancel for one booking, shared by the row menu and the
 * details dialog so the two cannot drift. Resolves to true on success
 * so a caller can close whatever it had open.
 */
export function useBookingMutations(booking: BookingDto) {
  const router = useRouter()
  const [pending, setPending] = useState<"confirm" | "cancel" | null>(null)
  const label = booking.title || "This booking"

  const run = async (
    kind: "confirm" | "cancel",
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
      toast.error(result.error ?? failed)
      return false
    } finally {
      setPending(null)
    }
  }

  return {
    label,
    pending,
    canConfirm: booking.status === "pending",
    canCancel: booking.status !== "cancelled" && booking.status !== "no_show",
    confirm: () => run("confirm", confirmBookingAction, "confirmed", "Failed to confirm"),
    cancel: () => run("cancel", cancelBookingAction, "cancelled", "Failed to cancel"),
  }
}
