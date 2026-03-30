// ===== Client (maps to backend OrganizationDto) =====
export interface Client {
  id: number;
  name: string;
  type?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  contactPerson?: string;
  industry?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
