import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"

export const metadata = { title: "No access" }

/**
 * #75 (S-11): an account that authenticates with Supabase but has no
 * role row gets 403 no_role_assigned from every endpoint. Before this it
 * saw a fully rendered shell with empty tables and dashed KPI cards, and
 * had no way to tell that from "there is no data yet".
 */
export default function NoRolePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">No access to the back office</h1>
      <p className="text-muted-foreground">
        You are signed in, but this back office has no account for you yet —
        or the one it has carries no role — so none of its data is available.
      </p>
      <p className="text-muted-foreground">Signing in again will not change this.</p>
      <p className="text-muted-foreground">
        Ask the owner to assign you a role, then reload this page.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Link href="/" className="text-sm underline underline-offset-4">
          Try again
        </Link>
        <LogoutButton />
      </div>
    </main>
  )
}
