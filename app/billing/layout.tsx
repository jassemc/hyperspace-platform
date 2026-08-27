import { AppSidebarNav } from "@/components/app-sidebar-nav"
import { SidebarProvider } from "@/components/sidebar"
import { getAuthenticatedUser } from "@/lib/auth/user"
import { ReactNode } from "react"
import { DashboardWrapper } from "@/components/dashboard-wrapper"
import { AppNavbar } from "@/components/app-navbar"

export default async function BillingLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getAuthenticatedUser()

  return (
    <SidebarProvider>
      <AppSidebarNav />
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
