"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { PlanCategoryDto } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"
import { formatDate } from "@/lib/format"

interface ColumnsProps {
  onEdit: (category: PlanCategoryDto) => void
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<PlanCategoryDto>[] => [
  {
    accessorKey: "sortOrder",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Order
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="tabular-nums">{row.getValue<number>("sortOrder")}</span>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const category = row.original
      return (
        <div className="flex items-center gap-2">
          <span>{category.name}</span>
          {/* Shipped by migrations — extend them, do not expect to remove them. */}
          {category.isDefault && (
            <Badge variant="outline" className="text-[10px] font-normal">
              Default
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.getValue<string>("slug")}</code>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("description")
      return value ? <span className="text-sm">{value}</span> : <span className="text-muted-foreground">-</span>
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(row.original)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]
