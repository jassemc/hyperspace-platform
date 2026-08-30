"use client"

import type { ReactNode } from "react"
import { DetailTabs } from "@/components/detail-tabs"
import { MEMBER_TABS, MEMBER_TAB_LABELS, type MemberTab } from "./member-route"

const TABS = MEMBER_TABS.map((value) => ({ value, label: MEMBER_TAB_LABELS[value] }))

/** Figures shown beside the tab labels, from the member payload. */
export type MemberTabCounts = Partial<Record<MemberTab, number>>

export function MemberTabs({
  activeTab,
  counts,
  children,
}: Readonly<{ activeTab: MemberTab; counts?: MemberTabCounts; children: ReactNode }>) {
  return (
    <DetailTabs tabs={TABS} activeTab={activeTab} counts={counts}>
      {children}
    </DetailTabs>
  )
}
