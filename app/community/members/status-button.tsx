"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserCog } from "lucide-react"
import { updateMemberStatusAction } from "./actions"
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
import type { MemberStatusOverride, MemberStatusUpdate } from "@/lib/service/HsService"
import { MEMBER_STATUS_OVERRIDE_OPTIONS } from "./member-status"

interface StatusButtonProps {
  memberId: string
  memberName: string
  statusOverride?: MemberStatusOverride | null
}

export function StatusButton({ memberId, memberName, statusOverride }: Readonly<StatusButtonProps>) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  // No override means the status is derived; "auto" is how the API says that.
  const [choice, setChoice] = useState<MemberStatusUpdate>(statusOverride ?? "auto")

  const onApply = async () => {
    setPending(true)
    try {
      const formData = new FormData()
      formData.set("id", memberId)
      formData.set("status", choice)

      const result = await updateMemberStatusAction({}, formData)
      if (result.success) {
        toast.success(`Status updated for ${memberName}`)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to update status")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Set lifecycle status"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950 dark:border-purple-800"
        >
          <UserCog className="h-4 w-4" />
          <span className="sr-only">Set status</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lifecycle status</AlertDialogTitle>
          <AlertDialogDescription>
            Pin {memberName} to a status, or return them to automatic so it follows their
            membership activity.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 py-2">
          {MEMBER_STATUS_OVERRIDE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3 text-sm"
            >
              <input
                type="radio"
                name="memberStatus"
                value={option.value}
                checked={choice === option.value}
                onChange={() => setChoice(option.value)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                {option.label}
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={onApply} disabled={pending}>
            {pending ? "Saving..." : "Apply"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
