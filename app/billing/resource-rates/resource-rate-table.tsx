"use client"

import { useState } from "react"
import { DataTable } from "@/app/dashboard/resources/data-table"
import type { ResourceRateDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddResourceRateForm } from "./add-resource-rate-form"

interface ResourceRateTableProps {
  data: ResourceRateDto[]
  totalCount?: number
  resourcesById?: Map<string, string> | Record<string, string>
}

export function ResourceRateTable({ data, totalCount, resourcesById }: Readonly<ResourceRateTableProps>) {
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

  const columns = createColumns({ onEdit: handleEdit, resourcesById })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddResourceRateForm
        key={editingRate?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingRate={editingRate}
      />
    </>
  )
}
