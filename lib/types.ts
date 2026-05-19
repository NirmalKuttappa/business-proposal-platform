// Shared domain types for proposals.
// All monetary values are stored as integer cents.

export type TeamMember = { name: string; role: string; bio: string };

export type Testimonial = { name: string; jobTitle: string; quote: string };

export type Deliverable = { name: string; timeline: string };

export type LineItem = {
  product: string;
  description: string;
  unitPrice: number; // cents
  quantity: number;
};

export type PaymentMilestone = {
  description: string;
  amount: number; // cents
  dueDate: string;
};

export type ContractClause = { heading: string; body: string };

/** The full structured body of a proposal — mirrors the default template. */
export type ProposalContent = {
  cover: {
    title: string;
    intro: string;
    preparedFor: string;
    createdBy: string;
  };
  companyOverview: { body: string };
  executiveSummary: { intro: string; teamMembers: TeamMember[] };
  testimonials: Testimonial[];
  scopeOfWork: { body: string };
  challengesAndGoals: { challenges: string[]; goals: string[] };
  deliverablesAndTimeline: { deliverables: Deliverable[] };
  projectOverview: { body: string };
  pricing: { lineItems: LineItem[] };
  paymentSchedule: PaymentMilestone[];
  contract: { intro: string; clauses: ContractClause[] };
};

export type ProposalStatus = "draft" | "sent" | "viewed" | "signed" | "paid";

export type Proposal = {
  id: string;
  owner_id: string;
  public_slug: string;
  title: string;
  client_name: string;
  client_email: string | null;
  client_company: string | null;
  status: ProposalStatus;
  content: ProposalContent;
  amount_total: number; // cents
  currency: string;
  ai_brief: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  paid_at: string | null;
};

export type SignatureRecord = {
  id: string;
  proposal_id: string;
  signer_name: string;
  signature_type: "typed" | "drawn";
  signature_data: string;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
};

export type PaymentRecord = {
  id: string;
  proposal_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
};

export const STATUS_ORDER: ProposalStatus[] = [
  "draft",
  "sent",
  "viewed",
  "signed",
  "paid",
];

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  paid: "Paid",
};
