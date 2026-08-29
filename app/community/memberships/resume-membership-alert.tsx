"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DateField } from "@/components/ui/date-field"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ResumeFields } from "./use-membership-mutations"

/** Resuming restarts billing; the only choice worth asking is when the pause actually ends. */
export function ResumeMembershipAlert({
  open,
  onOpenChange,
  label,
  pending,
  onConfirm,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  pending: boolean
  onConfirm: (fields: ResumeFields) => void
}>) {
  const [endsAt, setEndsAt] = useState("")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume this membership?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} starts billing again. Leave the date blank to end the pause today.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="resumeEndsAt">Pause ends</Label>
          {/* In a modal layer already, so the calendar renders in place —
              a portalled popover would sit behind the alert's overlay. */}
          <DateField
            id="resumeEndsAt"
            name="endsAt"
            value={endsAt}
            onChange={setEndsAt}
            placeholder="Today"
            clearable
            portalled={false}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button disabled={pending} onClick={() => onConfirm({ endsAt: endsAt || undefined })}>
            {pending ? "Resuming..." : "Resume"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
