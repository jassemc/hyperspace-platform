import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Coins, DoorOpen } from "lucide-react"
import type { MemberDetailsDto } from "@/lib/service/HsService"
import { formatDate, formatDateTime, formatEnumLabel } from "@/lib/format"
import { BOOKING_STATUS_CLASSES, BOOKING_STATUS_LABELS } from "@/app/booking/bookings/booking-status"
import { memberPath, type MemberTab } from "../member-route"
import { Empty, Row, Rows, Section } from "./section"

interface ActivityEntry {
  key: string
  /** Sort key. Upcoming bookings sort by start, everything else by when it happened. */
  at: string
  tab: MemberTab
  icon: ReactNode
  primary: ReactNode
  secondary: string
  aside?: ReactNode
}

const MAX_ENTRIES = 8

/**
 * One feed across bookings, check-ins and credit movements, newest first,
 * so "what has this member been doing" is a glance rather than three tabs.
 */
export function RecentActivity({
  member,
  timeZone,
}: Readonly<{ member: MemberDetailsDto; timeZone: string }>) {
  const { checkins, bookings, credits } = member

  const entries: ActivityEntry[] = [
    ...bookings.items.map((booking) => ({
      key: `booking-${booking.id}`,
      at: booking.startsAt,
      tab: "bookings" as const,
      icon: <CalendarClock className="h-4 w-4" />,
      primary: booking.title || booking.resource.name,
      secondary: `Booking · ${formatDateTime(booking.startsAt, timeZone)}`,
      aside: (
        <Badge variant="secondary" className={`${BOOKING_STATUS_CLASSES[booking.status]} border-0`}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      ),
    })),
    ...checkins.items.map((checkin) => ({
      key: `checkin-${checkin.id}`,
      at: checkin.checkedInAt,
      tab: "checkins" as const,
      icon: <DoorOpen className="h-4 w-4" />,
      primary: checkin.checkedOutAt ? "Visit" : "Checked in — still inside",
      secondary: `${formatDateTime(checkin.checkedInAt, timeZone)}${
        checkin.checkedOutAt ? ` → ${formatDateTime(checkin.checkedOutAt, timeZone)}` : ""
      }`,
      aside: (
        <span className="text-xs text-muted-foreground">{formatEnumLabel(checkin.entitlementUsed)}</span>
      ),
    })),
    ...credits.recent.map((row) => ({
      key: `credit-${row.id}`,
      at: row.occurredAt,
      tab: "credits" as const,
      icon: <Coins className="h-4 w-4" />,
      primary: `${row.delta > 0 ? "Credit granted" : "Credit used"} · ${formatEnumLabel(row.creditType)}`,
      secondary: `${formatDateTime(row.occurredAt, timeZone)}${row.reason ? ` · ${row.reason}` : ""}`,
      aside: (
        <span
          className={`tabular-nums ${row.delta < 0 ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"}`}
        >
          {row.delta > 0 ? `+${row.delta}` : row.delta}
        </span>
      ),
    })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, MAX_ENTRIES)

  const presence = checkins.onSite ? (
    <Badge variant="secondary" className="border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      On site
    </Badge>
  ) : checkins.items[0] ? (
    <span className="text-xs text-muted-foreground">
      Last visit {formatDate(checkins.items[0].checkedInAt)}
    </span>
  ) : null

  return (
    <Section title="Recent activity" viewAllHref={memberPath(member.id, "checkins")} aside={presence}>
      {entries.length === 0 ? (
        <Empty>No activity yet</Empty>
      ) : (
        <Rows>
          {entries.map((entry) => (
            <Row
              key={entry.key}
              icon={entry.icon}
              primary={entry.primary}
              secondary={entry.secondary}
              aside={entry.aside}
            />
          ))}
        </Rows>
      )}
    </Section>
  )
}
