export type FitCategory = 'required_technical' | 'responsibilities_seniority' | 'preferred';
export type EvidenceStatus = 'supported' | 'partially_supported' | 'unsupported_evidence';
export type LogisticsStatus = 'compatible' | 'incompatible' | 'needs_confirmation' | 'not_stated';
export interface FitReference { id: string; label: string; text: string }
export interface FitRequirement {
  requirement: string;
  jobQuote: string;
  category: FitCategory;
  status: EvidenceStatus;
  rationale: string;
  references: FitReference[];
}
export interface LogisticsFit {
  requirement: string | null;
  jobQuote: string | null;
  status: LogisticsStatus;
  rationale: string;
  references: FitReference[];
}
export interface FitCategoryBreakdown {
  category: FitCategory;
  label: string;
  weight: number;
  effectiveWeight: number;
  total: number;
  supported: number;
  partial: number;
  unsupported: number;
  earned: number;
  score: number | null;
  contribution: number;
}
export interface FitResult {
  version: 2;
  score: number | null;
  summary: string;
  requirements: FitRequirement[];
  location: LogisticsFit;
  workArrangement: LogisticsFit;
  breakdown: FitCategoryBreakdown[];
  nextActions: string[];
}
