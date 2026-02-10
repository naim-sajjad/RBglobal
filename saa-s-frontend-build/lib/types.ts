export interface UserRole {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  pivot: {
    model_type: string;
    model_id: number;
    role_id: number;
  };
}

export interface User {
  id: number;
  tenant_id: string | null; // Legacy - kept for backward compatibility
  is_global_admin: boolean;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
  permissions: string[];
  tenants?: Tenant[]; // Many-to-many relationship
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (tenantName: string, adminName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
}

export interface LoginResponse {
  user: User;
  token: string;
  tenant_id: string | null;
  tenants?: Tenant[]; // All tenants user belongs to
}

export interface RegisterResponse {
  message: string;
  tenant: Tenant;
  user: User;
  access_token: string;
}

export interface Tenant {
  id: string;
  name?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  admin_id?: string;
  data?: any;
  domain?: string;
  domains?: Array<{
    id: number;
    domain: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  tenant_id: string;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface UserWithDetails extends User {
  status?: 'active' | 'inactive';
  assigned_tenant?: Tenant | null;
  assigned_tenants?: Tenant[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role_id?: string | number;
  tenant_id?: string | number; // Single tenant (for backward compatibility)
  tenant_ids?: string[]; // Multiple tenants
  status?: 'active' | 'inactive';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role_id?: string | number;
  tenant_id?: string | number; // Single tenant (for backward compatibility)
  tenant_ids?: string[]; // Multiple tenants
  status?: 'active' | 'inactive';
}

export interface RoleWithDetails extends Role {
  user_count?: number;
  users?: User[];
}

export interface TenantWithDetails extends Tenant {
  user_count?: number;
  users?: User[];
  domain?: string;
  subdomain?: string;
  settings?: Record<string, any>;
}

export interface Driver {
  id: number;
  user_id: number;
  tenant_id?: string;
  // License Information
  license_number?: string;
  license_type?: 'AZ' | 'DZ' | 'G-Class' | 'G1/G2' | 'Other';
  license_other?: string;
  issuing_authority?: string;
  license_expiry_date?: string;
  // Driving Experience
  years_of_experience?: number;
  driving_history?: string;
  // Vehicle Information
  vehicle_types?: string[];
  vehicle_ownership?: 'company-owned' | 'self-owned';
  vehicle_capacity?: string;
  // Route & Shift Details
  route_type?: 'local' | 'regional' | 'long-haul' | 'intercity';
  route_details?: string;
  shift_timing?: 'day' | 'night' | 'rotational';
  pay_type?: 'hourly' | 'per_mile' | 'per_trip' | 'fixed_salary';
  // Compliance Requirements & Documents
  medical_certificate_path?: string;
  license_document_path?: string;
  abstract_document_path?: string;
  cvor_document_path?: string;
  safety_certificate_path?: string;
  background_check_status?: 'pending' | 'completed';
  drug_alcohol_test?: boolean;
  compliance_notes?: string;
  // Status
  status: 'pending_approval' | 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  user?: User;
  tenant?: Tenant;
}

export interface DriverWithDetails extends Driver {
  user?: User;
  tenant?: Tenant;
}

export interface CreateDriverData {
  // User info
  name: string;
  email: string;
  password?: string;
  tenant_id?: string;
  // License Information
  license_number?: string;
  license_type?: 'AZ' | 'DZ' | 'G-Class' | 'G1/G2' | 'Other';
  license_other?: string;
  issuing_authority?: string;
  license_expiry_date?: string;
  // Driving Experience
  years_of_experience?: number;
  driving_history?: string;
  // Vehicle Information
  vehicle_types?: string[];
  vehicle_ownership?: 'company-owned' | 'self-owned';
  vehicle_capacity?: string;
  // Route & Shift Details
  route_type?: 'local' | 'regional' | 'long-haul' | 'intercity';
  route_details?: string;
  shift_timing?: 'day' | 'night' | 'rotational';
  pay_type?: 'hourly' | 'per_mile' | 'per_trip' | 'fixed_salary';
  // Compliance Requirements & Documents
  medical_certificate?: File;
  license_document?: File;
  abstract_document?: File;
  cvor_document?: File;
  safety_certificate?: File;
  background_check_status?: 'pending' | 'completed';
  drug_alcohol_test?: boolean;
  compliance_notes?: string;
  // Status (admin only)
  status?: 'pending_approval' | 'active' | 'inactive' | 'suspended';
}
