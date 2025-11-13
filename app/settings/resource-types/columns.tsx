"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ResourceTypeDto } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit } from "lucide-react"
import { DeleteButton } from "./delete-button"

interface ColumnsProps {
  onEdit: (resourceType: ResourceTypeDto) => void
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<ResourceTypeDto>[] => [
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
            return <span className="capitalize">{value?.replaceAll("_", " ")}</span>
        },
    },
    {
        accessorKey: "icon",
        header: "Icon",
        cell: ({ row }) => {
            const value = row.getValue<string>("icon")
            return <span className="font-mono text-sm">{value || "-"}</span>
        },
    },
    {
        accessorKey: "canBook",
        header: "Can Book",
        cell: ({ row }) => {
            const value = row.getValue<boolean>("canBook")
            return (
                <Badge variant={value ? "default" : "secondary"}>
                    {value ? "Yes" : "No"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "canAssign",
        header: "Can Assign",
        cell: ({ row }) => {
            const value = row.getValue<boolean>("canAssign")
            return (
                <Badge variant={value ? "default" : "secondary"}>
                    {value ? "Yes" : "No"}
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
            const resourceType = row.original
            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(resourceType)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 dark:border-blue-800"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteButton resourceTypeId={resourceType.id} resourceTypeName={resourceType.name} />
                </div>
            )
        },
    },
]

