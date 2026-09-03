"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MemberFormDialog } from "./member-form-dialog"

export function AddMemberButton() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Member
      </Button>
      {isDrawerOpen && (
        <MemberFormDialog
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </>
  )
}
