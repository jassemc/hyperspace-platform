"use server"

import { revalidatePath } from "next/cache"
import { createResource, updateResource } from "@/lib/service"
import type { AvailabilityPeriodDto, CreateResourceDto, UpdateResourceDto } from "@/lib/service/HsService"


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

function idList(formData: FormData, field: string): string[] {
  return formData
    .getAll(field)
    .map((value) => String(value).trim())
    .filter(Boolean)
}

/**
 * Availability rows are submitted as index-aligned start/end pairs. An empty
 * start drops the row; an empty end means "indefinite".
 */
function availabilityPeriods(formData: FormData): AvailabilityPeriodDto[] {
  const starts = formData.getAll("availabilityStart").map((value) => String(value))
  const ends = formData.getAll("availabilityEnd").map((value) => String(value))

  return starts.reduce<AvailabilityPeriodDto[]>((periods, start, index) => {
    if (!start.trim()) return periods
    const end = ends[index]?.trim()
    periods.push({
      startDate: new Date(start).toISOString(),
      endDate: end ? new Date(end).toISOString() : null,
    })
    return periods
  }, [])
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
      amenityIds: idList(formData, "amenityIds"),
      rateIds: idList(formData, "rateIds"),
      availability: availabilityPeriods(formData),
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

    if (!id) {
      return {
        success: false,
        error: "Resource ID is required"
      }
    }

    const resourceTypeId = (formData.get("resourceTypeId") as string)?.trim() || undefined
    const locationId = (formData.get("locationId") as string)?.trim() || undefined

    const data: UpdateResourceDto = {
      name: formData.get("name") as string || undefined,
      description: formData.get("description") as string || undefined,
      capacity: Number(formData.get("capacity")) || undefined,
      resourceTypeId,
      locationId,
      // Full-replace semantics: what the form submits becomes the new set.
      amenityIds: idList(formData, "amenityIds"),
      rateIds: idList(formData, "rateIds"),
      availability: availabilityPeriods(formData),
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

/**
 * The API exposes no DELETE for resources, so retiring one is a soft delete:
 * `active: false` takes it out of circulation and can be reversed. See
 * docs/backend-api-issues.md if a hard delete is added later.
 */
export async function setResourceActiveAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    if (!id) {
      return { success: false, error: "Resource ID is required" }
    }

    const active = formData.get("active") === "true"

    await updateResource(id, { active })
    revalidatePath("/space/resources")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update the resource",
    }
  }
}
