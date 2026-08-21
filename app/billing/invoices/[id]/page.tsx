import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download } from "lucide-react"

import { getInvoice, getMember, getCompany } from "@/lib/service"
import type { ChargeDto, CompanyDto, InvoiceDto, MemberDto } from "@/lib/service/HsService"
import { apiString } from "@/lib/api-value"
import { formatDate, formatPriceHt, formatVatRate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS } from "../invoice-status"

/** VAT is a percentage, so the per-line tax is derived when not sent. */
function lineVat(charge: ChargeDto): number {
    return charge.vat ?? charge.amountHt * (charge.vatRate / 100)
}

export default async function InvoicePage({
    params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = await params

    let invoice: InvoiceDto
    try {
        invoice = (await getInvoice(id)) as InvoiceDto
    } catch (error) {
        console.warn(`Failed to load invoice ${id}`, error)
        notFound()
    }

    // An invoice is billed to a member XOR a company, carried as an id only.
    const memberId = apiString(invoice.memberId)
    const companyId = apiString(invoice.companyId)

    const [member, company] = await Promise.all([
        memberId ? (getMember(memberId).catch(() => null) as Promise<MemberDto | null>) : null,
        companyId ? (getCompany(companyId).catch(() => null) as Promise<CompanyDto | null>) : null,
    ])

    const billedTo = company?.billingName || company?.name || member?.fullName || "Unknown customer"
    const outstanding = Math.max(0, invoice.totalTtc - invoice.paid)

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between gap-4 px-4 pb-6">
                <Button variant="ghost" asChild>
                    <Link href="/billing/invoices">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to invoices
                    </Link>
                </Button>

                {/*
                 * The PDF is rendered by the API — a French VAT facture, with
                 * void invoices marked ANNULÉE. This is a plain link so the
                 * browser handles the download.
                 */}
                <Button asChild>
                    <a href={`/api/invoices/${invoice.id}/download`}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </a>
                </Button>
            </div>

            <div className="space-y-6 px-4">
                <section className="rounded-md border p-6">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <h1 className="font-mono text-2xl font-semibold">{invoice.number}</h1>
                            <p className="pt-1 text-sm text-muted-foreground">Billed to {billedTo}</p>
                        </div>
                        <Badge
                            variant="secondary"
                            className={`${INVOICE_STATUS_CLASSES[invoice.status] ?? ""} border-0`}
                        >
                            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                        </Badge>
                    </div>

                    <dl className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Issued</dt>
                            <dd className="pt-0.5">{formatDate(invoice.issuedAt)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Due</dt>
                            <dd className="pt-0.5">{formatDate(invoice.dueAt)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Total TTC</dt>
                            <dd className="pt-0.5 tabular-nums">{formatPriceHt(invoice.totalTtc)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</dt>
                            <dd className="pt-0.5 tabular-nums">{formatPriceHt(outstanding)}</dd>
                        </div>
                    </dl>
                </section>

                <section className="rounded-md border">
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-right">Amount HT</TableHead>
                                    <TableHead className="text-right">VAT</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.charges.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground">
                                            This invoice has no lines.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoice.charges.map((charge) => (
                                        <TableRow key={charge.id}>
                                            <TableCell>{charge.description}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {apiString(charge.accountingCode) ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {formatPriceHt(charge.amountHt)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {formatVatRate(charge.vatRate)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {formatPriceHt(charge.amountHt + lineVat(charge))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <dl className="flex flex-col items-end gap-1 border-t p-6 text-sm">
                        <div className="flex w-56 justify-between">
                            <dt className="text-muted-foreground">Subtotal HT</dt>
                            <dd className="tabular-nums">{formatPriceHt(invoice.totalHt)}</dd>
                        </div>
                        <div className="flex w-56 justify-between">
                            <dt className="text-muted-foreground">VAT</dt>
                            <dd className="tabular-nums">{formatPriceHt(invoice.totalVat)}</dd>
                        </div>
                        <div className="flex w-56 justify-between font-medium">
                            <dt>Total TTC</dt>
                            <dd className="tabular-nums">{formatPriceHt(invoice.totalTtc)}</dd>
                        </div>
                        <div className="flex w-56 justify-between">
                            <dt className="text-muted-foreground">Paid</dt>
                            <dd className="tabular-nums">{formatPriceHt(invoice.paid)}</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </div>
    )
}
