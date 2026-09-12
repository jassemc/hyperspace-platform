"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { ChargeDto } from "@/lib/service/HsService"
import { formatDate, formatEnumLabel, formatPriceHt, formatVatRate } from "@/lib/format"
import { apiName, apiString } from "@/lib/api-value"

interface ColumnsProps {
  /** Off on a member's own page, where every row is theirs. */
  hideCustomer?: boolean
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
}

export const createColumns = ({
  memberNames = {},
  companyNames = {},
  hideCustomer = false,
}: ColumnsProps): ColumnDef<ChargeDto>[] => {
  const columns: ColumnDef<ChargeDto>[] = [
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <span>{row.getValue<string>("description")}</span>,
  },
  {
    id: "customer",
    // A charge belongs to a member XOR a company.
    accessorFn: (charge) =>
      apiName(charge.companyId, companyNames) ?? apiName(charge.memberId, memberNames) ?? "",
    header: "Customer",
    cell: ({ row }) => {
      const value = row.getValue<string>("customer")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "kind",
    header: "Kind",
    cell: ({ row }) => (
      <Badge variant="secondary" className="border-0 capitalize">
        {formatEnumLabel(row.getValue<string>("kind"))}
      </Badge>
    ),
  },
  {
    accessorKey: "amountHt",
    header: "Amount (HT)",
    cell: ({ row }) => {
      const charge = row.original
      return (
        <div className="flex flex-col">
          <span>{formatPriceHt(charge.amountHt)}</span>
          <span className="text-xs text-muted-foreground">
            VAT {formatVatRate(charge.vatRate)} · {formatPriceHt(charge.vat)}
          </span>
        </div>
      )
    },
  },
  {
    id: "invoiced",
    accessorFn: (charge) => (apiString(charge.invoiceId) ? "invoiced" : "uninvoiced"),
    header: "Invoiced",
    cell: ({ row }) => {
      const invoiced = Boolean(apiString(row.original.invoiceId))
      return (
        <Badge
          variant="secondary"
          className={
            invoiced
              ? "border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "border-0 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
          }
        >
          {invoiced ? "On an invoice" : "Uninvoiced"}
        </Badge>
      )
    },
  },
  {
    id: "code",
    // A discount line names its campaign, and so does the fee line it
    // reduced (backend #55); anything else shows its accounting code. One
    // column, because a row only ever carries one of the two.
    accessorFn: (charge) =>
      apiString(charge.discountCode) ?? apiString(charge.accountingCode) ?? "",
    header: "Code",
    cell: ({ row }) => {
      const discountCode = apiString(row.original.discountCode)
      const value = discountCode ?? apiString(row.original.accountingCode)
      return value ? (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-xs"
          title={discountCode ? "Discount code" : "Accounting code"}
        >
          {value}
        </code>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => <span>{formatDate(row.getValue<string>("createdAt"))}</span>,
  },
  ]
  return columns.filter((column) => !(hideCustomer && column.id === "customer"))
}
