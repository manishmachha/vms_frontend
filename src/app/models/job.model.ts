import { Organization } from './organization.model';

// ===== Job Status (matches backend JobStatus enum) =====
export type JobStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ADMIN_VERIFIED'
  | 'TA_ENRICHED'
  | 'ADMIN_FINAL_VERIFIED'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';

// ===== Employment Type (matches backend EmploymentType enum) =====
export type EmploymentType = 'FTE' | 'C2H' | 'CONTRACT';

// ===== Job (matches backend Job entity) =====
export interface Job {
  id: number;
  title: string;
  description?: string;
  requirements?: string;
  rolesAndResponsibilities?: string;
  experience?: string;
  skills?: string;
  location?: string;
  status: JobStatus;
  employmentType?: EmploymentType;
  billRate?: number;
  payRate?: number;
  aiInsights?: Record<string, unknown>;
  organization?: Organization;
  createdAt?: string;
  updatedAt?: string;
}

// ===== Request types for Job operations =====
export interface JobCreateRequest {
  title: string;
  description?: string;
  employmentType?: string;
  requirements?: string;
  rolesAndResponsibilities?: string;
  experience?: string;
  skills?: string;
  billRate?: number;
  payRate?: number;
  status?: string;
}

export interface JobEnrichRequest {
  requirements: string;
  rolesAndResponsibilities: string;
  experience: string;
  skills: string;
}

export interface JobFinalVerifyRequest {
  billRate?: number;
  payRate?: number;
}
