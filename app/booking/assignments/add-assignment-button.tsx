"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddAssignmentForm } from "./add-assignment-form"

export function AddAssignmentButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Assignment
      </Button>
      {isDrawerOpen && (
        <AddAssignmentForm isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      )}
    </>
  )
}
