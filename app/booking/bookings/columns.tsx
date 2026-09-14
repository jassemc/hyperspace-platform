"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { BookingDto, BookingStatus } from "@/lib/service/HsService"
import { ArrowUpDown } from "lucide-react"
import {
  formatDateTime,
  formatEnumLabel,
  formatPriceHt,
  formatRelativeTime,
} from "@/lib/format"
import { BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from "./booking-status"
import { BookingRowActions } from "./booking-row-actions"
import { bookingValue, valueBreakdown } from "./booking-value"
import { FREE_REASON_LABELS } from "./free-reason"

interface ColumnsProps {
  /** Off on a member's own page, where every row is theirs. */
  hideCustomer?: boolean
  onEdit: (booking: BookingDto) => void
  timeZone: string
}

export const createColumns = ({
  onEdit,
  timeZone,
  hideCustomer = false,
}: ColumnsProps): ColumnDef<BookingDto>[] => {
  const columns: ColumnDef<BookingDto>[] = [
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
            {booking.resource.name || "Unknown resource"}
          </span>
        </div>
      )
    },
  },
  {
    id: "customer",
    // The API names the customer on the row, so a page past the hundredth
    // member no longer renders blank.
    accessorFn: (booking) => booking.member?.fullName ?? booking.company?.name ?? "",
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
    // #87 (O-01): when the request CAME IN, which is the Monday-morning
    // question ("what arrived over the weekend?"). It used to be visible
    // only inside each row's Details dialog, so answering it meant
    // opening every pending row. Sortable, because that is how the
    // question is actually asked.
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Requested
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className="flex flex-col">
          <span>{formatRelativeTime(booking.createdAt)}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(booking.createdAt, timeZone)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "priceHt",
    header: "Price (HT)",
    cell: ({ row }) => {
      const booking = row.original
      if (booking.isFree) {
        const reasonLabel = booking.freeReason ? FREE_REASON_LABELS[booking.freeReason] : undefined
        return (
          <Badge variant="secondary" className="font-normal" title={reasonLabel}>
            {reasonLabel ? `Free · ${reasonLabel}` : "Free"}
          </Badge>
        )
      }
      // Shared with the details dialog, so the two cannot disagree.
      const value = bookingValue(booking)
      // NULL price means credits cover the room; only extras, if any, are charged.
      if (value.creditCovered && value.extras.length === 0) {
        return (
          <Badge variant="outline" className="font-normal">
            Credit covered
          </Badge>
        )
      }
      const breakdown = valueBreakdown(value)
      return (
        <div className="flex flex-col">
          <span>
            {formatPriceHt(value.totalHt)}
            {value.discountPending && (
              <span className="ml-1 text-xs text-muted-foreground" title="Discount applied at confirmation">
                est.
              </span>
            )}
          </span>
          {breakdown && (
            <span className="text-xs text-muted-foreground">{breakdown}</span>
          )}
        </div>
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
    id: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const booking = row.original
      // A pending booking shows the visitor-typed code (even once a
      // discount is later applied on confirm), so staff always see what
      // was actually requested until the booking is decided.
      const requested = booking.status === "pending" ? booking.requestedDiscountCode : null
      if (requested) {
        return (
          <div className="flex flex-col">
            <code className="w-fit rounded bg-muted px-1 text-xs">{requested}</code>
            <span className="text-xs text-muted-foreground">requested</span>
          </div>
        )
      }
      if (booking.discount) {
        return (
          <div className="flex flex-col">
            <code className="w-fit rounded bg-muted px-1 text-xs">{booking.discount.code}</code>
            <span className="text-xs text-muted-foreground">applied</span>
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <BookingRowActions booking={row.original} timeZone={timeZone} onEdit={onEdit} />
    ),
  },
  ]
  return columns.filter((column) => !(hideCustomer && column.id === "customer"))
}
