"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { inviteMemberAction } from "./actions"
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
import { Input } from "@/components/ui/input"

interface InviteButtonProps {
  memberId: string
  memberName: string
  hasPortalAccess: boolean
}

export function InviteButton({
  memberId,
  memberName,
  hasPortalAccess,
}: Readonly<InviteButtonProps>) {
  const router = useRouter()
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onConfirm = async () => {
    setPending(true)
    try {
      const formData = new FormData()
      formData.append("id", memberId)
      const result = await inviteMemberAction({}, formData)
      if (result?.success && result.invite) {
        setInviteToken(result.invite.inviteToken)
        setExpiresAt(result.invite.inviteExpiresAt)
        toast.success("Invite created")
        router.refresh()
      } else if (result?.error) {
        toast.error(result.error)
      } else {
        toast.error("Failed to invite member")
      }
    } finally {
      setPending(false)
    }
  }

  const onCopy = async () => {
    if (!inviteToken) return
    try {
      await navigator.clipboard.writeText(inviteToken)
      toast.success("Invite token copied")
    } catch {
      toast.error("Could not copy token")
    }
  }

  if (hasPortalAccess) {
    return null
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          setInviteToken(null)
          setExpiresAt(null)
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950 dark:border-emerald-800"
        >
          <Mail className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {inviteToken ? "Invite token ready" : `Invite ${memberName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {inviteToken
              ? "Share this single-use token with the member so they can claim portal access."
              : "Create a single-use invite token for this member. Deliver it out-of-band (email or WhatsApp)."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {inviteToken ? (
          <div className="space-y-3">
            <Input readOnly value={inviteToken} />
            {expiresAt && (
              <p className="text-sm text-muted-foreground">
                Expires {new Date(expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>{inviteToken ? "Close" : "Cancel"}</AlertDialogCancel>
          {inviteToken ? (
            <Button onClick={onCopy}>Copy token</Button>
          ) : (
            <Button onClick={onConfirm} disabled={pending}>
              {pending ? "Creating..." : "Create invite"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
