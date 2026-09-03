"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddDiscountForm } from "./add-discount-form"

export function AddDiscountButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Discount
      </Button>
      {isDrawerOpen && (
        <AddDiscountForm
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </>
  )
}
