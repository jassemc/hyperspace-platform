"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"
import { todayIn, type CalendarView } from "./types"

export function CalendarToolbar({
  date,
  view,
  timeZone,
  timeRange,
  vacantOnly,
  onTimeRangeChange,
  onVacantOnlyChange,
}: Readonly<{
  date: string
  /** Drives the step size of the arrows; Task 7 adds the view switch. */
  view: CalendarView
  /** The grid's zone — "Today" must land on the grid's date, not the reader's. */
  timeZone: string
  timeRange: { from: string; to: string }
  vacantOnly: boolean
  onTimeRangeChange: (value: { from: string; to: string }) => void
  onVacantOnlyChange: (value: boolean) => void
}>) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const goTo = (nextDate: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", nextDate)
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  const shift = (days: number) => {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    goTo(d.toISOString().slice(0, 10))
  }

  return (
    <div className="mx-4 mb-3 flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" disabled={isPending}
        onClick={() => goTo(todayIn(timeZone))}>
        Today
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(-1)} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(1)} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-48">
        <DateField name="date" value={date} onChange={goTo} />
      </div>

      {/* Client-side: the payload already holds the whole day. */}
      <div className="flex items-center gap-2 text-sm">
        <input type="time" value={timeRange.from} aria-label="From"
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          onChange={(e) => onTimeRangeChange({ ...timeRange, from: e.target.value })} />
        <span aria-hidden="true">→</span>
        <input type="time" value={timeRange.to} aria-label="To"
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          onChange={(e) => onTimeRangeChange({ ...timeRange, to: e.target.value })} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={vacantOnly} className="h-4 w-4 rounded border-input"
          onChange={(e) => onVacantOnlyChange(e.target.checked)} />
        Vacant only
      </label>
    </div>
  )
}
