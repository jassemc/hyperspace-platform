"use client"

import { useState } from "react"
import { DataTable } from "@/app/dashboard/resources/data-table"
import { AddCompanyForm } from "./add-company-form"
import type { CompanyDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"

interface CompanyTableProps {
  data: CompanyDto[]
  totalCount?: number
}

export function CompanyTable({ data, totalCount }: Readonly<CompanyTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyDto | null>(null)

  const handleEdit = (company: CompanyDto) => {
    setEditingCompany(company)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
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
      />
      <AddCompanyForm
        key={editingCompany?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingCompany={editingCompany}
      />
    </>
  )
}
