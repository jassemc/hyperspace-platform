import type { MemberDetailsDto } from "@/lib/service/HsService"
import { formatDate, formatPriceHt } from "@/lib/format"
import { AddChargeButton } from "@/app/billing/charges/add-charge-button"
import { AddInvoiceButton } from "@/app/billing/invoices/add-invoice-button"
import { memberPath } from "../member-route"
import { CardEmpty, CardRow, CardRows, OverviewCard } from "./overview-card"

/** Invoices and charges addressed to the member personally (spec §0). */
export function BillingCard({ member }: Readonly<{ member: MemberDetailsDto }>) {
  const { open, outstandingTtc, items } = member.invoices
  const { uninvoiced } = member.charges

  return (
    <OverviewCard
      title="Billing"
      viewAllHref={memberPath(member.id, "invoices")}
      headline={
        <>
          {formatPriceHt(outstandingTtc)}
          <span className="text-sm font-normal text-muted-foreground"> outstanding</span>
        </>
      }
      subline={`${open} open invoice${open === 1 ? "" : "s"} · ${uninvoiced} uninvoiced charge${
        uninvoiced === 1 ? "" : "s"
      }`}
      action={
        <>
          <AddChargeButton defaultMemberId={member.id} />
          <AddInvoiceButton defaultMemberId={member.id} />
        </>
      }
    >
      {items.length === 0 ? (
        <CardEmpty>Nothing outstanding</CardEmpty>
      ) : (
        <CardRows>
          {items.slice(0, 3).map((invoice) => (
            <CardRow
              key={invoice.id}
              primary={invoice.number ?? "Draft"}
              secondary={`Due ${formatDate(invoice.dueAt)}`}
              aside={<span className="tabular-nums">{formatPriceHt(invoice.totalTtc)}</span>}
            />
          ))}
        </CardRows>
      )}
    </OverviewCard>
  )
}
