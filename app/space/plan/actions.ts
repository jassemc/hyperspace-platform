"use server"

import { revalidatePath } from "next/cache"
import { createPlan, updatePlan } from "@/lib/service"
import type { CreatePlanDto, PlanKind, UpdatePlanDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
}

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function num(formData: FormData, field: string): number | undefined {
  const raw = text(formData, field)
  if (raw === undefined) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function extraIds(formData: FormData): string[] {
  return formData
    .getAll("extraIds")
    .map((value) => String(value).trim())
    .filter(Boolean)
}

/**
 * `cycleMonths` is required for recurring plans and forbidden for one-off ones,
 * so it is dropped rather than sent as 0 when the kind is one_off.
 */
function planFields(formData: FormData, kind: PlanKind | undefined) {
  return {
    name: text(formData, "name"),
    code: text(formData, "code"),
    kind,
    cycleMonths: kind === "one_off" ? undefined : num(formData, "cycleMonths"),
    priceHt: num(formData, "priceHt"),
    vatRate: num(formData, "vatRate"),
    deposit: num(formData, "deposit"),
    cancellationDays: num(formData, "cancellationDays"),
    hidden: formData.get("hidden") === "on",
    description: text(formData, "description"),
    extraIds: extraIds(formData),
  }
}

export async function createPlanAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const kind = text(formData, "kind") as PlanKind | undefined
    const fields = planFields(formData, kind)

    if (!fields.name) return { success: false, error: "Plan name is required" }
    if (!kind) return { success: false, error: "Plan kind is required" }
    if (fields.priceHt === undefined || fields.priceHt < 0) {
      return { success: false, error: "Price must be a number of 0 or more" }
    }
    if (kind === "recurring" && fields.cycleMonths === undefined) {
      return { success: false, error: "Cycle months is required for recurring plans" }
    }

    const data: CreatePlanDto = {
      ...fields,
      name: fields.name,
      kind,
      priceHt: fields.priceHt,
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
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Plan ID is required" }

    const kind = text(formData, "kind") as PlanKind | undefined
    if (kind === "recurring" && num(formData, "cycleMonths") === undefined) {
      return { success: false, error: "Cycle months is required for recurring plans" }
    }

    const data: UpdatePlanDto = planFields(formData, kind)

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
