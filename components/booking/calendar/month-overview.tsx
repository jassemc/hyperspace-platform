"use client"

import { useMemo } from "react"
import type { BookingCalendarDto, CalendarBlockDto } from "@/lib/service/HsService"
import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
import { formatTimeOfDay } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CLOSED_GROUND } from "./free-slots"
import { addDays, todayIn } from "./types"

/** Chips shown per day before the rest folds into "+N more". */
const MAX_CHIPS = 3

/** Monday-first, matching every other grid here. The admin UI is
 *  hardcoded-English throughout, so no Intl derivation. */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface DayBlock extends CalendarBlockDto {
  roomName: string
}

/**
 * A Teams-style month: a full-width grid whose cells carry the day's
 * bookings as clickable chips — not the count heat-map this used to be,
 * which said how busy a day was but never what with. A chip opens its
 * booking; the day number, the "+N more" line and the cell's empty
 * ground all land on that day's grid, where the actual booking happens.
 */
export function MonthOverview({
  calendar,
  month,
  onPickDay,
  onOpenBooking,
}: Readonly<{
  calendar: BookingCalendarDto
  /** YYYY-MM. */
  month: string
  onPickDay: (date: string) => void
  onOpenBooking: (bookingId: string) => void
}>) {
  const tz = calendar.timezone

  const blocksByDay = useMemo(() => {
    const map = new Map<string, DayBlock[]>()
    // Bucketed in the location's zone, not the browser's — a booking
    // near local midnight must land under the day it falls on there.
    const dayOf = (iso: string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date(iso))

    for (const entry of calendar.resources) {
      for (const block of entry.blocks) {
        const key = dayOf(block.startsAt)
        // rangeFor's month span is a fixed 31 days — the API's own
        // ceiling — so a shorter month over-fetches a few days into the
        // next one. Only days of the displayed month get chips, or those
        // early-next-month bookings would render in cells whose data the
        // fetch never captured in full.
        if (!key.startsWith(month)) continue
        const list = map.get(key) ?? []
        list.push({ ...block, roomName: entry.resource.name })
        map.set(key, list)
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    }
    return map
  }, [calendar, tz, month])

  // The month's calendar matrix, Monday-first: lead days from the
  // previous month and trailing days from the next complete the first
  // and last weeks — dimmed and chipless, since their data was never
  // fetched and a chip drawn from partial data would lie.
  const cells = useMemo(() => {
    const [year, m] = month.split("-").map(Number)
    const lead = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7
    const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate()
    const total = Math.ceil((lead + daysInMonth) / 7) * 7
    const start = addDays(`${month}-01`, -lead)
    return Array.from({ length: total }, (_, i) => {
      const date = addDays(start, i)
      return { date, inMonth: date.startsWith(month) }
    })
  }, [month])

  // Days where no room has a bookable window — the location's day
  // limits (a closed weekday, a holiday). Hatched like the closed time
  // in the day and week grids.
  const openDays = useMemo(() => {
    const set = new Set<string>()
    for (const entry of calendar.resources) {
      for (const day of entry.days) {
        if (day.windows.length > 0) set.add(day.date)
      }
    }
    return set
  }, [calendar])

  const today = todayIn(tz)

  return (
    <div className="mx-4 max-h-full overflow-auto rounded-md border">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="py-1.5 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      {/* nth-child trims the borders the container already draws: no
          right border on the 7th column, no bottom border on the last
          row. */}
      <div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0 [&>*:nth-last-child(-n+7)]:border-b-0">
        {cells.map(({ date, inMonth }) => {
          const blocks = inMonth ? (blocksByDay.get(date) ?? []) : []
          const shown = blocks.slice(0, MAX_CHIPS)
          const overflow = blocks.length - shown.length
          const isToday = date === today
          return (
            // The cell-level onClick is a convenience duplicate of the
            // day-number button below, which carries the keyboard path —
            // chip clicks stop propagation so a booking click never also
            // navigates.
            <div
              key={date}
              className={cn(
                "min-h-[6.5rem] cursor-pointer border-b border-r p-1 transition-colors hover:bg-accent/40",
                inMonth && !openDays.has(date) && CLOSED_GROUND,
                !inMonth && "bg-muted/30"
              )}
              onClick={() => onPickDay(date)}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onPickDay(date)
                }}
                className={cn(
                  "mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums",
                  isToday
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "hover:bg-accent",
                  !inMonth && "text-muted-foreground/50"
                )}
              >
                {Number(date.slice(8, 10))}
              </button>
              <div className="space-y-0.5">
                {shown.map((block) => (
                  <button
                    key={block.bookingId}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenBooking(block.bookingId)
                    }}
                    className={cn(
                      "flex w-full items-center gap-1 rounded border px-1 py-0.5 text-left text-[11px] leading-tight",
                      "hover:ring-1 hover:ring-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      BOOKING_BLOCK_STYLES[block.status]
                    )}
                    title={`${block.roomName} — ${block.title ?? "Untitled"}`}
                  >
                    <span className="shrink-0 tabular-nums">
                      {formatTimeOfDay(block.startsAt, tz)}
                    </span>
                    <span className="truncate">
                      {block.title || block.customerName || block.roomName}
                    </span>
                  </button>
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPickDay(date)
                    }}
                    className="w-full px-1 text-left text-[11px] text-muted-foreground hover:underline"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
