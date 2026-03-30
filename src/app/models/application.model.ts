import { Job } from './job.model';
import { Vendor } from './organization.model';

// ===== JobApplication (matches backend JobApplication entity) =====
export interface JobApplication {
  id: number;
  job: Job;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    currentDesignation?: string;
    currentCompany?: string;
    experienceYears?: number;
    resumeFilePath?: string;
    organization?: {
      id: string;
      name: string;
      type?: string;
      email?: string;
      phone?: string;
      website?: string;
      city?: string;
      country?: string;
    };
  };
  resumeText?: string;
  resumeUrl?: string;
  status: string;
  vendor?: Vendor;
  latestAnalysis?: any;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  currentTitle?: string;
  currentCompany?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_PASSED'
  | 'INTERVIEW_FAILED'
  | 'L1_INTERVIEW'
  | 'L2_INTERVIEW'
  | 'L3_INTERVIEW'
  | 'OFFERED'
  | 'ONBOARDING_IN_PROGRESS'
  | 'ONBOARDED'
  | 'REJECTED'
  | 'DROPPED';

export interface ApplyRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  resumeUrl?: string;
  currentTitle?: string;
  currentCompany?: string;
  experienceYears?: number;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  location?: string;
  candidateId?: number;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}
