import { Badge } from "@/components/ui/badge"
import type { MemberDetailsDto, MembershipDto } from "@/lib/service/HsService"
import { formatDate, formatEnumLabel } from "@/lib/format"
import {
  MEMBERSHIP_STATUS_CLASSES,
  MEMBERSHIP_STATUS_LABELS,
} from "@/app/community/memberships/membership-status"
import { memberPath } from "../member-route"
import { Empty, Row, Rows, Section } from "./section"

/** Active first, then the rest of the lifecycle in order. */
const STATUS_RANK: Record<MembershipDto["status"], number> = {
  active: 0,
  pending: 1,
  paused: 2,
  ended: 3,
}

/**
 * What the member holds right now, with each membership's credit balances
 * inline — the balances block is keyed by membershipId, so the join is free.
 */
export function CurrentMemberships({ member }: Readonly<{ member: MemberDetailsDto }>) {
  const balancesByMembership = new Map(
    member.credits.balances.map((block) => [block.membershipId, block.balances])
  )
  const rows = [...member.memberships.items]
    .filter((membership) => membership.status !== "ended")
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])

  return (
    <Section
      title="Current memberships"
      viewAllHref={memberPath(member.id, "memberships")}
      aside={
        <span className="text-xs text-muted-foreground">
          {member.memberships.active} active · {member.memberships.total} total
        </span>
      }
    >
      {rows.length === 0 ? (
        <Empty>No current membership</Empty>
      ) : (
        <Rows>
          {rows.map((membership) => {
            const balances = balancesByMembership.get(membership.id) ?? []
            return (
              <Row
                key={membership.id}
                primary={
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{membership.name}</span>
                    {membership.plan?.name && (
                      <span className="text-xs text-muted-foreground">{membership.plan.name}</span>
                    )}
                  </span>
                }
                secondary={
                  <>
                    {formatDate(membership.startsAt)} →{" "}
                    {membership.endsAt ? formatDate(membership.endsAt) : "open-ended"}
                    {balances.length > 0 && (
                      <>
                        {" · "}
                        {balances
                          .map((b) => `${formatEnumLabel(b.creditType)} ${b.available}`)
                          .join(", ")}
                      </>
                    )}
                  </>
                }
                aside={
                  <Badge
                    variant="secondary"
                    className={`${MEMBERSHIP_STATUS_CLASSES[membership.status]} border-0`}
                  >
                    {MEMBERSHIP_STATUS_LABELS[membership.status]}
                  </Badge>
                }
              />
            )
          })}
        </Rows>
      )}
    </Section>
  )
}
