import {
  Assessment,
  AssessmentCalculationInput,
  AssessmentCalculationResult,
  AuthSession,
  Diet,
  License,
  Message,
  PatientProfile,
  User,
} from '../types.ts';

const TOKEN_KEY = 'nutrigestao_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }
    return data as T;
  },

  // Auth
  async login(email: string, password: string):Promise<{ message: string; session: AuthSession }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(formData: any): Promise<{ message: string; session: AuthSession }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  async googleLogin(googleData: any): Promise<{ message: string; session: AuthSession }> {
    return this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });
  },

  async getMe(): Promise<AuthSession> {
    return this.request('/api/auth/me');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Calculator preview
  async previewCalculation(input: AssessmentCalculationInput): Promise<AssessmentCalculationResult> {
    return this.request('/api/calc/preview', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Patients
  async getPatients(): Promise<PatientProfile[]> {
    return this.request('/api/patients');
  },

  async getPatient(id: string): Promise<PatientProfile> {
    return this.request(`/api/patients/${id}`);
  },

  async createPatient(data: any): Promise<{ message: string; patient: PatientProfile }> {
    return this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePatient(id: string, data: any): Promise<{ message: string; patient: PatientProfile }> {
    return this.request(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePatient(id: string): Promise<{ message: string }> {
    return this.request(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  },

  // Assessments
  async getAssessments(patientId: string): Promise<Assessment[]> {
    return this.request(`/api/patients/${patientId}/assessments`);
  },

  async createAssessment(patientId: string, data: any): Promise<{ message: string; assessment: Assessment }> {
    return this.request(`/api/patients/${patientId}/assessments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAssessment(id: string): Promise<{ message: string }> {
    return this.request(`/api/assessments/${id}`, {
      method: 'DELETE',
    });
  },

  // Diets
  async getDiets(patientId: string): Promise<Diet[]> {
    return this.request(`/api/patients/${patientId}/diets`);
  },

  async createDiet(patientId: string, data: any): Promise<{ message: string; diet: Diet }> {
    return this.request(`/api/patients/${patientId}/diets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDiet(id: string, data: any): Promise<{ message: string; diet: Diet }> {
    return this.request(`/api/diets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteDiet(id: string): Promise<{ message: string }> {
    return this.request(`/api/diets/${id}`, {
      method: 'DELETE',
    });
  },

  // Evolution
  async getEvolution(patientId: string): Promise<{
    patient: PatientProfile;
    assessmentsCount: number;
    timeSeries: any[];
    currentAssessment: Assessment | null;
    previousAssessment: Assessment | null;
    comparison: any | null;
  }> {
    return this.request(`/api/patients/${patientId}/evolution`);
  },

  // Chat
  async getMessages(patientId: string): Promise<Message[]> {
    return this.request(`/api/messages/${patientId}`);
  },

  async sendMessage(patientId: string, content: string): Promise<Message> {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ patientId, content }),
    });
  },

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    return this.request('/api/dashboard/stats');
  },

  // License
  async getLicense(): Promise<License> {
    return this.request('/api/license');
  },

  async toggleLicense(status?: string, type?: string): Promise<{ message: string; license: License }> {
    return this.request('/api/license/toggle', {
      method: 'PUT',
      body: JSON.stringify({ status, type }),
    });
  },

  // Profile & Password
  async updateProfile(data: any): Promise<{ message: string }> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return this.request('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
