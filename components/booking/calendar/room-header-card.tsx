"use client"

import { Users } from "lucide-react"
import type { CalendarResourceSummaryDto } from "@/lib/service/HsService"

/**
 * The column header: what the room *is*, not just its name. Everything
 * here already rides on the calendar payload, so picking a room by
 * capacity or kit costs no extra request.
 */
export function RoomHeaderCard({
  resource,
}: Readonly<{ resource: CalendarResourceSummaryDto }>) {
  return (
    <div className="flex w-40 shrink-0 flex-col gap-2 p-2">
      <div className="h-20 w-full overflow-hidden rounded-md bg-muted">
        {resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{resource.name}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {resource.amenities.length}{" "}
            {resource.amenities.length === 1 ? "amenity" : "amenities"}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {resource.capacity}
          </span>
        </p>
      </div>
    </div>
  )
}
