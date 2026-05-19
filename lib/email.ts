import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

type NotificationInput = {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

function renderEmail(opts: NotificationInput): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<a href="${opts.ctaUrl}" style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;font-size:15px;padding:12px 22px;border-radius:980px;margin-top:8px">${opts.ctaLabel}</a>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden">
      <tr><td style="padding:40px 40px 32px">
        <h1 style="margin:0 0 14px;font-size:24px;letter-spacing:-0.02em;color:#1d1d1f">${opts.heading}</h1>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#6e6e73">${opts.body}</p>
        ${cta}
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#86868b">Sent by your Proposals workspace</p>
  </td></tr></table>
  </body></html>`;
}

/**
 * Sends an owner notification email. Never throws — if Resend is not
 * configured or the send fails, it logs and returns so the core flow is
 * never blocked by email.
 */
export async function sendOwnerNotification(opts: NotificationInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping notification");
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: renderEmail(opts),
    });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    console.error("[email] failed to send:", err);
  }
}
