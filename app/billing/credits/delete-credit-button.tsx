"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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
import { deleteCreditAction } from "./actions"

interface DeleteCreditButtonProps {
  creditId: string
  creditLabel: string
}

export function DeleteCreditButton({ creditId, creditLabel }: Readonly<DeleteCreditButtonProps>) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const onDelete = async () => {
    setPending(true)
    try {
      const formData = new FormData()
      formData.set("id", creditId)
      const result = await deleteCreditAction({}, formData)
      if (result.success) {
        toast.success("Credit deleted")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to delete credit")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Delete credit"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this credit?</AlertDialogTitle>
          <AlertDialogDescription>
            {creditLabel} will be removed and the balance recalculated. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={onDelete}>
            {pending ? "Deleting..." : "Delete credit"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
