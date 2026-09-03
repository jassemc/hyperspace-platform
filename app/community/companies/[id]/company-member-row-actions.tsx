"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeftRight, Edit, Eye, MoreHorizontal, UserMinus } from "lucide-react"
import type { MemberDto } from "@/lib/service/HsService"

interface CompanyMemberRowActionsProps {
  member: MemberDto
  onDetails: (member: MemberDto) => void
  onEdit: (member: MemberDto) => void
  onReassign: (member: MemberDto) => void
  onDetach: (member: MemberDto) => void
}

/**
 * One "⋯" trigger per row; the actions live in a dropdown. Reassign and
 * Detach both open the same dialog — the table owns it, because that dialog
 * loads the company list before it can render.
 */
export function CompanyMemberRowActions({
  member,
  onDetails,
  onEdit,
  onReassign,
  onDetach,
}: Readonly<CompanyMemberRowActionsProps>) {
  return (
    // Non-modal: a modal menu that hands off to a dialog races on the
    // body's pointer-events lock and can leave the whole page unclickable
    // once the dialog closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions for {member.fullName}</span>
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
        <DropdownMenuItem title="Move to another company" onSelect={() => onReassign(member)}>
          <ArrowLeftRight />
          Reassign
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          title="Make this member solo"
          onSelect={() => onDetach(member)}
        >
          <UserMinus />
          Detach
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
