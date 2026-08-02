import {
    ArchiveX,
    Building2,
    File,
    Inbox,
    Send,
    Trash2,
    Users,
    MessageSquare,
    Calendar,
    Settings,
    CreditCard,
    Receipt,
    User,
    Bell,
    Database,
    BarChart3,
    PieChart,
    TrendingUp,
    Map,
    Car,
    Clock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Navigation types

export interface Site {
    logo: string
    name: string
    plan: string
}

export interface SubMenuItem {
    title: string
    url: string
    icon?: LucideIcon
    items?: NavigationItem[]
}

export interface NavigationItem {
    title: string
    url: string
    icon?: LucideIcon
}

export interface MenuItem {
    title: string
    url: string
    icon: LucideIcon
    isActive: boolean
    subMenus?: SubMenuItem[]
}

export interface NavigationConfig {
    site: Site[]
    navMain: MenuItem[]
}

// Navigation configuration
export const navigationConfig: NavigationConfig = {
    site: [
        {
            logo: '/logo.png',
            name: 'Hyperspace',
            plan: 'Bizerte'
        }
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: Inbox,
            isActive: true,
            subMenus: [
                {
                    title: "Analytics",
                    url: "#",
                    icon: BarChart3,
                    items: [
                        { title: "View Reports", url: "#" },
                        { title: "Export Data", url: "#" },
                        { title: "Trending Analysis", url: "#" },
                    ]
                },
                {
                    title: "Overview",
                    url: "/dashboard/overview",
                    icon: PieChart,
                },
                {
                    title: "Performance",
                    url: "#",
                    icon: TrendingUp,
                    items: [
                        { title: "Monthly Stats", url: "#" },
                        { title: "Weekly Report", url: "#" },
                    ]
                }
            ]
        },
        {
            title: "Community",
            url: "/community",
            icon: File,
            isActive: false,
            subMenus: [
                {
                    title: "Members",
                    url: "/community/members",
                    icon: Users,
                },
                {
                    title: "Companies",
                    url: "/community/companies",
                    icon: Building2,
                },
                {
                    title: "Discussions",
                    url: "#",
                    icon: MessageSquare,
                    items: [
                        { title: "Active Topics", url: "#" },
                        { title: "Create Topic", url: "#" },
                    ]
                },
                {
                    title: "Events",
                    url: "#",
                    icon: Calendar,
                }
            ]
        },
        {
            title: "Space",
            url: "/space",
            icon: Send,
            isActive: false,
            subMenus: [
                {
                    title: "Resource types",
                    url: "/resource-types",
                    icon: Map,
                    items: [
                        { title: "Resource type 1", url: "/resource-types" },
                        { title: "Resource type 2", url: "/resource-types" },
                    ]
                },
                {
                    title: "Resources",
                    url: "/space/resources",
                    icon: Database,
                },
                {
                    title: "Plan",
                    url: "/space/plan",
                    icon: Calendar,
                },
                {
                    title: "Availability",
                    url: "#",
                    icon: Clock,
                    items: [
                        { title: "Check Schedule", url: "#" },
                        { title: "Book Space", url: "#" },
                    ]
                }
            ]
        },
        {
            title: "Billing",
            url: "/billing",
            icon: ArchiveX,
            isActive: false,
            subMenus: [
                {
                    title: "Invoices",
                    url: "#",
                    icon: Receipt,
                    items: [
                        { title: "View Invoices", url: "#" },
                        { title: "Download PDF", url: "#" },
                        { title: "Payment History", url: "#" },
                    ]
                },
                {
                    title: "Resource rates",
                    url: "/billing/resource-rates",
                    icon: Receipt,
                },
                {
                    title: "Payment Methods",
                    url: "#",
                    icon: CreditCard,
                },
                {
                    title: "Subscriptions",
                    url: "#",
                    icon: Calendar,
                    items: [
                        { title: "Manage Plans", url: "#" },
                        { title: "Usage Stats", url: "#" },
                    ]
                }
            ]
        },
        {
            title: "Booking",
            url: "/booking",
            icon: Trash2,
            isActive: false,
            subMenus: [
                {
                    title: "Reservations",
                    url: "#",
                    icon: Calendar,
                    items: [
                        { title: "View Bookings", url: "#" },
                        { title: "Create Booking", url: "#" },
                        { title: "Cancel Booking", url: "#" },
                    ]
                },
                {
                    title: "Vehicles",
                    url: "#",
                    icon: Car,
                },
                {
                    title: "Schedule",
                    url: "#",
                    icon: Clock,
                    items: [
                        { title: "Daily View", url: "#" },
                        { title: "Weekly View", url: "#" },
                    ]
                }
            ]
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
            isActive: false,
            subMenus: [
                {
                    title: "Resource types",
                    url: "/settings/resource-types",
                    icon: Database,
                },
                {
                    title: "Profile",
                    url: "#",
                    icon: User,
                    items: [
                        { title: "Edit Profile", url: "#" },
                        { title: "Change Password", url: "#" },
                        { title: "Privacy Settings", url: "#" },
                    ]
                },
                {
                    title: "Notifications",
                    url: "#",
                    icon: Bell,
                },
                {
                    title: "Preferences",
                    url: "#",
                    icon: Settings,
                    items: [
                        { title: "Theme", url: "#" },
                        { title: "Language", url: "#" },
                    ]
                }
            ]
        },
    ]
}

// Utility functions for navigation
export const getActiveMenuItem = (pathname: string): MenuItem | undefined => {
    return navigationConfig.navMain.find(item =>
        item.url === pathname ||
        item.subMenus?.some(sub =>
            sub.url === pathname ||
            sub.items?.some(subItem => subItem.url === pathname)
        )
    )
}

export const getDefaultActiveItem = (): MenuItem => {
    return navigationConfig.navMain.find(item => item.isActive) || navigationConfig.navMain[0]
}