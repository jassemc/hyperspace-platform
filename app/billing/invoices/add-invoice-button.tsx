"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddInvoiceForm } from "./add-invoice-form"

export function AddInvoiceButton({
  defaultMemberId,
}: Readonly<{ defaultMemberId?: string }> = {}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Invoice
      </Button>
      {isDrawerOpen && (
        <AddInvoiceForm
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          defaultMemberId={defaultMemberId}
        />
      )}
    </>
  )
}
