import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import { DashboardWrapper } from "@/components/dashboard-wrapper"
import { AppNavbar } from "@/components/app-navbar"

export default async function SettingsLayout({ children }: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { data: userData } = await supabase.auth.getUser();

  const user = userData?.user ? {
    name: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || "User",
    email: userData.user.email || "",
    id: userData.user.id
  } : null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <DashboardWrapper>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-sidebar">
          <AppNavbar user={user} />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </DashboardWrapper>
    </SidebarProvider>
  )
}


