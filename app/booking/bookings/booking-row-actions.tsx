"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Ban, Check, Edit, Eye, MoreHorizontal, UserX } from "lucide-react"
import type { BookingDto } from "@/lib/service/HsService"
import { BookingDetailsDialog } from "./booking-details-dialog"
import { CancelBookingAlert } from "./cancel-booking-alert"
import { MarkNoShowAlert } from "./mark-no-show-alert"
import { useBookingMutations } from "./use-booking-mutations"

interface BookingRowActionsProps {
  booking: BookingDto
  timeZone: string
  onEdit: (booking: BookingDto) => void
}

/**
 * One "⋯" trigger per row; the actions live in a dropdown. The details and
 * cancel dialogs are controlled from here rather than nested in menu items,
 * because the menu unmounts its content on close and would take an inline
 * dialog down with it.
 */
export function BookingRowActions({ booking, timeZone, onEdit }: Readonly<BookingRowActionsProps>) {
  const {
    label,
    pending,
    canConfirm,
    canCancel,
    canMarkNoShow,
    noShowHint,
    confirm,
    cancel,
    markNoShow,
  } = useBookingMutations(booking)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [noShowOpen, setNoShowOpen] = useState(false)

  const confirmHint = canConfirm ? undefined : "Only pending bookings can be confirmed"
  const cancelHint = canCancel
    ? undefined
    : booking.status === "no_show"
      ? "Marked as a no-show"
      : "Already cancelled"

  return (
    <>
      {/* Non-modal: a modal menu that hands off to a dialog races on the
          body's pointer-events lock and can leave the whole page unclickable
          once the dialog closes. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending !== null}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions for {label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
            <Eye />
            Details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(booking)}>
            <Edit />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!canConfirm} onSelect={confirm} title={confirmHint}>
            <Check />
            Confirm
          </DropdownMenuItem>
          {/* One-way status change, so it asks first. */}
          <DropdownMenuItem
            disabled={!canMarkNoShow}
            onSelect={() => setNoShowOpen(true)}
            title={noShowHint}
          >
            <UserX />
            Mark as no-show
          </DropdownMenuItem>
          {/* Cancelling frees the slot and cannot be undone here, so it asks first. */}
          <DropdownMenuItem
            variant="destructive"
            disabled={!canCancel}
            onSelect={() => setCancelOpen(true)}
            title={cancelHint}
          >
            <Ban />
            Cancel booking
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BookingDetailsDialog
        booking={booking}
        timeZone={timeZone}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={() => {
          setDetailsOpen(false)
          onEdit(booking)
        }}
      />

      <CancelBookingAlert
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        label={label}
        pending={pending === "cancel"}
        onConfirm={async () => {
          if (await cancel()) setCancelOpen(false)
        }}
      />

      <MarkNoShowAlert
        open={noShowOpen}
        onOpenChange={setNoShowOpen}
        label={label}
        pending={pending === "no_show"}
        onConfirm={async () => {
          if (await markNoShow()) setNoShowOpen(false)
        }}
      />
    </>
  )
}
