"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { BookingDto, BookingStatus } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"
import { formatDateTime, formatEnumLabel, formatPriceHt } from "@/lib/format"
import { BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from "./booking-status"
import { BookingActionButtons } from "./booking-actions-buttons"

interface ColumnsProps {
  onEdit: (booking: BookingDto) => void
  timeZone: string
  resourceNames?: Record<string, string>
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
}

export const createColumns = ({
  onEdit,
  timeZone,
  resourceNames = {},
  memberNames = {},
  companyNames = {},
}: ColumnsProps): ColumnDef<BookingDto>[] => [
  {
    id: "title",
    accessorFn: (booking) => booking.title ?? "",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Booking
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className="flex flex-col">
          <span>{booking.title || "Untitled booking"}</span>
          <span className="text-xs text-muted-foreground">
            {resourceNames[booking.resourceId] ?? "Unknown resource"}
          </span>
        </div>
      )
    },
  },
  {
    id: "customer",
    accessorFn: (booking) =>
      booking.memberId
        ? memberNames[booking.memberId] ?? ""
        : booking.companyId
          ? companyNames[booking.companyId] ?? ""
          : "",
    header: "Customer",
    cell: ({ row }) => {
      const value = row.getValue<string>("customer")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "startsAt",
    header: "When",
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className="flex flex-col">
          <span>{formatDateTime(booking.startsAt, timeZone)}</span>
          <span className="text-xs text-muted-foreground">to {formatDateTime(booking.endsAt, timeZone)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "priceHt",
    header: "Price (HT)",
    cell: ({ row }) => {
      // NULL price means the booking is fully covered by credits.
      const value = row.getValue<number | null>("priceHt")
      return value === null || value === undefined ? (
        <Badge variant="outline" className="font-normal">
          Credit covered
        </Badge>
      ) : (
        <span>{formatPriceHt(value)}</span>
      )
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <span className="capitalize">{formatEnumLabel(row.getValue<string>("source"))}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<BookingStatus>("status")
      return (
        <Badge variant="secondary" className={`${BOOKING_STATUS_CLASSES[value] ?? ""} border-0`}>
          {BOOKING_STATUS_LABELS[value] ?? formatEnumLabel(value)}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const booking = row.original
      const label = booking.title || "This booking"
      const isClosed = booking.status === "cancelled" || booking.status === "no_show"
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(booking)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <BookingActionButtons
            bookingId={booking.id}
            bookingLabel={label}
            canConfirm={booking.status === "pending"}
            canCancel={!isClosed}
          />
        </div>
      )
    },
  },
]
