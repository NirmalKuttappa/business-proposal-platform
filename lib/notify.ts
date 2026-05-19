import { sendOwnerNotification } from "./email";
import { createSupabaseAdminClient } from "./supabase/admin";

/**
 * Looks up a proposal owner's email and sends them a notification.
 * Never throws — notification failure must not break the client flow.
 */
export async function notifyOwner(
  ownerId: string,
  opts: {
    subject: string;
    heading: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
  },
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.getUserById(ownerId);
    const email = data.user?.email;
    if (!email) return;
    await sendOwnerNotification({ to: email, ...opts });
  } catch (err) {
    console.error("[notify] failed:", err);
  }
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
}
