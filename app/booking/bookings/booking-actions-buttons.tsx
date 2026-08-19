"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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

interface BookingActionButtonsProps {
  bookingId: string
  bookingLabel: string
  canConfirm: boolean
  canCancel: boolean
}

export function BookingActionButtons({
  bookingId,
  bookingLabel,
  canConfirm,
  canCancel,
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
      {canConfirm && (
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
      )}

      {/* Cancelling frees the slot and cannot be undone here, so it asks first. */}
      {canCancel && (
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
      )}
    </>
  )
}
