"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MembershipFormDialog } from "./membership-form-dialog"

export function AddMembershipButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Membership
      </Button>
      {isDialogOpen && (
        <MembershipFormDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      )}
    </>
  )
}
