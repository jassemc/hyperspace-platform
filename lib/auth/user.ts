import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AppUser = {
  name: string;
  email: string;
  id: string;
};

/**
 * The signed-in staff member, or a redirect to the login page.
 *
 * Runs in every section layout, which makes it the one place that sees
 * every authenticated page load — so it is also where an expired or
 * role-less session is turned into a destination rather than an empty
 * screen (#75 / S-11). `reason` reaches the login page so it can explain
 * itself instead of looking like an unprompted logout.
 */
export async function getAuthenticatedUser(): Promise<AppUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login?reason=expired");
  }

  const { data: userData } = await supabase.auth.getUser();
  const supabaseUser = userData?.user;

  if (!supabaseUser) {
    redirect("/auth/login?reason=expired");
  }

  return {
    name:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.email?.split("@")[0] ||
      "User",
    email: supabaseUser.email || "",
    id: supabaseUser.id,
  };
}
