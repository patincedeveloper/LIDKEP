export type Role = 'SYSTEM_ADMINISTRATOR' | 'INNOVATOR' | 'EXPERT' | 'INVESTOR_PARTNER' | 'PUBLIC_USER';
export type Account = { id: string; name: string; email: string; role: Role; accountStatus: string; organization: string; district: string; verified: boolean; mfaEnabled: boolean };
export type Metric = { value: string; label: string };
export type Milestone = { title: string; date: string; status: string };
export type Innovation = {
  id: string; slug: string; title: string; summary: string; problem: string; solution: string; beneficiaries: string;
  sector: string; category: string; district: string; maturity: string; status: string; impact: string; supportNeeded: string;
  owner: string; organization: string; publishedAt: string; version: number; completion: number; views: number; saves: number;
  imageTone: string; evidence: string[]; metrics: Metric[]; milestones: Milestone[];
};
export type Assignment = { id: string; innovationId: string; innovation: string; version: number; expert: string; sector: string; district: string; status: string; dueAt: string; progress: number; score: number };
export type Engagement = { id: string; innovation: string; partner: string; type: string; status: string; createdAt: string; summary: string };
export type Notification = { id: string; title: string; message: string; time: string; read: boolean; type: string };
export type Revision = { id: string; innovation: string; field: string; instruction: string; dueAt: string; status: string };
export type DemoData = {
  roles: Role[];
  demoAccounts: Account[];
  taxonomies: { sectors: string[]; categories: string[]; districts: string[]; maturityLevels: string[]; impactAreas: string[] };
  innovations: Innovation[];
  assignments: Assignment[];
  reviews: Array<Record<string, unknown>>;
  revisions: Revision[];
  engagements: Engagement[];
  notifications: Notification[];
  verifications: Array<Record<string, string | number>>;
  auditLogs: Array<Record<string, string>>;
  criteria: Array<Record<string, unknown>>;
  statistics: { publishedInnovations: number; districtsReached: number; activeExperts: number; collaborationRequests: number; monthlySubmissions: number[]; sectorDistribution: Array<{label:string; value:number}> };
};
