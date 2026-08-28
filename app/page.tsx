import { redirect } from "next/navigation"

/**
 * There is no marketing page in front of this app, so the root is not a page
 * of its own: signed in it is the dashboard, and signed out the middleware
 * turns the hop into the login screen.
 */
export default function RootPage() {
  redirect("/dashboard/overview")
}
