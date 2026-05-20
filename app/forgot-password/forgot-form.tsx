"use client";

import { useState } from "react";
import { Button, Field, Spinner, inputClass } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-[15px] leading-relaxed text-ink-soft">
          If <span className="font-medium text-ink">{email}</span> has an
          account, a password-reset link is on its way. Check your inbox (and
          your spam folder).
        </p>
        <p className="mt-3 text-[13px] text-ink-faint">
          The link expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      {error ? (
        <p className="rounded-lg bg-[#fbeaea] px-3 py-2 text-[13px] text-[#c0392b]">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Spinner /> : null}
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
