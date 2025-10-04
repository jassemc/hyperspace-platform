"use client"

import * as React from "react"
import { SidebarContextProps } from "./sidebar-context.type"

export const SidebarContext = React.createContext<SidebarContextProps | null>(null)

export default function useSidebar() {
    const context = React.useContext(SidebarContext)
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.")
    }

    return context
}