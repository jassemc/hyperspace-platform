"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CompanyFormDialog } from "./company-form-dialog"

export function AddCompanyButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Company
      </Button>
      {isDrawerOpen && (
        <CompanyFormDialog
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </>
  )
}
