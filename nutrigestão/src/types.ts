export type UserRole = 'NUTRICIONISTA' | 'PACIENTE';

export type LicenseStatus = 'ATIVA' | 'INATIVA' | 'EXPIRADA' | 'SUSPENSA';

export type LicenseType = 'CRN Regular' | 'Especialista' | 'Clínica Pro';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface License {
  id: string;
  nutritionistId: string;
  type: LicenseType;
  status: LicenseStatus;
  licenseNumber: string;
  startDate: string;
  expirationDate: string;
  createdAt: string;
}

export interface NutritionistProfile {
  id: string;
  userId: string;
  licenseStatus: LicenseStatus;
  licenseType: LicenseType;
  licenseNumber: string;
  licenseStart: string;
  licenseExpiration: string;
  crn: string;
  specialty?: string;
  phone?: string;
  clinicName?: string;
  user: User;
}

export interface PatientProfile {
  id: string;
  userId: string;
  nutritionistId: string;
  birthDate: string;
  gender: 'M' | 'F';
  height: number; // in cm
  phone?: string;
  notes?: string;
  currentWeight?: number;
  currentBodyFat?: number;
  currentBmi?: number;
  lastAssessmentDate?: string;
  user: User;
}

export type AssessmentProtocol =
  | 'Pollock 7 Dobras'
  | 'Pollock 3 Dobras'
  | 'Faulkner 4 Dobras'
  | 'Petroski 4 Dobras'
  | 'Guedes 3 Dobras'
  | 'Bioimpedância / Básico'
  | 'pollock_7'
  | 'pollock_3'
  | 'faulkner_4'
  | 'petroski_4'
  | 'guedes_3'
  | 'basico';

export type SkinfoldType =
  | 'triceps'
  | 'biceps'
  | 'subscapular'
  | 'suprailiac'
  | 'abdominal'
  | 'chest'
  | 'midaxillary'
  | 'thigh'
  | 'calf';

export interface SkinfoldMeasurement {
  id: string;
  assessmentId: string;
  skinfoldType: SkinfoldType;
  value: number; // mm
}

export interface Assessment {
  id: string;
  patientId: string;
  nutritionistId: string;
  protocol: AssessmentProtocol;
  weight: number; // kg
  height: number; // cm
  bmi: number;
  bmiClassification: string;
  bodyFatPercentage: number;
  fatMass: number; // kg
  leanMass: number; // kg
  bodyDensity?: number;
  skinfoldsSum?: number;
  skinfolds: Record<string, number>;
  assessmentDate: string;
  notes?: string;
  createdAt: string;
}

export interface Food {
  id: string;
  mealId: string;
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface Meal {
  id: string;
  dietId: string;
  name: string;
  time: string;
  notes?: string;
  orderIndex: number;
  foods: Food[];
}

export interface Diet {
  id: string;
  patientId: string;
  nutritionistId: string;
  title: string;
  objective: string;
  notes?: string;
  startDate: string;
  endDate?: string;
  status: 'ATIVA' | 'INATIVA' | 'CONCLUÍDA';
  meals: Meal[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  patientId: string;
  content: string;
  readAt?: string | null;
  createdAt: string;
  senderName?: string;
  senderRole?: UserRole;
}

export interface AuthSession {
  user: User;
  token: string;
  nutritionist?: NutritionistProfile;
  patient?: PatientProfile;
  license?: License;
}

export interface AssessmentCalculationInput {
  gender: 'M' | 'F';
  age: number;
  weight: number; // kg
  height: number; // cm
  protocol: AssessmentProtocol;
  skinfolds: Partial<Record<SkinfoldType, number>>;
}

export interface AssessmentCalculationResult {
  bmi: number;
  bmiClassification: string;
  skinfoldsSum: number;
  bodyDensity?: number;
  bodyFatPercentage: number;
  fatMass: number;
  leanMass: number;
}
