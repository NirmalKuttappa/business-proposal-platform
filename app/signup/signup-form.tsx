"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Spinner, inputClass } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Session present => email confirmation is disabled, user is signed in.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setNeedsConfirm(true);
    setLoading(false);
  }

  if (needsConfirm) {
    return (
      <div className="text-center">
        <p className="text-[15px] text-ink-soft">
          Check <span className="font-medium text-ink">{email}</span> for a
          confirmation link. Once confirmed, sign in to continue.
        </p>
        <Button
          variant="secondary"
          className="mt-5 w-full"
          onClick={() => router.push("/login")}
        >
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Your name">
        <input
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          placeholder="Jane Rivera"
        />
      </Field>
      <Field label="Company name" hint="Shown as the sender on your proposals.">
        <input
          required
          autoComplete="organization"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className={inputClass}
          placeholder="Rivera Studio"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@company.com"
        />
      </Field>
      <Field label="Password" hint="At least 6 characters.">
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </Field>

      {error ? (
        <p className="rounded-lg bg-[#fbeaea] px-3 py-2 text-[13px] text-[#c0392b]">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Spinner /> : null}
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
