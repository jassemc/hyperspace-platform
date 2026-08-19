"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { BookingDto, ResourceDto } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddBookingForm } from "./add-booking-form"

interface BookingTableProps {
  data: BookingDto[]
  totalCount?: number
  resources?: ResourceDto[]
  resourceNames?: Record<string, string>
  memberNames?: Record<string, string>
  companyNames?: Record<string, string>
}

export function BookingTable({
  data,
  totalCount,
  resources = [],
  resourceNames = {},
  memberNames = {},
  companyNames = {},
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
    resourceNames,
    memberNames,
    companyNames,
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
      />
      <AddBookingForm
        key={editingBooking?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingBooking={editingBooking}
        resources={resources}
        memberNames={memberNames}
        companyNames={companyNames}
      />
    </>
  )
}
