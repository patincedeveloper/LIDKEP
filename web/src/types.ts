export type Role = 'SYSTEM_ADMINISTRATOR' | 'INNOVATOR' | 'EXPERT' | 'INVESTOR_PARTNER' | 'PUBLIC_USER';
export type Account = {
  id: string; name: string; email: string; role: Role; accountStatus: string; organization: string; district: string;
  verified: boolean; mfaEnabled: boolean; mustChangePassword: boolean; profileComplete: boolean; approvalStatus: string;
  identificationType?: string; identificationNumber?: string; phoneNumber?: string; educationLevel?: string; province?: string;
  administrativeSector?: string; occupation?: string; yearsOfExperience?: number; preferredLanguage?: string;
  publicProfile?: boolean; createdAt?: string; updatedAt?: string; lastLoginAt?: string;
};
export type Metric = { value: string; label: string };
export type Milestone = { title: string; date: string; status: string };
export type Innovation = {
  id: string; slug: string; title: string; summary: string; problem: string; solution: string; beneficiaries: string;
  sector: string; category: string; district: string; maturity: string; impactArea: string; status: string; impact: string;
  novelty: string; currentEvidence: string; implementationPlan: string; scalability: string; sustainability: string; supportNeeded: string;
  owner: string; organization: string; publishedAt: string; version: number; completion: number; views: number; saves: number;
  imageTone: string;
  evidence: Array<{id:string;name:string;mimeType:string;sizeBytes:string;visibility:string;scanStatus:string;createdAt:string}>;
  metrics: Metric[];
  milestones: Array<Milestone & {id?:string;description?:string;visibility?:string}>;
  ownerId?: string; versionId?: string; createdAt?: string; updatedAt?: string; submittedAt?: string;
  administratorReviewedAt?: string;
  ownershipDeclared?: boolean; accuracyDeclared?: boolean;
  supportingLinks: Array<{title:string;url:string}>;
  revisions?: Array<{id:string;field:string;instruction:string;response:string;dueAt:string;status:string}>;
  assignment?: null | {id:string;expertId:string;expert:string;status:string;dueAt:string;createdAt:string;reviewHistory:ReviewRound[]};
};
export type ReviewScore = { criterionKey: string; criterionName?: string; weight?: number; score: number; comment: string };
export type ReviewRound = {
  id:string;versionId:string;version:number;status:string;recommendation:string;totalScore:number|null;rationale:string;submittedAt:string;
  scores:ReviewScore[];
  revisionRequests:Array<{id?:string;fieldKey:string;instruction:string;response?:string;dueAt:string;status:string}>;
};
export type Assignment = {
  id: string; innovationId: string; innovation: string; version: number; expert: string; sector: string; district: string; status: string; dueAt: string;
  acceptedAt?: string; completedAt?: string; summary?: string; problem?: string; solution?: string; beneficiaries?: string; impact?: string;
  novelty?: string; currentEvidence?: string; implementationPlan?: string; scalability?: string; sustainability?: string; supportNeeded?: string;
  supportingLinks?: Array<{title:string;url:string}>;
  evidence?: Array<{id:string;name:string;mimeType:string;sizeBytes:string}>;
  criteria?: Array<{key:string;name:string;guidance:string;weight:number}>;
  review?: null | ReviewRound;
  reviewHistory: ReviewRound[];
};
export type InnovationFeedback = { innovationId:string;innovation:string;status:string;expert:string;rounds:ReviewRound[] };
export type Engagement = {
  id: string; innovationId:string; innovationSlug:string; innovation: string; partner: string; partnerId:string; innovator:string; ownerId:string;
  type: string; status: string; createdAt: string; updatedAt:string; summary: string; termsSummary:string; nonBindingAccepted:boolean;
  contact:{email:string;phone:string;organization:string};
};
export type Notification = { id: string; title: string; message: string; time: string; read: boolean; type: string; entityType:string; entityId:string; actionPath:string };
export type Revision = { id: string; innovationId?: string; innovation: string; field: string; instruction: string; response?: string; dueAt: string; status: string };
export type PlatformData = {
  users: Account[];
  taxonomies: {
    sectors: string[]; categories: string[]; districts: string[]; maturityLevels: string[]; impactAreas: string[];
    educationLevels: string[]; locations: Record<string,Record<string,string[]>>;
  };
  innovations: Innovation[];
  assignments: Assignment[];
  reviews: Array<Record<string, unknown>>;
  revisions: Revision[];
  engagements: Engagement[];
  notifications: Notification[];
  verifications: Array<Record<string, string | number>>;
  criteria: Array<Record<string, unknown>>;
  statistics: { publishedInnovations: number; districtsReached: number; activeExperts: number; collaborationRequests: number; monthlySubmissions: number[]; sectorDistribution: Array<{label:string; value:number}> };
};
