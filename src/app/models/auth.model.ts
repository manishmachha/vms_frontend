// ===== Auth Response (from POST /api/v1/auth/login) =====
export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId?: number;
  userType?: string;
}

// ===== Generic API Response wrapper =====
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ===== User (matches backend UserDto) =====
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status?: boolean;
  type?: string; // 'SOLVENTEK' | 'VENDOR'
  role?: string; // 'SUPER_ADMIN' | 'MANAGER' | 'TALENT_ACQUISITION' | 'VENDOR'
  organizationId?: number;
  orgId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Organization moved to separate file

// ===== Request types used by UserService =====
export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  type?: string;
  role?: string;
  organizationId?: number;
}

export type PersonalDetailsRequest = Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>;
export type EmploymentDetailsRequest = Record<string, unknown>;
export type ContactInfoRequest = Record<string, unknown>;
export type BankDetailsRequest = Record<string, unknown>;
export type UpdateManagerRequest = Record<string, unknown>;
export type EmploymentStatusRequest = Record<string, unknown>;
export type ConvertToFteRequest = Record<string, unknown>;

export interface ChangePasswordRequest {
  newPassword: string;
}

export interface UpdateStatusRequest {
  status: boolean;
}
