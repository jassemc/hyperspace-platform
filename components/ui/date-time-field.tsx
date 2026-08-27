"use client"

import * as React from "react"
import { DateField } from "@/components/ui/date-field"
import { HALF_HOURS } from "@/components/booking/calendar/types"

/**
 * A wall-clock instant as the booking form means it: `YYYY-MM-DDTHH:mm`,
 * with no zone of its own. The zone it is read in is decided by the server
 * action, from the hidden `timeZone` field — see actions.ts:toUtcIso.
 *
 * DateField stays date-only: it is a business date everywhere else it is
 * used, and three other call sites depend on that. This composes it rather
 * than widening it.
 */
const TIMES = HALF_HOURS

function split(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T")
  return { date, time: time.slice(0, 5) }
}

/**
 * The time a freshly-picked date should default to, when no time is chosen
 * yet. On `min`'s own day that must respect `min`'s time — defaulting to
 * `TIMES[18]` ("09:00") regardless, as this used to, can land before `min`
 * and produce an out-of-range pair the native `datetime-local` input this
 * replaced could never have offered (see booking-form-dialog.tsx's `startsAt`
 * handler for the symmetric case, where a stale end is cleared instead).
 *
 * If `min`'s time falls after every option on that day (i.e. past 23:30),
 * there is no valid default to offer. Returning "" and letting the caller
 * treat that as "not yet committable" is deliberate: guessing a fallback
 * here would just reintroduce the same out-of-range bug this exists to
 * fix. The pair is left empty rather than wrong; the user picks a later
 * date instead.
 */
function firstAllowedTime(
  forDate: string,
  minParts?: { date: string; time: string }
): string {
  if (!minParts || forDate !== minParts.date) return TIMES[18]
  return TIMES.find((option) => option >= minParts.time) ?? ""
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
  // cleared from outside (e.g. the dialog reopening on a fresh "create").
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
  // list; see booking-form-dialog.tsx.)
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
          is empty; see booking-form-dialog.tsx. */}
      <input type="hidden" name={name} value={value} />
      <div className="flex-1">
        <DateField
          id={id}
          name={`${name}__date`}
          value={date}
          onChange={(next) => emit(next, time || firstAllowedTime(next, minParts))}
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
