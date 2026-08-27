"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  addDays,
  addMonths,
  HALF_HOURS,
  todayIn,
  weekStartOf,
  type CalendarView,
} from "./types"

/**
 * The anchor date as the toolbar's headline, per view. Formatted in UTC
 * from the date-string's own calendar day — the string is already the
 * location's day, and running it through a zone again would shift it
 * (see week-grid.tsx's labelFor for the same rule).
 */
function titleFor(view: CalendarView, date: string): string {
  const fmt = (day: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(
      new Date(`${day}T12:00:00Z`)
    )
  if (view === "month") return fmt(date, { month: "long", year: "numeric" })
  if (view === "week")
    return `Week of ${fmt(weekStartOf(date), { month: "long", day: "numeric" })}`
  return fmt(date, { weekday: "long", month: "long", day: "numeric" })
}

/** Local-calendar Date for the picker, and back. Same construction the
 *  slot picker uses so DayPicker's local getters read the day we mean. */
function toPickerDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}
function fromPickerDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

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
  const [pickerOpen, setPickerOpen] = useState(false)

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
    <div className="mx-4 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* The date is the headline, and clicking it is the date picker —
          the reference design's "Wednesday, September 3 ⌄". */}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md text-2xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {titleFor(view, date)}
            <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <DayPicker
            mode="single"
            selected={toPickerDate(date)}
            defaultMonth={toPickerDate(date)}
            onSelect={(picked) => {
              if (!picked) return
              goTo(fromPickerDate(picked))
              setPickerOpen(false)
            }}
            showOutsideDays
            classNames={{
              months: "flex flex-col",
              month_caption: "flex items-center justify-center h-9 font-medium text-sm",
              nav: "flex items-center justify-between absolute w-full px-1 h-9",
              button_previous: "h-7 w-7 rounded-md hover:bg-accent inline-flex items-center justify-center",
              button_next: "h-7 w-7 rounded-md hover:bg-accent inline-flex items-center justify-center",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "text-muted-foreground w-9 text-xs font-normal",
              week: "flex w-full",
              day: "h-9 w-9 p-0 text-sm",
              day_button: "h-9 w-9 rounded-md hover:bg-accent inline-flex items-center justify-center",
              today: "font-semibold text-primary",
              selected:
                "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
              outside: "text-muted-foreground/50",
              disabled: "text-muted-foreground/40 pointer-events-none",
              root: "relative",
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => goTo(todayIn(timeZone))}
        >
          Today
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(-1)} aria-label={`Previous ${view}`}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={isPending} onClick={() => shift(1)} aria-label={`Next ${view}`}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Controls group right, per the reference. */}
      <div className="ml-auto flex flex-wrap items-center gap-2">
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
    </div>
  )
}
