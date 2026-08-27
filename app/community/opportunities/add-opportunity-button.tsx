"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { AddOpportunityForm } from "./add-opportunity-form"
import { useOpportunityOptions } from "./use-opportunity-options"

export function AddOpportunityButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { options, loading, loadOptions } = useOpportunityOptions()
  const isLoading = loading !== null

  // Members, plans and spaces first: a drawer that opens on empty dropdowns
  // reads as "there are none".
  const handleOpen = async () => {
    if (await loadOptions("create")) setIsDrawerOpen(true)
  }

  return (
    <>
      <Button onClick={handleOpen} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Loading..." : "Add Opportunity"}
      </Button>
      {isDrawerOpen && (
        <AddOpportunityForm
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          options={options}
        />
      )}
    </>
  )
}
