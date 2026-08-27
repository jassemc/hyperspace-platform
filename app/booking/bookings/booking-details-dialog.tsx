"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye } from "lucide-react"
import type { BookingDto } from "@/lib/service/HsService"
import { formatDateTime, formatEnumLabel, formatPriceHt } from "@/lib/format"
import { BOOKING_SOURCE_LABELS, BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from "./booking-status"

/** Minutes between two instants, rendered as "1h 30m". */
function duration(startsAt: string, endsAt: string): string {
  const minutes = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000
  )
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

function Row({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">{children}</span>
    </div>
  )
}

export function BookingDetailsDialog({
  booking,
  timeZone,
}: Readonly<{ booking: BookingDto; timeZone: string }>) {
  const customer = booking.member?.fullName ?? booking.company?.name
  const email = booking.member?.email

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Booking details">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{booking.title || "Untitled booking"}</DialogTitle>
          <DialogDescription>
            {booking.resource.name || "Unknown resource"}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y">
          <Row label="Status">
            <Badge
              variant="secondary"
              className={`${BOOKING_STATUS_CLASSES[booking.status] ?? ""} border-0`}
            >
              {BOOKING_STATUS_LABELS[booking.status] ?? formatEnumLabel(booking.status)}
            </Badge>
          </Row>
          <Row label="Customer">
            {customer ? (
              <>
                {customer}
                {email && <span className="block text-xs text-muted-foreground">{email}</span>}
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </Row>
          <Row label="When">
            {formatDateTime(booking.startsAt, timeZone)}
            <span className="block text-xs text-muted-foreground">
              to {formatDateTime(booking.endsAt, timeZone)} ·{" "}
              {duration(booking.startsAt, booking.endsAt)}
            </span>
          </Row>
          <Row label="Price">
            {booking.priceHt === null || booking.priceHt === undefined ? (
              <Badge variant="outline" className="font-normal">
                Credit covered
              </Badge>
            ) : (
              formatPriceHt(booking.priceHt)
            )}
          </Row>
          {(booking.extras ?? []).length > 0 && (
            <Row label="Extras">
              {(booking.extras ?? []).map((extra) => (
                <span key={extra.extraId} className="block">
                  {extra.name}
                  <span className="text-xs text-muted-foreground">
                    {" — "}
                    {formatPriceHt(extra.priceHt)} · {extra.vatRate}% VAT
                  </span>
                </span>
              ))}
            </Row>
          )}
          <Row label="Source">
            {BOOKING_SOURCE_LABELS[booking.source] ?? formatEnumLabel(booking.source)}
          </Row>
          {booking.notes && <Row label="Notes">{booking.notes}</Row>}
          <Row label="Created">{formatDateTime(booking.createdAt, timeZone)}</Row>
        </div>
      </DialogContent>
    </Dialog>
  )
}
