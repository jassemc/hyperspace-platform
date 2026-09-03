"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PlaceholderImage } from "@/components/placeholder-image"
import { ArrowRight, Ban, Building2, Check, Clock, Copy, Eye, Mail, Pencil, User, Users, UserX } from "lucide-react"
import { toast } from "sonner"
import type {
  BookingDto,
  CreditTransactionDto,
  ResourceDto,
} from "@/lib/service/HsService"
import {
  dayKey,
  formatDateTime,
  formatDayLabel,
  formatEnumLabel,
  formatPriceHt,
  formatTimeOfDay,
  formatVatRate,
} from "@/lib/format"
import { formatDiscountValue } from "@/app/billing/discounts/discount-meta"
import { getIconFromFontAwesome } from "@/lib/icon-utils"
import { getBookingDetailsAction, type BookingDetails } from "./actions"
import { CancelBookingAlert } from "./cancel-booking-alert"
import { ConfirmBookingDialog } from "./confirm-booking-dialog"
import { FREE_REASON_LABELS } from "./free-reason"
import { MarkNoShowAlert } from "./mark-no-show-alert"
import { useBookingMutations } from "./use-booking-mutations"
import { BOOKING_SOURCE_LABELS, BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from "./booking-status"

/** Minutes between two instants, rendered as "1h 30m". */
function duration(startsAt: string, endsAt: string): string {
  const minutes = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000
  )
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

function Section({
  title,
  aside,
  children,
}: Readonly<{ title: string; aside?: React.ReactNode; children: React.ReactNode }>) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function CopyId({ id }: Readonly<{ id: string }>) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
      title="Copy booking ID"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id)
          toast.success("Booking ID copied")
        } catch {
          toast.error("Could not copy")
        }
      }}
    >
      {id}
      <Copy className="h-3 w-3" />
    </button>
  )
}

/**
 * The room's thumbnail, sized to sit beside the dialog title. Fetched on
 * open — the booking row only knows the room's id and name — so it
 * pulses until the resource arrives and falls back to the placeholder
 * when there is no photo or the read failed.
 */
function RoomThumb({
  resource,
  name,
  loading,
}: Readonly<{ resource: ResourceDto | null; name: string; loading: boolean }>) {
  if (loading) return <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
      {resource?.imageUrl ? (
        // Served from the public bucket, so the host is not known at build time.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resource.imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <PlaceholderImage name={name} className="h-full w-full" />
      )}
    </div>
  )
}

/** Type · seats · amenities, as the subtitle under the title. */
function RoomFacts({ resource }: Readonly<{ resource: ResourceDto }>) {
  return (
    <>
      <span aria-hidden="true">·</span>
      <span>{resource.resourceType?.name ?? "Resource"}</span>
      <span aria-hidden="true">·</span>
      <Users className="h-3 w-3" />
      <span className="tabular-nums">
        {resource.capacity} {resource.capacity === 1 ? "seat" : "seats"}
      </span>
    </>
  )
}

function CreditRows({
  credits,
  timeZone,
}: Readonly<{ credits: CreditTransactionDto[]; timeZone: string }>) {
  if (credits.length === 0) {
    return <p className="text-sm text-muted-foreground">No credits were used.</p>
  }
  const total = credits.reduce((sum, c) => sum + Math.abs(c.delta), 0)
  return (
    <div className="rounded-lg border text-sm">
      {credits.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-3 border-b px-3 py-2 last:border-b-0">
          <div className="min-w-0">
            <p className="capitalize">{formatEnumLabel(c.creditType)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(c.occurredAt, timeZone)}
              {c.expiresAt && ` · expires ${formatDateTime(c.expiresAt, timeZone)}`}
              {c.reason && ` · ${c.reason}`}
            </p>
          </div>
          <span className="shrink-0 tabular-nums">−{Math.abs(c.delta)}</span>
        </div>
      ))}
      <div className="flex justify-between bg-muted/40 px-3 py-2 font-medium">
        <span>Total credits</span>
        <span className="tabular-nums">−{total}</span>
      </div>
    </div>
  )
}

export function BookingDetailsDialog({
  booking,
  timeZone,
  open,
  onOpenChange,
  onEdit,
}: Readonly<{
  booking: BookingDto
  timeZone: string
  /** Controlled from the calendar; the table call site leaves this unset
   *  and keeps its own trigger below. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Renders an Edit button in the footer when provided. */
  onEdit?: () => void
}>) {
  const controlled = open !== undefined
  const [innerOpen, setInnerOpen] = useState(false)
  const isOpen = controlled ? open : innerOpen
  const setOpen = (next: boolean) => {
    if (!controlled) setInnerOpen(next)
    onOpenChange?.(next)
  }

  // Room and credit ledger are loaded per open, not per mount: a table of
  // fifty rows must not fire a hundred requests for dialogs nobody opened.
  const [details, setDetails] = useState<BookingDetails | null>(null)
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setDetails(null)
    getBookingDetailsAction(booking.id, booking.resource.id).then((d) => {
      if (!cancelled) setDetails(d)
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, booking.id, booking.resource.id])

  const { label, pending, canConfirm, canCancel, canMarkNoShow, confirm, cancel, markNoShow } =
    useBookingMutations(booking)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [noShowOpen, setNoShowOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const customer = booking.member?.fullName ?? booking.company?.name
  const email = booking.member?.email
  const CustomerIcon = booking.member ? User : Building2
  const sameDay = dayKey(booking.startsAt, timeZone) === dayKey(booking.endsAt, timeZone)
  const extras = booking.extras ?? []
  const creditCovered = !booking.isFree && (booking.priceHt === null || booking.priceHt === undefined)
  const extrasHt = extras.reduce((s, e) => s + e.priceHt, 0)
  const extrasTtc = extras.reduce((s, e) => s + e.totalTtc, 0)
  const totalHt = (booking.priceHt ?? 0) + extrasHt

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" title="Booking details">
            <Eye className="h-4 w-4" />
            <span className="sr-only">Details</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6 text-left">
            <RoomThumb
              resource={details?.resource ?? null}
              name={booking.resource.name || "Room"}
              loading={details === null}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="leading-tight">{booking.title || "Untitled booking"}</DialogTitle>
                <Badge
                  variant="secondary"
                  className={`${BOOKING_STATUS_CLASSES[booking.status] ?? ""} border-0`}
                >
                  {BOOKING_STATUS_LABELS[booking.status] ?? formatEnumLabel(booking.status)}
                </Badge>
              </div>
              <DialogDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-medium text-foreground">
                  {booking.resource.name || "Unknown resource"}
                </span>
                {details?.resource && <RoomFacts resource={details.resource} />}
                <span aria-hidden="true">·</span>
                <span>{BOOKING_SOURCE_LABELS[booking.source] ?? formatEnumLabel(booking.source)}</span>
              </DialogDescription>
              {details?.resource && details.resource.amenities.length > 0 && (
                <ul className="flex flex-wrap gap-1 pt-1">
                  {details.resource.amenities.map((a) => {
                    const Icon = getIconFromFontAwesome(a.icon)
                    return (
                      <li
                        key={a.id}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"
                      >
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        {a.name}
                      </li>
                    )
                  })}
                </ul>
              )}
              {details?.error && <p className="text-xs text-destructive">{details.error}</p>}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* Schedule — the one thing every reader looks for first. */}
          <div className="rounded-lg border bg-muted/30 p-4">
            {sameDay ? (
              <>
                <p className="text-sm text-muted-foreground">{formatDayLabel(booking.startsAt, timeZone)}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold tabular-nums">
                  {formatTimeOfDay(booking.startsAt, timeZone)}
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  {formatTimeOfDay(booking.endsAt, timeZone)}
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {duration(booking.startsAt, booking.endsAt)}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">{formatDateTime(booking.startsAt, timeZone)}</p>
                <p className="text-sm text-muted-foreground">
                  to {formatDateTime(booking.endsAt, timeZone)} ·{" "}
                  {duration(booking.startsAt, booking.endsAt)}
                </p>
              </>
            )}
          </div>

          <Section title="Customer">
            {customer ? (
              <div className="flex items-start gap-2 text-sm">
                <CustomerIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p>{customer}</p>
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No customer attached.</p>
            )}
          </Section>

          <Section title="Extras">
            {extras.length === 0 ? (
              <p className="text-sm text-muted-foreground">No extras.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Extra</th>
                      <th className="px-3 py-2 text-right font-medium">Price HT</th>
                      <th className="px-3 py-2 text-right font-medium">VAT</th>
                      <th className="px-3 py-2 text-right font-medium">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extras.map((e) => (
                      <tr key={e.extraId} className="border-t">
                        <td className="px-3 py-2">{e.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(e.priceHt)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatVatRate(e.vatRate)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(e.totalTtc)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/40 font-medium">
                    <tr>
                      <td className="px-3 py-2">Extras total</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(extrasHt)}</td>
                      <td />
                      <td className="px-3 py-2 text-right tabular-nums">{formatPriceHt(extrasTtc)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Section>

          <Section
            title="Credits used"
            aside={
              creditCovered && (
                <Badge variant="outline" className="font-normal">
                  Credit covered
                </Badge>
              )
            }
          >
            {details === null ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <CreditRows credits={details.credits} timeZone={timeZone} />
            )}
          </Section>

          <Section title="Pricing">
            <dl className="rounded-lg border text-sm">
              {booking.isFree ? (
                <div className="flex justify-between px-3 py-2">
                  <dt className="text-muted-foreground">Complimentary</dt>
                  <dd className="tabular-nums">
                    {booking.freeReason
                      ? `${FREE_REASON_LABELS[booking.freeReason]} — nothing charged`
                      : "Nothing charged"}
                  </dd>
                </div>
              ) : (
                <>
                  {booking.requestedDiscountCode && (
                    <div className="flex justify-between px-3 py-2">
                      <dt className="text-muted-foreground">Requested code</dt>
                      <dd className="flex items-center gap-2">
                        <code className="rounded bg-muted px-1">{booking.requestedDiscountCode}</code>
                        <Badge variant="outline" className="font-normal text-muted-foreground">
                          {booking.status === "pending"
                            ? "awaiting confirmation"
                            : booking.discount
                              ? "applied"
                              : "not applied"}
                        </Badge>
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t px-3 py-2 first:border-t-0">
                    <dt className="text-muted-foreground">Room (HT)</dt>
                    <dd className="tabular-nums">
                      {creditCovered ? "Covered by credits" : formatPriceHt(booking.priceHt)}
                    </dd>
                  </div>
                  {booking.discount && (
                    <div className="flex justify-between border-t px-3 py-2">
                      <dt className="text-muted-foreground">Discount ({booking.discount.code})</dt>
                      <dd className="tabular-nums">{formatDiscountValue(booking.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t px-3 py-2">
                    <dt className="text-muted-foreground">Extras (HT)</dt>
                    <dd className="tabular-nums">{formatPriceHt(extrasHt)}</dd>
                  </div>
                  {/* booking.priceHt is already net of any discount (the API
                      applies it once, server-side, at confirm), so totalHt
                      below must not subtract the discount a second time. */}
                  <div className="flex justify-between border-t bg-muted/40 px-3 py-2 font-semibold">
                    <dt>Total HT</dt>
                    <dd className="tabular-nums">{formatPriceHt(totalHt)}</dd>
                  </div>
                </>
              )}
            </dl>
          </Section>

          {booking.notes && (
            <Section title="Notes">
              <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
                {booking.notes}
              </p>
            </Section>
          )}

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Created {formatDateTime(booking.createdAt, timeZone)}</span>
            <span>Updated {formatDateTime(booking.updatedAt, timeZone)}</span>
            <CopyId id={booking.id} />
          </p>
        </div>

        <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 sm:justify-end">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} disabled={pending !== null}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          )}
          {canConfirm && (
            <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={pending !== null}>
              <Check className="mr-1.5 h-4 w-4" />
              {pending === "confirm" ? "Confirming..." : "Confirm"}
            </Button>
          )}
          {canMarkNoShow && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNoShowOpen(true)}
              disabled={pending !== null}
            >
              <UserX className="mr-1.5 h-4 w-4" />
              Mark as no-show
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelOpen(true)}
              disabled={pending !== null}
            >
              <Ban className="mr-1.5 h-4 w-4" />
              Cancel booking
            </Button>
          )}
        </DialogFooter>
        <MarkNoShowAlert
          open={noShowOpen}
          onOpenChange={setNoShowOpen}
          label={label}
          pending={pending === "no_show"}
          onConfirm={async () => {
            if (await markNoShow()) setNoShowOpen(false)
          }}
        />
        <CancelBookingAlert
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          label={label}
          pending={pending === "cancel"}
          onConfirm={async () => {
            if (await cancel()) setCancelOpen(false)
          }}
        />
        {/* Mounted only while open — see booking-row-actions.tsx for why. */}
        {confirmOpen && (
          <ConfirmBookingDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            booking={booking}
            pending={pending === "confirm"}
            partnerTagged={false}
            onConfirm={async (opts) => {
              if (await confirm(opts)) setConfirmOpen(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
