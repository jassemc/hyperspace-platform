import type { MemberDetailsDto } from "@/lib/service/HsService"
import { formatDate, formatDateTime } from "@/lib/format"
import { AddCheckinButton } from "@/app/booking/checkins/add-checkin-button"
import { CheckoutButton } from "@/app/booking/checkins/checkout-button"
import { memberPath } from "../member-route"
import { CardEmpty, CardRow, CardRows, OverviewCard } from "./overview-card"

export function CheckinsCard({
  member,
  timeZone,
}: Readonly<{ member: MemberDetailsDto; timeZone: string }>) {
  const { total, onSite, items } = member.checkins
  const latest = items[0]

  let headline: string
  if (onSite) headline = "On site"
  else if (latest) headline = `Last visit ${formatDate(latest.checkedInAt)}`
  else headline = "Never visited"

  return (
    <OverviewCard
      title="Check-ins"
      viewAllHref={memberPath(member.id, "checkins")}
      headline={headline}
      subline={`${total} visit${total === 1 ? "" : "s"}`}
      action={
        onSite ? (
          <CheckoutButton checkinId={onSite.id} memberName={member.fullName} />
        ) : (
          <AddCheckinButton defaultMemberId={member.id} />
        )
      }
    >
      {items.length === 0 ? (
        <CardEmpty>No check-ins yet</CardEmpty>
      ) : (
        <CardRows>
          {items.slice(0, 3).map((checkin) => (
            <CardRow
              key={checkin.id}
              primary={formatDateTime(checkin.checkedInAt, timeZone)}
              secondary={
                checkin.checkedOutAt
                  ? `→ ${formatDateTime(checkin.checkedOutAt, timeZone)}`
                  : "Still inside"
              }
            />
          ))}
        </CardRows>
      )}
    </OverviewCard>
  )
}
