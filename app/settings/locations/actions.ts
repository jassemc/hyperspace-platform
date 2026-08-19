"use server"

import { revalidatePath } from "next/cache"
import { createLocation, updateLocation } from "@/lib/service"
import type {
  AddressDto,
  ClosedDayDto,
  CreateLocationDto,
  UpdateLocationDto,
  WeeklyOpeningHoursDto,
} from "@/lib/service/HsService"
import { WEEK_DAYS } from "./location-meta"

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

/** Omitted entirely when every part is blank, so an empty form sends no address. */
function address(formData: FormData): AddressDto | undefined {
  const value: AddressDto = {
    country: text(formData, "country"),
    state: text(formData, "state"),
    city: text(formData, "city"),
    street: text(formData, "street"),
    zip: text(formData, "zip"),
    formattedAddress: text(formData, "formattedAddress"),
    latitude: num(formData, "latitude"),
    longitude: num(formData, "longitude"),
  }

  return Object.values(value).some((part) => part !== undefined) ? value : undefined
}

/**
 * One open/close window per day. The schema allows several windows per day
 * (split shifts); this form covers the single-window case and a day left blank
 * is closed.
 */
function openingHours(formData: FormData): WeeklyOpeningHoursDto | undefined {
  const hours: WeeklyOpeningHoursDto = {}
  let hasAny = false

  for (const day of WEEK_DAYS) {
    const open = text(formData, `${day}Open`)
    const close = text(formData, `${day}Close`)
    if (open && close) {
      hours[day] = [{ open, close }]
      hasAny = true
    }
  }

  return hasAny ? hours : undefined
}

/** Index-aligned closed-day rows; a row without a start date is dropped. */
function closedDays(formData: FormData): ClosedDayDto[] {
  const froms = formData.getAll("closedFrom").map(String)
  const tos = formData.getAll("closedTo").map(String)
  const descriptions = formData.getAll("closedDescription").map(String)

  return froms.reduce<ClosedDayDto[]>((days, from, index) => {
    if (!from.trim()) return days
    days.push({
      from: from.trim(),
      // A single-day closure repeats the start date as the end.
      to: tos[index]?.trim() || from.trim(),
      description: descriptions[index]?.trim() || "Closed",
    })
    return days
  }, [])
}

function locationFields(formData: FormData) {
  return {
    name: text(formData, "name"),
    address: address(formData),
    timezone: text(formData, "timezone"),
    openingHours: openingHours(formData),
    closedDays: closedDays(formData),
    active: formData.get("active") === "on",
  }
}

export async function createLocationAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const fields = locationFields(formData)
    if (!fields.name) return { success: false, error: "Location name is required" }

    const data: CreateLocationDto = { ...fields, name: fields.name }

    await createLocation(data)
    revalidatePath("/settings/locations")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create location",
    }
  }
}

export async function updateLocationAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = text(formData, "id")
    if (!id) return { success: false, error: "Location ID is required" }

    const data: UpdateLocationDto = locationFields(formData)

    await updateLocation(id, data)
    revalidatePath("/settings/locations")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update location",
    }
  }
}
