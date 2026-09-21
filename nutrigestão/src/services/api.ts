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
import { clientStorage } from './clientStorage.ts';
import { calculateComposition } from '../utils/calc.ts';

const TOKEN_KEY = 'nutriflow_auth_token';
const LEGACY_TOKEN_KEY = 'nutrigestao_auth_token';

let serverAvailable: boolean | null = null;

async function checkServerHealth(): Promise<boolean> {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      serverAvailable = data?.status === 'ok';
      return serverAvailable;
    }
    serverAvailable = false;
    return false;
  } catch {
    serverAvailable = false;
    return false;
  }
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
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

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers,
      });

      const contentType = res.headers.get('content-type') || '';

      // If server returned HTML (e.g. Vercel SPA index.html fallback for missing API route)
      if (contentType.includes('text/html')) {
        serverAvailable = false;
        throw new Error('API_HTML_FALLBACK');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }
      serverAvailable = true;
      return data as T;
    } catch (err: any) {
      if (err.message === 'API_HTML_FALLBACK' || err.name === 'AbortError' || err.message?.includes('Failed to fetch')) {
        serverAvailable = false;
      }
      throw err;
    }
  },

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  async login(email: string, password: string): Promise<{ message: string; session: AuthSession }> {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    try {
      return await this.request<{ message: string; session: AuthSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        console.info('[NutriFlow] Usando persistência local para login (modo Vercel / Offline)');
        return clientStorage.login(cleanEmail, password);
      }
      throw err;
    }
  },

  async register(formData: any): Promise<{ message: string; session: AuthSession }> {
    try {
      const cleanData = {
        ...formData,
        email: formData.email ? formData.email.trim().toLowerCase() : '',
        name: formData.name ? formData.name.trim() : '',
      };
      return await this.request<{ message: string; session: AuthSession }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(cleanData),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        console.info('[NutriFlow] Usando persistência local para cadastro (modo Vercel / Offline)');
        return clientStorage.register(formData);
      }
      throw err;
    }
  },

  async googleLogin(googleData: any): Promise<{ message: string; session: AuthSession }> {
    try {
      return await this.request<{ message: string; session: AuthSession }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(googleData),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.googleLogin(googleData);
      }
      throw err;
    }
  },

  async getMe(): Promise<AuthSession> {
    const token = this.getToken();
    try {
      return await this.request<AuthSession>('/api/auth/me');
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.getMe(token);
      }
      throw err;
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.forgotPassword(email);
      }
      throw err;
    }
  },

  async changeFirstPassword(newPassword: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>('/api/auth/first-access-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const me = await this.getMe();
        await clientStorage.changeFirstPassword(me.user.id, newPassword);
        return { message: 'Senha inicial definida com sucesso!' };
      }
      throw err;
    }
  },

  // ==========================================
  // CALCULATION PREVIEW
  // ==========================================

  async previewCalculation(input: AssessmentCalculationInput): Promise<AssessmentCalculationResult> {
    try {
      return await this.request<AssessmentCalculationResult>('/api/calc/preview', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      // Local calculation fallback
      return calculateComposition(input);
    }
  },

  // ==========================================
  // PATIENTS
  // ==========================================

  async getPatients(): Promise<PatientProfile[]> {
    try {
      return await this.request<PatientProfile[]>('/api/patients');
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        try {
          const session = await this.getMe();
          if (session.nutritionist?.id) {
            return clientStorage.getPatients(session.nutritionist.id);
          }
          return [];
        } catch {
          return [];
        }
      }
      throw err;
    }
  },

  async getPatient(id: string): Promise<PatientProfile> {
    try {
      return await this.request<PatientProfile>(`/api/patients/${id}`);
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.getPatient(id);
      }
      throw err;
    }
  },

  async createPatient(
    data: any
  ): Promise<{ message: string; patient: PatientProfile; temporaryPassword?: string; invitation?: any }> {
    try {
      return await this.request<{
        message: string;
        patient: PatientProfile;
        temporaryPassword?: string;
        invitation?: any;
      }>('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const session = await this.getMe();
        const nutriId = session.nutritionist?.id;
        if (!nutriId) throw new Error('Nutricionista não identificado na sessão atual.');
        const result = await clientStorage.createPatient(nutriId, data);
        return {
          message: 'Paciente cadastrado com sucesso! Convite com senha provisória gerado.',
          patient: result.patient,
          temporaryPassword: result.temporaryPassword,
          invitation: {
            patientId: result.patient.id,
            patientName: result.patient.user.name,
            email: result.patient.user.email,
            temporaryPassword: result.temporaryPassword,
            sentAt: new Date().toISOString(),
            status: 'PENDENTE',
          },
        };
      }
      throw err;
    }
  },

  async getPatientInvitation(patientId: string): Promise<any> {
    try {
      return await this.request<any>(`/api/patients/${patientId}/invitation`);
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.getPatientInvitation(patientId);
      }
      throw err;
    }
  },

  async updatePatient(id: string, data: any): Promise<{ message: string; patient: PatientProfile }> {
    try {
      return await this.request<{ message: string; patient: PatientProfile }>(`/api/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const patient = await clientStorage.updatePatient(id, data);
        return { message: 'Paciente atualizado com sucesso!', patient };
      }
      throw err;
    }
  },

  async deletePatient(id: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/api/patients/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        await clientStorage.deletePatient(id);
        return { message: 'Paciente removido com sucesso!' };
      }
      throw err;
    }
  },

  // ==========================================
  // ASSESSMENTS
  // ==========================================

  async getAssessments(patientId: string): Promise<Assessment[]> {
    try {
      return await this.request<Assessment[]>(`/api/patients/${patientId}/assessments`);
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.getAssessments(patientId);
      }
      throw err;
    }
  },

  async createAssessment(patientId: string, data: any): Promise<{ message: string; assessment: Assessment }> {
    try {
      return await this.request<{ message: string; assessment: Assessment }>(`/api/patients/${patientId}/assessments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const session = await this.getMe();
        const nutriId = session.nutritionist?.id || 'nutri-carlos';
        const assessment = await clientStorage.createAssessment(patientId, nutriId, data);
        return { message: 'Avaliação física registrada com sucesso!', assessment };
      }
      throw err;
    }
  },

  async deleteAssessment(id: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/api/assessments/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      return { message: 'Avaliação removida.' };
    }
  },

  // ==========================================
  // DIETS
  // ==========================================

  async getDiets(patientId: string): Promise<Diet[]> {
    try {
      return await this.request<Diet[]>(`/api/patients/${patientId}/diets`);
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.getDiets(patientId);
      }
      throw err;
    }
  },

  async createDiet(patientId: string, data: any): Promise<{ message: string; diet: Diet }> {
    try {
      return await this.request<{ message: string; diet: Diet }>(`/api/patients/${patientId}/diets`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const session = await this.getMe();
        const nutriId = session.nutritionist?.id || 'nutri-carlos';
        const diet = await clientStorage.createDiet(patientId, nutriId, data);
        return { message: 'Plano nutricional criado com sucesso!', diet };
      }
      throw err;
    }
  },

  async updateDiet(id: string, data: any): Promise<{ message: string; diet: Diet }> {
    try {
      return await this.request<{ message: string; diet: Diet }>(`/api/diets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const diet = await clientStorage.updateDiet(id, data);
        return { message: 'Plano nutricional atualizado!', diet };
      }
      throw err;
    }
  },

  async deleteDiet(id: string): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/api/diets/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      return { message: 'Dieta removida.' };
    }
  },

  // ==========================================
  // EVOLUTION
  // ==========================================

  async getEvolution(patientId: string): Promise<{
    patient: PatientProfile;
    assessmentsCount: number;
    timeSeries: any[];
    currentAssessment: Assessment | null;
    previousAssessment: Assessment | null;
    comparison: any | null;
  }> {
    try {
      return await this.request<{
        patient: PatientProfile;
        assessmentsCount: number;
        timeSeries: any[];
        currentAssessment: Assessment | null;
        previousAssessment: Assessment | null;
        comparison: any | null;
      }>(`/api/patients/${patientId}/evolution`);
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const patient = await clientStorage.getPatient(patientId);
        const evolution = await clientStorage.getEvolution(patientId);
        return {
          patient,
          assessmentsCount: evolution.totalAssessments,
          timeSeries: evolution.history,
          currentAssessment: evolution.latestAssessment || null,
          previousAssessment: evolution.firstAssessment || null,
          comparison: evolution.summary,
        };
      }
      throw err;
    }
  },

  // ==========================================
  // CHAT & MESSAGES
  // ==========================================

  async getMessages(patientId: string): Promise<Message[]> {
    try {
      return await this.request<Message[]>(`/api/messages/${patientId}`);
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        return clientStorage.getMessages(patientId);
      }
      throw err;
    }
  },

  async sendMessage(patientId: string, content: string): Promise<Message> {
    try {
      return await this.request<Message>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ patientId, content }),
      });
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        const session = await this.getMe();
        const role = session.user.role;
        const senderId = session.user.id;
        return clientStorage.sendMessage(patientId, role, senderId, content);
      }
      throw err;
    }
  },

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  async getDashboardStats(): Promise<any> {
    try {
      return await this.request<any>('/api/dashboard/stats');
    } catch (err: any) {
      if (!serverAvailable || err.message === 'API_HTML_FALLBACK' || err.message?.includes('Failed to fetch')) {
        try {
          const session = await this.getMe();
          if (session.user.role === 'NUTRICIONISTA' && session.nutritionist?.id) {
            return clientStorage.getDashboardStats(session.nutritionist.id);
          } else if (session.patient?.id) {
            return clientStorage.getPatientDashboardStats(session.patient.id);
          }
          return { totalPatients: 0, activeDiets: 0, totalAssessments: 0, retentionRate: 0 };
        } catch {
          return { totalPatients: 0, activeDiets: 0, totalAssessments: 0, retentionRate: 0 };
        }
      }
      throw err;
    }
  },

  // ==========================================
  // LICENSE
  // ==========================================

  async getLicense(): Promise<License> {
    try {
      return await this.request<License>('/api/license');
    } catch (err: any) {
      try {
        const session = await this.getMe();
        if (session.license) return session.license;
      } catch {}
      return {
        id: 'lic-default',
        nutritionistId: 'nutri-current',
        type: 'CRN Regular',
        status: 'ATIVA',
        licenseNumber: 'CRN Regular',
        startDate: '2025-01-01',
        expirationDate: '2026-12-31',
        createdAt: '2025-01-01',
      };
    }
  },

  async toggleLicense(status?: string, type?: string): Promise<{ message: string; license: License }> {
    try {
      return await this.request<{ message: string; license: License }>('/api/license/toggle', {
        method: 'PUT',
        body: JSON.stringify({ status, type }),
      });
    } catch (err: any) {
      const session = await this.getMe();
      const nutriId = session.nutritionist?.id || 'nutri-carlos';
      const res = await clientStorage.toggleLicense(nutriId, (status as any) || 'ATIVA');
      return { message: 'Status da licença atualizado com sucesso!', license: res.license! };
    }
  },

  // ==========================================
  // PROFILE & PASSWORD
  // ==========================================

  async updateProfile(data: any): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      const session = await this.getMe();
      await clientStorage.updateProfile(session.user.id, data);
      return { message: 'Perfil atualizado com sucesso!' };
    }
  },

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>('/api/profile/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      const session = await this.getMe();
      await clientStorage.updatePassword(session.user.id, data.currentPassword, data.newPassword);
      return { message: 'Senha alterada com sucesso!' };
    }
  },
};
