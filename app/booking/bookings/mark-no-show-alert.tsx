"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/**
 * A no-show is a one-way status (the API has no route back to confirmed),
 * so it asks first.
 */
export function MarkNoShowAlert({
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
  onConfirm: () => void
}>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark as a no-show?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} will be recorded as a no-show. Billing and credits are not affected, and
            this cannot be undone from here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
          <Button disabled={pending} onClick={onConfirm}>
            {pending ? "Marking..." : "Mark as no-show"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
