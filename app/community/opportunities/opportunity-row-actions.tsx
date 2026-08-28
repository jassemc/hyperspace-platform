"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Eye, Loader2, MoreHorizontal, UserPlus } from "lucide-react"
import type { OpportunityDto } from "@/lib/service/HsService"
import { apiString } from "@/lib/api-value"
import type { OptionsLoading } from "./use-opportunity-options"

interface OpportunityRowActionsProps {
  opportunity: OpportunityDto
  onDetails: (opportunity: OpportunityDto) => void
  onEdit: (opportunity: OpportunityDto) => void
  onConvert: (opportunity: OpportunityDto) => void
  /** The row and the button waiting on data, if any. */
  loading: OptionsLoading | null
}

/** Why the conversion is unavailable matters more than that it is. */
function convertHint(closed: boolean, hasPlan: boolean): string {
  if (closed) return "Already closed — reopen it to convert"
  if (!hasPlan) return "Add a requested plan before converting"
  return "Convert to a membership and assignment"
}

/**
 * One "⋯" trigger per row; the actions live in a dropdown, matching the
 * bookings table. The dialogs themselves stay owned by the table, since edit
 * and convert first load their options before anything opens.
 */
export function OpportunityRowActions({
  opportunity,
  onDetails,
  onEdit,
  onConvert,
  loading,
}: Readonly<OpportunityRowActionsProps>) {
  const busy = loading !== null
  const waiting = loading?.id === opportunity.id
  // Converting a closed lead is refused: won/lost stamps closed_at.
  const closed = Boolean(opportunity.closedAt)
  // No plan, nothing to bill — onboarding refuses it. Shown but disabled,
  // so the action stays discoverable and the hint says what is missing.
  const hasPlan = Boolean(apiString(opportunity.requestedPlanId))
  const label = opportunity.member?.fullName ?? "this opportunity"

  return (
    // Non-modal: a modal menu that hands off to a dialog races on the body's
    // pointer-events lock and can leave the whole page unclickable once the
    // dialog closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}>
          {waiting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Open actions for {label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onDetails(opportunity)}>
          <Eye />
          Details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(opportunity)}>
          <Edit />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={closed || !hasPlan}
          onSelect={() => onConvert(opportunity)}
          title={convertHint(closed, hasPlan)}
        >
          <UserPlus />
          Convert
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
