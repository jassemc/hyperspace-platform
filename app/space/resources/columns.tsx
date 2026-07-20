"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ResourceDto } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit } from "lucide-react"
import { DeleteButton } from "./delete-button"

interface ColumnsProps {
  onEdit: (resource: ResourceDto) => void
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<ResourceDto>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            const value = row.getValue<string>("type")
            return <span className="capitalize">{value ? value.replaceAll("_", " ") : "-"}</span>
        },
    },
    {
        accessorKey: "capacity",
        header: "Capacity",
        cell: ({ row }) => {
            const value = row.getValue<number>("capacity")
            return <span>{value ?? "-"}</span>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const value = row.getValue<string>("status")
            if (!value) return <span>-</span>

            const getStatusVariant = (status: string) => {
                switch (status) {
                    case "AVAILABLE":
                        return "default"
                    case "OCCUPIED":
                        return "destructive"
                    case "UNAVAILABLE":
                        return "secondary"
                    case "AVAILABLE_SOON":
                        return "outline"
                    case "RESERVED":
                        return "outline"
                    default:
                        return "secondary"
                }
            }
            
            const getStatusColor = (status: string) => {
                switch (status) {
                    case "AVAILABLE":
                        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                    case "OCCUPIED":
                        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                    case "UNAVAILABLE":
                        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                    case "AVAILABLE_SOON":
                        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                    case "RESERVED":
                        return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
                    default:
                        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                }
            }
            
            return (
                <Badge 
                    variant={getStatusVariant(value)} 
                    className={`${getStatusColor(value)} border-0`}
                >
                    {value.replaceAll("_", " ")}
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
            const resource = row.original
            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(resource)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteButton resourceId={resource.id} resourceName={resource.name} />
                </div>
            )
        },
    },
]


