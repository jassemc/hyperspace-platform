"use client"

import * as React from "react"
import { SidebarInset } from "@/components/sidebar"

interface DashboardWrapperProps {
  children: React.ReactNode
}

export function DashboardWrapper({ children }: Readonly<DashboardWrapperProps>) {
  const [isSticky, setIsSticky] = React.useState(false)

  React.useEffect(() => {
    const handleStickyChange = (event: CustomEvent) => {
      setIsSticky(event.detail.isSticky)
    }

    // Listen for sticky state changes from the sidebar
    window.addEventListener('sidebar-sticky-change', handleStickyChange as EventListener)

    return () => {
      window.removeEventListener('sidebar-sticky-change', handleStickyChange as EventListener)
    }
  }, [])

  return (
    // min-w-0: SidebarInset is a flex item in the sidebar row, and a flex
    // item's default min-width:auto refuses to shrink below its content's
    // intrinsic width — a width:max-content child (the booking calendar's
    // 24h track) therefore blew the whole layout out to ~2400px and made
    // the BODY scroll horizontally instead of the grid's own container.
    <SidebarInset
      className={`min-w-0 transition-all duration-300 ease-in-out ${
        isSticky ? 'ml-60' : 'ml-0'
      }`}
    >
      {children}
    </SidebarInset>
  )
}

