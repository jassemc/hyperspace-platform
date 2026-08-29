import type { MemberDetailsDto } from "@/lib/service/HsService"
import { formatDateTime, formatEnumLabel } from "@/lib/format"
import { AddCreditButton } from "@/app/billing/credits/add-credit-button"
import { memberPath } from "../member-route"
import { CardEmpty, CardRow, CardRows, OverviewCard } from "./overview-card"

/**
 * Balances follow the ledger's `memberId` semantics — what this person can
 * draw on, employer pool included (spec §0).
 */
export function CreditsCard({
  member,
  timeZone,
}: Readonly<{ member: MemberDetailsDto; timeZone: string }>) {
  const { balances, recent } = member.credits

  // One figure per credit type across every membership the member draws on.
  const byType = new Map<string, number>()
  for (const block of balances) {
    for (const balance of block.balances) {
      byType.set(balance.creditType, (byType.get(balance.creditType) ?? 0) + balance.available)
    }
  }
  const available = [...byType.values()].reduce((sum, value) => sum + value, 0)
  const breakdown = [...byType.entries()]
    .slice(0, 3)
    .map(([type, value]) => `${formatEnumLabel(type)}: ${value}`)
    .join(" · ")

  return (
    <OverviewCard
      title="Credits"
      viewAllHref={memberPath(member.id, "credits")}
      headline={
        <>
          {available}
          <span className="text-sm font-normal text-muted-foreground"> available</span>
        </>
      }
      subline={breakdown || "No credit balances"}
      action={<AddCreditButton defaultMemberId={member.id} />}
    >
      {recent.length === 0 ? (
        <CardEmpty>No credit activity</CardEmpty>
      ) : (
        <CardRows>
          {recent.slice(0, 3).map((row) => (
            <CardRow
              key={row.id}
              primary={formatEnumLabel(row.creditType)}
              secondary={formatDateTime(row.occurredAt, timeZone)}
              aside={
                <span
                  className={`tabular-nums ${row.delta < 0 ? "text-muted-foreground" : "text-green-700 dark:text-green-400"}`}
                >
                  {row.delta > 0 ? `+${row.delta}` : row.delta}
                </span>
              }
            />
          ))}
        </CardRows>
      )}
    </OverviewCard>
  )
}
