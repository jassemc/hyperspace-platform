"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { PlanDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddPlanForm } from "./add-plan-form"

interface PlanTableProps {
  data: PlanDto[]
  totalCount?: number
}

export function PlanTable({ data, totalCount }: Readonly<PlanTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null)

  const handleEdit = (plan: PlanDto) => {
    setEditingPlan(plan)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingPlan(null)
  }

  const columns = createColumns({ onEdit: handleEdit })

  return (
    <>
      <DataTable columns={columns} data={data} totalCount={typeof totalCount === "number" ? totalCount : undefined} />
      <AddPlanForm key={editingPlan?.id || "create"} isOpen={isDrawerOpen} onClose={handleClose} editingPlan={editingPlan} />
    </>
  )
}
