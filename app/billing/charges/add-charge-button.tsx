"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddChargeForm } from "./add-charge-form"

export function AddChargeButton({
  defaultMemberId,
  defaultCompanyId,
}: Readonly<{ defaultMemberId?: string; defaultCompanyId?: string }> = {}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Charge
      </Button>
      {isDrawerOpen && (
        <AddChargeForm
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          defaultMemberId={defaultMemberId}
          defaultCompanyId={defaultCompanyId}
        />
      )}
    </>
  )
}
