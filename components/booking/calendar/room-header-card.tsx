"use client"

import { Users } from "lucide-react"
import type { CalendarResourceSummaryDto } from "@/lib/service/HsService"

/**
 * The row header: what the room *is*, not just its name. Everything
 * here already rides on the calendar payload, so picking a room by
 * capacity or kit costs no extra request.
 *
 * Image on top, name beneath — the reference design's card. The
 * capacity · amenities line is kept even though the reference drops it:
 * that is real information and it fits.
 */
export function RoomHeaderCard({
  resource,
}: Readonly<{ resource: CalendarResourceSummaryDto }>) {
  return (
    <div className="flex w-40 shrink-0 flex-col gap-1.5 p-2">
      <div className="h-[72px] w-full overflow-hidden rounded-lg bg-muted">
        {resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{resource.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
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
