"use server"

import { revalidatePath } from "next/cache"
import { MEMBER_ROUTE_PATTERN } from "@/app/community/members/[id]/member-route"
import { COMPANY_ROUTE_PATTERN } from "@/app/community/companies/[id]/company-route"
import { createAssignment, endAssignment, relocateAssignment } from "@/lib/service"
import type { CreateAssignmentDto } from "@/lib/service/HsService"
import { type ActionState, problem, text } from "@/lib/action-state"

/**
 * Assignments surface inside the membership and resource dialogs, and a
 * resource's derived status moves with them, so every page that renders
 * either list refreshes.
 */
function revalidate() {
  revalidatePath("/community/memberships")
  revalidatePath("/space/resources")
  revalidatePath(MEMBER_ROUTE_PATTERN, "page")
  revalidatePath(COMPANY_ROUTE_PATTERN, "page")
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
    return problem(error, "Failed to create assignment")
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
    return problem(error, "Failed to end assignment")
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
    return problem(error, "Failed to relocate assignment")
  }
}
