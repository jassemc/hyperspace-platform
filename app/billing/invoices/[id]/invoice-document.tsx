import type { AddressDto, ChargeDto, CompanyDto, InvoiceDto, MemberDto } from "@/lib/service/HsService"
import { formatDate, formatPriceHt, formatVatRate } from "@/lib/format"
import { INVOICE_ISSUER } from "@/lib/invoice-identity"
import { INVOICE_STATUS_LABELS } from "../invoice-status"

interface InvoiceDocumentProps {
  invoice: InvoiceDto
  member?: MemberDto | null
  company?: CompanyDto | null
}

function addressLines(address: AddressDto | null | undefined): string[] {
  if (!address) return []
  if (address.formattedAddress) return [address.formattedAddress]
  return [
    address.street,
    [address.zip, address.city].filter(Boolean).join(" "),
    address.country,
  ].filter((line): line is string => Boolean(line && line.trim()))
}

/** VAT is a percentage, so the per-line tax is derived rather than stored. */
function lineVat(charge: ChargeDto): number {
  return charge.vat ?? charge.amountHt * (charge.vatRate / 100)
}

/**
 * The printable invoice. Laid out for A4 with `print:` variants so the same
 * markup serves the screen and the page — no separate print template to drift.
 */
export function InvoiceDocument({ invoice, member, company }: Readonly<InvoiceDocumentProps>) {
  const outstanding = Math.max(0, invoice.totalTtc - invoice.paid)

  const billedToName =
    company?.billingName || company?.name || member?.fullName || "Customer"
  const billedToLines = company
    ? addressLines(company.billingAddress)
    : []
  const billedToContact = [company?.email || member?.email, company?.phone || member?.phone]
    .filter(Boolean)
    .join(" · ")

  return (
    <article className="mx-auto max-w-3xl rounded-md border bg-background p-8 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="flex items-start justify-between gap-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-semibold">{INVOICE_ISSUER.legalName}</h1>
          {INVOICE_ISSUER.addressLines.map((line) => (
            <p key={line} className="text-sm text-muted-foreground">
              {line}
            </p>
          ))}
          {INVOICE_ISSUER.taxId && (
            <p className="text-sm text-muted-foreground">Tax ID {INVOICE_ISSUER.taxId}</p>
          )}
          {INVOICE_ISSUER.registrationNumber && (
            <p className="text-sm text-muted-foreground">
              Reg. {INVOICE_ISSUER.registrationNumber}
            </p>
          )}
        </div>

        <div className="text-right">
          <h2 className="text-xl font-semibold uppercase tracking-wide">
            {/* A negative total is a credit note, not an invoice. */}
            {invoice.totalTtc < 0 ? "Credit note" : "Invoice"}
          </h2>
          <p className="font-mono text-lg">{invoice.number}</p>
          <p className="pt-2 text-sm">
            Issued <span className="font-medium">{formatDate(invoice.issuedAt)}</span>
          </p>
          <p className="text-sm">
            Due <span className="font-medium">{formatDate(invoice.dueAt)}</span>
          </p>
          <p className="pt-1 text-sm uppercase tracking-wide text-muted-foreground">
            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </p>
        </div>
      </header>

      <section className="py-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Billed to
        </h3>
        <p className="pt-1 font-medium">{billedToName}</p>
        {billedToLines.map((line) => (
          <p key={line} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
        {company?.taxId && (
          <p className="text-sm text-muted-foreground">Tax ID {company.taxId}</p>
        )}
        {company?.registrationNumber && (
          <p className="text-sm text-muted-foreground">Reg. {company.registrationNumber}</p>
        )}
        {billedToContact && <p className="text-sm text-muted-foreground">{billedToContact}</p>}
      </section>

      <section>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y text-left">
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 px-3 font-medium">Code</th>
              <th className="py-2 px-3 text-right font-medium">Amount HT</th>
              <th className="py-2 px-3 text-right font-medium">VAT</th>
              <th className="py-2 pl-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.charges.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-3 text-muted-foreground">
                  This invoice has no lines.
                </td>
              </tr>
            ) : (
              invoice.charges.map((charge) => {
                const vat = lineVat(charge)
                return (
                  <tr key={charge.id} className="border-b align-top">
                    <td className="py-2 pr-3">{charge.description}</td>
                    <td className="py-2 px-3 font-mono text-xs">
                      {typeof charge.accountingCode === "string" ? charge.accountingCode : "—"}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {formatPriceHt(charge.amountHt)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {formatVatRate(charge.vatRate)}
                    </td>
                    <td className="py-2 pl-3 text-right tabular-nums">
                      {formatPriceHt(charge.amountHt + vat)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end pt-6">
        <dl className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal HT</dt>
            <dd className="tabular-nums">{formatPriceHt(invoice.totalHt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">VAT</dt>
            <dd className="tabular-nums">{formatPriceHt(invoice.totalVat)}</dd>
          </div>
          <div className="flex justify-between border-t pt-1 font-medium">
            <dt>Total TTC</dt>
            <dd className="tabular-nums">{formatPriceHt(invoice.totalTtc)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="tabular-nums">{formatPriceHt(invoice.paid)}</dd>
          </div>
          <div className="flex justify-between border-t pt-1 font-medium">
            <dt>Outstanding</dt>
            <dd className="tabular-nums">{formatPriceHt(outstanding)}</dd>
          </div>
        </dl>
      </section>

      {INVOICE_ISSUER.footerNote && (
        <footer className="mt-8 border-t pt-4 text-sm text-muted-foreground">
          {INVOICE_ISSUER.footerNote}
        </footer>
      )}
    </article>
  )
}
