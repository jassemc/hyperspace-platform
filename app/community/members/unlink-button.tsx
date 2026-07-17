"use client"

import { Button } from "@/components/ui/button"
import { Unlink } from "lucide-react"
import { unlinkMemberAction } from "./actions"
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
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface UnlinkButtonProps {
  memberId: string
  memberName: string
  hasPortalAccess: boolean
}

export function UnlinkButton({
  memberId,
  memberName,
  hasPortalAccess,
}: Readonly<UnlinkButtonProps>) {
  const router = useRouter()

  if (!hasPortalAccess) {
    return null
  }

  const onConfirm = async () => {
    const formData = new FormData()
    formData.append("id", memberId)
    const result = await unlinkMemberAction({}, formData)
    if (result?.success) {
      toast.success("Portal access revoked")
      router.refresh()
    } else if (result?.error) {
      toast.error(result.error)
    } else {
      toast.error("Failed to revoke portal access")
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
          <Unlink className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke portal access</AlertDialogTitle>
          <AlertDialogDescription>
            Remove portal access for &quot;{memberName}&quot;? The CRM record stays; they will need a
            new invite to reclaim access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Revoke access</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
