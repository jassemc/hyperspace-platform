"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { CalendarIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * A business date, as the API means it: a plain YYYY-MM-DD with no timezone
 * attached. Parsing one with `new Date("2026-09-01")` reads it as UTC midnight
 * and can render as the day before, so the parts are handled directly.
 */
function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toValue(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

interface DateFieldProps {
  id?: string
  name: string
  value: string
  onChange: (value: string) => void
  /** Earliest selectable day, as YYYY-MM-DD. */
  min?: string
  placeholder?: string
  required?: boolean
  clearable?: boolean
  /** Render the calendar in place — required inside a vaul drawer; see
   *  PopoverContent's portalled prop. */
  portalled?: boolean
}

export function DateField({
  id,
  name,
  value,
  onChange,
  min,
  placeholder = "Pick a date",
  required = false,
  clearable = false,
  portalled = true,
}: Readonly<DateFieldProps>) {
  const [open, setOpen] = React.useState(false)
  const selected = toDate(value)
  const minDate = toDate(min)

  return (
    <div className="flex items-center gap-1">
      {/* The value travels in the form, not in the trigger. */}
      <input type="hidden" name={name} value={value} required={required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-9 flex-1 justify-start font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? LONG_DATE.format(selected) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent portalled={portalled}>
          <DayPicker
            mode="single"
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? minDate}
            disabled={minDate ? { before: minDate } : undefined}
            onSelect={(date) => {
              if (!date) return
              onChange(toValue(date))
              setOpen(false)
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
              day_button:
                "h-9 w-9 rounded-md hover:bg-accent inline-flex items-center justify-center",
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
      {clearable && value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear date</span>
        </Button>
      )}
    </div>
  )
}
