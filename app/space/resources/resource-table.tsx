"use client"

import { useState, useOptimistic } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { AddResourceForm } from "./add-resource-form"
import { ResourceDetailsDialog } from "./resource-details-dialog"
import type { ResourceDto, ResourceStatus } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { RESOURCE_STATUS_TABS } from "./resource-status"

interface ResourceTableProps {
    data: ResourceDto[]
    totalCount?: number
    resourceTypeNames?: Record<string, string>
    activeResourceTypeId?: string
    activeStatus?: ResourceStatus
}

export function ResourceTable({ data, totalCount, resourceTypeNames = {}, activeResourceTypeId, activeStatus }: Readonly<ResourceTableProps>) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingResource, setEditingResource] = useState<ResourceDto | null>(null)
    const [detailsResource, setDetailsResource] = useState<ResourceDto | null>(null)

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
        onDetails: setDetailsResource,
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
                key={`${activeResourceTypeId ?? "all"}-${activeStatus ?? "all"}`}
                columns={columns}
                data={optimisticResources}
                totalCount={typeof totalCount === 'number' ? totalCount : undefined}
                showTypeFilter={true}
                showStatusTabs={true}
                statusTabOptions={RESOURCE_STATUS_TABS}
            />
            <AddResourceForm
                key={editingResource?.id || 'create'}
                isOpen={isDrawerOpen}
                onClose={handleClose}
                editingResource={editingResource}
            />
            {detailsResource && (
                <ResourceDetailsDialog
                    key={detailsResource.id}
                    resource={detailsResource}
                    open
                    onOpenChange={(next) => {
                        if (!next) setDetailsResource(null)
                    }}
                    // Hand over: the details dialog closes first so the two never stack.
                    onEdit={() => {
                        const resource = detailsResource
                        setDetailsResource(null)
                        handleEdit(resource)
                    }}
                    resourceTypeName={resourceTypeNames[detailsResource.resourceTypeId]}
                />
            )}
        </>
    )
}


