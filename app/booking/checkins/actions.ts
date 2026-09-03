"use server"

import { revalidatePath } from "next/cache"
import { MEMBER_ROUTE_PATTERN } from "@/app/community/members/[id]/member-route"
import { checkIn, checkOut } from "@/lib/service"
import type { CreateCheckinDto } from "@/lib/service/HsService"

type ForceKind = NonNullable<CreateCheckinDto["force"]>
const FORCE_KINDS: ForceKind[] = ["visitor", "trial"]

export type ActionState = {
  success?: boolean
  error?: string
}

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/**
 * An ISO instant the form already converted from the user's local time —
 * a bare `datetime-local` value parsed here would take the server's zone.
 */
function instant(formData: FormData, field: string): string | undefined {
  const raw = text(formData, field)
  if (!raw) return undefined
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export async function checkInAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const memberId = text(formData, "memberId")
    if (!memberId) return { success: false, error: "Select a member" }

    const force = text(formData, "force")

    const data: CreateCheckinDto = {
      memberId,
      // Optional when exactly one active location exists.
      locationId: text(formData, "locationId"),
      // Staff may record a past visit: from is the visit's own instant,
      // to closes it in the same call.
      checkedInAt: instant(formData, "checkedInAt"),
      checkedOutAt: instant(formData, "checkedOutAt"),
      // Staff-only override recording a visitor or trial visit with no
      // entitlement or credit behind it.
      force: FORCE_KINDS.includes(force as ForceKind) ? (force as ForceKind) : undefined,
    }

    await checkIn(data)
    revalidatePath("/booking/checkins")
    revalidatePath(MEMBER_ROUTE_PATTERN, "page")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check in",
    }
  }
}

export async function checkOutAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Check-in ID is required" }

    await checkOut(id)
    revalidatePath("/booking/checkins")
    revalidatePath(MEMBER_ROUTE_PATTERN, "page")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check out",
    }
  }
}
