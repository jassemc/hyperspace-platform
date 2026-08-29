"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BookingFormDialog } from "./booking-form-dialog"
import type { BookingLookups } from "./lookups"

export function AddBookingButton({
  timeZone,
  lookups,
}: Readonly<{
  /** Fetched by the page so opening the dialog issues no requests. */
  lookups: BookingLookups
  /** The location's zone, from the page — every time in the form is
   *  written and read in it, so there is nothing sane to default to. */
  timeZone: string
}>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Booking
      </Button>
      {isOpen && (
        <BookingFormDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          resources={lookups.resources}
          members={lookups.members}
          companies={lookups.companies}
          timeZone={timeZone}
        />
      )}
    </>
  )
}
