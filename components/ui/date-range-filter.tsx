"use client"

import { DateField } from "@/components/ui/date-field"
import { Button } from "@/components/ui/button"

/**
 * Picks a local day range and emits UTC instants.
 *
 * The zone is the caller's: a location's when there is one in scope,
 * otherwise the reader's own browser zone. The server deliberately does
 * not decide this — an opportunity has no location, so "today" is the
 * today of whoever is looking.
 */
export interface DateRangeValue {
  fromIso?: string
  toIso?: string
}

function startOfLocalDay(day: string, timeZone: string): string {
  const [y, m, d] = day.split("-").map(Number)
  const naive = Date.UTC(y, m - 1, d)
  const offset = (at: number) =>
    at -
    Date.parse(
      new Intl.DateTimeFormat("sv-SE", {
        timeZone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23",
      })
        .format(new Date(at))
        .replace(" ", "T") + "Z"
    )
  // Two passes, so a DST transition day is not an hour out.
  const guess = naive + offset(naive)
  return new Date(naive + offset(guess)).toISOString()
}

/** Exclusive upper bound: the start of the day after `day`. */
function endOfLocalDay(day: string, timeZone: string): string {
  const [y, m, d] = day.split("-").map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  return startOfLocalDay(next, timeZone)
}

function isoToLocalDay(iso: string | undefined, timeZone: string): string {
  if (!iso) return ""
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

export function DateRangeFilter({
  label,
  fromValue,
  toValue,
  timeZone,
  presets = [],
  onChange,
}: Readonly<{
  label: string
  fromValue?: string
  toValue?: string
  timeZone: string
  presets?: { label: string; days: number }[]
  onChange: (value: DateRangeValue) => void
}>) {
  const fromDay = isoToLocalDay(fromValue, timeZone)
  const toDay = isoToLocalDay(toValue, timeZone)

  const applyPreset = (days: number) => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date())
    const start = new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000)
      .toISOString()
      .slice(0, 10)
    onChange({
      fromIso: startOfLocalDay(days === 0 ? today : start, timeZone),
      toIso: endOfLocalDay(today, timeZone),
    })
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <DateField
        name="from"
        value={fromDay}
        clearable
        placeholder="From"
        onChange={(day) =>
          onChange({
            fromIso: day ? startOfLocalDay(day, timeZone) : undefined,
            toIso: toValue,
          })
        }
      />
      <DateField
        name="to"
        value={toDay}
        clearable
        placeholder="To"
        onChange={(day) =>
          onChange({
            fromIso: fromValue,
            toIso: day ? endOfLocalDay(day, timeZone) : undefined,
          })
        }
      />
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
