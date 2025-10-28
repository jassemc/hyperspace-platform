"use client"

import { useState, useOptimistic } from "react"
import { DataTable } from "@/app/dashboard/resources/data-table"
import { AddResourceForm } from "./add-resource-form"
import type { ResourceDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface ResourceTableProps {
  data: ResourceDto[]
}

export function ResourceTable({ data }: Readonly<ResourceTableProps>) {
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
    })

    return (
        <>
            <DataTable columns={columns} data={optimisticResources} />
            <AddResourceForm
                key={editingResource?.id || 'create'}
                isOpen={isDrawerOpen}
                onClose={handleClose}
                editingResource={editingResource}
            />
        </>
    )
}


