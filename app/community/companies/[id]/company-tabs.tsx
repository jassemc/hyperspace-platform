"use client"

import type { ReactNode } from "react"
import { DetailTabs } from "@/components/detail-tabs"
import { COMPANY_TABS, COMPANY_TAB_LABELS, type CompanyTab } from "./company-route"

const TABS = COMPANY_TABS.map((value) => ({ value, label: COMPANY_TAB_LABELS[value] }))

export type CompanyTabCounts = Partial<Record<CompanyTab, number>>

export function CompanyTabs({
  activeTab,
  counts,
  children,
}: Readonly<{ activeTab: CompanyTab; counts?: CompanyTabCounts; children: ReactNode }>) {
  return (
    <DetailTabs tabs={TABS} activeTab={activeTab} counts={counts}>
      {children}
    </DetailTabs>
  )
}
