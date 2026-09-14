import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";
import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

/** Why the user is looking at this page, when they did not ask to be. */
const SIGN_IN_REASONS: Record<string, string> = {
  expired: "Your session has expired. Please sign in again.",
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // #75 (S-11): an expired session used to drop the user here — or worse,
  // leave them on a shell of empty tables — with nothing to explain it,
  // which reads as an unprompted logout or as lost permissions.
  const params = (await searchParams) ?? {};
  const rawReason = params.reason;
  const reason =
    typeof rawReason === "string" ? SIGN_IN_REASONS[rawReason] : undefined;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (!error && data?.claims) {
    redirect("/dashboard");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Image
                src='/logo.png'
                alt="logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            Hyperspace
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs space-y-4">
            {reason && (
              <p
                role="status"
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
              >
                {reason}
              </p>
            )}
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/login.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          width={500}
          height={500}
        />
      </div>
    </div>
  )
}
