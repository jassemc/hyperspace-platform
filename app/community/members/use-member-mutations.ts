"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { MemberDto, MemberStatusUpdate } from "@/lib/service/HsService"
import type { ActionState } from "@/lib/action-state"
import { updateMemberStatusAction } from "./actions"

export type MemberMutationKind = "status"

function messageFor(result: ActionState, fallback: string): string {
  if (result.problemType === "member_not_found") return "This member no longer exists."
  return result.error ?? fallback
}

/**
 * The one non-form mutation a member has, shared by the row menu and the
 * details dialog so the two cannot drift. Returns whether it succeeded so the
 * caller can close what it had open.
 */
export function useMemberMutations(member: MemberDto) {
  const router = useRouter()
  const [pending, setPending] = useState<MemberMutationKind | null>(null)
  const label = member.fullName || "This member"

  const setStatus = async (choice: MemberStatusUpdate): Promise<boolean> => {
    setPending("status")
    try {
      const formData = new FormData()
      formData.set("id", member.id)
      formData.set("status", choice)
      const result = await updateMemberStatusAction({}, formData)
      if (result.success) {
        toast.success(`Status updated for ${label}`)
        router.refresh()
        return true
      }
      toast.error(messageFor(result, "Failed to update status"))
      return false
    } finally {
      setPending(null)
    }
  }

  return { label, pending, setStatus }
}
