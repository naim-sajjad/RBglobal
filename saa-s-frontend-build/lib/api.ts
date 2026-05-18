import axios, { AxiosInstance, isAxiosError } from 'axios';
import { LoginResponse, RegisterResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';

/** Driver create/update/register: field names that must be appended as files, not strings */
const DRIVER_MULTIPART_FILE_KEYS = new Set([
  'pcc_document',
  'license_front_image',
  'license_back_image',
  'license_document',
  'abstract_document',
  'cvor_document',
  'safety_certificate',
]);

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
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
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
  async getDrivers(params?: { sort_by?: string; sort_dir?: 'asc' | 'desc' }) {
    const response = await this.client.get('/tenant/drivers', { params });
    return response.data;
  }

  async getDriver(id: string | number) {
    const response = await this.client.get(`/tenant/drivers/${id}`);
    return response.data;
  }

  async getMyDriverProfile() {
    const response = await this.client.get('/tenant/drivers/my-profile');
    return response.data;
  }

  async createDriver(driverData: any) {
    const formData = new FormData();

    // Append all fields to FormData (let axios set multipart boundary)
    Object.keys(driverData).forEach((key) => {
      if (DRIVER_MULTIPART_FILE_KEYS.has(key) && driverData[key] instanceof File) {
        formData.append(key, driverData[key]);
      } else if (key === 'vehicle_types' && Array.isArray(driverData[key])) {
        driverData[key].forEach((type: string) => {
          formData.append('vehicle_types[]', type);
        });
      } else if (driverData[key] !== null && driverData[key] !== undefined) {
        formData.append(key, driverData[key]);
      }
    });

    const response = await this.client.post('/tenant/drivers', formData);
    return response.data;
  }

  async updateDriver(id: string | number, driverData: any) {
    const formData = new FormData();

    // POST: PHP reliably parses multipart file uploads; PUT often leaves $_FILES empty
    Object.keys(driverData).forEach((key) => {
      if (DRIVER_MULTIPART_FILE_KEYS.has(key) && driverData[key] instanceof File) {
        formData.append(key, driverData[key]);
      } else if (key === 'vehicle_types' && Array.isArray(driverData[key])) {
        driverData[key].forEach((type: string) => {
          formData.append('vehicle_types[]', type);
        });
      } else if (key === 'driver_class_id' && driverData[key] === null) {
        formData.append(key, '');
      } else if (driverData[key] !== null && driverData[key] !== undefined) {
        formData.append(key, driverData[key]);
      }
    });

    const response = await this.client.post(`/tenant/drivers/${id}`, formData);
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

    Object.keys(driverData).forEach((key) => {
      if (DRIVER_MULTIPART_FILE_KEYS.has(key) && driverData[key] instanceof File) {
        formData.append(key, driverData[key]);
      } else if (key === 'vehicle_types' && Array.isArray(driverData[key])) {
        driverData[key].forEach((type: string) => {
          formData.append('vehicle_types[]', type);
        });
      } else if (driverData[key] !== null && driverData[key] !== undefined) {
        formData.append(key, driverData[key]);
      }
    });

    const response = await this.client.post('/drivers/register', formData);
    return response.data;
  }

  // Reference Check APIs (tenant-scoped; for drivers)
  async getReferenceChecks(driverId: string | number) {
    const response = await this.client.get(`/tenant/drivers/${driverId}/reference-checks`);
    return response.data;
  }

  async getReferenceCheck(driverId: string | number, referenceCheckId: string) {
    const response = await this.client.get(`/tenant/drivers/${driverId}/reference-checks/${referenceCheckId}`);
    return response.data;
  }

  async createReferenceCheckRequest(driverId: string | number, payload: {
    referee_email?: string;
    reference_request: import('./types').ReferenceRequestData;
    applicant_consent?: import('./types').ApplicantConsentData;
  }) {
    const response = await this.client.post(`/tenant/drivers/${driverId}/reference-checks`, payload);
    return response.data;
  }

  async sendReferenceCheckLink(driverId: string | number, referenceCheckId: string, refereeEmail: string) {
    const response = await this.client.post(`/tenant/drivers/${driverId}/reference-checks/${referenceCheckId}/send-link`, {
      referee_email: refereeEmail,
    });
    return response.data;
  }

  async submitReferenceCheckAsAdmin(driverId: string | number, referenceCheckId: string, formData: import('./types').ReferenceCheckFormData) {
    const response = await this.client.put(`/tenant/drivers/${driverId}/reference-checks/${referenceCheckId}/fill`, {
      form_data: formData,
      filled_by: 'admin',
    });
    return response.data;
  }

  // Employers (clients) & Rate Cards (tenant-scoped)
  async getEmployers(params?: { search?: string; status?: string }) {
    const response = await this.client.get('/tenant/employers', { params });
    return response.data;
  }

  async getEmployer(id: string | number) {
    const response = await this.client.get(`/tenant/employers/${id}`);
    return response.data;
  }

  async createEmployer(data: import('./types').EmployerFormData & { name: string }) {
    const response = await this.client.post('/tenant/employers', data);
    return response.data;
  }

  async updateEmployer(id: string | number, data: import('./types').EmployerFormData) {
    const response = await this.client.put(`/tenant/employers/${id}`, data);
    return response.data;
  }

  async deleteEmployer(id: string | number) {
    const response = await this.client.delete(`/tenant/employers/${id}`);
    return response.data;
  }

  // Driver Classes (pay tiers)
  async getDriverClasses(params?: { status?: string }) {
    const response = await this.client.get('/tenant/driver-classes', { params });
    return response.data;
  }

  async getDriverClass(id: string | number) {
    const response = await this.client.get(`/tenant/driver-classes/${id}`);
    return response.data;
  }

  async createDriverClass(data: import('./types').DriverClassFormData) {
    const response = await this.client.post('/tenant/driver-classes', data);
    return response.data;
  }

  async updateDriverClass(id: string | number, data: Partial<import('./types').DriverClassFormData>) {
    const response = await this.client.put(`/tenant/driver-classes/${id}`, data);
    return response.data;
  }

  async deleteDriverClass(id: string | number) {
    const response = await this.client.delete(`/tenant/driver-classes/${id}`);
    return response.data;
  }

  async getRateCards(employerId: string | number) {
    const response = await this.client.get(`/tenant/employers/${employerId}/rate-cards`);
    return response.data;
  }

  async createRateCard(employerId: string | number, data: import('./types').RateCardFormData) {
    const response = await this.client.post(`/tenant/employers/${employerId}/rate-cards`, data);
    return response.data;
  }

  async getRateCard(employerId: string | number, rateCardId: string | number) {
    const response = await this.client.get(`/tenant/employers/${employerId}/rate-cards/${rateCardId}`);
    return response.data;
  }

  async updateRateCard(employerId: string | number, rateCardId: string | number, data: Partial<import('./types').RateCardFormData>) {
    const response = await this.client.put(`/tenant/employers/${employerId}/rate-cards/${rateCardId}`, data);
    return response.data;
  }

  async duplicateRateCard(employerId: string | number, rateCardId: string | number) {
    const response = await this.client.post(`/tenant/employers/${employerId}/rate-cards/${rateCardId}/duplicate`);
    return response.data;
  }

  async deactivateRateCard(employerId: string | number, rateCardId: string | number) {
    const response = await this.client.post(`/tenant/employers/${employerId}/rate-cards/${rateCardId}/deactivate`);
    return response.data;
  }

  async getEmployerPayItemRates(employerId: string | number) {
    const response = await this.client.get(`/tenant/employers/${employerId}/pay-item-rates`);
    return response.data;
  }

  async updateEmployerPayItemRate(employerId: string | number, payload: { pay_item_template_id: number; rate: number }) {
    const response = await this.client.put(`/tenant/employers/${employerId}/pay-item-rates`, payload);
    return response.data;
  }

  // Pay Item Templates
  async getPayItemTemplates(params?: { active_only?: boolean }) {
    const response = await this.client.get('/tenant/pay-item-templates', { params });
    return response.data;
  }

  async createPayItemTemplate(data: { code: string; name: string; unit: string; is_active?: boolean }) {
    const response = await this.client.post('/tenant/pay-item-templates', data);
    return response.data;
  }

  async getPayItemTemplate(id: string | number) {
    const response = await this.client.get(`/tenant/pay-item-templates/${id}`);
    return response.data;
  }

  async updatePayItemTemplate(id: string | number, data: Partial<{ code: string; name: string; unit: string; is_active: boolean }>) {
    const response = await this.client.put(`/tenant/pay-item-templates/${id}`, data);
    return response.data;
  }

  async deletePayItemTemplate(id: string | number) {
    const response = await this.client.delete(`/tenant/pay-item-templates/${id}`);
    return response.data;
  }

  // Timesheets
  async getTimesheets(params?: {
    driver_id?: number;
    status?: string;
    employer_id?: number;
    week_start_from?: string;
    week_start_to?: string;
  }) {
    const response = await this.client.get('/tenant/timesheets', {
      params,
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    return response.data;
  }

  async createTimesheet(data: { driver_id?: number; week_start_date: string; week_end_date: string }) {
    const response = await this.client.post('/tenant/timesheets', data);
    return response.data;
  }

  async getTimesheet(id: string | number) {
    const response = await this.client.get(`/tenant/timesheets/${id}`);
    return response.data;
  }

  async updateTimesheet(id: string | number, data: Partial<{ notes: string }>) {
    const response = await this.client.put(`/tenant/timesheets/${id}`, data);
    return response.data;
  }

  async deleteTimesheet(id: string | number) {
    const response = await this.client.delete(`/tenant/timesheets/${id}`);
    return response.data;
  }

  async submitTimesheet(id: string | number) {
    const response = await this.client.post(`/tenant/timesheets/${id}/submit`);
    return response.data;
  }

  async approveTimesheet(id: string | number) {
    const response = await this.client.post(`/tenant/timesheets/${id}/approve`);
    return response.data;
  }

  async rejectTimesheet(id: string | number, rejectReason?: string) {
    const response = await this.client.post(`/tenant/timesheets/${id}/reject`, { reject_reason: rejectReason });
    return response.data;
  }

  async markTimesheetPaid(id: string | number) {
    const response = await this.client.post(`/tenant/timesheets/${id}/mark-paid`);
    return response.data;
  }

  async recalculateTimesheet(id: string | number) {
    const response = await this.client.post(`/tenant/timesheets/${id}/recalculate`);
    return response.data;
  }

  async createTimesheetTrip(
    timesheetId: string | number,
    data: {
      employer_id: number;
      trip_date: string;
      trip_number?: string;
      distance: number;
      notes?: string;
      additional_quantities?: Record<string, number>;
    }
  ) {
    const response = await this.client.post(`/tenant/timesheets/${timesheetId}/trips`, data);
    return response.data;
  }

  async updateTimesheetTrip(
    timesheetId: string | number,
    tripId: string | number,
    data: Partial<{
      employer_id: number;
      trip_date: string;
      trip_number: string;
      distance: number;
      notes: string;
      additional_quantities: Record<string, number>;
    }>
  ) {
    const response = await this.client.put(`/tenant/timesheets/${timesheetId}/trips/${tripId}`, data);
    return response.data;
  }

  async adjustTimesheetTrip(
    timesheetId: string | number,
    tripId: string | number,
    data: {
      reason?: string;
      manual_rate_snapshot: any;
      notify_driver?: boolean;
      email_driver?: boolean;
    }
  ) {
    const response = await this.client.post(`/tenant/timesheets/${timesheetId}/trips/${tripId}/adjust`, data);
    return response.data;
  }

  async deleteTimesheetTrip(timesheetId: string | number, tripId: string | number) {
    const response = await this.client.delete(`/tenant/timesheets/${timesheetId}/trips/${tripId}`);
    return response.data;
  }

  async createTimesheetPayItem(
    timesheetId: string | number,
    tripId: string | number,
    data: { pay_item_template_id: number; quantity: number; rate?: number }
  ) {
    const response = await this.client.post(`/tenant/timesheets/${timesheetId}/trips/${tripId}/pay-items`, data);
    return response.data;
  }

  async updateTimesheetPayItem(
    timesheetId: string | number,
    tripId: string | number,
    payItemId: string | number,
    data: { quantity?: number; rate?: number }
  ) {
    const response = await this.client.put(`/tenant/timesheets/${timesheetId}/trips/${tripId}/pay-items/${payItemId}`, data);
    return response.data;
  }

  async deleteTimesheetPayItem(timesheetId: string | number, tripId: string | number, payItemId: string | number) {
    const response = await this.client.delete(`/tenant/timesheets/${timesheetId}/trips/${tripId}/pay-items/${payItemId}`);
    return response.data;
  }

  // Client billing (employer invoices)
  async previewClientInvoice(data: {
    employer_id: number;
    start_date: string;
    end_date: string;
    driver_id?: number;
  }) {
    const response = await this.client.post('/tenant/billing/invoice-preview', data);
    return response.data;
  }

  async getClientInvoices(params?: { employer_id?: number; status?: string; per_page?: number }) {
    const response = await this.client.get('/tenant/billing/invoices', { params });
    return response.data;
  }

  async createClientInvoice(data: {
    employer_id: number;
    start_date: string;
    end_date: string;
    tax_rate: number;
    notes?: string;
    driver_id?: number;
  }) {
    const response = await this.client.post('/tenant/billing/invoices', data);
    return response.data;
  }

  async getClientInvoice(id: string | number) {
    const response = await this.client.get(`/tenant/billing/invoices/${id}`);
    return response.data;
  }

  async updateClientInvoice(id: string | number, data: { invoice_number?: string; notes?: string }) {
    const response = await this.client.patch(`/tenant/billing/invoices/${id}`, data);
    return response.data;
  }

  async updateClientInvoiceStatus(id: string | number, status: string) {
    const response = await this.client.patch(`/tenant/billing/invoices/${id}/status`, { status });
    return response.data;
  }

  async recordClientInvoicePayment(
    id: string | number,
    data: { amount: number; payment_date: string; reference?: string }
  ) {
    const response = await this.client.post(`/tenant/billing/invoices/${id}/payments`, data);
    return response.data;
  }

  private parseFilenameFromContentDisposition(header: string | undefined): string | null {
    if (!header || typeof header !== 'string') return null;
    const utf8 = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
    if (utf8?.[1]) {
      try {
        return decodeURIComponent(utf8[1].replace(/\+/g, ' '));
      } catch {
        /* ignore */
      }
    }
    const quoted = /filename="((?:\\.|[^"\\])*)"/i.exec(header);
    if (quoted?.[1]) return quoted[1].replace(/\\"/g, '"');
    const simple = /filename=([^;\s]+)/i.exec(header);
    if (simple?.[1]) return simple[1].replace(/^["']|["']$/g, '');
    return null;
  }

  private async downloadPdf(path: string, fallbackFilename: string): Promise<void> {
    try {
      const response = await this.client.get(path, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });
      const blob = response.data as Blob;
      const cd = response.headers['content-disposition'] as string | undefined;
      const filename = this.parseFilenameFromContentDisposition(cd) ?? fallbackFilename;
      const url = window.URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        window.URL.revokeObjectURL(url);
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data instanceof Blob) {
        const t = await err.response.data.text();
        let msg = 'PDF download failed';
        try {
          const j = JSON.parse(t) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          /* keep default */
        }
        throw new Error(msg);
      }
      throw err;
    }
  }

  async downloadInvoicePdf(id: string | number, invoiceNumber?: string | null) {
    const label = invoiceNumber ? String(invoiceNumber).replace(/[^\w.-]+/g, '_') : id;
    await this.downloadPdf(`/tenant/billing/invoices/${id}/pdf`, `invoice-${label}.pdf`);
  }

  async downloadPayslipPdf(payslipId: string | number) {
    await this.downloadPdf(`/tenant/payroll/payslips/${payslipId}/pdf`, `payslip-${payslipId}.pdf`);
  }

  async downloadPayslipInvoicePdf(payslipId: string | number) {
    await this.downloadPdf(
      `/tenant/payroll/payslips/${payslipId}/invoice-pdf`,
      `payslip-invoice-${payslipId}.pdf`
    );
  }

  async downloadRemittancePdf(payslipId: string | number) {
    await this.downloadPdf(`/tenant/payroll/payslips/${payslipId}/remittance-pdf`, `remittance-${payslipId}.pdf`);
  }

  async downloadDriverCalculationPdf(calculationId: string | number) {
    await this.downloadPdf(
      `/tenant/payroll/driver-calculations/${calculationId}/pdf`,
      `driver-calculation-${calculationId}.pdf`
    );
  }

  // Driver payroll
  async getTenantCompanyProfile() {
    const response = await this.client.get('/tenant/company-profile');
    return response.data;
  }

  async putTenantCompanyProfile(data: {
    company_legal_name: string;
    company_address: string;
    company_phone?: string;
    company_email?: string;
    pay_stub_cc_emails?: string;
  }) {
    const response = await this.client.put('/tenant/company-profile', data);
    return response.data;
  }

  async getPayrollBillingTaxSettings() {
    const response = await this.client.get('/tenant/payroll/billing-tax-settings');
    return response.data;
  }

  async putPayrollBillingTaxSettings(data: { taxes: Array<{ name: string; type: 'percentage' | 'fixed'; value: number }> }) {
    const response = await this.client.put('/tenant/payroll/billing-tax-settings', data);
    return response.data;
  }

  async previewPayrollCalculation(data: {
    period_start: string;
    period_end: string;
    vacation_percent?: number;
    default_deductions?: number;
  }) {
    const response = await this.client.post('/tenant/payroll/calculation-preview', data);
    return response.data;
  }

  async generatePayroll(data: {
    period_start: string;
    period_end: string;
    vacation_percent?: number;
    default_deductions?: number;
  }) {
    const response = await this.client.post('/tenant/payroll/generate', data);
    return response.data;
  }

  async getPayslips(params?: { driver_id?: number; status?: string; per_page?: number }) {
    const response = await this.client.get('/tenant/payroll/payslips', { params });
    return response.data;
  }

  async getPayslip(id: string | number) {
    const response = await this.client.get(`/tenant/payroll/payslips/${id}`);
    return response.data;
  }

  async deletePayslip(id: string | number) {
    const response = await this.client.delete(`/tenant/payroll/payslips/${id}`);
    return response.data;
  }

  async recordRemittance(
    payslipId: string | number,
    data: { amount_paid: number; payment_date: string; reference?: string }
  ) {
    const response = await this.client.post(`/tenant/payroll/payslips/${payslipId}/remittances`, data);
    return response.data;
  }

  async sendPayStubEmail(payslipId: string | number) {
    const response = await this.client.post(`/tenant/payroll/payslips/${payslipId}/email-pay-stub`);
    return response.data as { message: string };
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();

/** Public API for referee form (no auth; used with token in link) */
export async function getReferenceCheckByToken(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';
  const { data } = await axios.get(`${baseUrl}/reference-check/${token}`);
  return data;
}

export async function submitReferenceCheckByToken(token: string, formData: import('./types').ReferenceCheckFormData) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';
  const { data } = await axios.post(`${baseUrl}/reference-check/${token}/submit`, { form_data: formData });
  return data;
}
