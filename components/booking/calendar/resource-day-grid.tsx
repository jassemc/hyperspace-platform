"use client"

import { useMemo } from "react"
import type {
  BookingCalendarDto,
  CalendarBlockDto,
  CalendarResourceDto,
} from "@/lib/service/HsService"
import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
import { formatTimeOfDay } from "@/lib/format"
import { wallClockToUtcMs } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { RoomHeaderCard, ROOM_HEADER_PX } from "./room-header-card"

/** Pixels per hour. Tall enough that a 30-minute block is still legible. */
const HOUR_PX = 56
const SLOT_MIN = 30

/**
 * Visible side-by-side lanes for concurrent blocks. The exclusion
 * constraint is scoped to confirmed bookings, so several pending
 * requests legitimately compete for one slot — this is the only surface
 * that shows them doing it, so they must not render on top of one
 * another. Capped at three so a pathological pile-up doesn't crush the
 * column; the rest fold into one "+N" indicator in the last lane.
 */
const MAX_LANES = 3

interface LaneItem {
  block: CalendarBlockDto
  lane: number
  lanes: number
}

interface OverflowItem {
  overflow: CalendarBlockDto[]
  lane: number
  lanes: number
  startMs: number
  endMs: number
}

/**
 * First-fit lane assignment over start/end, grouped into clusters of
 * mutually-overlapping blocks so an unrelated pair earlier in the day
 * doesn't inflate this pair's lane count.
 */
function layoutBlocks(blocks: CalendarBlockDto[]): (LaneItem | OverflowItem)[] {
  const sorted = [...blocks].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
  )

  const out: (LaneItem | OverflowItem)[] = []
  let cluster: { block: CalendarBlockDto; lane: number }[] = []
  let laneEnds: number[] = []

  const flush = () => {
    if (cluster.length === 0) return
    const needed = laneEnds.length
    const lanes = Math.min(needed, MAX_LANES)
    const overflowLane = MAX_LANES - 1
    const overflow: CalendarBlockDto[] = []
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

    // No lane is still occupied at this start: the previous cluster is
    // over, so its lane count must not bleed into this one.
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

function isOverflowItem(item: LaneItem | OverflowItem): item is OverflowItem {
  return "overflow" in item
}

interface DayGridProps {
  calendar: BookingCalendarDto
  date: string
  vacantOnly?: boolean
  /** Wall-clock narrowing, e.g. { from: "09:00", to: "10:00" }. */
  timeRange?: { from: string; to: string }
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
}

export function ResourceDayGrid({
  calendar,
  date,
  vacantOnly = false,
  timeRange,
  onPickSlot,
}: Readonly<DayGridProps>) {
  const tz = calendar.timezone

  // The axis spans the union of every room's windows that day, so a room
  // opening early does not push every other column off the grid.
  const axis = useMemo(() => {
    const opens: number[] = []
    const closes: number[] = []
    for (const entry of calendar.resources) {
      const day = entry.days.find((d) => d.date === date)
      for (const w of day?.windows ?? []) {
        opens.push(wallClockToUtcMs(date, w.open, tz))
        closes.push(wallClockToUtcMs(date, w.close, tz))
      }
    }
    if (opens.length === 0) return null
    return { startMs: Math.min(...opens), endMs: Math.max(...closes) }
  }, [calendar, date, tz])

  const visible = useMemo(() => {
    if (!vacantOnly || !timeRange || !axis) return calendar.resources
    const fromMs = wallClockToUtcMs(date, timeRange.from, tz)
    const toMs = wallClockToUtcMs(date, timeRange.to, tz)
    return calendar.resources.filter(
      (entry) =>
        !entry.blocks.some(
          (b) => Date.parse(b.startsAt) < toMs && Date.parse(b.endsAt) > fromMs
        )
    )
  }, [calendar.resources, vacantOnly, timeRange, date, tz, axis])

  if (!axis) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No room is open on this day.
      </div>
    )
  }

  const totalHours = (axis.endMs - axis.startMs) / 3_600_000
  const height = totalHours * HOUR_PX
  const topFor = (ms: number) => ((ms - axis.startMs) / 3_600_000) * HOUR_PX

  const hourTicks: number[] = []
  for (let t = axis.startMs; t <= axis.endMs; t += 3_600_000) hourTicks.push(t)

  return (
    <div className="mx-4 overflow-x-auto rounded-md border">
      <div className="flex min-w-max">
        {/* Hour gutter */}
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r bg-background">
          <div className="border-b" style={{ height: ROOM_HEADER_PX }} />
          <div className="relative" style={{ height }}>
            {hourTicks.map((t) => (
              <div
                key={t}
                className="absolute -translate-y-1/2 pr-2 text-right text-xs text-muted-foreground tabular-nums w-full"
                style={{ top: topFor(t) }}
              >
                {formatTimeOfDay(new Date(t).toISOString(), tz)}
              </div>
            ))}
          </div>
        </div>

        {visible.map((entry) => (
          <RoomColumn
            key={entry.resource.id}
            entry={entry}
            date={date}
            tz={tz}
            axis={axis}
            height={height}
            topFor={topFor}
            onPickSlot={onPickSlot}
          />
        ))}
      </div>
    </div>
  )
}

function RoomColumn({
  entry,
  date,
  tz,
  axis,
  height,
  topFor,
  onPickSlot,
}: Readonly<{
  entry: CalendarResourceDto
  date: string
  tz: string
  axis: { startMs: number; endMs: number }
  height: number
  topFor: (ms: number) => number
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
}>) {
  const day = entry.days.find((d) => d.date === date)
  const windows = (day?.windows ?? []).map((w) => ({
    startMs: wallClockToUtcMs(date, w.open, tz),
    endMs: wallClockToUtcMs(date, w.close, tz),
  }))

  // Clickable half-hour slots inside the open windows. Each carries its
  // window's close, so a slot can be dropped when the resource's own
  // minimum duration would run past it (or into the next booking).
  const slots: { startMs: number; endMs: number; windowEndMs: number }[] = []
  const step = SLOT_MIN * 60_000
  for (const w of windows) {
    for (let t = w.startMs; t + step <= w.endMs; t += step) {
      slots.push({ startMs: t, endMs: t + step, windowEndMs: w.endMs })
    }
  }

  const isBusy = (startMs: number, endMs: number) =>
    entry.blocks.some(
      (b) => Date.parse(b.startsAt) < endMs && Date.parse(b.endsAt) > startMs
    )

  const minDuration = entry.resource.minDurationMin ?? SLOT_MIN
  const laneItems = layoutBlocks(entry.blocks)

  return (
    <div className="w-40 shrink-0 border-r last:border-r-0">
      <div className="border-b" style={{ height: ROOM_HEADER_PX }}>
        <RoomHeaderCard resource={entry.resource} />
      </div>

      <div className="relative bg-muted/40" style={{ height }}>
        {/* Open windows read as available ground. */}
        {windows.map((w) => (
          <div
            key={w.startMs}
            className="absolute inset-x-0 bg-background"
            style={{ top: topFor(w.startMs), height: topFor(w.endMs) - topFor(w.startMs) }}
          />
        ))}

        {/* Free half-hours: clickable, and the only way to start a booking.
            A slot is only offered if the resource's own minimum duration
            both stays clear of the next booking and fits before close —
            otherwise it is a click that only errors server-side. */}
        {slots
          .filter((s) => {
            const prefillEnd = s.startMs + minDuration * 60_000
            return !isBusy(s.startMs, prefillEnd) && prefillEnd <= s.windowEndMs
          })
          .map((s) => (
            <button
              key={s.startMs}
              type="button"
              className="absolute inset-x-0 border-b border-dashed border-border/60 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              style={{ top: topFor(s.startMs), height: topFor(s.endMs) - topFor(s.startMs) }}
              onClick={() =>
                onPickSlot(
                  entry.resource.id,
                  new Date(s.startMs).toISOString(),
                  new Date(s.startMs + minDuration * 60_000).toISOString()
                )
              }
            >
              <span className="sr-only">
                Book {entry.resource.name} at {formatTimeOfDay(new Date(s.startMs).toISOString(), tz)}
              </span>
            </button>
          ))}

        {/* Bookings, laid out in side-by-side lanes. Pending is drawn
            differently because it does NOT hold the slot — several may
            legitimately overlap, and lanes are what let staff see them
            competing instead of one silently hiding the rest. */}
        {laneItems.map((item) =>
          isOverflowItem(item) ? (
            <OverflowChip
              key={`overflow-${item.startMs}-${item.lane}`}
              count={item.overflow.length}
              titles={item.overflow.map((b) => b.title || b.customerName || "Untitled")}
              lane={item.lane}
              lanes={item.lanes}
              top={topFor(Math.max(item.startMs, axis.startMs))}
              height={
                topFor(Math.min(item.endMs, axis.endMs)) -
                topFor(Math.max(item.startMs, axis.startMs))
              }
            />
          ) : (
            <BlockChip
              key={item.block.bookingId}
              block={item.block}
              tz={tz}
              lane={item.lane}
              lanes={item.lanes}
              top={topFor(Math.max(Date.parse(item.block.startsAt), axis.startMs))}
              height={
                topFor(Math.min(Date.parse(item.block.endsAt), axis.endMs)) -
                topFor(Math.max(Date.parse(item.block.startsAt), axis.startMs))
              }
            />
          )
        )}
      </div>
    </div>
  )
}

/** Inline left/width for a lane within the column, with a small gutter
    between neighbours; collapses to the old inset-x-1 look when lanes === 1. */
function laneStyle(lane: number, lanes: number, top: number, height: number) {
  return {
    top,
    height: Math.max(height, 18),
    left: `calc(${(lane / lanes) * 100}% + 4px)`,
    width: `calc(${100 / lanes}% - 8px)`,
  } as const
}

function BlockChip({
  block,
  tz,
  lane,
  lanes,
  top,
  height,
}: Readonly<{
  block: CalendarBlockDto
  tz: string
  lane: number
  lanes: number
  top: number
  height: number
}>) {
  const pending = block.status === "pending"
  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-md border px-2 py-1 text-xs",
        BOOKING_BLOCK_STYLES[block.status]
      )}
      style={laneStyle(lane, lanes, top, height)}
      title={`${block.title ?? "Untitled"} — ${block.customerName ?? "No customer"}`}
    >
      <p className="truncate font-medium">
        {block.title || block.customerName || "Untitled"}
      </p>
      <p className="truncate opacity-80 tabular-nums">
        {formatTimeOfDay(block.startsAt, tz)}–{formatTimeOfDay(block.endsAt, tz)}
        {pending ? " · pending" : ""}
      </p>
    </div>
  )
}

/**
 * What a cluster's overflow beyond MAX_LANES collapses into: still
 * disclosed, not silently dropped, but named rather than drawn stacked.
 */
function OverflowChip({
  count,
  titles,
  lane,
  lanes,
  top,
  height,
}: Readonly<{
  count: number
  titles: string[]
  lane: number
  lanes: number
  top: number
  height: number
}>) {
  return (
    <div
      className="absolute flex items-center justify-center overflow-hidden rounded-md border border-dashed border-muted-foreground/40 bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
      style={laneStyle(lane, lanes, top, height)}
      title={titles.join(", ")}
    >
      +{count}
    </div>
  )
}
