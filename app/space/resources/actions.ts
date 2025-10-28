"use server"

import { revalidatePath } from "next/cache"
import { addResource, updateResource, deleteResource } from "@/lib/service"
import type { CreateResourceDto, UpdateResourceDto } from "@/lib/service/HsService"

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createResourceAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: CreateResourceDto = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      capacity: Number(formData.get("capacity")),
      status: formData.get("status") as CreateResourceDto["status"],
      amenities: [],
    }

    await addResource(data)
    revalidatePath("/space/resources")
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create resource" 
    }
  }
}

export async function updateResourceAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    const data: UpdateResourceDto = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      capacity: Number(formData.get("capacity")),
      status: formData.get("status") as UpdateResourceDto["status"],
      amenities: [],
    }

    await updateResource(id, data)
    revalidatePath("/space/resources")
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update resource" 
    }
  }
}

export async function deleteResourceAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    await deleteResource(id)
    revalidatePath("/space/resources")
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete resource" 
    }
  }
}
