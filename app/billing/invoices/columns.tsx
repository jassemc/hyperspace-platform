"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { InvoiceDto, InvoiceStatus } from "@/lib/service/HsService"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import { formatDate, formatPriceHt } from "@/lib/format"
import { apiName } from "@/lib/api-value"
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS } from "./invoice-status"
import { InvoiceActionButtons } from "./invoice-actions-buttons"

interface ColumnsProps {
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
}

export const createColumns = ({
  memberNames = {},
  companyNames = {},
}: ColumnsProps): ColumnDef<InvoiceDto>[] => [
  {
    accessorKey: "number",
    header: "Number",
    cell: ({ row }) => (
      <Link
        href={`/billing/invoices/${row.original.id}`}
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs underline-offset-4 hover:underline"
      >
        {row.getValue<string>("number")}
      </Link>
    ),
  },
  {
    id: "billedTo",
    // An invoice is billed to a member XOR a company.
    accessorFn: (invoice) =>
      apiName(invoice.companyId, companyNames) ?? apiName(invoice.memberId, memberNames) ?? "",
    header: "Billed to",
    cell: ({ row }) => {
      const value = row.getValue<string>("billedTo")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "issuedAt",
    header: "Dates",
    cell: ({ row }) => {
      const invoice = row.original
      return (
        <div className="flex flex-col">
          <span>{formatDate(invoice.issuedAt)}</span>
          <span className="text-xs text-muted-foreground">due {formatDate(invoice.dueAt)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "totalTtc",
    header: "Total",
    cell: ({ row }) => {
      const invoice = row.original
      return (
        <div className="flex flex-col">
          <span>{formatPriceHt(invoice.totalTtc)}</span>
          <span className="text-xs text-muted-foreground">
            {formatPriceHt(invoice.totalHt)} HT + {formatPriceHt(invoice.totalVat)} VAT
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "paid",
    header: "Paid",
    cell: ({ row }) => {
      const invoice = row.original
      const outstanding = invoice.totalTtc - invoice.paid
      return (
        <div className="flex flex-col">
          <span>{formatPriceHt(invoice.paid)}</span>
          {outstanding > 0 && (
            <span className="text-xs text-muted-foreground">{formatPriceHt(outstanding)} left</span>
          )}
        </div>
      )
    },
  },
  {
    id: "charges",
    accessorFn: (invoice) => (invoice.charges ?? []).length,
    header: "Lines",
    cell: ({ row }) => <span className="tabular-nums">{(row.original.charges ?? []).length}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<InvoiceStatus>("status")
      return (
        <Badge variant="secondary" className={`${INVOICE_STATUS_CLASSES[value] ?? ""} border-0`}>
          {INVOICE_STATUS_LABELS[value] ?? value}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const invoice = row.original
      const outstanding = Math.max(0, invoice.totalTtc - invoice.paid)
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild title="Open and print">
            <Link href={`/billing/invoices/${invoice.id}`}>
              <FileText className="h-4 w-4" />
              <span className="sr-only">Open invoice</span>
            </Link>
          </Button>
          {/* The API renders the PDF; this is a plain link so the browser saves it. */}
          <Button variant="outline" size="sm" asChild title="Download PDF">
            <a href={`/api/invoices/${invoice.id}/download`}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download PDF</span>
            </a>
          </Button>
          <InvoiceActionButtons
            invoiceId={invoice.id}
            invoiceNumber={invoice.number}
            outstanding={outstanding}
            canPay={invoice.status !== "void" && outstanding > 0}
            canVoid={invoice.status !== "void" && invoice.status !== "paid"}
          />
        </div>
      )
    },
  },
]
