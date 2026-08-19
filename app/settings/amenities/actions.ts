"use server"

import { revalidatePath } from "next/cache"
import { createAmenity, updateAmenity } from "@/lib/service"
import type { CreateAmenityDto, UpdateAmenityDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
}

function text(formData: FormData, field: string): string | undefined {
  const value = formData.get(field)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/** The slug is a stable machine identifier, so it is normalised to snake_case. */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export async function createAmenityAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = text(formData, "name")
    if (!name) return { success: false, error: "Amenity name is required" }

    // Fall back to deriving the slug from the name when it is left blank.
    const slug = toSlug(text(formData, "slug") ?? name)
    if (!slug) return { success: false, error: "Slug could not be derived from the name" }

    const data: CreateAmenityDto = {
      name,
      slug,
      icon: text(formData, "icon"),
    }

    await createAmenity(data)
    revalidatePath("/settings/amenities")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create amenity",
    }
  }
}

export async function updateAmenityAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Amenity ID is required" }

    const slug = text(formData, "slug")

    const data: UpdateAmenityDto = {
      name: text(formData, "name"),
      slug: slug ? toSlug(slug) : undefined,
      icon: text(formData, "icon"),
    }

    await updateAmenity(id, data)
    revalidatePath("/settings/amenities")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update amenity",
    }
  }
}
