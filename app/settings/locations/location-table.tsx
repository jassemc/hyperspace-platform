"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { LocationDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddLocationForm } from "./add-location-form"

interface LocationTableProps {
  data: LocationDto[]
  totalCount?: number
}

export function LocationTable({ data, totalCount }: Readonly<LocationTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationDto | null>(null)

  const handleEdit = (location: LocationDto) => {
    setEditingLocation(location)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingLocation(null)
  }

  const columns = createColumns({ onEdit: handleEdit })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddLocationForm
        key={editingLocation?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingLocation={editingLocation}
      />
    </>
  )
}
