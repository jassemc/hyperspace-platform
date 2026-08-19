"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddCheckinForm } from "./add-checkin-form"

export function AddCheckinButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Check-in
      </Button>
      {isDrawerOpen && (
        <AddCheckinForm isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      )}
    </>
  )
}
