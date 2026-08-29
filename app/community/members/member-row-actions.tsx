"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Eye, Loader2, MoreHorizontal, UserCog } from "lucide-react"
import type { MemberDto } from "@/lib/service/HsService"
import { StatusDialog } from "./status-dialog"
import { useMemberMutations } from "./use-member-mutations"

interface MemberRowActionsProps {
  member: MemberDto
  onDetails: (member: MemberDto) => void
  onEdit: (member: MemberDto) => void
}

/**
 * One "⋯" trigger per row; the actions live in a dropdown. The status dialog
 * is controlled from here rather than nested in a menu item, because the
 * menu unmounts its content on close and would take an inline dialog down
 * with it.
 */
export function MemberRowActions({ member, onDetails, onEdit }: Readonly<MemberRowActionsProps>) {
  const { label, pending, setStatus } = useMemberMutations(member)
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <>
      {/* Non-modal: a modal menu that hands off to a dialog races on the
          body's pointer-events lock and can leave the whole page unclickable
          once the dialog closes. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending !== null}>
            {pending !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            <span className="sr-only">Open actions for {label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onDetails(member)}>
            <Eye />
            Details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(member)}>
            <Edit />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setStatusOpen(true)}>
            <UserCog />
            Set status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        member={member}
        pending={pending === "status"}
        onApply={async (choice) => {
          if (await setStatus(choice)) setStatusOpen(false)
        }}
      />
    </>
  )
}
