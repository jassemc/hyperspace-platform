"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ResourceDto, ResourceStatus } from "@/lib/service/HsService"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit } from "lucide-react"
import { ArchiveButton } from "./archive-button"
import { RESOURCE_STATUS_CLASSES, RESOURCE_STATUS_LABELS } from "./resource-status"

interface ColumnsProps {
  onEdit: (resource: ResourceDto) => void
  resourceTypeNames?: Record<string, string>
}

export const createColumns = ({ onEdit, resourceTypeNames = {} }: ColumnsProps): ColumnDef<ResourceDto>[] => [
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
        id: "type",
        // Resources reference their type by id only, so resolve the name from the loaded types.
        accessorFn: (resource) => resourceTypeNames[resource.resourceTypeId] ?? "",
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
        id: "amenities",
        accessorFn: (resource) => (resource.amenities ?? []).map((amenity) => amenity.name).join(", "),
        header: "Amenities",
        cell: ({ row }) => {
            const amenities = row.original.amenities ?? []
            if (amenities.length === 0) return <span className="text-muted-foreground">-</span>
            return (
                <div className="flex flex-wrap gap-1">
                    {amenities.map((amenity) => (
                        <Badge key={amenity.id} variant="outline" className="font-normal">
                            {amenity.name}
                        </Badge>
                    ))}
                </div>
            )
        },
    },
    {
        id: "rates",
        accessorFn: (resource) => (resource.rates ?? []).length,
        header: "Rates",
        cell: ({ row }) => {
            const rates = row.original.rates ?? []
            if (rates.length === 0) return <span className="text-muted-foreground">-</span>
            return (
                <span title={rates.map((rate) => rate.name).join(", ")}>
                    {rates.length} {rates.length === 1 ? "rate" : "rates"}
                </span>
            )
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const value = row.getValue<ResourceStatus | undefined>("status")
            if (!value) return <span className="text-muted-foreground">-</span>

            return (
                <Badge
                    variant="secondary"
                    className={`${RESOURCE_STATUS_CLASSES[value] ?? ""} border-0`}
                >
                    {RESOURCE_STATUS_LABELS[value] ?? value.replaceAll("_", " ")}
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
                    <ArchiveButton
                        resourceId={resource.id}
                        resourceName={resource.name}
                        active={resource.active}
                    />
                </div>
            )
        },
    },
]


