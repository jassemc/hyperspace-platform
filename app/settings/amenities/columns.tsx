"use client"

import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { AmenityDto } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"
import { formatDate } from "@/lib/format"

interface ColumnsProps {
  onEdit: (amenity: AmenityDto) => void
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<AmenityDto>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.getValue<string>("slug")}</code>
    ),
  },
  {
    accessorKey: "icon",
    header: "Icon",
    cell: ({ row }) => {
      const value = row.getValue<string | null>("icon")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
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
