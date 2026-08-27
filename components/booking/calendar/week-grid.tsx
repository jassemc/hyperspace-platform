"use client"

import { useEffect, useMemo, useRef } from "react"
import type {
  BookingCalendarDto,
  CalendarBlockDto,
  CalendarResourceDto,
} from "@/lib/service/HsService"
import { BOOKING_BLOCK_STYLES } from "@/app/booking/bookings/booking-status"
import { formatTimeOfDay } from "@/lib/format"
import { wallClockToUtcMs } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { CLOSED_GROUND, FREE_SLOT_CLASS, freeSlotsFor } from "./free-slots"
import { addDays } from "./types"

const HOUR_PX = 48
const SLOT_MIN = 30

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
  onOpenBooking,
  onPickSlot,
  onPickDay,
}: Readonly<{
  calendar: BookingCalendarDto
  weekStartDate: string
  resourceId?: string
  onOpenBooking: (bookingId: string) => void
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
  onPickDay: (date: string) => void
}>) {
  const tz = calendar.timezone
  const rooms = resourceId
    ? calendar.resources.filter((r) => r.resource.id === resourceId)
    : calendar.resources

  // Free slots only make sense with exactly one room in view: unfiltered,
  // a day column stacks every room, and a click would have no single room
  // to book. See the ground/hatch branch below.
  const soleRoom = rooms.length === 1 ? rooms[0] : null

  /** Free half-hour slots for `room` on `date`, via the shared walker in
   *  free-slots.ts — the same one resource-day-grid.tsx uses, so a slot is
   *  offered here under exactly the rules it is offered there. */
  const freeSlotsForRoom = (room: CalendarResourceDto, date: string) => {
    const day = room.days.find((d) => d.date === date)
    const windows = (day?.windows ?? []).map((w) => ({
      startMs: wallClockToUtcMs(date, w.open, tz),
      endMs: wallClockToUtcMs(date, w.close, tz),
    }))
    const minDuration = room.resource.minDurationMin ?? SLOT_MIN
    return freeSlotsFor(windows, room.blocks, minDuration, SLOT_MIN)
  }

  const days = useMemo(() => {
    const out: string[] = []
    for (let i = 0; i < 7; i += 1) {
      out.push(addDays(weekStartDate, i))
    }
    return out
  }, [weekStartDate])

  // The full local day, hour-based so all seven columns share one axis —
  // see resource-day-grid.tsx for why the axis stopped tracking opening
  // windows: closed time was hidden, and an after-hours booking with it.
  // Per-column ms bounds below still go through the zone, so a DST day's
  // blocks clamp into the column rather than drawing outside it.
  const axis = { startHour: 0, endHour: 24 }

  // The empty state the old windows-derived axis signalled by being null.
  const anyOpen = rooms.some((entry) =>
    entry.days.some((day) => day.windows.length > 0)
  )

  // Initial scroll target: the earliest opening minute anywhere this
  // week. Windows are wall-clock strings, so no zone math is needed.
  const earliestOpenMinutes = useMemo(() => {
    const opens = rooms.flatMap((entry) =>
      entry.days.flatMap((day) =>
        day.windows.map((w) => {
          const [h, m] = w.open.split(":").map(Number)
          return h * 60 + m
        })
      )
    )
    return opens.length > 0 ? Math.min(...opens) : null
  }, [rooms])

  // Land the initial view on the working day rather than midnight, half
  // an hour of headroom above the earliest opening. Once per week, so it
  // never fights a manual scroll.
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrolledWeekRef = useRef<string | null>(null)
  useEffect(() => {
    if (scrolledWeekRef.current === weekStartDate) return
    const el = scrollRef.current
    if (el === null || earliestOpenMinutes === null) return
    scrolledWeekRef.current = weekStartDate
    el.scrollTop = Math.max(0, ((earliestOpenMinutes - 30) / 60) * HOUR_PX)
  })

  if (!anyOpen) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No room is open this week.
      </div>
    )
  }

  const height = (axis.endHour - axis.startHour) * HOUR_PX

  return (
    <div
      ref={scrollRef}
      className="isolate mx-4 max-h-[calc(100vh-16rem)] overflow-auto rounded-md border"
    >
      {/* w-full + min-w-max: columns stretch to fill a wide viewport and
          fall back to their min width (scrolling) on a narrow one. */}
      <div className="flex w-full min-w-max">
        {/* z tiers: gutter 40 over the day headers' 30 over the blocks —
            both scroll axes keep the sticky edges on top. */}
        <div className="sticky left-0 z-40 w-16 shrink-0 border-r bg-background">
          <div className="sticky top-0 z-10 h-10 border-b bg-background" />
          <div className="relative" style={{ height }}>
            {Array.from({ length: axis.endHour - axis.startHour }, (_, i) => (
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
            <div key={date} className="min-w-32 flex-1 shrink-0 border-r last:border-r-0">
              <div className="sticky top-0 z-30 flex h-10 items-center justify-center border-b bg-background text-sm font-medium">
                {labelFor(date)}
              </div>
              <div className={cn("relative", CLOSED_GROUND)} style={{ height }}>
                {/* Open windows read as available ground; the rest keeps
                    the hatched closed treatment (CLOSED_GROUND). Union
                    across the rooms in view: unfiltered, "open" means
                    some room is open then. */}
                {rooms.flatMap((entry) => {
                  const day = entry.days.find((d) => d.date === date)
                  return (day?.windows ?? []).map((w) => (
                    <div
                      key={`${entry.resource.id}-${w.open}-${w.close}`}
                      className="absolute inset-x-0 bg-background"
                      style={place(
                        wallClockToUtcMs(date, w.open, tz),
                        wallClockToUtcMs(date, w.close, tz)
                      )}
                    />
                  ))
                })}
                {/* Free half-hours, but only with one room selected: an
                    unfiltered column stacks every room, so a click has no
                    single room to book. Without a room, the empty ground
                    navigates to this day's grid instead. Drawn BEFORE the
                    lane items below so blocks always sit on top and stay
                    clickable (see resource-day-grid.tsx / BlockChip). */}
                {soleRoom
                  ? freeSlotsForRoom(soleRoom, date).map((slot) => {
                      // Visually the clickable cell is one 30-minute
                      // sliver — matching the day grid's granularity — but
                      // the booking it starts must run the resource's own
                      // minimum duration, same as resource-day-grid.tsx:
                      // freeSlotsFor already only offers this slot when
                      // that duration both clears the next booking and
                      // fits before the window closes.
                      const minDuration = soleRoom.resource.minDurationMin ?? SLOT_MIN
                      return (
                        <button
                          key={slot.startMs}
                          type="button"
                          className={FREE_SLOT_CLASS}
                          style={place(slot.startMs, slot.endMs)}
                          onClick={() =>
                            onPickSlot(
                              soleRoom.resource.id,
                              new Date(slot.startMs).toISOString(),
                              new Date(slot.startMs + minDuration * 60_000).toISOString()
                            )
                          }
                        >
                          <span className="sr-only">
                            Book {soleRoom.resource.name} at{" "}
                            {formatTimeOfDay(new Date(slot.startMs).toISOString(), tz)}
                          </span>
                        </button>
                      )
                    })
                  : (
                      <button
                        type="button"
                        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        onClick={() => onPickDay(date)}
                      >
                        <span className="sr-only">Open {date} in the day view</span>
                      </button>
                    )}

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
                    <button
                      key={item.block.bookingId}
                      type="button"
                      onClick={() => onOpenBooking(item.block.bookingId)}
                      className={cn(
                        "absolute overflow-hidden rounded border px-1.5 py-0.5 text-left text-[11px]",
                        "hover:ring-1 hover:ring-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
                    </button>
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
