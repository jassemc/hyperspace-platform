import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { MemberChargesSummaryDto, MemberInvoicesSummaryDto } from "@/lib/service/HsService"
import { formatDate, formatPriceHt } from "@/lib/format"
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS } from "@/app/billing/invoices/invoice-status"
import { Empty, Row, Rows, Section } from "./section"

/** What is still owed or not yet billed — the two things billing staff chase. */
export function OpenBilling({
  invoices,
  charges,
  invoicesHref,
  uninvoicedHref,
}: Readonly<{
  invoices: MemberInvoicesSummaryDto
  charges: MemberChargesSummaryDto
  invoicesHref: string
  /** The charges tab, pre-filtered to what still needs an invoice. */
  uninvoicedHref: string
}>) {

  return (
    <Section
      title="Open billing"
      viewAllHref={invoicesHref}
      aside={
        invoices.outstandingTtc > 0 && (
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {formatPriceHt(invoices.outstandingTtc)} outstanding
          </span>
        )
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Open invoices
          </p>
          {invoices.items.length === 0 ? (
            <Empty>Nothing outstanding</Empty>
          ) : (
            <Rows>
              {invoices.items.map((invoice) => (
                <Row
                  key={invoice.id}
                  primary={
                    <Link href={`/billing/invoices/${invoice.id}`} className="hover:underline">
                      {invoice.number ?? "Draft"}
                    </Link>
                  }
                  secondary={`Due ${formatDate(invoice.dueAt)} · paid ${formatPriceHt(invoice.paid)}`}
                  aside={
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">{formatPriceHt(invoice.totalTtc)}</span>
                      <Badge
                        variant="secondary"
                        className={`${INVOICE_STATUS_CLASSES[invoice.status]} border-0`}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </Badge>
                    </span>
                  }
                />
              ))}
            </Rows>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Uninvoiced charges
            <Link
              href={uninvoicedHref}
              className="font-normal normal-case tracking-normal text-primary hover:underline"
            >
              {charges.uninvoiced} to invoice
            </Link>
          </p>
          {charges.items.length === 0 ? (
            <Empty>Everything is invoiced</Empty>
          ) : (
            <Rows>
              {charges.items.slice(0, 3).map((charge) => (
                <Row
                  key={charge.id}
                  primary={charge.description}
                  secondary={`${formatDate(charge.createdAt)} · ${charge.kind.replace(/_/g, " ")}`}
                  aside={<span className="tabular-nums">{formatPriceHt(charge.amountHt)} HT</span>}
                />
              ))}
            </Rows>
          )}
        </div>
      </div>
    </Section>
  )
}
