import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No recovery session => the link is expired or this page was opened
  // directly. Send the user back to start the flow over.
  if (!user) redirect("/forgot-password");

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something memorable but secure."
      footer={
        <>
          Changed your mind?{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <ResetForm />
    </AuthShell>
  );
}
