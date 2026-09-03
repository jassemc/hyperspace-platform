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

export function ArchiveResourceAlert({
  open,
  onOpenChange,
  resourceName,
  pending,
  onConfirm,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceName: string
  pending: boolean
  onConfirm: () => void
}>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive &quot;{resourceName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            It stops being bookable and drops out of the active list. You can restore it later —
            the API has no permanent delete for resources.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Archiving..." : "Archive"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
