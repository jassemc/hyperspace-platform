"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { NativeSelect } from "@/components/ui/native-select"
import type { BookingDto, BookingFreeReason } from "@/lib/service/HsService"
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
  onConfirm: (opts: { isFree: boolean; freeReason?: BookingFreeReason; discountCode?: string | null }) => void
}>) {
  const [isFree, setIsFree] = useState(partnerTagged)
  const [reason, setReason] = useState<BookingFreeReason>("partnership")
  const [keepDiscountCode, setKeepDiscountCode] = useState(true)
  const label = booking.title || "This booking"
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
        {booking.requestedDiscountCode && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={keepDiscountCode}
              onChange={(e) => setKeepDiscountCode(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <span>
              Apply the requested code <code className="rounded bg-muted px-1">{booking.requestedDiscountCode}</code>
              <span className="block text-xs text-muted-foreground">Unchecked = confirm at the list price. Unknown or expired codes are refused.</span>
            </span>
          </label>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Not yet</AlertDialogCancel>
          <Button
            disabled={pending}
            onClick={() =>
              onConfirm({
                ...(isFree ? { isFree, freeReason: reason } : { isFree: false }),
                // Only meaningful when a code was actually requested — leave
                // it undefined otherwise so nothing gets sent to drop.
                ...(booking.requestedDiscountCode
                  ? { discountCode: keepDiscountCode ? booking.requestedDiscountCode : null }
                  : {}),
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
