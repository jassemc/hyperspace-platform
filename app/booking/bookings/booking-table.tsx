"use client"

import { useState } from "react"
import { DataTable, type TableFilter } from "@/components/data-table"
import type {
  BookingDto,
  BookingSource,
  BookingStatsDto,
  BookingStatus,
  ResourceDto,
} from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { BookingFormDialog } from "./booking-form-dialog"
import { BOOKING_STATUS_TABS } from "./booking-status"
import { bookingTotals } from "./stats"
import { formatEnumLabel } from "@/lib/format"

interface BookingTableProps {
  data: BookingDto[]
  totalCount?: number
  resources?: ResourceDto[]
  timeZone: string
  stats?: BookingStatsDto | null
  activeStatus?: BookingStatus
  activeSource?: BookingSource
  activeResourceId?: string
  activeFrom?: string
  activeTo?: string
}

export function BookingTable({
  data,
  totalCount,
  resources = [],
  timeZone,
  stats,
  activeStatus,
  activeSource,
  activeResourceId,
  activeFrom,
  activeTo,
}: Readonly<BookingTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<BookingDto | null>(null)

  const handleEdit = (booking: BookingDto) => {
    setEditingBooking(booking)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingBooking(null)
  }

  const columns = createColumns({
    onEdit: handleEdit,
    timeZone,
  })

  const totals = bookingTotals(stats ?? null)

  const filters: TableFilter[] = [
    {
      key: "resourceId",
      label: "Resource",
      value: activeResourceId,
      options: resources.map((resource) => ({
        value: resource.id,
        label: resource.name,
        count: (stats?.byResource ?? []).find(
          (row) => row.resourceId === resource.id
        )?.count,
      })),
    },
    {
      key: "source",
      label: "Source",
      value: activeSource,
      options: (stats?.bySource ?? []).map((entry) => ({
        value: entry.source,
        label: formatEnumLabel(entry.source),
        count: entry.count,
      })),
    },
    {
      kind: "dateRange",
      label: "Dates",
      fromKey: "from",
      toKey: "to",
      fromValue: activeFrom,
      toValue: activeTo,
      presets: [
        { label: "Today", days: 0 },
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 },
      ],
    },
  ]

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={`${activeStatus ?? "all"}-${activeResourceId ?? "any"}-${activeSource ?? "any"}-${activeFrom ?? ""}-${activeTo ?? ""}`}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        filters={filters}
        timeZone={timeZone}
        showStatusTabs={true}
        statusTabOptions={BOOKING_STATUS_TABS.map((tab) => ({
          ...tab,
          count: totals.countFor(tab.value),
        }))}
        statusAllCount={totals.total}
        serverSearch
        searchPlaceholder="Search title, notes or customer..."
      />
      <BookingFormDialog
        key={editingBooking?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingBooking={editingBooking}
        resources={resources}
        timeZone={timeZone}
      />
    </>
  )
}
