"use server"

import { revalidatePath } from "next/cache"
import { createResource, updateResource, getListResourceTypes } from "@/lib/service"
import type { CreateResourceDto, ResourceTypeDto, UpdateResourceDto } from "@/lib/service/HsService"


type ApiErrorProperty = {
  name?: string
  message?: string
  title?: string
}

type ApiErrorViolation = {
  field?: string
  message?: string
}

type ApiErrorData = {
  detail?: string
  properties?: ApiErrorProperty[]
  violations?: ApiErrorViolation[]
}

function getApiErrorData(error: unknown): ApiErrorData | undefined {
  if (typeof error === "object" && error !== null && "error" in error) {
    return (error as { error?: ApiErrorData }).error
  }
  return undefined
}

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
    const locationId = formData.get("locationId") as string
    const resourceTypeId = formData.get("resourceTypeId") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const capacityStr = formData.get("capacity") as string

    if (!locationId?.trim()) {
      return { 
        success: false,
        error: "Location is required"
      }
    }

    if (!resourceTypeId?.trim()) {
      return { 
        success: false,
        error: "Resource type is required"
      }
    }

    if (!name?.trim()) {
      return { 
        success: false,
        error: "Resource name is required"
      }
    }

    const capacity = Number(capacityStr)
    if (isNaN(capacity) || capacity < 1) {
      return { 
        success: false,
        error: "Capacity must be a number greater than 0"
      }
    }

    const data: CreateResourceDto = {
      locationId: locationId.trim(),
      resourceTypeId: resourceTypeId.trim(),
      name: name.trim(),
      description: description?.trim() || undefined,
      capacity,
    }

    console.log("Creating resource with data:", JSON.stringify(data, null, 2))

    await createResource(data)
    revalidatePath("/space/resources")
    return { success: true }
  } catch (error) {
    console.error("Create resource error:", error)

    let errorMessage = "Failed to create resource"

    if (error instanceof Error) {
      errorMessage = error.message

      const errorData = getApiErrorData(error)
      console.error("API error data:", JSON.stringify(errorData, null, 2))

      if (errorData?.properties && Array.isArray(errorData.properties)) {
        const details = errorData.properties
          .map((p) => `${p.name || 'Field'}: ${p.message || p.title}`)
          .join(", ")
        errorMessage = details || errorData.detail || errorMessage
      } else if (errorData?.violations) {
        const violations = errorData.violations
          .map((v) => `${v.field || 'Field'}: ${v.message}`)
          .join(", ")
        errorMessage = violations || errorMessage
      } else if (errorData?.detail) {
        errorMessage = errorData.detail
      }
    }

    console.error("Error details:", { error, errorMessage })
    return {
      success: false,
      error: errorMessage
    }
  }
}

export async function updateResourceAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    const typeValue = formData.get("type") as string

    if (!id) {
      return { 
        success: false,
        error: "Resource ID is required"
      }
    }

    // Find the resourceTypeId from the type value
    let resourceTypeId: string | undefined
    if (typeValue) {
      const resourceTypes = await getListResourceTypes({
        limit: 100,  // API max limit is 100
        offset: 0,
        sort: "ASC"
      })

      const selectedType = resourceTypes?.results?.find(
        (rt: ResourceTypeDto) => rt.name === typeValue
      )

      if (selectedType) {
        resourceTypeId = selectedType.id
      }
    }

    const data: UpdateResourceDto = {
      name: formData.get("name") as string || undefined,
      description: formData.get("description") as string || undefined,
      capacity: Number(formData.get("capacity")) || undefined,
      resourceTypeId,
    }

    await updateResource(id, data)
    revalidatePath("/space/resources")
    return { success: true }
  } catch (error) {
    console.error("Update resource error:", error)

    let errorMessage = "Failed to update resource"

    if (error instanceof Error) {
      errorMessage = error.message

      const errorData = getApiErrorData(error)
      if (errorData?.violations) {
        const violations = errorData.violations
          .map((v) => `${v.field || 'Field'}: ${v.message}`)
          .join(", ")
        errorMessage = violations || errorMessage
      } else if (errorData?.detail) {
        errorMessage = errorData.detail
      }
    }

    console.error("Error details:", { error, errorMessage })
    return {
      success: false,
      error: errorMessage
    }
  }
}

export async function deleteResourceAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // TODO: Implement deleteResource when API endpoint is available
    revalidatePath("/space/resources")
    return { success: true, error: "Delete not yet implemented" }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete resource" 
    }
  }
}
