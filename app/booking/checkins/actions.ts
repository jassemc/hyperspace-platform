"use server"

import { revalidatePath } from "next/cache"
import { checkIn } from "@/lib/service"
import { checkOut } from "@/lib/service-supplement"
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
      // Staff-only override recording a visitor or trial visit with no
      // entitlement or credit behind it.
      force: FORCE_KINDS.includes(force as ForceKind) ? (force as ForceKind) : undefined,
    }

    await checkIn(data)
    revalidatePath("/booking/checkins")
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
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check out",
    }
  }
}
