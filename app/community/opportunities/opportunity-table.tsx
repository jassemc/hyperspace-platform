"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import type {
  OpportunityDto,
  OpportunityInterest,
  OpportunityStage,
  OpportunityStatsDto,
} from "@/lib/service/HsService"
import { createColumns } from "./columns"
import { AddOpportunityForm } from "./add-opportunity-form"
import { ConvertLeadForm } from "./convert-lead-form"
import { useOpportunityOptions, type ConvertContext } from "./use-opportunity-options"
import {
  OPPORTUNITY_INTEREST_LABELS,
  OPPORTUNITY_INTEREST_VALUES,
  OPPORTUNITY_STAGE_TABS,
  opportunityTotals,
} from "./opportunity-meta"

interface OpportunityTableProps {
  data: OpportunityDto[]
  totalCount?: number
  activeStage?: OpportunityStage
  activeInterest?: OpportunityInterest
  activeSource?: string
  stats?: OpportunityStatsDto | null
}

export function OpportunityTable({
  data,
  totalCount,
  activeStage,
  activeInterest,
  activeSource,
  stats,
}: Readonly<OpportunityTableProps>) {
  const totals = opportunityTotals(stats)

  // Interest is a fixed vocabulary; source is whatever staff have typed, so
  // its options come from the data with their counts.
  const filters = [
    {
      key: "interest",
      label: "Interest",
      value: activeInterest,
      options: OPPORTUNITY_INTEREST_VALUES.map((value) => ({
        value,
        label: OPPORTUNITY_INTEREST_LABELS[value],
      })),
    },
    {
      key: "source",
      label: "Source",
      value: activeSource,
      options: (stats?.bySource ?? []).map((entry) => ({
        value: entry.source,
        label: entry.source,
        count: entry.count,
      })),
    },
  ]
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityDto | null>(null)
  const [convertingOpportunity, setConvertingOpportunity] = useState<OpportunityDto | null>(null)
  const [convertContext, setConvertContext] = useState<ConvertContext | null>(null)
  const { options, loading, loadOptions, loadConvert } = useOpportunityOptions()

  // Its plan, space and add-ons load first; the drawer opens already filled in.
  const handleEdit = async (opportunity: OpportunityDto) => {
    if (!(await loadOptions("edit", opportunity))) return
    setEditingOpportunity(opportunity)
    setIsDrawerOpen(true)
  }

  const handleConvert = async (opportunity: OpportunityDto) => {
    const context = await loadConvert(opportunity)
    if (!context) return
    setConvertContext(context)
    setConvertingOpportunity(opportunity)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setEditingOpportunity(null)
  }

  const columns = createColumns({
    onEdit: handleEdit,
    onConvert: handleConvert,
    loading,
  })

  return (
    <>
      {/* Remount on filter change so pagination is re-read from the URL. */}
      <DataTable
        key={`${activeStage ?? "all"}-${activeInterest ?? "any"}-${activeSource ?? "any"}`}
        columns={columns}
        data={data}
        totalCount={typeof totalCount === "number" ? totalCount : undefined}
        filters={filters}
        showStatusTabs={true}
        statusTabOptions={OPPORTUNITY_STAGE_TABS.map((tab) => ({
          ...tab,
          count: totals.countFor(tab.value),
        }))}
        statusAllCount={totals.total}
        serverSearch
        searchPlaceholder="Search by member..."
      />
      {isDrawerOpen && (
        <AddOpportunityForm
          key={editingOpportunity?.id || "create"}
          isOpen={isDrawerOpen}
          onClose={handleClose}
          options={options}
          editingOpportunity={editingOpportunity}
        />
      )}
      {convertingOpportunity && convertContext && (
        <ConvertLeadForm
          key={convertingOpportunity.id}
          isOpen={true}
          onClose={() => {
            setConvertingOpportunity(null)
            setConvertContext(null)
          }}
          context={convertContext}
          opportunity={convertingOpportunity}
        />
      )}
    </>
  )
}
