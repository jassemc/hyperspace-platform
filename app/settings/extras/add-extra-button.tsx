"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddExtraForm } from "./add-extra-form"

export function AddExtraButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Extra
      </Button>
      {isDrawerOpen && (
        <AddExtraForm isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      )}
    </>
  )
}
