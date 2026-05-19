import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the "middleware" file convention to "proxy".
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all routes except:
     * - Next.js internals and static assets
     * - public proposal pages (/p/...) and their public APIs
     * - the Stripe webhook
     */
    "/((?!_next/static|_next/image|favicon.ico|p/|api/public/|api/stripe/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
