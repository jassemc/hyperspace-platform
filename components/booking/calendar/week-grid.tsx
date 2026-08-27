"use client"

import { useMemo } from "react"
import type { BookingCalendarDto, CalendarBlockDto } from "@/lib/service/HsService"
import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
import { formatTimeOfDay } from "@/lib/format"
import { wallClockToUtcMs } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { addDays } from "./types"

const HOUR_PX = 48

/**
 * The "+N" chip's height. Fixed, and anchored at the cluster's start,
 * rather than spanning min(starts)→max(ends): a week column aggregates
 * every room, so four chained overlaps is ordinary on a busy day, and an
 * envelope-height grey bar reads as "blocked all day" — distorting the
 * exact judgement this view exists to support. The day grid keeps the
 * envelope, where one room per column makes 4+ mutual overlaps rare.
 */
const OVERFLOW_PX = 20

/** A block whose span clamps to nothing still has to be visible. */
const MIN_BLOCK_PX = 16

const pad2 = (value: number) => String(value).padStart(2, "0")

/**
 * The label for a column is the calendar date itself, so it must be
 * derived from the string and not run through a zone conversion: the
 * date is already local to the location, and converting it again pushes
 * the heading to the next day at UTC+12 and above (2026-08-26 renders as
 * "Thu 27" in Pacific/Auckland) while the column's contents stay on the
 * right day. Formatting the UTC-parsed date in UTC is a no-op shift, so
 * this reads the same in every location zone and every browser zone.
 */
const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
})
const labelFor = (date: string) => DAY_LABEL.format(new Date(`${date}T00:00:00Z`))

/**
 * Visible side-by-side lanes for blocks that land in the same day column.
 * Unfiltered, a column holds every room's bookings for that day, so two
 * rooms booked at the same hour is the common case, not the exception —
 * this needs lane splitting even more than the day grid's per-room
 * columns do. Capped at three: the column is the same 160px width as a
 * day-grid room column, so the same cap applies for the same reason —
 * beyond it a pile-up folds into a "+N" chip instead of shrinking every
 * lane unreadably thin.
 */
const MAX_LANES = 3

interface DayBlock extends CalendarBlockDto {
  roomName: string
}

interface LaneItem {
  block: DayBlock
  lane: number
  lanes: number
}

interface OverflowItem {
  overflow: DayBlock[]
  lane: number
  lanes: number
  startMs: number
  endMs: number
}

function isOverflowItem(item: LaneItem | OverflowItem): item is OverflowItem {
  return "overflow" in item
}

/** First-fit lane assignment over start/end, clustered so an unrelated
 *  pair earlier in the day doesn't inflate this pair's lane count. */
function layoutDayBlocks(blocks: DayBlock[]): (LaneItem | OverflowItem)[] {
  const sorted = [...blocks].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
  )

  const out: (LaneItem | OverflowItem)[] = []
  let cluster: { block: DayBlock; lane: number }[] = []
  let laneEnds: number[] = []

  const flush = () => {
    if (cluster.length === 0) return
    const needed = laneEnds.length
    const lanes = Math.min(needed, MAX_LANES)
    const overflowLane = MAX_LANES - 1
    const overflow: DayBlock[] = []
    for (const item of cluster) {
      if (needed > MAX_LANES && item.lane >= overflowLane) {
        overflow.push(item.block)
      } else {
        out.push({ block: item.block, lane: item.lane, lanes })
      }
    }
    if (overflow.length > 0) {
      out.push({
        overflow,
        lane: overflowLane,
        lanes,
        startMs: Math.min(...overflow.map((b) => Date.parse(b.startsAt))),
        endMs: Math.max(...overflow.map((b) => Date.parse(b.endsAt))),
      })
    }
    cluster = []
    laneEnds = []
  }

  for (const block of sorted) {
    const start = Date.parse(block.startsAt)
    const end = Date.parse(block.endsAt)

    if (laneEnds.length > 0 && laneEnds.every((laneEnd) => laneEnd <= start)) {
      flush()
    }

    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = end
    cluster.push({ block, lane })
  }
  flush()

  return out
}

function laneStyle(
  lane: number,
  lanes: number,
  box: { top: number; height: number }
) {
  return {
    top: box.top,
    height: box.height,
    left: `calc(${(lane / lanes) * 100}% + 2px)`,
    width: `calc(${100 / lanes}% - 4px)`,
  } as const
}

/**
 * One week. With a resource filter it is that room's week; without one
 * every room's bookings are stacked per day, which answers "how busy is
 * Thursday" rather than "which room is free".
 */
export function WeekGrid({
  calendar,
  weekStartDate,
  resourceId,
}: Readonly<{
  calendar: BookingCalendarDto
  weekStartDate: string
  resourceId?: string
}>) {
  const tz = calendar.timezone
  const rooms = resourceId
    ? calendar.resources.filter((r) => r.resource.id === resourceId)
    : calendar.resources

  const days = useMemo(() => {
    const out: string[] = []
    for (let i = 0; i < 7; i += 1) {
      out.push(addDays(weekStartDate, i))
    }
    return out
  }, [weekStartDate])

  const axis = useMemo(() => {
    const opens: number[] = []
    const closes: number[] = []
    for (const entry of rooms) {
      for (const day of entry.days) {
        for (const w of day.windows) {
          opens.push(wallClockToUtcMs(day.date, w.open, tz))
          closes.push(wallClockToUtcMs(day.date, w.close, tz))
        }
      }
    }
    if (opens.length === 0) return null
    // Reduce each instant to its wall-clock hour so all seven days share
    // one vertical axis. An open truncates down and a close rounds *up*:
    // truncating a 18:30 close to 18 puts the last half-hour of the day
    // off the bottom of the axis, where the clamp below would flatten it
    // to a sliver. Rounding up costs at most one empty hour band.
    const minutesOf = (ms: number) => {
      const [h, m] = formatTimeOfDay(new Date(ms).toISOString(), tz).split(":").map(Number)
      return h * 60 + m
    }
    // A close lands on the *next* day's 00:00 when a room shuts at
    // midnight, which reads back as minute 0 and would collapse the axis.
    const closeMinutesOf = (ms: number) => minutesOf(ms) || 24 * 60
    const startHour = Math.floor(Math.min(...opens.map(minutesOf)) / 60)
    const endHour = Math.min(24, Math.ceil(Math.max(...closes.map(closeMinutesOf)) / 60))
    return { startHour, endHour: Math.max(endHour, startHour + 1) }
  }, [rooms, tz])

  if (!axis) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No room is open this week.
      </div>
    )
  }

  const height = (axis.endHour - axis.startHour) * HOUR_PX

  return (
    <div className="mx-4 overflow-x-auto rounded-md border">
      <div className="flex min-w-max">
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r bg-background">
          <div className="h-10 border-b" />
          <div className="relative" style={{ height }}>
            {Array.from({ length: axis.endHour - axis.startHour + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute -translate-y-1/2 w-full pr-2 text-right text-xs text-muted-foreground tabular-nums"
                style={{ top: i * HOUR_PX }}
              >
                {pad2((axis.startHour + i) % 24)}:00
              </div>
            ))}
          </div>
        </div>

        {days.map((date) => {
          // Bucketed in the location's zone, not the browser's — a booking
          // near local midnight must land under the day it actually falls
          // on there, which can differ from the reader's own day.
          const blocks: DayBlock[] = rooms.flatMap((entry) =>
            entry.blocks
              .filter(
                (b) =>
                  new Intl.DateTimeFormat("en-CA", {
                    timeZone: tz,
                    year: "numeric", month: "2-digit", day: "2-digit",
                  }).format(new Date(b.startsAt)) === date
              )
              .map((b) => ({ ...b, roomName: entry.resource.name }))
          )
          const laneItems = layoutDayBlocks(blocks)

          // The axis in instants, for this column's own date — the same
          // clamp the day grid applies (resource-day-grid.tsx). Without
          // it a block that starts before the axis or runs past it is
          // positioned outside the column: a 17:30-18:30 booking on a
          // 09-18 axis draws below the grid, an 07:00 one draws over the
          // day header, and one crossing midnight gets a negative height.
          const axisStartMs = wallClockToUtcMs(date, `${pad2(axis.startHour)}:00`, tz)
          const axisEndMs = wallClockToUtcMs(date, `${pad2(axis.endHour)}:00`, tz)
          const topFor = (ms: number) =>
            ((Math.min(Math.max(ms, axisStartMs), axisEndMs) - axisStartMs) / 3_600_000) * HOUR_PX
          /** Top and height, both inside the column: a block clamped to
           *  zero span still gets MIN_BLOCK_PX, so its top is pulled up
           *  by that much rather than hanging off the bottom edge. */
          const place = (startMs: number, endMs: number, fixed?: number) => {
            const span = fixed ?? Math.max(topFor(endMs) - topFor(startMs), MIN_BLOCK_PX)
            return { top: Math.min(topFor(startMs), height - span), height: span }
          }

          return (
            <div key={date} className="w-40 shrink-0 border-r last:border-r-0">
              <div className="flex h-10 items-center justify-center border-b text-sm font-medium">
                {labelFor(date)}
              </div>
              <div className="relative bg-background" style={{ height }}>
                {laneItems.map((item) =>
                  isOverflowItem(item) ? (
                    <div
                      key={`overflow-${item.startMs}-${item.lane}`}
                      className="absolute flex items-center justify-center overflow-hidden rounded border border-dashed border-muted-foreground/40 bg-muted text-[11px] font-medium text-muted-foreground"
                      style={laneStyle(
                        item.lane,
                        item.lanes,
                        place(item.startMs, item.endMs, OVERFLOW_PX)
                      )}
                      title={item.overflow.map((b) => b.roomName).join(", ")}
                    >
                      +{item.overflow.length}
                    </div>
                  ) : (
                    <div
                      key={item.block.bookingId}
                      className={cn(
                        "absolute overflow-hidden rounded border px-1.5 py-0.5 text-[11px]",
                        BOOKING_BLOCK_STYLES[item.block.status]
                      )}
                      style={laneStyle(
                        item.lane,
                        item.lanes,
                        place(
                          Date.parse(item.block.startsAt),
                          Date.parse(item.block.endsAt)
                        )
                      )}
                      title={`${item.block.roomName} — ${item.block.title ?? "Untitled"}`}
                    >
                      <p className="truncate font-medium">
                        {resourceId ? (item.block.title ?? "Untitled") : item.block.roomName}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
