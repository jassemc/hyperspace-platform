"use client"

import { Users } from "lucide-react"
import type { CalendarResourceSummaryDto } from "@/lib/service/HsService"

/**
 * Header height, in pixels. The hour gutter renders a spacer of exactly
 * this so its ticks line up with the columns' hour bands — export it
 * rather than writing the number twice, which is what previously needed
 * a comment begging the next reader to keep them in sync.
 */
export const ROOM_HEADER_PX = 92

/**
 * The column header: what the room *is*, not just its name. Everything
 * here already rides on the calendar payload, so picking a room by
 * capacity or kit costs no extra request.
 *
 * The image sits beside the text rather than above it: stacked, this
 * cost 140px of every screen before the first hour was visible.
 */
export function RoomHeaderCard({
  resource,
}: Readonly<{ resource: CalendarResourceSummaryDto }>) {
  return (
    <div className="flex w-40 shrink-0 items-start gap-2 p-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{resource.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3 shrink-0" />
          <span className="tabular-nums">{resource.capacity}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">
            {resource.amenities.length}{" "}
            {resource.amenities.length === 1 ? "amenity" : "amenities"}
          </span>
        </p>
      </div>
    </div>
  )
}
