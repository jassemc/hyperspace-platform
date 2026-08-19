"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { CreditTransactionDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { EditCreditForm } from "./edit-credit-form"

interface CreditTableProps {
  data: CreditTransactionDto[]
  totalCount?: number
  resourceTypeNames?: Record<string, string>
}

export function CreditTable({
  data,
  totalCount,
  resourceTypeNames = {},
}: Readonly<CreditTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingCredit, setEditingCredit] = useState<CreditTransactionDto | null>(null)

  const handleEdit = (credit: CreditTransactionDto) => {
    setEditingCredit(credit)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingCredit(null)
  }

  const columns = createColumns({ onEdit: handleEdit, resourceTypeNames })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <EditCreditForm
        key={editingCredit?.id || "none"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingCredit={editingCredit}
      />
    </>
  )
}
