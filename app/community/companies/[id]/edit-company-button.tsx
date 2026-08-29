"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import type { CompanyDto } from "@/lib/service/HsService"
import { CompanyFormDialog } from "../company-form-dialog"

export function EditCompanyButton({ company }: Readonly<{ company: CompanyDto }>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </Button>
      {open && <CompanyFormDialog isOpen onClose={() => setOpen(false)} editingCompany={company} />}
    </>
  )
}
