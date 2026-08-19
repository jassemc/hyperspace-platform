"use client"

import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { CreditTransactionDto } from "@/lib/service/HsService"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { formatDate, formatEnumLabel } from "@/lib/format"
import { apiName, apiString } from "@/lib/api-value"
import { DeleteCreditButton } from "./delete-credit-button"

interface ColumnsProps {
  onEdit: (credit: CreditTransactionDto) => void
  resourceTypeNames?: Record<string, string>
}

export const createColumns = ({
  onEdit,
  resourceTypeNames = {},
}: ColumnsProps): ColumnDef<CreditTransactionDto>[] => [
  {
    accessorKey: "creditType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary" className="border-0 capitalize">
        {formatEnumLabel(row.getValue<string>("creditType"))}
      </Badge>
    ),
  },
  {
    accessorKey: "delta",
    header: "Amount",
    cell: ({ row }) => {
      // A grant is positive, a consumption negative.
      const value = row.getValue<number>("delta")
      const isGrant = value >= 0
      return (
        <span
          className={
            isGrant
              ? "tabular-nums text-green-700 dark:text-green-400"
              : "tabular-nums text-red-700 dark:text-red-400"
          }
        >
          {isGrant ? "+" : ""}
          {value}
        </span>
      )
    },
  },
  {
    id: "scope",
    accessorFn: (credit) => apiName(credit.resourceTypeId, resourceTypeNames) ?? "",
    header: "Scope",
    cell: ({ row }) => {
      const value = row.getValue<string>("scope")
      return value ? (
        <span>{value}</span>
      ) : (
        <span className="text-muted-foreground">Any resource type</span>
      )
    },
  },
  {
    accessorKey: "occurredAt",
    header: "Occurred",
    cell: ({ row }) => <span>{formatDate(row.getValue<string>("occurredAt"))}</span>,
  },
  {
    accessorKey: "expiresAt",
    header: "Expires",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("expiresAt")
      if (!value) return <span className="text-muted-foreground">Never</span>
      const expired = new Date(value).getTime() < Date.now()
      return (
        <span className={expired ? "text-muted-foreground line-through" : undefined}>
          {formatDate(value)}
        </span>
      )
    },
  },
  {
    id: "reason",
    accessorFn: (credit) => apiString(credit.reason) ?? "",
    header: "Reason",
    cell: ({ row }) => {
      const value = row.getValue<string>("reason")
      return value ? <span className="text-sm">{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const credit = row.original
      // Only grants are removable; consumption follows a booking or check-in.
      if (credit.delta < 0) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(credit)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteCreditButton
            creditId={credit.id}
            creditLabel={`${credit.delta} ${credit.creditType}`}
          />
        </div>
      )
    },
  },
]
