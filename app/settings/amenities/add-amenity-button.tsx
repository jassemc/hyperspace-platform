"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddAmenityForm } from "./add-amenity-form"

export function AddAmenityButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Amenity
      </Button>
      {isDrawerOpen && (
        <AddAmenityForm isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      )}
    </>
  )
}
