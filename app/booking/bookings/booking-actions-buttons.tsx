"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Ban } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { cancelBookingAction, confirmBookingAction } from "./actions"
import type { BookingStatus } from "@/lib/service/HsService"

interface BookingActionButtonsProps {
  bookingId: string
  bookingLabel: string
  canConfirm: boolean
  canCancel: boolean
  /** Drives the disabled tooltip's wording. */
  status: BookingStatus
}

/**
 * A disabled element fires no pointer events, so a bare `title` attribute
 * never shows and a Radix trigger never opens. The button is therefore
 * wrapped in a span, which is what the tooltip actually listens on.
 */
function DisabledAction({
  reason,
  children,
}: Readonly<{ reason: string; children: React.ReactNode }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button variant="outline" size="sm" disabled>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}

export function BookingActionButtons({
  bookingId,
  bookingLabel,
  canConfirm,
  canCancel,
  status,
}: Readonly<BookingActionButtonsProps>) {
  const router = useRouter()
  const [pending, setPending] = useState<"confirm" | "cancel" | null>(null)

  const confirm = async () => {
    setPending("confirm")
    try {
      const formData = new FormData()
      formData.set("id", bookingId)
      const result = await confirmBookingAction({}, formData)
      if (result.success) {
        toast.success(`${bookingLabel} confirmed`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to confirm")
      }
    } finally {
      setPending(null)
    }
  }

  const cancel = async () => {
    setPending("cancel")
    try {
      const formData = new FormData()
      formData.set("id", bookingId)
      const result = await cancelBookingAction({}, formData)
      if (result.success) {
        toast.success(`${bookingLabel} cancelled`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to cancel")
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      {canConfirm ? (
        <Button
          variant="outline"
          size="sm"
          title="Confirm booking"
          disabled={pending !== null}
          onClick={confirm}
          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950 dark:border-green-800"
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Confirm</span>
        </Button>
      ) : (
        <DisabledAction reason="Only pending bookings can be confirmed">
          <Check className="h-4 w-4" />
          <span className="sr-only">Confirm</span>
        </DisabledAction>
      )}

      {/* Cancelling frees the slot and cannot be undone here, so it asks first. */}
      {canCancel ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Cancel booking"
              disabled={pending !== null}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
            >
              <Ban className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
              <AlertDialogDescription>
                {bookingLabel} will be released and the slot freed for others.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending !== null}>Keep it</AlertDialogCancel>
              <Button variant="destructive" disabled={pending !== null} onClick={cancel}>
                {pending === "cancel" ? "Cancelling..." : "Cancel booking"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <DisabledAction
          reason={status === "no_show" ? "Marked as a no-show" : "Already cancelled"}
        >
          <Ban className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </DisabledAction>
      )}
    </>
  )
}
