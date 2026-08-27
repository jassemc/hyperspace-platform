"use client"

import * as React from "react"
import { DateField } from "@/components/ui/date-field"

/**
 * A wall-clock instant as the booking form means it: `YYYY-MM-DDTHH:mm`,
 * with no zone of its own. The zone it is read in is decided by the server
 * action, from the hidden `timeZone` field — see actions.ts:toUtcIso.
 *
 * DateField stays date-only: it is a business date everywhere else it is
 * used, and three other call sites depend on that. This composes it rather
 * than widening it.
 */
const STEP_MINUTES = 30

/** Half-hours across the day, matching the calendar grid's bookable slots. */
const TIMES: string[] = Array.from(
  { length: (24 * 60) / STEP_MINUTES },
  (_, index) => {
    const minutes = index * STEP_MINUTES
    const hh = `${Math.floor(minutes / 60)}`.padStart(2, "0")
    const mm = `${minutes % 60}`.padStart(2, "0")
    return `${hh}:${mm}`
  }
)

function split(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T")
  return { date, time: time.slice(0, 5) }
}

interface DateTimeFieldProps {
  id?: string
  name: string
  value: string
  onChange: (value: string) => void
  /** Earliest selectable instant, same shape as `value`. */
  min?: string
}

export function DateTimeField({
  id,
  name,
  value,
  onChange,
  min,
}: Readonly<DateTimeFieldProps>) {
  const { date, time: valueTime } = split(value)
  const minParts = min ? split(min) : undefined

  // A time picked before a date can't be committed into `value` yet — emit
  // below has nowhere to put it — but discarding it outright would be
  // asymmetric with the date-first path, which keeps a default time. Held
  // here until a date makes the pair committable; reset once the field is
  // cleared from outside (e.g. the drawer reopening on a fresh "create").
  const [pendingTime, setPendingTime] = React.useState("")
  React.useEffect(() => {
    if (!value) setPendingTime("")
  }, [value])

  const time = valueTime || pendingTime

  // A time earlier than `min` is only invalid on `min`'s own day.
  const times =
    minParts && date && date === minParts.date
      ? TIMES.filter((option) => option >= minParts.time)
      : TIMES

  // A calendar prefill isn't guaranteed to land on the half-hour: slots are
  // stepped from each resource's own opening-hours window start (see
  // resource-day-grid.tsx), and that window's `open` time is a free-typed
  // HH:mm with no half-hour constraint (add-location-form.tsx). If `time`
  // fell off the grid, it wouldn't match any option and the select would
  // silently render blank — dropping the slot the user clicked. Keeping it
  // in the list preserves whatever was seeded until the user changes it.
  // (A time excluded solely by `min` — a stale end time left behind when the
  // start moves later — is handled by the caller clearing it, not by this
  // list; see add-booking-form.tsx.)
  const options = time && !times.includes(time) ? [...times, time].sort() : times

  const emit = (nextDate: string, nextTime: string) => {
    if (nextDate && nextTime) {
      setPendingTime("")
      onChange(`${nextDate}T${nextTime}`)
    } else {
      // Not yet committable — hold the time locally instead of the pair
      // silently collapsing to nothing.
      setPendingTime(nextTime)
      onChange("")
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* The value travels in the form, not in either control. Hidden
          inputs are always excluded from constraint validation (the HTML
          spec bars them outright), so `required` cannot live here — the
          create form's submit button is disabled instead when either time
          is empty; see add-booking-form.tsx. */}
      <input type="hidden" name={name} value={value} />
      <div className="flex-1">
        <DateField
          id={id}
          name={`${name}__date`}
          value={date}
          onChange={(next) => emit(next, time || TIMES[18])}
          min={minParts?.date}
        />
      </div>
      <select
        aria-label="Time"
        className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={time}
        onChange={(event) => emit(date, event.target.value)}
      >
        <option value="">--:--</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
