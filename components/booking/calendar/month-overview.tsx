"use client"

import { useMemo } from "react"
import { DayPicker } from "react-day-picker"
import type { BookingCalendarDto } from "@/lib/service/HsService"
import { cn } from "@/lib/utils"

/**
 * A month of hour-blocks is unreadable, so this view answers a different
 * question: which days are busy. Picking a day switches to the day grid,
 * where the actual booking happens.
 */
export function MonthOverview({
  calendar,
  month,
  onPickDay,
}: Readonly<{
  calendar: BookingCalendarDto
  month: string
  onPickDay: (date: string) => void
}>) {
  const tz = calendar.timezone

  const loadByDay = useMemo(() => {
    const counts = new Map<string, number>()
    const dayOf = (iso: string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date(iso))

    for (const entry of calendar.resources) {
      for (const block of entry.blocks) {
        const key = dayOf(block.startsAt)
        // rangeFor's month span is a fixed 31 days — the API's own
        // ceiling — so a shorter month over-fetches 1-3 days into the
        // next one (April 1 + 31 = May 2). Only count days that actually
        // belong to the displayed month, or those early-next-month
        // bookings show up as extra shaded outside-day cells carrying a
        // count the fetch never captured in full for that month.
        if (!key.startsWith(month)) continue
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return counts
  }, [calendar, tz, month])

  const busiest = Math.max(1, ...loadByDay.values())

  const toKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

  return (
    <div className="mx-4 rounded-md border p-4">
      <DayPicker
        mode="single"
        defaultMonth={new Date(`${month}-01T12:00:00Z`)}
        showOutsideDays
        onSelect={(date) => date && onPickDay(toKey(date))}
        components={{
          DayButton: (props) => {
            const key = toKey(props.day.date)
            const count = loadByDay.get(key) ?? 0
            // Four steps rather than a continuous ramp: a reader
            // comparing two days wants "busier", not a precise value.
            const step = count === 0 ? 0 : Math.ceil((count / busiest) * 3)
            return (
              <button
                {...props}
                className={cn(
                  "relative flex h-12 w-12 flex-col items-center justify-center rounded-md text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  step === 1 && "bg-emerald-50 dark:bg-emerald-950",
                  step === 2 && "bg-emerald-100 dark:bg-emerald-900",
                  step === 3 && "bg-emerald-200 dark:bg-emerald-800"
                )}
              >
                <span>{props.day.date.getDate()}</span>
                {count > 0 && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            )
          },
        }}
      />
      <p className="pt-3 text-xs text-muted-foreground">
        Bookings per day. Pick a day to open its grid.
      </p>
    </div>
  )
}
