"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { ResourceRateDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddResourceRateForm } from "./add-resource-rate-form"

interface ResourceRateTableProps {
  data: ResourceRateDto[]
  totalCount?: number
  resourceTypeNames?: Record<string, string>
  activeResourceTypeId?: string
}

export function ResourceRateTable({
  data,
  totalCount,
  resourceTypeNames = {},
  activeResourceTypeId,
}: Readonly<ResourceRateTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ResourceRateDto | null>(null)

  const handleEdit = (rate: ResourceRateDto) => {
    setEditingRate(rate)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingRate(null)
  }

  const columns = createColumns({ onEdit: handleEdit, resourceTypeNames })

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={activeResourceTypeId ?? "all"}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddResourceRateForm
        key={editingRate?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingRate={editingRate}
        resourceTypeNames={resourceTypeNames}
      />
    </>
  )
}
