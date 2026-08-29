import { Badge } from "@/components/ui/badge"
import type { MemberDetailsDto } from "@/lib/service/HsService"
import { formatDateTime } from "@/lib/format"
import { AddBookingButton } from "@/app/booking/bookings/add-booking-button"
import { BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from "@/app/booking/bookings/booking-status"
import type { BookingLookups } from "@/app/booking/bookings/lookups"
import { memberPath } from "../member-route"
import { CardEmpty, CardRow, CardRows, OverviewCard } from "./overview-card"

export function BookingsCard({
  member,
  lookups,
  timeZone,
}: Readonly<{ member: MemberDetailsDto; lookups: BookingLookups; timeZone: string }>) {
  const { upcoming, items } = member.bookings

  return (
    <OverviewCard
      title="Bookings"
      viewAllHref={memberPath(member.id, "bookings")}
      headline={
        <>
          {upcoming}
          <span className="text-sm font-normal text-muted-foreground"> upcoming</span>
        </>
      }
      action={<AddBookingButton lookups={lookups} timeZone={timeZone} defaultMemberId={member.id} />}
    >
      {items.length === 0 ? (
        <CardEmpty>Nothing booked ahead</CardEmpty>
      ) : (
        <CardRows>
          {items.slice(0, 3).map((booking) => (
            <CardRow
              key={booking.id}
              primary={booking.title || booking.resource.name}
              secondary={formatDateTime(booking.startsAt, timeZone)}
              aside={
                <Badge
                  variant="secondary"
                  className={`${BOOKING_STATUS_CLASSES[booking.status]} border-0`}
                >
                  {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
              }
            />
          ))}
        </CardRows>
      )}
    </OverviewCard>
  )
}
