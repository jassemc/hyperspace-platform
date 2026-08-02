"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { ResourceRateDto, RateAudience, RateType } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"

function formatPrice(value: number) {
  return `${(value / 1000).toLocaleString("en-US")} TND`
}

function formatLabel(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ")
}

function audienceBadgeClass(audience: RateAudience) {
  return audience === "member"
    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
    : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
}

function typeBadgeClass(type: RateType) {
  return type === "hourly"
    ? "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200"
    : "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
}

interface ColumnsProps {
  onEdit: (rate: ResourceRateDto) => void
  resourcesById?: Map<string, string> | Record<string, string>
}

export const createColumns = ({ onEdit, resourcesById }: ColumnsProps): ColumnDef<ResourceRateDto>[] => [
  {
    accessorKey: "resourceId",
    header: ({ column }) => (
      <button
        type="button"
        className="flex items-center gap-2 font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Resource
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => {
      const resourceId = row.getValue<string>("resourceId")
      const resourceName = resourcesById instanceof Map
        ? resourcesById.get(resourceId)
        : resourcesById?.[resourceId]
      return <span>{resourceName || resourceId}</span>
    },
    filterFn: (row, id, value) => {
      const resourceId = row.getValue<string>(id)
      const resourceName = resourcesById instanceof Map
        ? resourcesById.get(resourceId)
        : resourcesById?.[resourceId]
      return (resourceName || resourceId).toLowerCase().includes(String(value).toLowerCase())
    },
  },
  {
    accessorKey: "rateType",
    header: "Type",
    cell: ({ row }) => {
      const value = row.getValue<RateType>("rateType")
      return (
        <Badge variant="secondary" className={`${typeBadgeClass(value)} border-0 capitalize`}>
          {formatLabel(value)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "audience",
    header: "Audience",
    cell: ({ row }) => {
      const value = row.getValue<RateAudience>("audience")
      return (
        <Badge variant="secondary" className={`${audienceBadgeClass(value)} border-0 capitalize`}>
          {formatLabel(value)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "priceHtMillimes",
    header: "Price",
    cell: ({ row }) => <span>{formatPrice(row.getValue<number>("priceHtMillimes"))}</span>,
  },
  {
    accessorKey: "vatRateBp",
    header: "VAT",
    cell: ({ row }) => <span>{row.getValue<number>("vatRateBp") / 100}%</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const value = row.getValue<string>("createdAt")
      const date = value ? new Date(value) : null
      return <span>{date ? date.toLocaleDateString() : "-"}</span>
    },
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
