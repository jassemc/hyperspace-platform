"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { PlanDto, PlanKind, PlanStatus } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"

function formatPrice(value: number) {
  return `${(value / 1000).toLocaleString("en-US")} TND`
}

function formatLabel(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ")
}

function statusBadgeClass(status: PlanStatus) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
    case "archived":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
  }
}

function kindBadgeClass(kind: PlanKind) {
  return kind === "recurring"
    ? "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200"
    : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
}

interface ColumnsProps {
  onEdit: (plan: PlanDto) => void
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<PlanDto>[] => [
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
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => <span>{row.getValue<string | null>("code") || "-"}</span>,
  },
  {
    accessorKey: "kind",
    header: "Kind",
    cell: ({ row }) => {
      const value = row.getValue<PlanKind>("kind")
      return (
        <Badge variant="secondary" className={`${kindBadgeClass(value)} border-0 capitalize`}>
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<PlanStatus>("status")
      return (
        <Badge variant="secondary" className={`${statusBadgeClass(value)} border-0 capitalize`}>
          {formatLabel(value)}
        </Badge>
      )
    },
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
      const plan = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(plan)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
