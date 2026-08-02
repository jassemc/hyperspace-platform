"use server"

import { revalidatePath } from "next/cache"
import { createPlan, updatePlan } from "@/lib/service"
import type { CreatePlanDto, UpdatePlanDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
}

export async function createPlanAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: CreatePlanDto = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string) || undefined,
      kind: formData.get("kind") as CreatePlanDto["kind"],
      cycleMonths: formData.get("cycleMonths") ? Number(formData.get("cycleMonths")) : undefined,
      priceHtMillimes: Number(formData.get("priceHtMillimes")),
      vatRateBp: formData.get("vatRateBp") ? Number(formData.get("vatRateBp")) : undefined,
      depositMillimes: formData.get("depositMillimes") ? Number(formData.get("depositMillimes")) : undefined,
      cancellationDays: formData.get("cancellationDays") ? Number(formData.get("cancellationDays")) : undefined,
      hidden: formData.get("hidden") === "on",
      description: (formData.get("description") as string) || undefined,
    }

    await createPlan(data)
    revalidatePath("/space/plan")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create plan",
    }
  }
}

export async function updatePlanAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    const data: UpdatePlanDto = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string) || undefined,
      kind: formData.get("kind") as UpdatePlanDto["kind"],
      cycleMonths: formData.get("cycleMonths") ? Number(formData.get("cycleMonths")) : undefined,
      priceHtMillimes: Number(formData.get("priceHtMillimes")),
      vatRateBp: formData.get("vatRateBp") ? Number(formData.get("vatRateBp")) : undefined,
      depositMillimes: formData.get("depositMillimes") ? Number(formData.get("depositMillimes")) : undefined,
      cancellationDays: formData.get("cancellationDays") ? Number(formData.get("cancellationDays")) : undefined,
      hidden: formData.get("hidden") === "on",
      description: (formData.get("description") as string) || undefined,
    }

    await updatePlan(id, data)
    revalidatePath("/space/plan")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update plan",
    }
  }
}
