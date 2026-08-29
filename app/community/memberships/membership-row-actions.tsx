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
import { Ban, Edit, Eye, Loader2, MoreHorizontal, Pause, Play, RotateCw } from "lucide-react"
import type { MembershipDto } from "@/lib/service/HsService"
import { CancelMembershipAlert } from "./cancel-membership-alert"
import { PauseMembershipDialog } from "./pause-membership-dialog"
import { RenewMembershipAlert } from "./renew-membership-alert"
import { ResumeMembershipAlert } from "./resume-membership-alert"
import type { MembershipActions } from "./use-membership-mutations"
import { useMembershipMutations } from "./use-membership-mutations"

interface MembershipRowActionsProps {
  membership: MembershipDto
  onDetails: (membership: MembershipDto) => void
  onEdit: (membership: MembershipDto) => void
  actions?: MembershipActions
  companyId?: string
}

/**
 * One "⋯" trigger per row; the actions live in a dropdown. The lifecycle
 * dialogs are controlled from here rather than nested in menu items,
 * because the menu unmounts its content on close and would take an inline
 * dialog down with it.
 */
export function MembershipRowActions({
  membership,
  onDetails,
  onEdit,
  actions,
  companyId,
}: Readonly<MembershipRowActionsProps>) {
  const {
    label,
    pending,
    canRenew,
    renewHint,
    canPause,
    pauseHint,
    canResume,
    resumeHint,
    canCancel,
    cancelHint,
    renew,
    pause,
    resume,
    cancel,
  } = useMembershipMutations(membership, actions, companyId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)

  const isPaused = membership.status === "paused"

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
          <DropdownMenuItem onSelect={() => onDetails(membership)}>
            <Eye />
            Details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(membership)}>
            <Edit />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* `title` still helps on the enabled case, but dropdown-menu.tsx sets
              data-[disabled]:pointer-events-none on disabled items, which swallows
              hover entirely — so a disabled item's reason is also rendered as a
              muted second line inside the item, where it stays visible. */}
          <DropdownMenuItem disabled={!canRenew} title={renewHint ?? "Append another billing cycle"} onSelect={() => setRenewOpen(true)}>
            <RotateCw />
            <span className="flex flex-col">
              <span>Renew</span>
              {!canRenew && renewHint && <span className="text-xs text-muted-foreground">{renewHint}</span>}
            </span>
          </DropdownMenuItem>
          {isPaused ? (
            <DropdownMenuItem disabled={!canResume} title={resumeHint ?? "Start billing again"} onSelect={() => setResumeOpen(true)}>
              <Play />
              <span className="flex flex-col">
                <span>Resume</span>
                {!canResume && resumeHint && <span className="text-xs text-muted-foreground">{resumeHint}</span>}
              </span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={!canPause} title={pauseHint ?? "Stop billing for a while"} onSelect={() => setPauseOpen(true)}>
              <Pause />
              <span className="flex flex-col">
                <span>Pause</span>
                {!canPause && pauseHint && <span className="text-xs text-muted-foreground">{pauseHint}</span>}
              </span>
            </DropdownMenuItem>
          )}
          {/* Cancelling stops renewal for good, so it asks first. */}
          <DropdownMenuItem
            variant="destructive"
            disabled={!canCancel}
            title={cancelHint ?? "Stop this membership renewing"}
            onSelect={() => setCancelOpen(true)}
          >
            <Ban />
            <span className="flex flex-col">
              <span>Cancel</span>
              {!canCancel && cancelHint && <span className="text-xs text-muted-foreground">{cancelHint}</span>}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelMembershipAlert
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        label={label}
        pending={pending === "cancel"}
        onConfirm={async () => {
          if (await cancel()) setCancelOpen(false)
        }}
      />

      <RenewMembershipAlert
        open={renewOpen}
        onOpenChange={setRenewOpen}
        label={label}
        pending={pending === "renew"}
        onConfirm={async () => {
          if (await renew()) setRenewOpen(false)
        }}
      />

      {/* Mounted only while open so its fields reset by unmounting rather
          than needing an effect to clear them for the next row. */}
      {pauseOpen && (
        <PauseMembershipDialog
          open={pauseOpen}
          onOpenChange={setPauseOpen}
          pending={pending === "pause"}
          onConfirm={async (fields) => {
            if (await pause(fields)) setPauseOpen(false)
          }}
        />
      )}

      {resumeOpen && (
        <ResumeMembershipAlert
          open={resumeOpen}
          onOpenChange={setResumeOpen}
          label={label}
          pending={pending === "resume"}
          onConfirm={async (fields) => {
            if (await resume(fields)) setResumeOpen(false)
          }}
        />
      )}
    </>
  )
}
