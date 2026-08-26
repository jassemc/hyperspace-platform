"use client"

import { useMemo } from "react"
import type { BookingCalendarDto, CalendarBlockDto } from "@/lib/service/HsService"
import { formatTimeOfDay } from "@/lib/format"
import { wallClockToUtcMs } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { addDays } from "./types"

const HOUR_PX = 48

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

function laneStyle(lane: number, lanes: number, top: number, height: number) {
  return {
    top,
    height: Math.max(height, 16),
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
  onPickSlot,
}: Readonly<{
  calendar: BookingCalendarDto
  weekStartDate: string
  resourceId?: string
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
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
    // one vertical axis.
    const hourOf = (ms: number) =>
      Number(formatTimeOfDay(new Date(ms).toISOString(), tz).slice(0, 2))
    return { startHour: Math.min(...opens.map(hourOf)), endHour: Math.max(...closes.map(hourOf)) }
  }, [rooms, tz])

  if (!axis) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No room is open this week.
      </div>
    )
  }

  const height = (axis.endHour - axis.startHour) * HOUR_PX
  const topForHhmm = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number)
    return (h - axis.startHour + m / 60) * HOUR_PX
  }

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
                {String(axis.startHour + i).padStart(2, "0")}:00
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

          return (
            <div key={date} className="w-40 shrink-0 border-r last:border-r-0">
              <div className="flex h-10 items-center justify-center border-b text-sm font-medium">
                {new Intl.DateTimeFormat("en-GB", {
                  timeZone: tz, weekday: "short", day: "numeric",
                }).format(new Date(`${date}T12:00:00Z`))}
              </div>
              <div className="relative bg-background" style={{ height }}>
                {laneItems.map((item) =>
                  isOverflowItem(item) ? (
                    <div
                      key={`overflow-${item.startMs}-${item.lane}`}
                      className="absolute flex items-center justify-center overflow-hidden rounded border border-dashed border-muted-foreground/40 bg-muted text-[11px] font-medium text-muted-foreground"
                      style={laneStyle(item.lane, item.lanes, topForHhmm(formatTimeOfDay(new Date(item.startMs).toISOString(), tz)), topForHhmm(formatTimeOfDay(new Date(item.endMs).toISOString(), tz)) - topForHhmm(formatTimeOfDay(new Date(item.startMs).toISOString(), tz)))}
                      title={item.overflow.map((b) => b.roomName).join(", ")}
                    >
                      +{item.overflow.length}
                    </div>
                  ) : (
                    <div
                      key={item.block.bookingId}
                      className={cn(
                        "absolute overflow-hidden rounded border px-1.5 py-0.5 text-[11px]",
                        item.block.status === "pending"
                          ? "border-dashed border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100"
                          : "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                      )}
                      style={laneStyle(
                        item.lane,
                        item.lanes,
                        topForHhmm(formatTimeOfDay(item.block.startsAt, tz)),
                        topForHhmm(formatTimeOfDay(item.block.endsAt, tz)) -
                          topForHhmm(formatTimeOfDay(item.block.startsAt, tz))
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
