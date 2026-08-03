export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  currentDesignation?: string;
  currentCompany?: string;
  experienceYears?: number;
  skills: string[];
  summary?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  resumeFilePath?: string;
  resumeOriginalFileName?: string;
  source?: string;
  status: string;
  isArchived: boolean;
  experienceDetailsJson?: string;
  educationDetailsJson?: string;
  aiAnalysisJson?: string;
  jobId?: string;
  jobTitle?: string;
  applyToJob?: boolean;
  organization?: {
    id: string;
    name: string;
    type: string;
    email?: string;
    phone?: string;
    website?: string;
    city?: string;
    country?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CandidateExperience {
  company: string;
  title: string;
  start: string;
  end: string;
  isCurrent: boolean;
  description?: string;
}
