"use server"

import { revalidatePath } from "next/cache"
import { addResourceType, updateResourceType, deleteResourceType } from "@/lib/service"
import type { CreateResourceTypeDto, UpdateResourceTypeDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createResourceTypeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: CreateResourceTypeDto = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      type: formData.get("type") as string,
      icon: formData.get("icon") as string,
      bookingMode: formData.get("bookingMode") as CreateResourceTypeDto["bookingMode"],
      canBook: formData.get("canBook") === "true",
      canAssign: formData.get("canAssign") === "true",
    }

    await addResourceType(data)
    revalidatePath("/space/resource-types")
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create resource type" 
    }
  }
}

export async function updateResourceTypeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    const data: UpdateResourceTypeDto = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      type: formData.get("type") as string,
      icon: formData.get("icon") as string,
      bookingMode: formData.get("bookingMode") as UpdateResourceTypeDto["bookingMode"],
      canBook: formData.get("canBook") === "true",
      canAssign: formData.get("canAssign") === "true",
    }

    await updateResourceType(id, data)
    revalidatePath("/space/resource-types")
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update resource type" 
    }
  }
}

export async function deleteResourceTypeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    await deleteResourceType(id)
    revalidatePath("/space/resource-types")
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete resource type" 
    }
  }
}

