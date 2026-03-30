export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Organization {
  id: number;
  name: string;
  orgType: 'SOLVENTEK' | 'VENDOR';
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

// Alias for transition and backward compatibility in components
export type Vendor = Organization;
