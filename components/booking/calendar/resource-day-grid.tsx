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
import { CLOSED_GROUND, FREE_SLOT_GROUND, freeSlotsFor } from "./free-slots"
import { RoomHeaderCard } from "./room-header-card"
import { addDays, todayIn } from "./types"
import { useNow } from "./use-now"

/** Pixels per hour, horizontally. A 30-minute slot is a 48px-wide target. */
const HOUR_W = 96
/** One room's row. Fits the image-on-top header card, and three stacked
 *  lanes of overlapping bookings at a still-legible ~40px each. */
const ROW_PX = 140
const SLOT_MIN = 30
/** A block whose span clamps to nothing still has to be visible. */
const MIN_BLOCK_W = 18

/**
 * Visible stacked lanes for concurrent blocks. The exclusion
 * constraint is scoped to confirmed bookings, so several pending
 * requests legitimately compete for one slot — this is the only surface
 * that shows them doing it, so they must not render on top of one
 * another. Capped at three so a pathological pile-up doesn't crush the
 * row; the rest fold into one "+N" indicator in the last lane.
 */
const MAX_LANES = 3

/**
 * FREE_SLOT_CLASS in free-slots.ts is vertical-column geometry — full
 * column width, a dashed BOTTOM border between stacked slots. This grid
 * lays time out horizontally, so the same ground and interaction are
 * recomposed transposed: full row height, dashed RIGHT border between
 * side-by-side slots (twMerge drops the ground's border-b in favour of
 * the border-b-0). Local rather than exported: this is the only
 * horizontal surface.
 */
const FREE_SLOT_CLASS_H = cn(
  FREE_SLOT_GROUND,
  "border-b-0 border-r",
  "group absolute inset-y-0 transition-colors hover:bg-accent hover:bg-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
)

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
  onOpenBooking: (bookingId: string) => void
}

export function ResourceDayGrid({
  calendar,
  date,
  vacantOnly = false,
  timeRange,
  onPickSlot,
  onOpenBooking,
}: Readonly<DayGridProps>) {
  const tz = calendar.timezone

  // The axis is the full local day, midnight to midnight — not the union
  // of opening windows it used to be, which hid everything outside
  // business hours and made an after-hours booking invisible. Both
  // bounds go through the zone rather than start + 24h: a DST fall-back
  // day is genuinely 25 hours wide here and a spring-forward day 23.
  // Closed time renders as CLOSED_GROUND's hatch (free-slots.ts), with
  // the open windows painted clean over it.
  const axis = useMemo(
    () => ({
      startMs: wallClockToUtcMs(date, "00:00", tz),
      endMs: wallClockToUtcMs(addDays(date, 1), "00:00", tz),
    }),
    [date, tz]
  )

  // Where the initial scroll lands when it isn't the now-line: the
  // earliest opening across every room. Doubles as the "no room is open
  // on this day" signal the old windows-derived axis carried by being
  // null.
  const earliestOpenMs = useMemo(() => {
    const opens = calendar.resources.flatMap((entry) => {
      const day = entry.days.find((d) => d.date === date)
      return (day?.windows ?? []).map((w) => wallClockToUtcMs(date, w.open, tz))
    })
    return opens.length > 0 ? Math.min(...opens) : null
  }, [calendar, date, tz])

  const now = useNow()
  // Only on the grid's own today, read in the grid's zone — not the
  // reader's, which can be a different date entirely.
  const nowMs = date === todayIn(tz) && now > 0 ? now : null

  const visible = useMemo(() => {
    if (!vacantOnly || !timeRange) return calendar.resources
    const fromMs = wallClockToUtcMs(date, timeRange.from, tz)
    const toMs = wallClockToUtcMs(date, timeRange.to, tz)
    return calendar.resources.filter(
      (entry) =>
        !entry.blocks.some(
          (b) => Date.parse(b.startsAt) < toMs && Date.parse(b.endsAt) > fromMs
        )
    )
  }, [calendar.resources, vacantOnly, timeRange, date, tz])

  // Land the initial view on the working day: the now-line on today,
  // otherwise the earliest opening, half an hour of headroom before
  // either. Once per date, so it never fights a manual scroll. On today
  // it waits one tick for the clock (useNow starts at 0): landing on the
  // opening hour only to hop to the now-line a render later would be a
  // visible jump.
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrolledDateRef = useRef<string | null>(null)
  useEffect(() => {
    if (scrolledDateRef.current === date) return
    if (date === todayIn(tz) && now === 0) return
    const el = scrollRef.current
    const target = nowMs ?? earliestOpenMs
    if (el === null || target === null) return
    scrolledDateRef.current = date
    el.scrollLeft = Math.max(0, ((target - axis.startMs) / 3_600_000 - 0.5) * HOUR_W)
  })

  if (earliestOpenMs === null) {
    return (
      <div className="mx-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No room is open on this day.
      </div>
    )
  }

  const trackW = ((axis.endMs - axis.startMs) / 3_600_000) * HOUR_W
  const leftFor = (ms: number) => ((ms - axis.startMs) / 3_600_000) * HOUR_W

  const hourTicks: number[] = []
  for (let t = axis.startMs; t < axis.endMs; t += 3_600_000) hourTicks.push(t)

  return (
    <div
      ref={scrollRef}
      className="isolate mx-4 max-h-[calc(100vh-16rem)] overflow-auto rounded-md border"
    >
      <div className="w-max min-w-full">
        {/* Hour ruler. z-40 over the room headers' z-30, which sit over
            the now-line's z-20 and the unlayered blocks and slots —
            scrolling either axis keeps every sticky edge above the
            content sliding under it. The corner cell is sticky on both
            axes inside the ruler's own stacking context. */}
        <div className="sticky top-0 z-40 flex border-b bg-background">
          <div className="sticky left-0 z-10 h-10 w-40 shrink-0 border-r bg-background" />
          <div className="relative h-10 shrink-0" style={{ width: trackW }}>
            {hourTicks.map((t) => (
              <div
                key={t}
                className="absolute top-1/2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
                style={{ left: leftFor(t) + 6 }}
              >
                {formatTimeOfDay(new Date(t).toISOString(), tz)}
              </div>
            ))}
            {/* The current time, where the now-line meets the ruler —
                bold primary over a background patch that masks whatever
                hour label it passes. Ticks on the minute via useNow. */}
            {nowMs !== null && (
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-1 text-xs font-semibold tabular-nums text-primary"
                style={{ left: leftFor(nowMs) }}
              >
                {formatTimeOfDay(new Date(nowMs).toISOString(), tz)}
              </div>
            )}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No room is vacant in this time range.
          </div>
        ) : (
          visible.map((entry) => (
            <RoomRow
              key={entry.resource.id}
              entry={entry}
              date={date}
              tz={tz}
              axis={axis}
              trackW={trackW}
              leftFor={leftFor}
              nowMs={nowMs}
              onPickSlot={onPickSlot}
              onOpenBooking={onOpenBooking}
            />
          ))
        )}
      </div>
    </div>
  )
}

function RoomRow({
  entry,
  date,
  tz,
  axis,
  trackW,
  leftFor,
  nowMs,
  onPickSlot,
  onOpenBooking,
}: Readonly<{
  entry: CalendarResourceDto
  date: string
  tz: string
  axis: { startMs: number; endMs: number }
  trackW: number
  leftFor: (ms: number) => number
  nowMs: number | null
  onPickSlot: (resourceId: string, startUtc: string, endUtc: string) => void
  onOpenBooking: (bookingId: string) => void
}>) {
  const day = entry.days.find((d) => d.date === date)
  const windows = (day?.windows ?? []).map((w) => ({
    startMs: wallClockToUtcMs(date, w.open, tz),
    endMs: wallClockToUtcMs(date, w.close, tz),
  }))

  const minDuration = entry.resource.minDurationMin ?? SLOT_MIN
  const slots = freeSlotsFor(windows, entry.blocks, minDuration, SLOT_MIN)
  const laneItems = layoutBlocks(entry.blocks)

  return (
    <div className="flex border-b last:border-b-0">
      <div
        className="sticky left-0 z-30 flex w-40 shrink-0 items-center border-r bg-background"
        style={{ height: ROW_PX }}
      >
        <RoomHeaderCard resource={entry.resource} />
      </div>

      <div
        className={cn("relative shrink-0", CLOSED_GROUND)}
        style={{ width: trackW, height: ROW_PX }}
      >
        {/* Open windows read as available ground. */}
        {windows.map((w) => (
          <div
            key={w.startMs}
            className="absolute inset-y-0 bg-background"
            style={{
              left: leftFor(w.startMs),
              width: leftFor(w.endMs) - leftFor(w.startMs),
            }}
          />
        ))}

        {/* Hour gridlines. 96px is HOUR_W — Tailwind arbitrary values
            cannot interpolate the constant, so keep the two in step. The
            ms-linear axis keeps hours a uniform 96px apart even on DST
            days. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_right,var(--color-border)_0,var(--color-border)_1px,transparent_1px,transparent_96px)] opacity-40"
        />

        {/* Where "now" is. Deliberately drawn ON TOP of the blocks (z-20):
            a busy day is exactly when knowing where "now" is matters
            most, and a now-line painted underneath every booking would
            be invisible on that day. A hairline plus an 8px dot is a
            small enough footprint that sitting on top doesn't hide
            anything worth protecting. Primary, not destructive — it pairs
            with the bold time label in the ruler, and "now" is a fact,
            not an alarm. Only drawn on the grid's own today — see nowMs
            above. */}
        {nowMs !== null && nowMs >= axis.startMs && nowMs <= axis.endMs && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-20 border-l border-primary"
            style={{ left: leftFor(nowMs) }}
          />
        )}

        {/* Free half-hours: clickable, and the only way to start a booking.
            A slot is only offered if the resource's own minimum duration
            both stays clear of the next booking and fits before close —
            otherwise it is a click that only errors server-side. */}
        {slots.map((s) => (
          <button
            key={s.startMs}
            type="button"
            className={FREE_SLOT_CLASS_H}
            style={{
              left: leftFor(s.startMs),
              width: leftFor(s.endMs) - leftFor(s.startMs),
            }}
            onClick={() =>
              onPickSlot(
                entry.resource.id,
                new Date(s.startMs).toISOString(),
                new Date(s.startMs + minDuration * 60_000).toISOString()
              )
            }
          >
            <span className="sr-only">
              Book {entry.resource.name} at{" "}
              {formatTimeOfDay(new Date(s.startMs).toISOString(), tz)}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none flex h-full items-center justify-center text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              +
            </span>
          </button>
        ))}

        {/* Bookings, laid out in stacked lanes. Pending is drawn
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
              left={leftFor(Math.max(item.startMs, axis.startMs))}
              width={
                leftFor(Math.min(item.endMs, axis.endMs)) -
                leftFor(Math.max(item.startMs, axis.startMs))
              }
            />
          ) : (
            <BlockChip
              key={item.block.bookingId}
              block={item.block}
              tz={tz}
              lane={item.lane}
              lanes={item.lanes}
              left={leftFor(Math.max(Date.parse(item.block.startsAt), axis.startMs))}
              width={
                leftFor(Math.min(Date.parse(item.block.endsAt), axis.endMs)) -
                leftFor(Math.max(Date.parse(item.block.startsAt), axis.startMs))
              }
              onOpen={() => onOpenBooking(item.block.bookingId)}
            />
          )
        )}
      </div>
    </div>
  )
}

/** Lane geometry, transposed: lanes stack top-to-bottom inside the row,
    with a small gutter between neighbours. */
function laneBox(lane: number, lanes: number, left: number, width: number) {
  const laneH = ROW_PX / lanes
  return {
    left,
    width: Math.max(width, MIN_BLOCK_W),
    top: laneH * lane + 3,
    height: laneH - 6,
  } as const
}

function BlockChip({
  block,
  tz,
  lane,
  lanes,
  left,
  width,
  onOpen,
}: Readonly<{
  block: CalendarBlockDto
  tz: string
  lane: number
  lanes: number
  left: number
  width: number
  onOpen: () => void
}>) {
  const pending = block.status === "pending"
  // A sole lane has the full row: the reference card's hierarchy — muted
  // time range, bold title, customer as the subtitle. Split lanes are
  // ~40px each: one truncating line, the title attribute carries the
  // rest. Confirmed cards are borderless soft fills per the reference;
  // pending keeps its dashed border, which is load-bearing (it does not
  // hold the slot).
  const roomy = lanes === 1
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "absolute overflow-hidden border text-left",
        roomy ? "rounded-xl px-3 py-2 text-xs" : "flex items-center rounded-md px-1.5 text-[11px] leading-tight",
        "hover:ring-1 hover:ring-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        BOOKING_BLOCK_STYLES[block.status],
        block.status === "confirmed" && "border-transparent"
      )}
      style={laneBox(lane, lanes, left, width)}
      title={`${block.title ?? "Untitled"} — ${block.customerName ?? "No customer"}`}
    >
      {roomy ? (
        <>
          <p className="truncate text-[11px] tabular-nums opacity-70">
            {formatTimeOfDay(block.startsAt, tz)}–{formatTimeOfDay(block.endsAt, tz)}
            {pending ? " · pending" : ""}
          </p>
          <p className="truncate text-sm font-semibold">
            {block.title || block.customerName || "Untitled"}
          </p>
          {block.title && block.customerName && (
            <p className="truncate text-xs opacity-70">{block.customerName}</p>
          )}
        </>
      ) : (
        <p className="truncate font-medium">
          {block.title || block.customerName || "Untitled"}
        </p>
      )}
    </button>
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
  left,
  width,
}: Readonly<{
  count: number
  titles: string[]
  lane: number
  lanes: number
  left: number
  width: number
}>) {
  return (
    <div
      className="absolute flex items-center justify-center overflow-hidden rounded-md border border-dashed border-muted-foreground/40 bg-muted px-2 text-xs font-medium text-muted-foreground"
      style={laneBox(lane, lanes, left, width)}
      title={titles.join(", ")}
    >
      +{count}
    </div>
  )
}
