"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreHorizontal } from "lucide-react"
import type { CompanyDto } from "@/lib/service/HsService"

interface CompanyRowActionsProps {
  company: CompanyDto
  onEdit: (company: CompanyDto) => void
}

/**
 * One "⋯" trigger per row; the actions live in a dropdown, matching the
 * bookings table. The company page is the details view, so Details
 * navigates instead of opening a dialog.
 */
export function CompanyRowActions({ company, onEdit }: Readonly<CompanyRowActionsProps>) {
  return (
    // Non-modal: a modal menu that hands off to a dialog races on the body's
    // pointer-events lock and can leave the whole page unclickable once the
    // dialog closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions for {company.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/community/companies/${company.id}`}>
            <Eye />
            Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(company)}>
          <Edit />
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
