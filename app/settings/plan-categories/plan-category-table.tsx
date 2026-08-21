"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { PlanCategoryDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddPlanCategoryForm } from "./add-plan-category-form"

interface PlanCategoryTableProps {
  data: PlanCategoryDto[]
  totalCount?: number
}

export function PlanCategoryTable({ data, totalCount }: Readonly<PlanCategoryTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PlanCategoryDto | null>(null)

  const handleEdit = (category: PlanCategoryDto) => {
    setEditingCategory(category)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingCategory(null)
  }

  const columns = createColumns({ onEdit: handleEdit })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddPlanCategoryForm
        key={editingCategory?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingCategory={editingCategory}
      />
    </>
  )
}
