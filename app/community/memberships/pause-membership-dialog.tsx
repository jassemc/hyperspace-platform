"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateField } from "@/components/ui/date-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PauseFields } from "./use-membership-mutations"

/** Today, as a business date (YYYY-MM-DD) — the pause's default start. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Pausing collects a span rather than a single flag, so it is a full dialog
 * (not an alert). The three fields reset whenever it opens so a previous
 * pause's choices never leak into the next one.
 */
export function PauseMembershipDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: (fields: PauseFields) => void
}>) {
  const [startsAt, setStartsAt] = useState(today)
  const [endsAt, setEndsAt] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (open) {
      setStartsAt(today())
      setEndsAt("")
      setReason("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause this membership?</DialogTitle>
          <DialogDescription>
            Billing stops for the pause. Leave the end blank for an open-ended pause.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="pauseStartsAt">Starts</Label>
          {/* Already inside a modal layer, so the calendar renders in
              place rather than through a portal. */}
          <DateField
            id="pauseStartsAt"
            name="startsAt"
            value={startsAt}
            onChange={setStartsAt}
            required
            portalled={false}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pauseEndsAt">Ends</Label>
          <DateField
            id="pauseEndsAt"
            name="endsAt"
            value={endsAt}
            onChange={setEndsAt}
            min={startsAt}
            placeholder="Open-ended"
            clearable
            portalled={false}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pauseReason">Reason (optional)</Label>
          <Input
            id="pauseReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why the membership is pausing"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || !startsAt}
            onClick={() => onConfirm({ startsAt, endsAt, reason })}
          >
            {pending ? "Pausing..." : "Pause"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
