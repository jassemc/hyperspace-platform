"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteResourceAction } from "./actions"

interface DeleteButtonProps {
  resourceId: string
  resourceName: string
}

export function DeleteButton({ resourceId, resourceName }: Readonly<DeleteButtonProps>) {
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${resourceName}"?`)) {
      const formData = new FormData()
      formData.append("id", resourceId)
      await deleteResourceAction({}, formData)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
