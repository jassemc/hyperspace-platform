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

/** Cancelling stops renewal for good, so it asks first. */
export function CancelMembershipAlert({
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
          <AlertDialogTitle>Cancel this membership?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} will stop renewing. Charges already raised are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Cancelling..." : "Cancel membership"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
