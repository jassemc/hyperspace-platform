"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Archive, ArchiveRestore } from "lucide-react"
import { setResourceActiveAction } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface ArchiveButtonProps {
  resourceId: string
  resourceName: string
  active: boolean
}

/**
 * Stands in for a delete action: the API has no DELETE for resources, so this
 * flips `active` instead. Unlike a delete it is reversible, hence the restore
 * path when the resource is already inactive.
 */
export function ArchiveButton({ resourceId, resourceName, active }: Readonly<ArchiveButtonProps>) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const apply = async (nextActive: boolean) => {
    setPending(true)
    try {
      const formData = new FormData()
      formData.set("id", resourceId)
      formData.set("active", String(nextActive))

      const result = await setResourceActiveAction({}, formData)
      if (result.success) {
        toast.success(nextActive ? `${resourceName} restored` : `${resourceName} archived`)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to update the resource")
      }
    } finally {
      setPending(false)
    }
  }

  // Restoring is harmless, so it goes straight through without a dialog.
  if (!active) {
    return (
      <Button
        variant="outline"
        size="sm"
        title="Restore resource"
        disabled={pending}
        onClick={() => apply(true)}
        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950 dark:border-green-800"
      >
        <ArchiveRestore className="h-4 w-4" />
        <span className="sr-only">Restore</span>
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Archive resource"
          disabled={pending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
        >
          <Archive className="h-4 w-4" />
          <span className="sr-only">Archive</span>
        </Button>
      </AlertDialogTrigger>
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
          <Button variant="destructive" disabled={pending} onClick={() => apply(false)}>
            {pending ? "Archiving..." : "Archive"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
