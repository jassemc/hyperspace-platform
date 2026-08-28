import type { BookingFreeReason } from "@/lib/service/HsService"

export const FREE_REASON_LABELS: Record<BookingFreeReason, string> = {
  partnership: "Partnership",
  internal_event: "Internal event",
  goodwill: "Goodwill",
  staff: "Staff use",
}
