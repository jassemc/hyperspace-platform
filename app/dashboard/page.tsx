import { redirect } from "next/navigation"

/**
 * The Dashboard section has no content of its own — Overview is its landing
 * page, so the bare route sends you there rather than showing an empty shell.
 */
export default function DashboardPage() {
  redirect("/dashboard/overview")
}
