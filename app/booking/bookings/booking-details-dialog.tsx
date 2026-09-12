"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Code,
  DetailsBody,
  DetailsContent,
  DetailsFooter,
  DetailsHeader,
  Empty,
  ExtrasTable,
  Hero,
  HeroValue,
  MetaLine,
  Notes,
  Party,
  Section,
  Sep,
  StatusBadge,
  Term,
  Terms,
  Thumb,
} from "@/components/details-dialog-parts"
import { ArrowRight, Ban, Check, Clock, Eye, Pencil, Users, UserX } from "lucide-react"
import type { BookingDto, CreditTransactionDto, ResourceDto } from "@/lib/service/HsService"
import {
  dayKey,
  formatDateTime,
  formatDayLabel,
  formatEnumLabel,
  formatPriceHt,
  formatTimeOfDay,
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
import { bookingValue } from "./booking-value"

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

/** Type · seats, as the subtitle under the title. */
function RoomFacts({ resource }: Readonly<{ resource: ResourceDto }>) {
  return (
    <>
      <Sep />
      <span>{resource.resourceType?.name ?? "Resource"}</span>
      <Sep />
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
  if (credits.length === 0) return <Empty>No credits were used.</Empty>
  const total = credits.reduce((sum, c) => sum + Math.abs(c.delta), 0)
  return (
    <Terms>
      {credits.map((c) => (
        <Term
          key={c.id}
          label={
            <span className="min-w-0">
              <span className="block capitalize text-foreground">{formatEnumLabel(c.creditType)}</span>
              <span className="block text-xs">
                {formatDateTime(c.occurredAt, timeZone)}
                {c.expiresAt && ` · expires ${formatDateTime(c.expiresAt, timeZone)}`}
                {c.reason && ` · ${c.reason}`}
              </span>
            </span>
          }
          value={`−${Math.abs(c.delta)}`}
        />
      ))}
      <Term total label="Total credits" value={`−${total}`} />
    </Terms>
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

  const roomName = booking.resource.name || "Room"
  const sameDay = dayKey(booking.startsAt, timeZone) === dayKey(booking.endsAt, timeZone)
  // Shared with the table's Price column, so the two cannot disagree.
  const value = bookingValue(booking)
  const { extras, creditCovered, extrasHt, totalHt } = value

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
      <DetailsContent>
        <DetailsHeader
          visual={
            <Thumb src={details?.resource?.imageUrl} name={roomName} loading={details === null} />
          }
          title={booking.title || "Untitled booking"}
          badges={
            <StatusBadge className={BOOKING_STATUS_CLASSES[booking.status]}>
              {BOOKING_STATUS_LABELS[booking.status] ?? formatEnumLabel(booking.status)}
            </StatusBadge>
          }
          description={
            <>
              <span className="font-medium text-foreground">
                {booking.resource.name || "Unknown resource"}
              </span>
              {details?.resource && <RoomFacts resource={details.resource} />}
              <Sep />
              <span>{BOOKING_SOURCE_LABELS[booking.source] ?? formatEnumLabel(booking.source)}</span>
            </>
          }
        >
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
        </DetailsHeader>

        <DetailsBody>
          {/* Schedule — the one thing every reader looks for first. */}
          {sameDay ? (
            <Hero eyebrow={formatDayLabel(booking.startsAt, timeZone)}>
              <HeroValue>
                {formatTimeOfDay(booking.startsAt, timeZone)}
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                {formatTimeOfDay(booking.endsAt, timeZone)}
                <span className="ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  {duration(booking.startsAt, booking.endsAt)}
                </span>
              </HeroValue>
            </Hero>
          ) : (
            <Hero
              hint={`to ${formatDateTime(booking.endsAt, timeZone)} · ${duration(booking.startsAt, booking.endsAt)}`}
            >
              <HeroValue className="text-lg">{formatDateTime(booking.startsAt, timeZone)}</HeroValue>
            </Hero>
          )}

          <Section title="Customer">
            {booking.member ? (
              <Party
                kind="member"
                id={booking.member.id}
                name={booking.member.fullName}
                email={booking.member.email}
              />
            ) : booking.company ? (
              <Party kind="company" id={booking.company.id} name={booking.company.name} />
            ) : (
              <Empty>No customer attached.</Empty>
            )}
          </Section>

          <Section title="Extras">
            <ExtrasTable extras={extras.map((e) => ({ ...e, id: e.extraId }))} />
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
            <Terms>
              {booking.isFree ? (
                <Term
                  label="Complimentary"
                  value={
                    booking.freeReason
                      ? `${FREE_REASON_LABELS[booking.freeReason]} — nothing charged`
                      : "Nothing charged"
                  }
                />
              ) : (
                <>
                  {booking.requestedDiscountCode && (
                    <Term
                      label="Requested code"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <Code>{booking.requestedDiscountCode}</Code>
                          <Badge variant="outline" className="font-normal text-muted-foreground">
                            {booking.status === "pending"
                              ? "awaiting confirmation"
                              : booking.discount
                                ? "applied"
                                : "not applied"}
                          </Badge>
                        </span>
                      }
                    />
                  )}
                  <Term
                    label="Room (HT)"
                    value={creditCovered ? "Covered by credits" : formatPriceHt(value.roomListHt)}
                  />
                  {/* The API stores the room net of the discount plus the list
                      price it came from; the row shows the list above, the
                      amount taken off here, and the net below — so the total
                      never looks like the discount was skipped (issue #37). */}
                  {value.discount && (
                    <>
                      <Term
                        label={
                          <>
                            Discount {value.discount.code} ({formatDiscountValue(value.discount)})
                            {value.discountPending && (
                              <Badge variant="outline" className="font-normal text-muted-foreground">
                                applied at confirmation
                              </Badge>
                            )}
                          </>
                        }
                        value={creditCovered ? "—" : formatPriceHt(value.discountHt)}
                      />
                      {!creditCovered && (
                        <Term label="Room after discount (HT)" value={formatPriceHt(value.roomHt)} />
                      )}
                    </>
                  )}
                  <Term label="Extras (HT)" value={formatPriceHt(extrasHt)} />
                  <Term
                    total
                    label={value.discountPending ? "Total HT (estimated)" : "Total HT"}
                    value={formatPriceHt(totalHt)}
                  />
                </>
              )}
            </Terms>
          </Section>

          {booking.notes && (
            <Section title="Notes">
              <Notes>{booking.notes}</Notes>
            </Section>
          )}

          <MetaLine id={booking.id} label="Booking">
            <span>Created {formatDateTime(booking.createdAt, timeZone)}</span>
            <span>Updated {formatDateTime(booking.updatedAt, timeZone)}</span>
          </MetaLine>
        </DetailsBody>

        <DetailsFooter>
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
        </DetailsFooter>
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
      </DetailsContent>
    </Dialog>
  )
}
