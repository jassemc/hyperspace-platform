"use client"

import { useState, useOptimistic } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/app/dashboard/resources/data-table"
import { AddResourceForm } from "./add-resource-form"
import type { ResourceDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface ResourceTableProps {
    data: ResourceDto[]
    totalCount?: number
    resourceTypeNames?: Record<string, string>
    activeResourceTypeId?: string
}

export function ResourceTable({ data, totalCount, resourceTypeNames = {}, activeResourceTypeId }: Readonly<ResourceTableProps>) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingResource, setEditingResource] = useState<ResourceDto | null>(null)

    const [optimisticResources] = useOptimistic(
        data,
        (state, newResource: ResourceDto) => [...state, newResource]
    )

    const handleEdit = (resource: ResourceDto) => {
        setEditingResource(resource)
        setIsDrawerOpen(true)
    }

    const handleClose = () => {
        setIsDrawerOpen(false)
        setEditingResource(null)
    }

    const columns = createColumns({
        onEdit: handleEdit,
        resourceTypeNames,
    })

    const activeResourceTypeName = activeResourceTypeId
        ? resourceTypeNames[activeResourceTypeId] ?? "Unknown type"
        : undefined

    return (
        <>
            {activeResourceTypeName && (
                <div className="flex items-center gap-2 px-4 pt-2 text-sm text-muted-foreground">
                    <span>Filtered by type</span>
                    <Badge variant="secondary" className="gap-1">
                        {activeResourceTypeName}
                        <Link href="/space/resources" aria-label="Clear resource type filter">
                            <X className="h-3 w-3" />
                        </Link>
                    </Badge>
                </div>
            )}
            {/* Remount on filter change so the table re-reads pagination from the URL. */}
            <DataTable
                key={activeResourceTypeId ?? "all"}
                columns={columns}
                data={optimisticResources}
                totalCount={typeof totalCount === 'number' ? totalCount : undefined}
                showTypeFilter={true}
            />
            <AddResourceForm
                key={editingResource?.id || 'create'}
                isOpen={isDrawerOpen}
                onClose={handleClose}
                editingResource={editingResource}
            />
        </>
    )
}


