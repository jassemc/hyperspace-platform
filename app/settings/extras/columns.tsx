"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { ExtraDto } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"
import { formatDate, formatPriceHt, formatVatRate } from "@/lib/format"

interface ColumnsProps {
  onEdit: (extra: ExtraDto) => void
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<ExtraDto>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const extra = row.original
      return (
        <div className="flex flex-col">
          <span>{extra.name}</span>
          {extra.description && (
            <span className="text-xs text-muted-foreground">{extra.description}</span>
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
        <span className="text-xs text-muted-foreground">VAT {formatVatRate(row.original.vatRate)}</span>
      </div>
    ),
  },
  {
    accessorKey: "deposit",
    header: "Deposit",
    cell: ({ row }) => {
      const value = row.getValue<number>("deposit")
      return value ? <span>{formatPriceHt(value)}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    id: "amenity",
    accessorFn: (extra) => extra.amenityName ?? "",
    header: "Amenity",
    cell: ({ row }) => {
      // The API denormalises the linked amenity's name onto the extra.
      const name = row.original.amenityName
      return name ? (
        <Badge variant="outline" className="font-normal">
          {name}
        </Badge>
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
