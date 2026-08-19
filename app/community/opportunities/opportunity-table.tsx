"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type { OpportunityDto, OpportunityStage } from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddOpportunityForm } from "./add-opportunity-form"
import { OPPORTUNITY_STAGE_TABS } from "./opportunity-meta"

interface OpportunityTableProps {
  data: OpportunityDto[]
  totalCount?: number
  memberNames?: Record<string, string>
  activeStage?: OpportunityStage
}

export function OpportunityTable({
  data,
  totalCount,
  memberNames = {},
  activeStage,
}: Readonly<OpportunityTableProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityDto | null>(null)

  const handleEdit = (opportunity: OpportunityDto) => {
    setEditingOpportunity(opportunity)
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingOpportunity(null)
  }

  const columns = createColumns({ onEdit: handleEdit, memberNames })

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={activeStage ?? "all"}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        showStatusTabs={true}
        statusTabOptions={OPPORTUNITY_STAGE_TABS}
      />
      <AddOpportunityForm
        key={editingOpportunity?.id || "create"}
        isOpen={isDrawerOpen}
        onClose={handleClose}
        editingOpportunity={editingOpportunity}
      />
    </>
  )
}
