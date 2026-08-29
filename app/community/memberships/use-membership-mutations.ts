"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { MembershipDto } from "@/lib/service/HsService"
import type { ActionState } from "@/lib/action-state"
import { cancelMembershipAction, pauseMembershipAction, renewMembershipAction, resumeMembershipAction } from "./actions"

export type MembershipMutationKind = "cancel" | "renew" | "pause" | "resume"
export type PauseFields = { startsAt: string; endsAt?: string; reason?: string }
export type ResumeFields = { endsAt?: string }
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>
export type MembershipActions = { cancel: Action; renew: Action; pause: Action; resume: Action }

const DEFAULT_ACTIONS: MembershipActions = {
  cancel: cancelMembershipAction, renew: renewMembershipAction,
  pause: pauseMembershipAction, resume: resumeMembershipAction,
}

/** Mirrors the API's rules so the menu is disabled with a reason instead of a 409. */
export function cancelBlocker(m: MembershipDto): string | null {
  if (m.cancelledAt) return "Already cancelled"
  if (m.status === "ended") return "Ended memberships cannot be cancelled"
  return null
}
export function renewBlocker(m: MembershipDto): string | null {
  if (m.cancelledAt) return "A cancelled membership cannot be renewed"
  return null
}
export function pauseBlocker(m: MembershipDto): string | null {
  if (m.status !== "active") return "Only an active membership can be paused"
  return null
}
export function resumeBlocker(m: MembershipDto): string | null {
  if (m.status !== "paused") return "Only a paused membership can be resumed"
  return null
}

function messageFor(result: ActionState, fallback: string): string {
  switch (result.problemType) {
    case "membership_already_cancelled": return "This membership is already cancelled."
    case "membership_not_recurring": return "Only a recurring membership can be renewed."
    case "membership_end_reached": return "This membership has reached its end date and cannot be renewed."
    case "membership_cancelled": return "A cancelled membership cannot be renewed."
    case "membership_not_pausable": return "Only an active membership can be paused."
    case "pause_outside_membership": return "The pause must fall inside the membership's term."
    case "pause_end_before_start": return "The pause ends before it starts."
    case "pause_overlap": return "That pause overlaps an existing one."
    case "membership_not_paused": return "Only a paused membership can be resumed."
    default: return result.error ?? fallback
  }
}

/**
 * Cancel / renew / pause / resume for one membership, shared by the row
 * menu (Task 8) and the company page's plans tab so the two cannot drift.
 * Resolves to true on success so a caller can close whatever it had open.
 *
 * @param actions Override for the four server actions — the company page
 * passes its `*CompanyMembershipAction` wrappers (Task 12) instead of the
 * bare ones so a company-scoped list revalidates correctly.
 * @param revalidateCompanyId The company page passes its own id so
 * member-held memberships still refresh the page the user is looking at.
 */
export function useMembershipMutations(
  membership: MembershipDto,
  actions: MembershipActions = DEFAULT_ACTIONS,
  revalidateCompanyId?: string
) {
  const router = useRouter()
  const [pending, setPending] = useState<MembershipMutationKind | null>(null)
  const label = membership.name || "This membership"

  const run = async (kind: MembershipMutationKind, action: Action, done: string, failed: string, fields: Record<string, string> = {}): Promise<boolean> => {
    setPending(kind)
    try {
      const formData = new FormData()
      formData.set("id", membership.id)
      // The company page's wrappers revalidate by this; harmless elsewhere.
      const companyId = revalidateCompanyId ?? membership.companyId ?? ""
      if (companyId) formData.set("companyId", companyId)
      for (const [k, v] of Object.entries(fields)) if (v) formData.set(k, v)
      const result = await action({}, formData)
      if (result.success) { toast.success(`${label} ${done}`); router.refresh(); return true }
      toast.error(messageFor(result, failed))
      return false
    } finally {
      setPending(null)
    }
  }

  const cancelHint = cancelBlocker(membership)
  const renewHint = renewBlocker(membership)
  const pauseHint = pauseBlocker(membership)
  const resumeHint = resumeBlocker(membership)

  return {
    label, pending,
    canCancel: cancelHint === null, cancelHint: cancelHint ?? undefined,
    canRenew: renewHint === null, renewHint: renewHint ?? undefined,
    canPause: pauseHint === null, pauseHint: pauseHint ?? undefined,
    canResume: resumeHint === null, resumeHint: resumeHint ?? undefined,
    cancel: () => run("cancel", actions.cancel, "cancelled", "Failed to cancel membership"),
    renew: () => run("renew", actions.renew, "renewed", "Failed to renew membership"),
    pause: (f: PauseFields) => run("pause", actions.pause, "paused", "Failed to pause membership", { startsAt: f.startsAt, endsAt: f.endsAt ?? "", reason: f.reason ?? "" }),
    resume: (f: ResumeFields) => run("resume", actions.resume, "resumed", "Failed to resume membership", { endsAt: f.endsAt ?? "" }),
  }
}
