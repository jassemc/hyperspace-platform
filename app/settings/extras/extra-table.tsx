"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { ExtraDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddExtraForm } from "./add-extra-form"

interface ExtraTableProps {
  data: ExtraDto[]
  totalCount?: number
}

export function ExtraTable({ data, totalCount }: Readonly<ExtraTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingExtra, setEditingExtra] = useState<ExtraDto | null>(null)

  const handleEdit = (extra: ExtraDto) => {
    setEditingExtra(extra)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingExtra(null)
  }

  const columns = createColumns({ onEdit: handleEdit })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddExtraForm
        key={editingExtra?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingExtra={editingExtra}
      />
    </>
  )
}
