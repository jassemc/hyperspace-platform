"use server"

import { revalidatePath } from "next/cache"
import { createAssignment, endAssignment, relocateAssignment } from "@/lib/service"
import type { CreateAssignmentDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
}

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function revalidate() {
  revalidatePath("/booking/assignments")
  revalidatePath("/space/resources")
}

export async function createAssignmentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const resourceId = text(formData, "resourceId")
    const membershipId = text(formData, "membershipId")
    const startsAt = text(formData, "startsAt")

    if (!resourceId) return { success: false, error: "Select a resource" }
    if (!membershipId) return { success: false, error: "Select a membership" }
    if (!startsAt) return { success: false, error: "Start date is required" }

    const data: CreateAssignmentDto = {
      resourceId,
      membershipId,
      startsAt,
      // Omitted for an open-ended assignment.
      endsAt: text(formData, "endsAt"),
      notes: text(formData, "notes"),
    }

    await createAssignment(data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create assignment",
    }
  }
}

/** `endsAt` is exclusive — the assignment's last active day is the day before. */
export async function endAssignmentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    const endsAt = text(formData, "endsAt")

    if (!id) return { success: false, error: "Assignment ID is required" }
    if (!endsAt) return { success: false, error: "An end date is required" }

    await endAssignment(id, { endsAt })
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to end assignment",
    }
  }
}

/** Closes the current assignment and opens one on the destination resource. */
export async function relocateAssignmentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    const resourceId = text(formData, "resourceId")
    const effectiveDate = text(formData, "effectiveDate")

    if (!id) return { success: false, error: "Assignment ID is required" }
    if (!resourceId) return { success: false, error: "Select a destination resource" }
    if (!effectiveDate) return { success: false, error: "An effective date is required" }

    await relocateAssignment(id, { resourceId, effectiveDate })
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to relocate assignment",
    }
  }
}
