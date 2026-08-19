"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { AmenityDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddAmenityForm } from "./add-amenity-form"

interface AmenityTableProps {
  data: AmenityDto[]
  totalCount?: number
}

export function AmenityTable({ data, totalCount }: Readonly<AmenityTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState<AmenityDto | null>(null)

  const handleEdit = (amenity: AmenityDto) => {
    setEditingAmenity(amenity)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingAmenity(null)
  }

  const columns = createColumns({ onEdit: handleEdit })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddAmenityForm
        key={editingAmenity?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingAmenity={editingAmenity}
      />
    </>
  )
}
