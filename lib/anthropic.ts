import Anthropic from "@anthropic-ai/sdk";

/** Claude model used to draft proposals — the latest, most capable Opus. */
export const PROPOSAL_MODEL = "claude-opus-4-7";

export function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local — see README.md.",
    );
  }
  return new Anthropic({ apiKey });
}
