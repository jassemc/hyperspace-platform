"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { CompanyFormDialog } from "./company-form-dialog"
import type { CompanyDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface CompanyTableProps {
  data: CompanyDto[]
  totalCount?: number
}

export function CompanyTable({ data, totalCount }: Readonly<CompanyTableProps>) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyDto | null>(null)

  const handleEdit = (company: CompanyDto) => {
    setEditingCompany(company)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingCompany(null)
  }

  const columns = createColumns({
    onEdit: handleEdit,
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        serverSearch
        searchPlaceholder="Search companies..."
      />
      {isFormOpen && (
        <CompanyFormDialog
          key={editingCompany?.id || "create"}
          isOpen
          onClose={handleClose}
          editingCompany={editingCompany}
        />
      )}
    </>
  )
}
