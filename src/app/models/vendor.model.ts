// ===== Vendor (matches backend VendorDto) =====
export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  type?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}
