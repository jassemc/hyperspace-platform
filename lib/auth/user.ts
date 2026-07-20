import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AppUser = {
  name: string;
  email: string;
  id: string;
};

export async function getAuthenticatedUser(): Promise<AppUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { data: userData } = await supabase.auth.getUser();
  const supabaseUser = userData?.user;

  if (!supabaseUser) {
    redirect("/auth/login");
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
