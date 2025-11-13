"use client"

import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/sidebar"

export function SidebarLogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" onClick={logout} className="flex items-center gap-2">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

