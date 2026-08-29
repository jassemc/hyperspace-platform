"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Ban, RefreshCw } from "lucide-react"
import { cancelCompanyMembershipAction as cancelMembershipAction, renewCompanyMembershipAction as renewMembershipAction } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface MembershipActionProps {
  membershipId: string
  planName: string
  companyId: string
}

export function RenewMembershipButton({
  membershipId,
  planName,
  companyId,
}: Readonly<MembershipActionProps>) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const onConfirm = async () => {
    setIsPending(true)
    try {
      const formData = new FormData()
      formData.append("id", membershipId)
      formData.append("companyId", companyId)
      const result = await renewMembershipAction({}, formData)

      if (result.success) {
        toast.success("Membership renewed")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to renew membership")
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950 dark:border-emerald-800"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Renew membership</AlertDialogTitle>
          <AlertDialogDescription>
            Start a new cycle for &quot;{planName}&quot;? The plan terms frozen on this membership
            are carried over.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Renewing..." : "Renew"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function CancelMembershipButton({
  membershipId,
  planName,
  companyId,
  isCancelled,
}: Readonly<MembershipActionProps & { isCancelled: boolean }>) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const onConfirm = async () => {
    setIsPending(true)
    try {
      const formData = new FormData()
      formData.append("id", membershipId)
      formData.append("companyId", companyId)
      const result = await cancelMembershipAction({}, formData)

      if (result.success) {
        toast.success("Membership cancelled")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to cancel membership")
      }
    } finally {
      setIsPending(false)
    }
  }

  if (isCancelled) {
    return null
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-800"
        >
          <Ban className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel membership</AlertDialogTitle>
          <AlertDialogDescription>
            Cancel &quot;{planName}&quot; for this company? Cancellation follows the notice period
            frozen on the membership, so it may stay active until the end of the current cycle.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Cancelling..." : "Cancel membership"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
