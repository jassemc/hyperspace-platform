"use client"

import { useState, useOptimistic } from "react"
import { DataTable } from "@/components/data-table"
import { AddResourceTypeForm } from "./add-resource-type-form"
import type { ResourceTypeDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface ResourceTypeTableProps {
  data: ResourceTypeDto[]
  totalCount?: number
}

export function ResourceTypeTable({ data, totalCount }: Readonly<ResourceTypeTableProps>) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editingResourceType, setEditingResourceType] = useState<ResourceTypeDto | null>(null)
    
    const [optimisticResourceTypes] = useOptimistic(
        data,
        (state, newResourceType: ResourceTypeDto) => [...state, newResourceType]
    )

    const handleEdit = (resourceType: ResourceTypeDto) => {
        setEditingResourceType(resourceType)
        setIsDrawerOpen(true)
    }

    const handleClose = () => {
        setIsDrawerOpen(false)
        setEditingResourceType(null)
    }

    const columns = createColumns({
        onEdit: handleEdit,
    })

    return (
        <>
            <DataTable 
                columns={columns} 
                data={optimisticResourceTypes} 
                totalCount={typeof totalCount === 'number' ? totalCount : undefined}
                showTypeFilter={true}
            />
            <AddResourceTypeForm
                key={editingResourceType?.id || 'create'}
                isOpen={isDrawerOpen}
                onClose={handleClose}
                editingResourceType={editingResourceType}
            />
        </>
    )
}

