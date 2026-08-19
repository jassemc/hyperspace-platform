"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RotateCw, Ban } from "lucide-react"
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
import { cancelMembershipAction, renewMembershipAction } from "./actions"

interface LifecycleButtonsProps {
  membershipId: string
  membershipName: string
  canCancel: boolean
}

export function LifecycleButtons({ membershipId, membershipName, canCancel }: Readonly<LifecycleButtonsProps>) {
  const router = useRouter()
  const [pending, setPending] = useState<"renew" | "cancel" | null>(null)

  const run = async (
    kind: "renew" | "cancel",
    action: typeof renewMembershipAction,
    successMessage: string
  ) => {
    setPending(kind)
    try {
      const formData = new FormData()
      formData.set("id", membershipId)
      const result = await action({}, formData)
      if (result.success) {
        toast.success(successMessage)
        router.refresh()
      } else {
        toast.error(result.error ?? "Action failed")
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        title="Renew for another cycle"
        disabled={pending !== null}
        onClick={() => run("renew", renewMembershipAction, `${membershipName} renewed`)}
        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950 dark:border-green-800"
      >
        <RotateCw className="h-4 w-4" />
        <span className="sr-only">Renew</span>
      </Button>

      {/* Cancelling is not reversible from here, so it asks first. */}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              title="Cancel membership"
              disabled={pending !== null}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
            >
              <Ban className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this membership?</AlertDialogTitle>
              <AlertDialogDescription>
                {membershipName} will stop renewing. Charges already raised are not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending !== null}>Keep it</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={pending !== null}
                onClick={() => run("cancel", cancelMembershipAction, `${membershipName} cancelled`)}
              >
                {pending === "cancel" ? "Cancelling..." : "Cancel membership"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
