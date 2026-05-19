import Link from "next/link";
import { NewProposalForm } from "./new-proposal-form";

export default function NewProposalPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard"
        className="text-[14px] text-ink-soft transition-colors hover:text-ink"
      >
        ← Back to proposals
      </Link>
      <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-ink">
        New proposal
      </h1>
      <p className="mt-1.5 text-[15px] text-ink-soft">
        Tell us about the client and the project. Claude will draft a complete,
        polished proposal you can review and refine.
      </p>
      <div className="mt-7">
        <NewProposalForm />
      </div>
    </div>
  );
}
