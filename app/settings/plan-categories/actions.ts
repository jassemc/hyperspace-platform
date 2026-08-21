"use server"

import { revalidatePath } from "next/cache"
import { createPlanCategory, updatePlanCategory } from "@/lib/service"
import type { CreatePlanCategoryDto, UpdatePlanCategoryDto } from "@/lib/service/HsService"

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

/** The slug is a stable machine identifier, so it is normalised to snake_case. */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function revalidate() {
  revalidatePath("/settings/plan-categories")
  revalidatePath("/space/plan")
}

export async function createPlanCategoryAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = text(formData, "name")
    if (!name) return { success: false, error: "Category name is required" }

    // Derived from the name when left blank.
    const slug = toSlug(text(formData, "slug") ?? name)
    if (!slug) return { success: false, error: "Slug could not be derived from the name" }

    const data: CreatePlanCategoryDto = {
      name,
      slug,
      description: text(formData, "description"),
      sortOrder: num(formData, "sortOrder"),
    }

    await createPlanCategory(data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create plan category",
    }
  }
}

export async function updatePlanCategoryAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Category ID is required" }

    const slug = text(formData, "slug")

    const data: UpdatePlanCategoryDto = {
      name: text(formData, "name"),
      slug: slug ? toSlug(slug) : undefined,
      description: text(formData, "description"),
      sortOrder: num(formData, "sortOrder"),
    }

    await updatePlanCategory(id, data)
    revalidate()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update plan category",
    }
  }
}
