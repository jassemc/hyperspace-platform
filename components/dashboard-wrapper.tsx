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
    <SidebarInset 
      className={`transition-all duration-300 ease-in-out ${
        isSticky ? 'ml-60' : 'ml-0'
      }`}
    >
      {children}
    </SidebarInset>
  )
}

