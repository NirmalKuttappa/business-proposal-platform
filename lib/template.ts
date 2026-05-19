import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, PROPOSAL_MODEL } from "./anthropic";
import type { ProposalContent } from "./types";

/**
 * The default proposal template — derived from the user's proven
 * "Business Proposal" template. It defines the 12 sections every generated
 * proposal contains. The AI fills the narrative sections; pricing and the
 * payment schedule are seeded from the owner's inputs.
 */

/** The shape of the AI-generated portion of a proposal. */
export type AiProposalDraft = {
  coverTitle: string;
  coverIntro: string;
  companyOverview: string;
  executiveSummaryIntro: string;
  teamMembers: { name: string; role: string; bio: string }[];
  testimonials: { name: string; jobTitle: string; quote: string }[];
  scopeOfWork: string;
  challenges: string[];
  goals: string[];
  deliverables: { name: string; timeline: string }[];
  projectOverview: string;
  contractIntro: string;
  contractClauses: { heading: string; body: string }[];
};

const SYSTEM_PROMPT = `You are an expert proposal writer for a professional services company. You produce client-ready business proposals that are polished, persuasive, and concrete.

You will be given a short brief describing a project. From it, write a complete proposal that follows this fixed template structure:

1. COVER — a confident title and a one-sentence intro line summarising the engagement.
2. COMPANY OVERVIEW — 2 short paragraphs introducing the provider and why they are credible for this work.
3. EXECUTIVE SUMMARY — a one-paragraph intro, plus 2-3 key team members (realistic name, role, and a 1-2 sentence bio each).
4. CLIENT TESTIMONIALS — exactly 3 short, believable testimonials (name, job title, 1-2 sentence quote) from plausible past clients in a relevant industry.
5. SCOPE OF WORK — 2 paragraphs framing the engagement: the challenge, the approach, and what is included.
6. CHALLENGES & GOALS — 2-4 specific client challenges and 2-4 concrete goals & objectives this work achieves.
7. DELIVERABLES & TIMELINE — 4-6 deliverables, each with a realistic timeline (e.g. "Weeks 1-2").
8. PROJECT OVERVIEW — 2-3 paragraphs on how the service solves the client's needs and what working together looks like.
9. CONTRACT — a one-paragraph intro plus standard sales-contract clauses: Product/Service Purchased, Payment, Default, Warranty, Modification, and Applicable Law. Keep clauses professional and generic; do not invent jurisdiction-specific law.

WRITING STYLE — emulate the clarity of Apple's communication:
- Clear, confident, and concrete. Short sentences. No buzzwords, no filler, no hype.
- Lead with client benefit and outcomes, not process jargon.
- Specific over vague. Concrete numbers and timeframes where reasonable.
- For any multi-paragraph field, separate paragraphs with a blank line (\\n\\n).
- Never use placeholder text like "[Client.Company]" — use the real names you are given.

Call the submit_proposal tool with the finished proposal. Fill every field.`;

const SUBMIT_TOOL: Anthropic.Tool = {
  name: "submit_proposal",
  description: "Submit the completed proposal content.",
  input_schema: {
    type: "object",
    properties: {
      coverTitle: {
        type: "string",
        description: "Confident proposal title, e.g. 'A growth partnership for Acme Co.'",
      },
      coverIntro: {
        type: "string",
        description: "One sentence summarising the engagement.",
      },
      companyOverview: {
        type: "string",
        description: "2 short paragraphs about the provider. Separate with a blank line.",
      },
      executiveSummaryIntro: {
        type: "string",
        description: "One-paragraph executive summary intro.",
      },
      teamMembers: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            bio: { type: "string", description: "1-2 sentence bio." },
          },
          required: ["name", "role", "bio"],
        },
      },
      testimonials: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            jobTitle: { type: "string" },
            quote: { type: "string" },
          },
          required: ["name", "jobTitle", "quote"],
        },
      },
      scopeOfWork: {
        type: "string",
        description: "2 paragraphs. Separate with a blank line.",
      },
      challenges: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: { type: "string" },
      },
      goals: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: { type: "string" },
      },
      deliverables: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            timeline: { type: "string", description: "e.g. 'Weeks 1-2'" },
          },
          required: ["name", "timeline"],
        },
      },
      projectOverview: {
        type: "string",
        description: "2-3 paragraphs. Separate paragraphs with a blank line.",
      },
      contractIntro: {
        type: "string",
        description: "One-paragraph intro to the sales contract.",
      },
      contractClauses: {
        type: "array",
        minItems: 5,
        maxItems: 7,
        items: {
          type: "object",
          properties: {
            heading: { type: "string", description: "e.g. 'Payment'" },
            body: { type: "string" },
          },
          required: ["heading", "body"],
        },
      },
    },
    required: [
      "coverTitle",
      "coverIntro",
      "companyOverview",
      "executiveSummaryIntro",
      "teamMembers",
      "testimonials",
      "scopeOfWork",
      "challenges",
      "goals",
      "deliverables",
      "projectOverview",
      "contractIntro",
      "contractClauses",
    ],
  },
};

export type GenerateInput = {
  brief: string;
  clientName: string;
  clientCompany: string;
  ownerName: string;
  ownerCompany: string;
};

/** Calls Claude Opus to draft the narrative portion of a proposal. */
export async function generateProposalDraft(
  input: GenerateInput,
): Promise<AiProposalDraft> {
  const anthropic = getAnthropic();

  const userPrompt = `Write a complete business proposal.

PROVIDER (the company sending this proposal):
- Name of contact: ${input.ownerName || "the proposal sender"}
- Company: ${input.ownerCompany || "the provider"}

CLIENT (who the proposal is for):
- Name: ${input.clientName}
- Company: ${input.clientCompany || input.clientName}

PROJECT BRIEF:
${input.brief}

Write the proposal now and submit it with the submit_proposal tool.`;

  const message = await anthropic.messages.create({
    model: PROPOSAL_MODEL,
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [SUBMIT_TOOL],
    tool_choice: { type: "tool", name: "submit_proposal" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("The model did not return a structured proposal.");
  }
  return toolUse.input as AiProposalDraft;
}

export type AssembleInput = {
  clientName: string;
  clientCompany: string;
  ownerName: string;
  ownerCompany: string;
  amountTotalCents: number;
};

/**
 * Merges the AI draft with owner-provided pricing into the final
 * ProposalContent. Pricing starts as a single line item equal to the
 * total the owner entered; the owner can refine it in the editor.
 */
export function assembleProposalContent(
  draft: AiProposalDraft,
  opts: AssembleInput,
): ProposalContent {
  const preparedFor = opts.clientCompany
    ? `${opts.clientName}, ${opts.clientCompany}`
    : opts.clientName;
  const createdBy = opts.ownerCompany
    ? `${opts.ownerName}, ${opts.ownerCompany}`
    : opts.ownerName || "Your company";

  return {
    cover: {
      title: draft.coverTitle,
      intro: draft.coverIntro,
      preparedFor,
      createdBy,
    },
    companyOverview: { body: draft.companyOverview },
    executiveSummary: {
      intro: draft.executiveSummaryIntro,
      teamMembers: draft.teamMembers,
    },
    testimonials: draft.testimonials,
    scopeOfWork: { body: draft.scopeOfWork },
    challengesAndGoals: {
      challenges: draft.challenges,
      goals: draft.goals,
    },
    deliverablesAndTimeline: { deliverables: draft.deliverables },
    projectOverview: { body: draft.projectOverview },
    pricing: {
      lineItems: [
        {
          product: "Professional services — full engagement",
          description: "Complete delivery of the scope described in this proposal.",
          unitPrice: opts.amountTotalCents,
          quantity: 1,
        },
      ],
    },
    paymentSchedule: [
      {
        description: "Full payment due upon signing this proposal",
        amount: opts.amountTotalCents,
        dueDate: "Due upon acceptance",
      },
    ],
    contract: {
      intro: draft.contractIntro,
      clauses: draft.contractClauses,
    },
  };
}
