"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { addDays, addMonths, todayIn, HALF_HOURS, type CalendarView } from "./types"

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
  /** Drives both the step size of the arrows and the view switch below. */
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

  // Steps by the view's own span: a day, a week, or a calendar month —
  // not always one day, or `›` on Month would take twelve clicks to
  // reach next month.
  const shift = (direction: 1 | -1) => {
    if (view === "month") {
      goTo(addMonths(date, direction))
      return
    }
    goTo(addDays(date, direction * (view === "week" ? 7 : 1)))
  }

  return (
    <div className="mx-4 mb-3 flex flex-wrap items-center gap-x-2 gap-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => goTo(todayIn(timeZone))}
      >
        Today
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(-1)} aria-label={`Previous ${view}`}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(1)} aria-label={`Next ${view}`}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-48">
        <DateField name="date" value={date} onChange={goTo} />
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="inline-flex items-center rounded-md border p-0.5" role="group" aria-label="Calendar view">
        {(["day", "week", "month"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={view === value}
            className={cn(
              "h-8 px-3 capitalize",
              view === value && "bg-accent text-accent-foreground"
            )}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              if (value === "day") {
                params.delete("calendarView")
              } else {
                params.set("calendarView", value)
              }
              startTransition(() => router.replace(`?${params.toString()}`))
            }}
          >
            {value}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Client-side narrowing: the payload already holds the whole day. */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Between</span>
        <div className="w-24">
          <NativeSelect
            aria-label="From"
            className="h-8"
            value={timeRange.from}
            onChange={(e) => onTimeRangeChange({ ...timeRange, from: e.target.value })}
          >
            {HALF_HOURS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </NativeSelect>
        </div>
        <span aria-hidden="true" className="text-muted-foreground">–</span>
        <div className="w-24">
          <NativeSelect
            aria-label="To"
            className="h-8"
            value={timeRange.to}
            onChange={(e) => onTimeRangeChange({ ...timeRange, to: e.target.value })}
          >
            {HALF_HOURS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={vacantOnly}
        className={cn("h-8 px-3", vacantOnly && "bg-accent text-accent-foreground")}
        onClick={() => onVacantOnlyChange(!vacantOnly)}
      >
        Vacant only
      </Button>
    </div>
  )
}
