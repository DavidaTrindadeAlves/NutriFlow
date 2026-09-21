import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  NutritionistProfile,
  PatientProfile,
  License,
  Assessment,
  Diet,
  Meal,
  Food,
  Message,
} from '../src/types.ts';

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  nutritionists: NutritionistProfile[];
  patients: PatientProfile[];
  licenses: License[];
  assessments: Assessment[];
  diets: Diet[];
  messages: Message[];
}

import os from 'os';

function getStoragePaths(): { dataDir: string; dbFile: string } {
  // If running on Vercel or read-only filesystem, use /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join(os.tmpdir(), 'nutrigestao_data');
    return { dataDir: tmpDir, dbFile: path.join(tmpDir, 'nutrigestao_db.json') };
  }

  const defaultDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(defaultDir, '.write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return { dataDir: defaultDir, dbFile: path.join(defaultDir, 'nutrigestao_db.json') };
  } catch {
    // Fall back to os.tmpdir() if current working dir is read-only
    const tmpDir = path.join(os.tmpdir(), 'nutrigestao_data');
    return { dataDir: tmpDir, dbFile: path.join(tmpDir, 'nutrigestao_db.json') };
  }
}

const { dataDir: DATA_DIR, dbFile: DB_FILE } = getStoragePaths();

let dbMemory: DatabaseSchema | null = null;

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data directory, running in memory:', err);
  }
}

function saveDb(): void {
  if (!dbMemory) return;
  try {
    ensureDataDir();
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(dbMemory, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.warn('Persistence write warning (continuing with in-memory state):', err);
  }
}

function seedDefaultData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync('password123', salt);

  const now = new Date().toISOString();
  const dateAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const userNutri: User & { passwordHash: string } = {
    id: 'u-nutri-carlos',
    name: 'Dr. Carlos Nutrição',
    email: 'dr.carlos@nutrigestao.com',
    role: 'NUTRICIONISTA',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(180),
    updatedAt: now,
    passwordHash: defaultHash,
  };

  const userMariana: User & { passwordHash: string } = {
    id: 'u-pat-mariana',
    name: 'Mariana Silva',
    email: 'mariana.silva@email.com',
    role: 'PACIENTE',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(90),
    updatedAt: now,
    passwordHash: defaultHash,
  };

  const userLucas: User & { passwordHash: string } = {
    id: 'u-pat-lucas',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@email.com',
    role: 'PACIENTE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(60),
    updatedAt: now,
    passwordHash: defaultHash,
  };

  const userJuliana: User & { passwordHash: string } = {
    id: 'u-pat-juliana',
    name: 'Juliana Costa',
    email: 'juliana.costa@email.com',
    role: 'PACIENTE',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(45),
    updatedAt: now,
    passwordHash: defaultHash,
  };

  const licenseId = 'lic-001';
  const license: License = {
    id: licenseId,
    nutritionistId: 'nutri-carlos',
    type: 'Especialista',
    status: 'ATIVA',
    licenseNumber: 'CRN-3 48219/SP',
    startDate: dateAgo(180).split('T')[0],
    expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: dateAgo(180),
  };

  const nutritionist: NutritionistProfile = {
    id: 'nutri-carlos',
    userId: userNutri.id,
    licenseStatus: 'ATIVA',
    licenseType: 'Especialista',
    licenseNumber: 'CRN-3 48219/SP',
    licenseStart: license.startDate,
    licenseExpiration: license.expirationDate,
    crn: 'CRN-3 48219/SP',
    specialty: 'Nutrição Clínica & Esportiva',
    phone: '(11) 98765-4321',
    clinicName: 'Clínica NutriVida',
    user: {
      id: userNutri.id,
      name: userNutri.name,
      email: userNutri.email,
      role: userNutri.role,
      avatar: userNutri.avatar,
      createdAt: userNutri.createdAt,
      updatedAt: userNutri.updatedAt,
    },
  };

  const patientMariana: PatientProfile = {
    id: 'pat-mariana',
    userId: userMariana.id,
    nutritionistId: nutritionist.id,
    birthDate: '1998-05-14',
    gender: 'F',
    height: 168,
    phone: '(11) 97123-8890',
    notes: 'Objetivo: perda de gordura e ganho de massa magra. Pratica musculação 4x na semana.',
    currentWeight: 63.5,
    currentBodyFat: 21.8,
    currentBmi: 22.5,
    lastAssessmentDate: dateAgo(7).split('T')[0],
    user: {
      id: userMariana.id,
      name: userMariana.name,
      email: userMariana.email,
      role: userMariana.role,
      avatar: userMariana.avatar,
      createdAt: userMariana.createdAt,
      updatedAt: userMariana.updatedAt,
    },
  };

  const patientLucas: PatientProfile = {
    id: 'pat-lucas',
    userId: userLucas.id,
    nutritionistId: nutritionist.id,
    birthDate: '1992-09-22',
    gender: 'M',
    height: 180,
    phone: '(11) 98234-5511',
    notes: 'Objetivo: hipertrofia limpa. Treina musculação e joga tênis aos finais de semana.',
    currentWeight: 82.0,
    currentBodyFat: 16.5,
    currentBmi: 25.3,
    lastAssessmentDate: dateAgo(14).split('T')[0],
    user: {
      id: userLucas.id,
      name: userLucas.name,
      email: userLucas.email,
      role: userLucas.role,
      avatar: userLucas.avatar,
      createdAt: userLucas.createdAt,
      updatedAt: userLucas.updatedAt,
    },
  };

  const patientJuliana: PatientProfile = {
    id: 'pat-juliana',
    userId: userJuliana.id,
    nutritionistId: nutritionist.id,
    birthDate: '1984-11-03',
    gender: 'F',
    height: 162,
    phone: '(11) 99122-3344',
    notes: 'Objetivo: controle de glicemia e melhora da disposição geral. Intolerância leve à lactose.',
    currentWeight: 71.0,
    currentBodyFat: 29.2,
    currentBmi: 27.0,
    lastAssessmentDate: dateAgo(20).split('T')[0],
    user: {
      id: userJuliana.id,
      name: userJuliana.name,
      email: userJuliana.email,
      role: userJuliana.role,
      avatar: userJuliana.avatar,
      createdAt: userJuliana.createdAt,
      updatedAt: userJuliana.updatedAt,
    },
  };

  // Historical assessments for Mariana
  const assessments: Assessment[] = [
    {
      id: 'ass-m-1',
      patientId: patientMariana.id,
      nutritionistId: nutritionist.id,
      protocol: 'Pollock 7 Dobras',
      weight: 67.2,
      height: 168,
      bmi: 23.81,
      bmiClassification: 'Eutrofia (Peso normal)',
      bodyFatPercentage: 26.5,
      fatMass: 17.81,
      leanMass: 49.39,
      bodyDensity: 1.0395,
      skinfoldsSum: 135,
      skinfolds: {
        chest: 14,
        midaxillary: 16,
        triceps: 22,
        subscapular: 20,
        abdominal: 24,
        suprailiac: 21,
        thigh: 18,
      },
      assessmentDate: dateAgo(60).split('T')[0],
      notes: 'Avaliação inicial. Dobras abdominais e supra-ilíacas mais evidentes.',
      createdAt: dateAgo(60),
    },
    {
      id: 'ass-m-2',
      patientId: patientMariana.id,
      nutritionistId: nutritionist.id,
      protocol: 'Pollock 7 Dobras',
      weight: 65.0,
      height: 168,
      bmi: 23.03,
      bmiClassification: 'Eutrofia (Peso normal)',
      bodyFatPercentage: 23.9,
      fatMass: 15.54,
      leanMass: 49.46,
      bodyDensity: 1.0452,
      skinfoldsSum: 116,
      skinfolds: {
        chest: 12,
        midaxillary: 14,
        triceps: 19,
        subscapular: 17,
        abdominal: 20,
        suprailiac: 18,
        thigh: 16,
      },
      assessmentDate: dateAgo(30).split('T')[0],
      notes: 'Ótima resposta ao plano inicial. Redução de 2kg de gordura e manutenção de massa magra.',
      createdAt: dateAgo(30),
    },
    {
      id: 'ass-m-3',
      patientId: patientMariana.id,
      nutritionistId: nutritionist.id,
      protocol: 'Pollock 7 Dobras',
      weight: 63.5,
      height: 168,
      bmi: 22.5,
      bmiClassification: 'Eutrofia (Peso normal)',
      bodyFatPercentage: 21.8,
      fatMass: 13.84,
      leanMass: 49.66,
      bodyDensity: 1.0503,
      skinfoldsSum: 101,
      skinfolds: {
        chest: 10,
        midaxillary: 12,
        triceps: 17,
        subscapular: 15,
        abdominal: 17,
        suprailiac: 16,
        thigh: 14,
      },
      assessmentDate: dateAgo(7).split('T')[0],
      notes: 'Evolução constante! Definição aparente no abdômen e aumento de tônus muscular.',
      createdAt: dateAgo(7),
    },
    {
      id: 'ass-l-1',
      patientId: patientLucas.id,
      nutritionistId: nutritionist.id,
      protocol: 'Pollock 3 Dobras',
      weight: 82.0,
      height: 180,
      bmi: 25.31,
      bmiClassification: 'Sobrepeso',
      bodyFatPercentage: 16.5,
      fatMass: 13.53,
      leanMass: 68.47,
      bodyDensity: 1.062,
      skinfoldsSum: 42,
      skinfolds: {
        chest: 11,
        abdominal: 18,
        thigh: 13,
      },
      assessmentDate: dateAgo(14).split('T')[0],
      notes: 'Avaliação inicial para ajuste calórico de ganho muscular.',
      createdAt: dateAgo(14),
    },
  ];

  // Diets with meals and foods
  const diets: Diet[] = [
    {
      id: 'diet-mariana-1',
      patientId: patientMariana.id,
      nutritionistId: nutritionist.id,
      title: 'Plano Nutricional - Definição & Energia',
      objective: 'Déficit calórico moderado com alta ingestão proteica para manutenção de massa muscular.',
      notes: 'Consumir pelo menos 2.5 litros de água diariamente. Não pular a refeição pré-treino.',
      startDate: dateAgo(30).split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ATIVA',
      createdAt: dateAgo(30),
      updatedAt: now,
      meals: [
        {
          id: 'meal-m1',
          dietId: 'diet-mariana-1',
          name: 'Café da Manhã',
          time: '07:30',
          notes: 'Preferir ovos caipiras ou mexidos com pouco azeite.',
          orderIndex: 1,
          foods: [
            { id: 'f-1', mealId: 'meal-m1', name: 'Ovos mexidos', quantity: '2', unit: 'unidades', calories: 156, protein: 12, carbs: 1, fats: 10, notes: 'Com pitada de cúrcuma e orégano' },
            { id: 'f-2', mealId: 'meal-m1', name: 'Pão integral 100%', quantity: '2', unit: 'fatias', calories: 120, protein: 6, carbs: 22, fats: 1.5, notes: 'Tostado' },
            { id: 'f-3', mealId: 'meal-m1', name: 'Mamão papaia', quantity: '1/2', unit: 'unidade', calories: 60, protein: 1, carbs: 15, fats: 0.2, notes: 'Com 1 colher de chia' },
            { id: 'f-4', mealId: 'meal-m1', name: 'Café puro ou c/ leite vegetal', quantity: '200', unit: 'ml', calories: 15, protein: 0.5, carbs: 2, fats: 0.5, notes: 'Sem açúcar refinado' },
          ],
        },
        {
          id: 'meal-m2',
          dietId: 'diet-mariana-1',
          name: 'Lanche da Manhã',
          time: '10:30',
          notes: 'Pode ser levado na bolsa.',
          orderIndex: 2,
          foods: [
            { id: 'f-5', mealId: 'meal-m2', name: 'Castanhas-do-pará', quantity: '3', unit: 'unidades', calories: 99, protein: 2, carbs: 2, fats: 9.5 },
            { id: 'f-6', mealId: 'meal-m2', name: 'Maçã gala ou pera', quantity: '1', unit: 'unidade', calories: 85, protein: 0.5, carbs: 21, fats: 0.3 },
          ],
        },
        {
          id: 'meal-m3',
          dietId: 'diet-mariana-1',
          name: 'Almoço',
          time: '13:00',
          notes: 'Colorir o prato com folhas verde-escuras à vontade.',
          orderIndex: 3,
          foods: [
            { id: 'f-7', mealId: 'meal-m3', name: 'Peito de frango grelhado', quantity: '140', unit: 'g', calories: 230, protein: 42, carbs: 0, fats: 5, notes: 'Temperado com limão e ervas' },
            { id: 'f-8', mealId: 'meal-m3', name: 'Arroz integral cozido', quantity: '4', unit: 'colheres de sopa', calories: 130, protein: 3, carbs: 28, fats: 1 },
            { id: 'f-9', mealId: 'meal-m3', name: 'Feijão carioca', quantity: '1', unit: 'concha média', calories: 95, protein: 6, carbs: 16, fats: 0.8 },
            { id: 'f-10', mealId: 'meal-m3', name: 'Salada crua variada + Azeite EV', quantity: '1', unit: 'prato de sobremesa', calories: 75, protein: 1.5, carbs: 4, fats: 6, notes: 'Rúcula, alface, tomate e 1 col. chá azeite' },
          ],
        },
        {
          id: 'meal-m4',
          dietId: 'diet-mariana-1',
          name: 'Lanche da Tarde / Pré-Treino',
          time: '16:30',
          notes: 'Consumir 45 a 60 minutos antes do treino de força.',
          orderIndex: 4,
          foods: [
            { id: 'f-11', mealId: 'meal-m4', name: 'Iogurte natural desnatado', quantity: '170', unit: 'g', calories: 90, protein: 9, carbs: 11, fats: 0.5 },
            { id: 'f-12', mealId: 'meal-m4', name: 'Whey Protein Isolado', quantity: '25', unit: 'g', calories: 100, protein: 22, carbs: 1, fats: 0.5 },
            { id: 'f-13', mealId: 'meal-m4', name: 'Banana prata fatiada', quantity: '1', unit: 'unidade', calories: 90, protein: 1, carbs: 23, fats: 0.3 },
          ],
        },
        {
          id: 'meal-m5',
          dietId: 'diet-mariana-1',
          name: 'Jantar',
          time: '20:00',
          notes: 'Refeição leve facilitando boa qualidade de sono.',
          orderIndex: 5,
          foods: [
            { id: 'f-14', mealId: 'meal-m5', name: 'Filé de tilápia ou salmão grelhado', quantity: '150', unit: 'g', calories: 190, protein: 38, carbs: 0, fats: 4 },
            { id: 'f-15', mealId: 'meal-m5', name: 'Purê de abóbora cabotiá', quantity: '3', unit: 'colheres de sopa', calories: 70, protein: 2, carbs: 15, fats: 0.5 },
            { id: 'f-16', mealId: 'meal-m5', name: 'Brócolis e cenoura cozidos no vapor', quantity: '1', unit: 'xícara', calories: 45, protein: 3, carbs: 8, fats: 0.4 },
          ],
        },
      ],
    },
  ];

  // Messages between Dr. Carlos and Mariana
  const messages: Message[] = [
    {
      id: 'msg-1',
      senderId: nutritionist.userId,
      receiverId: patientMariana.userId,
      patientId: patientMariana.id,
      content: 'Olá Mariana! Seja muito bem-vinda ao NutriGestão. Seu plano alimentar já está disponível na aba Dieta.',
      readAt: dateAgo(28),
      createdAt: dateAgo(29),
      senderName: nutritionist.user.name,
      senderRole: 'NUTRICIONISTA',
    },
    {
      id: 'msg-2',
      senderId: patientMariana.userId,
      receiverId: nutritionist.userId,
      patientId: patientMariana.id,
      content: 'Oi Dr. Carlos! Muito obrigada! Já dei uma olhada e achei as opções do café da manhã super práticas.',
      readAt: dateAgo(27),
      createdAt: dateAgo(28),
      senderName: patientMariana.user.name,
      senderRole: 'PACIENTE',
    },
    {
      id: 'msg-3',
      senderId: patientMariana.userId,
      receiverId: nutritionist.userId,
      patientId: patientMariana.id,
      content: 'Tenho uma dúvida: se eu treinar de manhã em algum dia, inverto o pré-treino com o café da manhã?',
      readAt: dateAgo(20),
      createdAt: dateAgo(20),
      senderName: patientMariana.user.name,
      senderRole: 'PACIENTE',
    },
    {
      id: 'msg-4',
      senderId: nutritionist.userId,
      receiverId: patientMariana.userId,
      patientId: patientMariana.id,
      content: 'Exatamente Mariana! Pode comer a banana com um pouco de iogurte ou whey antes, e fazer os ovos com pão logo após o treino.',
      readAt: dateAgo(19),
      createdAt: dateAgo(19),
      senderName: nutritionist.user.name,
      senderRole: 'NUTRICIONISTA',
    },
    {
      id: 'msg-5',
      senderId: patientMariana.userId,
      receiverId: nutritionist.userId,
      patientId: patientMariana.id,
      content: 'Perfeito! Consegui bater os 2.5L de água essa semana toda e notei menos retenção!',
      readAt: null,
      createdAt: dateAgo(2),
      senderName: patientMariana.user.name,
      senderRole: 'PACIENTE',
    },
  ];

  return {
    users: [userNutri, userMariana, userLucas, userJuliana],
    nutritionists: [nutritionist],
    patients: [patientMariana, patientLucas, patientJuliana],
    licenses: [license],
    assessments,
    diets,
    messages,
  };
}

export function getDb(): DatabaseSchema {
  if (dbMemory) return dbMemory;

  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbMemory = JSON.parse(data);
      return dbMemory!;
    } catch (err) {
      console.error('Error reading db file, re-seeding:', err);
    }
  }

  dbMemory = seedDefaultData();
  saveDb();
  return dbMemory;
}

export const db = {
  // Users
  getUserById(id: string) {
    return getDb().users.find((u) => u.id === id);
  },
  getUserByEmail(email: string) {
    return getDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  createUser(user: User & { passwordHash: string }) {
    getDb().users.push(user);
    saveDb();
    return user;
  },
  updateUser(id: string, updates: Partial<User>) {
    const user = getDb().users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    saveDb();
    return user;
  },
  updateUserPassword(id: string, passwordHash: string) {
    const user = getDb().users.find((u) => u.id === id);
    if (!user) return null;
    user.passwordHash = passwordHash;
    user.updatedAt = new Date().toISOString();
    saveDb();
    return user;
  },

  // Nutritionists
  getNutritionistByUserId(userId: string) {
    return getDb().nutritionists.find((n) => n.userId === userId);
  },
  getNutritionistById(id: string) {
    return getDb().nutritionists.find((n) => n.id === id);
  },
  createNutritionist(profile: NutritionistProfile) {
    getDb().nutritionists.push(profile);
    saveDb();
    return profile;
  },
  updateNutritionist(id: string, updates: Partial<NutritionistProfile>) {
    const n = getDb().nutritionists.find((item) => item.id === id);
    if (!n) return null;
    Object.assign(n, updates);
    saveDb();
    return n;
  },

  // Patients
  getPatientsByNutritionist(nutritionistId: string) {
    return getDb().patients.filter((p) => p.nutritionistId === nutritionistId);
  },
  getPatientById(id: string) {
    return getDb().patients.find((p) => p.id === id);
  },
  getPatientByUserId(userId: string) {
    return getDb().patients.find((p) => p.userId === userId);
  },
  createPatient(patient: PatientProfile) {
    getDb().patients.push(patient);
    saveDb();
    return patient;
  },
  updatePatient(id: string, updates: Partial<PatientProfile>) {
    const p = getDb().patients.find((item) => item.id === id);
    if (!p) return null;
    Object.assign(p, updates, { updatedAt: new Date().toISOString() });
    saveDb();
    return p;
  },
  deletePatient(id: string) {
    const dbInstance = getDb();
    const index = dbInstance.patients.findIndex((p) => p.id === id);
    if (index !== -1) {
      dbInstance.patients.splice(index, 1);
      // Remove related assessments and diets
      dbInstance.assessments = dbInstance.assessments.filter((a) => a.patientId !== id);
      dbInstance.diets = dbInstance.diets.filter((d) => d.patientId !== id);
      dbInstance.messages = dbInstance.messages.filter((m) => m.patientId !== id);
      saveDb();
      return true;
    }
    return false;
  },

  // Licenses
  getLicenseByNutritionistId(nutritionistId: string) {
    return getDb().licenses.find((l) => l.nutritionistId === nutritionistId);
  },
  createLicense(license: License) {
    getDb().licenses.push(license);
    saveDb();
    return license;
  },
  updateLicense(id: string, updates: Partial<License>) {
    const lic = getDb().licenses.find((l) => l.id === id);
    if (!lic) return null;
    Object.assign(lic, updates);
    saveDb();
    return lic;
  },

  // Assessments
  getAssessmentsByPatient(patientId: string) {
    return getDb()
      .assessments.filter((a) => a.patientId === patientId)
      .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime());
  },
  getAssessmentById(id: string) {
    return getDb().assessments.find((a) => a.id === id);
  },
  createAssessment(assessment: Assessment) {
    getDb().assessments.push(assessment);
    // update patient summary cache
    const pat = getDb().patients.find((p) => p.id === assessment.patientId);
    if (pat) {
      pat.currentWeight = assessment.weight;
      pat.currentBodyFat = assessment.bodyFatPercentage;
      pat.currentBmi = assessment.bmi;
      pat.lastAssessmentDate = assessment.assessmentDate;
    }
    saveDb();
    return assessment;
  },
  deleteAssessment(id: string) {
    const dbInstance = getDb();
    const idx = dbInstance.assessments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const removed = dbInstance.assessments.splice(idx, 1)[0];
      // update latest assessment for patient
      const patAssessments = dbInstance.assessments
        .filter((a) => a.patientId === removed.patientId)
        .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
      const pat = dbInstance.patients.find((p) => p.id === removed.patientId);
      if (pat) {
        if (patAssessments.length > 0) {
          pat.currentWeight = patAssessments[0].weight;
          pat.currentBodyFat = patAssessments[0].bodyFatPercentage;
          pat.currentBmi = patAssessments[0].bmi;
          pat.lastAssessmentDate = patAssessments[0].assessmentDate;
        } else {
          pat.currentWeight = undefined;
          pat.currentBodyFat = undefined;
          pat.currentBmi = undefined;
          pat.lastAssessmentDate = undefined;
        }
      }
      saveDb();
      return true;
    }
    return false;
  },

  // Diets
  getDietsByPatient(patientId: string) {
    return getDb()
      .diets.filter((d) => d.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getDietById(id: string) {
    return getDb().diets.find((d) => d.id === id);
  },
  createDiet(diet: Diet) {
    getDb().diets.push(diet);
    saveDb();
    return diet;
  },
  updateDiet(id: string, updates: Partial<Diet>) {
    const diet = getDb().diets.find((d) => d.id === id);
    if (!diet) return null;
    Object.assign(diet, updates, { updatedAt: new Date().toISOString() });
    saveDb();
    return diet;
  },
  deleteDiet(id: string) {
    const dbInstance = getDb();
    const idx = dbInstance.diets.findIndex((d) => d.id === id);
    if (idx !== -1) {
      dbInstance.diets.splice(idx, 1);
      saveDb();
      return true;
    }
    return false;
  },

  // Messages
  getMessagesBetween(patientId: string) {
    return getDb()
      .messages.filter((m) => m.patientId === patientId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
  createMessage(msg: Message) {
    getDb().messages.push(msg);
    saveDb();
    return msg;
  },
  markMessagesRead(patientId: string, receiverId: string) {
    const now = new Date().toISOString();
    let updatedCount = 0;
    getDb().messages.forEach((m) => {
      if (m.patientId === patientId && m.receiverId === receiverId && !m.readAt) {
        m.readAt = now;
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      saveDb();
    }
    return updatedCount;
  },
  getUnreadCountForUser(userId: string) {
    return getDb().messages.filter((m) => m.receiverId === userId && !m.readAt).length;
  },
};
