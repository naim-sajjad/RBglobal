import axios, { AxiosInstance } from 'axios';
import { LoginResponse, RegisterResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token and tenant from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      this.tenantId = localStorage.getItem('tenant_id');
    }

    // Add request interceptor
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      // Use X-Tenant header for tenant context (as per Stancl Tenancy middleware)
      if (this.tenantId) {
        config.headers['X-Tenant'] = this.tenantId;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string, tenantId: string | null = null) {
    this.token = token;
    if (tenantId) {
      this.tenantId = tenantId;
      localStorage.setItem('tenant_id', tenantId);
    }
    localStorage.setItem('auth_token', token);
  }

  logout() {
    this.token = null;
    this.tenantId = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_id');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    this.setToken(response.data.token, response.data.tenant_id);
    return response.data;
  }

  async register(tenantName: string, adminName: string, email: string, password: string): Promise<RegisterResponse> {
    const response = await this.client.post<RegisterResponse>('/register', {
      tenant_name: tenantName,
      admin_name: adminName,
      email,
      password,
    });
    return response.data;
  }

  // Permission Management APIs (Tenant-scoped)
  async getPermissions() {
    const response = await this.client.get('/tenant/permissions');
    return response.data;
  }

  async createPermission(permissionData: any) {
    const response = await this.client.post('/tenant/permissions', permissionData);
    return response.data;
  }

  async updatePermission(id: string, permissionData: any) {
    const response = await this.client.put(`/tenant/permissions/${id}`, permissionData);
    return response.data;
  }

  async deletePermission(id: string) {
    const response = await this.client.delete(`/tenant/permissions/${id}`);
    return response.data;
  }

  // User Management APIs (Tenant-scoped)
  async getUsers(params?: { page?: number; per_page?: number; search?: string }) {
    const response = await this.client.get('/tenant/users', { params });
    return response.data;
  }

  async getUser(id: string | number) {
    const response = await this.client.get(`/tenant/users/${id}`);
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.client.post('/tenant/users', userData);
    return response.data;
  }

  async updateUser(id: string | number, userData: any) {
    const response = await this.client.put(`/tenant/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string | number) {
    const response = await this.client.delete(`/tenant/users/${id}`);
    return response.data;
  }

  async resetUserPassword(id: string | number) {
    const response = await this.client.post(`/tenant/users/${id}/reset-password`);
    return response.data;
  }

  // Role Management APIs (Tenant-scoped)
  async getRoles() {
    const response = await this.client.get('/tenant/roles');
    return response.data;
  }

  async getRole(id: string | number) {
    const response = await this.client.get(`/tenant/roles/${id}`);
    return response.data;
  }

  async createRole(roleData: any) {
    const response = await this.client.post('/tenant/roles', roleData);
    return response.data;
  }

  async updateRole(id: string | number, roleData: any) {
    const response = await this.client.put(`/tenant/roles/${id}`, roleData);
    return response.data;
  }

  async deleteRole(id: string | number) {
    const response = await this.client.delete(`/tenant/roles/${id}`);
    return response.data;
  }

  // Tenant Management APIs (Global - Super Admin only)
  async getTenants() {
    const response = await this.client.get('/tenants');
    return response.data;
  }

  async getTenant(id: string | number) {
    const response = await this.client.get(`/tenants/${id}`);
    return response.data;
  }

  async createTenant(tenantData: any) {
    const response = await this.client.post('/tenants', tenantData);
    return response.data;
  }

  async updateTenant(id: string | number, tenantData: any) {
    const response = await this.client.put(`/tenants/${id}`, tenantData);
    return response.data;
  }

  async deleteTenant(id: string | number) {
    const response = await this.client.delete(`/tenants/${id}`);
    return response.data;
  }

  // Driver Management APIs
  async getDrivers() {
    const response = await this.client.get('/tenant/drivers');
    return response.data;
  }

  async getDriver(id: string | number) {
    const response = await this.client.get(`/tenant/drivers/${id}`);
    return response.data;
  }

  async createDriver(driverData: any) {
    const formData = new FormData();
    
    // Document fields that should be uploaded as files
    const documentFields = [
      'medical_certificate',
      'license_document',
      'abstract_document',
      'cvor_document',
      'safety_certificate',
    ];
    
    // Append all fields to FormData
    Object.keys(driverData).forEach((key) => {
      if (documentFields.includes(key) && driverData[key] instanceof File) {
        formData.append(key, driverData[key]);
      } else if (key === 'vehicle_types' && Array.isArray(driverData[key])) {
        driverData[key].forEach((type: string) => {
          formData.append('vehicle_types[]', type);
        });
      } else if (driverData[key] !== null && driverData[key] !== undefined) {
        formData.append(key, driverData[key]);
      }
    });

    const response = await this.client.post('/tenant/drivers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateDriver(id: string | number, driverData: any) {
    const formData = new FormData();
    
    // Document fields that should be uploaded as files
    const documentFields = [
      'medical_certificate',
      'license_document',
      'abstract_document',
      'cvor_document',
      'safety_certificate',
    ];
    
    // Append all fields to FormData
    Object.keys(driverData).forEach((key) => {
      if (documentFields.includes(key) && driverData[key] instanceof File) {
        formData.append(key, driverData[key]);
      } else if (key === 'vehicle_types' && Array.isArray(driverData[key])) {
        driverData[key].forEach((type: string) => {
          formData.append('vehicle_types[]', type);
        });
      } else if (driverData[key] !== null && driverData[key] !== undefined) {
        formData.append(key, driverData[key]);
      }
    });

    const response = await this.client.put(`/tenant/drivers/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteDriver(id: string | number) {
    const response = await this.client.delete(`/tenant/drivers/${id}`);
    return response.data;
  }

  async approveDriver(id: string | number) {
    const response = await this.client.post(`/tenant/drivers/${id}/approve`);
    return response.data;
  }

  // Public driver self-registration
  async registerDriver(driverData: any) {
    const formData = new FormData();
    
    // Document fields that should be uploaded as files
    const documentFields = [
      'medical_certificate',
      'license_document',
      'abstract_document',
      'cvor_document',
      'safety_certificate',
    ];
    
    // Append all fields to FormData
    Object.keys(driverData).forEach((key) => {
      if (documentFields.includes(key) && driverData[key] instanceof File) {
        formData.append(key, driverData[key]);
      } else if (key === 'vehicle_types' && Array.isArray(driverData[key])) {
        driverData[key].forEach((type: string) => {
          formData.append('vehicle_types[]', type);
        });
      } else if (driverData[key] !== null && driverData[key] !== undefined) {
        formData.append(key, driverData[key]);
      }
    });

    const response = await this.client.post('/drivers/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();
