"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteResourceTypeAction } from "./actions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface DeleteButtonProps {
  resourceTypeId: string
  resourceTypeName: string
}

export function DeleteButton({ resourceTypeId, resourceTypeName }: Readonly<DeleteButtonProps>) {
  const onConfirm = async () => {
    const formData = new FormData()
    formData.append("id", resourceTypeId)
    const result = await deleteResourceTypeAction({}, formData)
    if (result?.success) {
      toast.success("Resource type deleted")
    } else if (result?.error) {
      toast.error(result.error)
    } else {
      toast.error("Failed to delete resource type")
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete resource type</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{resourceTypeName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

