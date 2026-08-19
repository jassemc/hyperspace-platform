"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { RateIntervalType, ResourceRateDto } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"
import { formatDate, formatEnumLabel, formatPriceHt, formatVatRate } from "@/lib/format"
import { RATE_INTERVAL_LABELS } from "./rate-meta"

interface ColumnsProps {
  onEdit: (rate: ResourceRateDto) => void
  resourceTypeNames?: Record<string, string>
}

export const createColumns = ({
  onEdit,
  resourceTypeNames = {},
}: ColumnsProps): ColumnDef<ResourceRateDto>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-2 font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => {
      const rate = row.original
      return (
        <div className="flex flex-col">
          <span>{rate.name}</span>
          {rate.description && (
            <span className="text-xs text-muted-foreground">{rate.description}</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      // The code becomes the line-item code on invoice exports.
      const value = row.getValue<string | null>("code")
      return value ? (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{value}</code>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: "resourceType",
    // Rates reference their type by id only, so resolve the name separately.
    accessorFn: (rate) => resourceTypeNames[rate.resourceTypeId] ?? "",
    header: "Resource type",
    cell: ({ row }) => {
      const value = row.getValue<string>("resourceType")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "intervalType",
    header: "Interval",
    cell: ({ row }) => {
      const value = row.getValue<RateIntervalType>("intervalType")
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="border-0">
            {RATE_INTERVAL_LABELS[value] ?? formatEnumLabel(value)}
          </Badge>
          {row.original.isWeekendRate && (
            <Badge
              variant="outline"
              className="border-0 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            >
              Weekend
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "priceHt",
    header: "Price (HT)",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{formatPriceHt(row.getValue<number>("priceHt"))}</span>
        <span className="text-xs text-muted-foreground">
          VAT {formatVatRate(row.original.vatRate)}
        </span>
      </div>
    ),
  },
  {
    id: "extras",
    accessorFn: (rate) => (rate.extras ?? []).length,
    header: "Extras",
    cell: ({ row }) => {
      const extras = row.original.extras ?? []
      if (extras.length === 0) return <span className="text-muted-foreground">-</span>
      return (
        <span title={extras.map((extra) => extra.name).join(", ")}>
          {extras.length} {extras.length === 1 ? "extra" : "extras"}
        </span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => <span>{formatDate(row.getValue<string>("createdAt"))}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const rate = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(rate)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
