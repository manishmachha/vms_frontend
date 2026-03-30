// ===== Project =====
export interface Project {
  id: number;
  name: string;
  description?: string;
  clientId?: number;
  client?: {
    id: number;
    name: string;
  };
  internalOrg?: {
    id: number;
    name: string;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED';
  startDate?: string;
  endDate?: string;
  allocations?: ProjectAllocation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectAllocation {
  id: number;
  candidateId?: number;
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  candidateDetails?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  startDate: string;
  endDate?: string;
  allocationPercentage: number;
  billingRole?: string;
  status: 'ACTIVE' | 'ENDED' | 'PLANNED';
}

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}
