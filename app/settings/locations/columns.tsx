"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import type { LocationDto } from "@/lib/service/HsService"
import { ArrowUpDown, Edit } from "lucide-react"
import { formatDate } from "@/lib/format"

interface ColumnsProps {
  onEdit: (location: LocationDto) => void
}

/** `formattedAddress` overrides the composed parts when the API supplies it. */
function addressLine(location: LocationDto): string {
  const address = location.address
  if (!address) return ""
  if (address.formattedAddress) return address.formattedAddress
  return [address.street, address.zip, address.city, address.country].filter(Boolean).join(", ")
}

function openDayCount(location: LocationDto): number {
  const hours = location.openingHours
  if (!hours) return 0
  return Object.values(hours).filter((windows) => (windows ?? []).length > 0).length
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<LocationDto>[] => [
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
    id: "address",
    accessorFn: addressLine,
    header: "Address",
    cell: ({ row }) => {
      const value = row.getValue<string>("address")
      return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "timezone",
    header: "Timezone",
    cell: ({ row }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.getValue<string>("timezone")}</code>
    ),
  },
  {
    id: "openingHours",
    accessorFn: openDayCount,
    header: "Open days",
    cell: ({ row }) => {
      const count = row.getValue<number>("openingHours")
      if (!count) return <span className="text-muted-foreground">Not set</span>
      return <span>{count} / 7</span>
    },
  },
  {
    id: "closedDays",
    accessorFn: (location) => (location.closedDays ?? []).length,
    header: "Closures",
    cell: ({ row }) => {
      const closures = row.original.closedDays ?? []
      if (closures.length === 0) return <span className="text-muted-foreground">-</span>
      return (
        <span title={closures.map((day) => day.description).join(", ")}>
          {closures.length} {closures.length === 1 ? "closure" : "closures"}
        </span>
      )
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue<boolean>("active")
      return (
        <Badge
          variant="secondary"
          className={
            active
              ? "border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "border-0 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }
        >
          {active ? "Active" : "Inactive"}
        </Badge>
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
