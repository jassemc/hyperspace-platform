"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { NativeSelect } from "@/components/ui/native-select"
import { getListDiscounts, getResource } from "@/lib/service"
import type { BookingDto, BookingFreeReason, DiscountDto } from "@/lib/service/HsService"
import { discountIneligibilityReason, formatDiscountValue, isInWindow } from "@/app/billing/discounts/discount-meta"
import { FREE_REASON_LABELS } from "./free-reason"

/**
 * Confirming a website request prices it and writes the charge, so the
 * one question worth asking first is "is this one on the house?" — a
 * partner's request usually is. Pre-ticked when the company is tagged
 * `partner`, which is the only hint the row carries.
 */
export function ConfirmBookingDialog({ open, onOpenChange, booking, pending, onConfirm, partnerTagged }: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingDto
  pending: boolean
  partnerTagged: boolean
  onConfirm: (opts: { isFree: boolean; freeReason?: BookingFreeReason; discountId?: string }) => void
}>) {
  const [isFree, setIsFree] = useState(partnerTagged)
  const [reason, setReason] = useState<BookingFreeReason>("partnership")
  const [discounts, setDiscounts] = useState<DiscountDto[]>([])
  const [discountId, setDiscountId] = useState("")
  const [loading, setLoading] = useState(true)
  // Kept alongside `discounts` (both set by the same fetch below) so the
  // requested-code note can explain a rate mismatch, not just quote it.
  const [resourceRateIds, setResourceRateIds] = useState<Set<string>>(new Set())
  // The requested code's own record, resolved against the UNFILTERED
  // catalog — only once it isn't already an option in `discounts` — purely
  // to explain why it can't be picked. "not_found" means the code matches
  // nothing at all; `null` means no code was requested, or the lookup
  // hasn't settled yet.
  const [requestedDiscountDetails, setRequestedDiscountDetails] = useState<DiscountDto | "not_found" | null>(
    null
  )
  const label = booking.title || "This booking"

  // Fetched once per mount (this dialog is only mounted while open, see
  // booking-row-actions.tsx) rather than on every keystroke: the room's
  // rates and the active discount catalog both fit in one page.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getResource(booking.resourceId),
      getListDiscounts({ limit: 100, offset: 0, sort: "ASC", kind: "resource_rate", status: "active" }),
    ])
      .then(([resource, page]) => {
        if (cancelled) return
        const rateIds = new Set((resource.rates ?? []).map((rate) => rate.id))
        const eligible = ((page.results ?? []) as DiscountDto[]).filter(
          (discount) =>
            isInWindow(discount) &&
            (discount.appliesToAll || discount.resourceRateIds.some((id) => rateIds.has(id)))
        )
        setDiscounts(eligible)
        setResourceRateIds(rateIds)
        // The visitor's requested code only pre-selects when it is still
        // an eligible, resolvable discount for this exact resource — an
        // expired or unrelated code leaves the select on "No discount"
        // rather than silently applying something else.
        const requested = booking.requestedDiscountCode
          ? eligible.find((discount) => discount.code === booking.requestedDiscountCode)
          : undefined
        setDiscountId(requested?.id ?? "")
      })
      .catch((error) => console.error("Failed to load discount options", error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [booking.resourceId, booking.requestedDiscountCode])

  // Resolves the requested code against the FULL catalog (no kind/status/
  // window filter) so a note can say *why* it can't be picked — expired,
  // archived, plan-kind, or scoped to other rates — rather than the generic
  // "no longer applies" the select's own silence used to leave staff with.
  // Waits on `loading`: `discounts` starts `[]` before the first fetch
  // settles, and firing this against that placeholder would call it
  // "unknown" for a code the eligible-list fetch was about to explain fine.
  useEffect(() => {
    setRequestedDiscountDetails(null)
    const code = booking.requestedDiscountCode
    if (!code || loading || discounts.some((discount) => discount.code === code)) return
    let cancelled = false
    getListDiscounts({ q: code, limit: 5, offset: 0, sort: "ASC" })
      .then((page) => {
        if (cancelled) return
        const match = ((page.results ?? []) as DiscountDto[]).find((discount) => discount.code === code)
        setRequestedDiscountDetails(match ?? "not_found")
      })
      .catch((error) => console.error("Failed to resolve the requested discount code", error))
    return () => {
      cancelled = true
    }
  }, [booking.requestedDiscountCode, discounts, loading])

  // What to tell staff about the requested code when it is neither a real
  // option above nor resolvable at all — built at render time so it always
  // reflects the current `discounts`/`resourceRateIds`, not whatever they
  // were when the resolution fetch fired.
  let requestedNote: string | null = null
  if (
    booking.requestedDiscountCode &&
    !discounts.some((discount) => discount.code === booking.requestedDiscountCode)
  ) {
    if (requestedDiscountDetails === "not_found") {
      requestedNote = `Requested code ${booking.requestedDiscountCode} is unknown`
    } else if (requestedDiscountDetails) {
      const ineligibleReason = discountIneligibilityReason(requestedDiscountDetails, resourceRateIds)
      requestedNote = ineligibleReason
        ? `Requested code ${booking.requestedDiscountCode} can't be applied here — ${ineligibleReason}`
        : null
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm this booking?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} will block the slot and be priced unless marked free.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-input" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
          Free booking (no credits, no charges)
        </label>
        {isFree && (
          <div className="grid gap-2">
            <Label htmlFor="confirmFreeReason">Reason</Label>
            <NativeSelect id="confirmFreeReason" value={reason} onChange={(e) => setReason(e.target.value as BookingFreeReason)}>
              {Object.entries(FREE_REASON_LABELS).map(([value, text]) => (
                <option key={value} value={value}>{text}</option>
              ))}
            </NativeSelect>
          </div>
        )}
        {!isFree && (
          <div className="grid gap-2">
            <Label htmlFor="confirmDiscountId">Discount</Label>
            <NativeSelect
              id="confirmDiscountId"
              value={discountId}
              onChange={(e) => setDiscountId(e.target.value)}
              disabled={loading}
            >
              <option value="">No discount</option>
              {discounts.map((discount) => {
                const isRequested = discount.code === booking.requestedDiscountCode
                return (
                  <option key={discount.id} value={discount.id}>
                    {discount.code} — {formatDiscountValue(discount)}
                    {isRequested ? " — requested by the visitor" : ""}
                  </option>
                )
              })}
            </NativeSelect>
            {/* The requested code named a discount that either doesn't
                exist or exists but can't be used here — say which, and
                why, rather than leaving staff to guess why it isn't in the
                list above. */}
            {!loading && requestedNote && (
              <p className="text-xs text-muted-foreground">{requestedNote}</p>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Not yet</AlertDialogCancel>
          <Button
            disabled={pending}
            onClick={() =>
              onConfirm({
                ...(isFree ? { isFree, freeReason: reason } : { isFree: false }),
                // A free confirm stores no discount snapshot regardless
                // (spec 2026-08-29: "not free") — dropped here too, so the
                // request matches what the hidden select shows.
                ...(!isFree && discountId ? { discountId } : {}),
              })
            }
          >
            {pending ? "Confirming..." : isFree ? "Confirm as free" : "Confirm"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
