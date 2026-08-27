"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import type { BookingCalendarDto, BookingDto, ResourceTypeDto } from "@/lib/service/HsService"
import { getBooking } from "@/lib/service"
import { BookingFormDialog } from "@/app/booking/bookings/booking-form-dialog"
import { BookingDetailsDialog } from "@/app/booking/bookings/booking-details-dialog"
import { CalendarLegend } from "./calendar-legend"
import { CalendarToolbar } from "./calendar-toolbar"
import { ResourceTypeTabs } from "./resource-type-tabs"
import { ResourceDayGrid } from "./resource-day-grid"
import { WeekGrid } from "./week-grid"
import { MonthOverview } from "./month-overview"
import { weekStartOf, type CalendarViewState } from "./types"

interface Prefill {
  resourceId: string
  startsAt: string
  endsAt: string
  /** Read off the calendar payload so the drawer's select never flashes blank. */
  resourceName?: string
}

export function CalendarViews({
  calendar,
  state,
  bookableTypes,
}: Readonly<{
  calendar: BookingCalendarDto
  state: CalendarViewState
  bookableTypes: ResourceTypeDto[]
}>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [timeRange, setTimeRange] = useState({ from: "09:00", to: "10:00" })
  const [vacantOnly, setVacantOnly] = useState(false)
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [openBooking, setOpenBooking] = useState<BookingDto | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [editing, setEditing] = useState<BookingDto | null>(null)

  const pick = (resourceId: string, startsAt: string, endsAt: string) =>
    setPrefill({
      resourceId,
      startsAt,
      endsAt,
      resourceName: calendar.resources.find((entry) => entry.resource.id === resourceId)
        ?.resource.name,
    })

  const openBookingById = (bookingId: string) => {
    setLoadingBooking(true)
    getBooking(bookingId)
      .then((booking) => setOpenBooking(booking as BookingDto))
      .catch((error) => {
        console.error("Failed to load booking", error)
        toast.error("That booking could not be opened")
      })
      .finally(() => setLoadingBooking(false))
  }

  return (
    <>
      <ResourceTypeTabs types={bookableTypes} activeTypeId={state.resourceTypeId} />
      <CalendarToolbar
        date={state.date}
        view={state.view}
        timeZone={calendar.timezone}
        timeRange={timeRange}
        vacantOnly={vacantOnly}
        onTimeRangeChange={setTimeRange}
        onVacantOnlyChange={setVacantOnly}
      />
      <CalendarLegend />
      <div className="relative">
        {loadingBooking && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {state.view === "day" && (
          <ResourceDayGrid
            calendar={calendar}
            date={state.date}
            vacantOnly={vacantOnly}
            timeRange={timeRange}
            onPickSlot={pick}
            onOpenBooking={openBookingById}
          />
        )}
        {state.view === "week" && (
          <WeekGrid
            calendar={calendar}
            weekStartDate={weekStartOf(state.date)}
            resourceId={state.resourceId}
            onOpenBooking={openBookingById}
          />
        )}
        {state.view === "month" && (
          <MonthOverview
            calendar={calendar}
            month={state.date.slice(0, 7)}
            onPickDay={(date) => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("date", date)
              params.delete("calendarView")   // day is the default, so absent
              router.replace(`?${params.toString()}`)
            }}
            // The picker's own arrows land here too, so paging the month
            // moves the URL and refetches instead of silently redrawing an
            // unfetched month with every count at zero.
            onPickMonth={(month) => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("date", `${month}-01`)
              router.replace(`?${params.toString()}`)
            }}
          />
        )}
      </div>
      {prefill && (
        <BookingFormDialog
          key={`${prefill.resourceId}-${prefill.startsAt}`}
          isOpen
          onClose={() => setPrefill(null)}
          prefill={prefill}
          timeZone={calendar.timezone}
        />
      )}
      {openBooking && (
        <BookingDetailsDialog
          booking={openBooking}
          timeZone={calendar.timezone}
          open
          onOpenChange={(next) => {
            if (!next) setOpenBooking(null)
          }}
          onEdit={() => {
            setEditing(openBooking)
            setOpenBooking(null)
          }}
        />
      )}
      {editing && (
        <BookingFormDialog
          isOpen
          onClose={() => setEditing(null)}
          editingBooking={editing}
          timeZone={calendar.timezone}
        />
      )}
    </>
  )
}
