import { Badge } from "@/components/ui/badge"
import type { MemberDetailsDto, MembershipDto } from "@/lib/service/HsService"
import { formatDate } from "@/lib/format"
import {
  MEMBERSHIP_STATUS_CLASSES,
  MEMBERSHIP_STATUS_LABELS,
} from "@/app/community/memberships/membership-status"
import { AddMembershipButton } from "@/app/community/memberships/add-membership-button"
import { memberPath } from "../member-route"
import { CardEmpty, CardRow, CardRows, OverviewCard } from "./overview-card"

/** Active first, then the rest of the lifecycle in order. */
const STATUS_RANK: Record<MembershipDto["status"], number> = {
  active: 0,
  pending: 1,
  paused: 2,
  ended: 3,
}

export function MembershipsCard({ member }: Readonly<{ member: MemberDetailsDto }>) {
  const { total, active, items } = member.memberships
  const rows = [...items].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]).slice(0, 3)

  return (
    <OverviewCard
      title="Memberships"
      viewAllHref={memberPath(member.id, "memberships")}
      headline={
        <>
          {active}
          <span className="text-sm font-normal text-muted-foreground"> active of {total}</span>
        </>
      }
      action={<AddMembershipButton defaultMemberId={member.id} />}
    >
      {rows.length === 0 ? (
        <CardEmpty>No memberships yet</CardEmpty>
      ) : (
        <CardRows>
          {rows.map((membership) => (
            <CardRow
              key={membership.id}
              primary={membership.name}
              secondary={`${formatDate(membership.startsAt)} → ${
                membership.endsAt ? formatDate(membership.endsAt) : "open-ended"
              }`}
              aside={
                <Badge
                  variant="secondary"
                  className={`${MEMBERSHIP_STATUS_CLASSES[membership.status]} border-0`}
                >
                  {MEMBERSHIP_STATUS_LABELS[membership.status]}
                </Badge>
              }
            />
          ))}
        </CardRows>
      )}
    </OverviewCard>
  )
}
