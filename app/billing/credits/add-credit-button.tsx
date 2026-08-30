"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddCreditForm } from "./add-credit-form"

export function AddCreditButton({
  defaultMemberId,
  defaultCompanyId,
}: Readonly<{ defaultMemberId?: string; defaultCompanyId?: string }> = {}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Credit
      </Button>
      {isDrawerOpen && (
        <AddCreditForm
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          defaultMemberId={defaultMemberId}
          defaultCompanyId={defaultCompanyId}
        />
      )}
    </>
  )
}
