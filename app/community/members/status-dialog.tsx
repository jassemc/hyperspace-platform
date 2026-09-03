"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import type { MemberDto, MemberStatusUpdate } from "@/lib/service/HsService"
import { MEMBER_STATUS_OVERRIDE_OPTIONS } from "./member-status"

interface StatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberDto
  pending: boolean
  onApply: (choice: MemberStatusUpdate) => void
}

export function StatusDialog({ open, onOpenChange, member, pending, onApply }: Readonly<StatusDialogProps>) {
  // No override means the status is derived; "auto" is how the API says that.
  const [choice, setChoice] = useState<MemberStatusUpdate>(member.statusOverride ?? "auto")
  useEffect(() => {
    if (open) setChoice(member.statusOverride ?? "auto")
  }, [open, member.statusOverride])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lifecycle status</AlertDialogTitle>
          <AlertDialogDescription>
            Pin {member.fullName} to a status, or return them to automatic so it follows their
            membership activity.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 py-2">
          {MEMBER_STATUS_OVERRIDE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3 text-sm"
            >
              <input
                type="radio"
                name="memberStatus"
                value={option.value}
                checked={choice === option.value}
                onChange={() => setChoice(option.value)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                {option.label}
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={() => onApply(choice)} disabled={pending}>
            {pending ? "Saving..." : "Apply"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
