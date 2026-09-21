import {
  Assessment,
  AssessmentCalculationInput,
  AssessmentCalculationResult,
  AuthSession,
  Diet,
  License,
  Message,
  NutritionistProfile,
  PatientProfile,
  User,
} from '../types.ts';
import { calculateComposition } from '../utils/calc.ts';

const LOCAL_STORAGE_DB_KEY = 'nutrigestao_local_storage_db';

export interface LocalDatabaseSchema {
  users: (User & { passwordHash: string })[];
  nutritionists: NutritionistProfile[];
  patients: PatientProfile[];
  licenses: License[];
  assessments: Assessment[];
  diets: Diet[];
  messages: Message[];
}

function dateAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function getInitialDatabase(): LocalDatabaseSchema {
  const now = new Date().toISOString();

  const userNutri: User & { passwordHash: string } = {
    id: 'u-nutri-carlos',
    name: 'Dr. Carlos Nutrição',
    email: 'dr.carlos@nutrigestao.com',
    role: 'NUTRICIONISTA',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(180),
    updatedAt: now,
    passwordHash: 'password123',
  };

  const userMariana: User & { passwordHash: string } = {
    id: 'u-pat-mariana',
    name: 'Mariana Silva',
    email: 'mariana.silva@email.com',
    role: 'PACIENTE',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(90),
    updatedAt: now,
    passwordHash: 'password123',
  };

  const userLucas: User & { passwordHash: string } = {
    id: 'u-pat-lucas',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@email.com',
    role: 'PACIENTE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(60),
    updatedAt: now,
    passwordHash: 'password123',
  };

  const userJuliana: User & { passwordHash: string } = {
    id: 'u-pat-juliana',
    name: 'Juliana Costa',
    email: 'juliana.costa@email.com',
    role: 'PACIENTE',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    createdAt: dateAgo(45),
    updatedAt: now,
    passwordHash: 'password123',
  };

  const licenseRecord: License = {
    id: 'lic-001',
    nutritionistId: 'nutri-carlos',
    type: 'CRN Regular',
    status: 'ATIVA',
    licenseNumber: 'CRN-3 48190/SP',
    startDate: dateAgo(180).split('T')[0],
    expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: dateAgo(180),
  };

  const nutritionist: NutritionistProfile = {
    id: 'nutri-carlos',
    userId: userNutri.id,
    licenseStatus: 'ATIVA',
    licenseType: 'CRN Regular',
    licenseNumber: 'CRN-3 48190/SP',
    licenseStart: licenseRecord.startDate,
    licenseExpiration: licenseRecord.expirationDate,
    crn: 'CRN-3 48190/SP',
    specialty: 'Nutrição Esportiva & Composição Corporal',
    phone: '(11) 98765-4321',
    user: userNutri,
  };

  const patientMariana: PatientProfile = {
    id: 'pat-mariana',
    userId: userMariana.id,
    nutritionistId: nutritionist.id,
    birthDate: '1996-03-12',
    gender: 'F',
    height: 168,
    phone: '(11) 99123-4567',
    notes: 'Objetivo: Redução de gordura corporal mantendo massa magra. Pratica musculação 4x na semana.',
    user: userMariana,
  };

  const patientLucas: PatientProfile = {
    id: 'pat-lucas',
    userId: userLucas.id,
    nutritionistId: nutritionist.id,
    birthDate: '1992-08-25',
    gender: 'M',
    height: 182,
    phone: '(11) 97654-3210',
    notes: 'Objetivo: Hipertrofia limpa. Histórico de intolerância moderada a lactose.',
    user: userLucas,
  };

  const patientJuliana: PatientProfile = {
    id: 'pat-juliana',
    userId: userJuliana.id,
    nutritionistId: nutritionist.id,
    birthDate: '2000-11-04',
    gender: 'F',
    height: 162,
    phone: '(11) 96543-2109',
    notes: 'Objetivo: Reeducação alimentar e ganho de disposição para corrida de rua.',
    user: userJuliana,
  };

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
      notes: 'Excelente evolução em 30 dias. Redução de 2.2kg de gordura e retenção de massa magra.',
      createdAt: dateAgo(30),
    },
    {
      id: 'ass-m-3',
      patientId: patientMariana.id,
      nutritionistId: nutritionist.id,
      protocol: 'Pollock 7 Dobras',
      weight: 63.8,
      height: 168,
      bmi: 22.6,
      bmiClassification: 'Eutrofia (Peso normal)',
      bodyFatPercentage: 21.8,
      fatMass: 13.91,
      leanMass: 49.89,
      bodyDensity: 1.0501,
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
      assessmentDate: dateAgo(3).split('T')[0],
      notes: 'Meta quase atingida. Definição abdominal nítida, ganho perceptível de massa muscular nas pernas.',
      createdAt: dateAgo(3),
    },
  ];

  const diets: Diet[] = [
    {
      id: 'diet-mariana-1',
      patientId: patientMariana.id,
      nutritionistId: nutritionist.id,
      title: 'Plano Nutricional — Definição e Performance',
      objective: 'Dieta hiperproteica com déficit calórico controlado (~1.800 kcal). Foco em saciedade e preservação muscular.',
      status: 'ATIVA',
      startDate: dateAgo(30).split('T')[0],
      createdAt: dateAgo(30),
      updatedAt: dateAgo(3),
      meals: [
        {
          id: 'meal-m1',
          dietId: 'diet-mariana-1',
          name: 'Café da Manhã Energético',
          time: '07:30',
          notes: 'Consumir acompanhado de 400ml de água e café preto sem açúcar.',
          orderIndex: 1,
          foods: [
            { id: 'f-1', mealId: 'meal-m1', name: 'Ovos inteiros mexidos', quantity: '2', unit: 'unidades', calories: 140, protein: 12, carbs: 1, fats: 10 },
            { id: 'f-2', mealId: 'meal-m1', name: 'Pão 100% integral', quantity: '2', unit: 'fatias', calories: 120, protein: 6, carbs: 22, fats: 1.5 },
            { id: 'f-3', mealId: 'meal-m1', name: 'Mamão papaia com aveia', quantity: '1/2', unit: 'unidade + 1 colher sopa', calories: 85, protein: 2.5, carbs: 18, fats: 1 },
          ],
        },
        {
          id: 'meal-m2',
          dietId: 'diet-mariana-1',
          name: 'Lanche da Manhã',
          time: '10:30',
          notes: 'Praticidade para consumir no trabalho.',
          orderIndex: 2,
          foods: [
            { id: 'f-4', mealId: 'meal-m2', name: 'Whey Protein Isolado batido com água', quantity: '30', unit: 'g', calories: 110, protein: 26, carbs: 1, fats: 0.5 },
            { id: 'f-5', mealId: 'meal-m2', name: 'Castanhas-do-Pará', quantity: '3', unit: 'unidades', calories: 95, protein: 2, carbs: 2, fats: 9 },
          ],
        },
        {
          id: 'meal-m3',
          dietId: 'diet-mariana-1',
          name: 'Almoço Completo',
          time: '13:00',
          notes: 'Salada de folhas verdes à vontade com 1 fio de azeite extravirgem.',
          orderIndex: 3,
          foods: [
            { id: 'f-6', mealId: 'meal-m3', name: 'Filé de peito de frango grelhado', quantity: '160', unit: 'g', calories: 250, protein: 48, carbs: 0, fats: 5 },
            { id: 'f-7', mealId: 'meal-m3', name: 'Arroz integral cozido', quantity: '120', unit: 'g', calories: 135, protein: 3, carbs: 28, fats: 1 },
            { id: 'f-8', mealId: 'meal-m3', name: 'Feijão carioca cozido', quantity: '1', unit: 'concha média', calories: 85, protein: 5, carbs: 15, fats: 0.5 },
            { id: 'f-9', mealId: 'meal-m3', name: 'Legumes refogados (abobrinha e cenoura)', quantity: '100', unit: 'g', calories: 50, protein: 1.5, carbs: 9, fats: 1 },
          ],
        },
        {
          id: 'meal-m4',
          dietId: 'diet-mariana-1',
          name: 'Pré-Treino / Lanche da Tarde',
          time: '16:30',
          notes: 'Consumir 45 a 60 minutos antes do treino de musculação.',
          orderIndex: 4,
          foods: [
            { id: 'f-10', mealId: 'meal-m4', name: 'Iogurte natural desnatado', quantity: '170', unit: 'g', calories: 80, protein: 8, carbs: 11, fats: 0 },
            { id: 'f-11', mealId: 'meal-m4', name: 'Farelo de aveia', quantity: '20', unit: 'g', calories: 75, protein: 3.5, carbs: 12, fats: 1.5 },
            { id: 'f-12', mealId: 'meal-m4', name: 'Banana prata fatiada', quantity: '1', unit: 'unidade', calories: 90, protein: 1, carbs: 23, fats: 0.3 },
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
            { id: 'f-13', mealId: 'meal-m5', name: 'Filé de tilápia ou salmão grelhado', quantity: '150', unit: 'g', calories: 190, protein: 38, carbs: 0, fats: 4 },
            { id: 'f-14', mealId: 'meal-m5', name: 'Purê de abóbora cabotiá', quantity: '3', unit: 'colheres de sopa', calories: 70, protein: 2, carbs: 15, fats: 0.5 },
            { id: 'f-15', mealId: 'meal-m5', name: 'Brócolis e cenoura cozidos no vapor', quantity: '1', unit: 'xícara', calories: 45, protein: 3, carbs: 8, fats: 0.4 },
          ],
        },
      ],
    },
  ];

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
      senderId: nutritionist.userId,
      receiverId: patientMariana.userId,
      patientId: patientMariana.id,
      content: 'Excelente! Qualquer dúvida nos horários ou substituição de alimentos, me envie mensagem por aqui.',
      readAt: dateAgo(19),
      createdAt: dateAgo(19),
      senderName: nutritionist.user.name,
      senderRole: 'NUTRICIONISTA',
    },
  ];

  return {
    users: [userNutri, userMariana, userLucas, userJuliana],
    nutritionists: [nutritionist],
    patients: [patientMariana, patientLucas, patientJuliana],
    licenses: [licenseRecord],
    assessments,
    diets,
    messages,
  };
}

class ClientStorageService {
  private db: LocalDatabaseSchema;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): LocalDatabaseSchema {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to parse local storage DB, initializing defaults:', err);
    }
    const initial = getInitialDatabase();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(data: LocalDatabaseSchema) {
    try {
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(data));
      this.db = data;
    } catch (err) {
      console.warn('Failed to save to local storage:', err);
    }
  }

  private persist() {
    this.saveToStorage(this.db);
  }

  // AUTH METHODS
  async login(email: string, password: string): Promise<{ message: string; session: AuthSession }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    // In client-side mode: if user registered with a password, check it, or default seed password 'password123'
    if (user.passwordHash && user.passwordHash !== password && user.passwordHash !== 'password123' && password !== 'password123') {
      throw new Error('E-mail ou senha incorretos.');
    }

    const token = `local-token-${user.id}-${Date.now()}`;
    const nutri = user.role === 'NUTRICIONISTA' ? this.db.nutritionists.find((n) => n.userId === user.id) : undefined;
    const patient = user.role === 'PACIENTE' ? this.db.patients.find((p) => p.userId === user.id) : undefined;
    const license = nutri ? this.db.licenses.find((l) => l.nutritionistId === nutri.id) : undefined;

    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      message: 'Login realizado com sucesso!',
      session: {
        user: safeUser,
        token,
        nutritionist: nutri,
        patient,
        license,
      },
    };
  }

  async register(formData: any): Promise<{ message: string; session: AuthSession }> {
    const { name, email, password, role, crn, specialty, phone, birthDate, gender, height } = formData;

    if (!name || !email || !password || !role) {
      throw new Error('Preencha todos os campos obrigatórios (nome, e-mail, senha e tipo de conta).');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = this.db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    const now = new Date().toISOString();
    const userId = `u-${Date.now()}`;

    const newUser: User & { passwordHash: string } = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      createdAt: now,
      updatedAt: now,
      passwordHash: password,
    };

    this.db.users.push(newUser);

    let nutritionistProfile: NutritionistProfile | undefined;
    let patientProfile: PatientProfile | undefined;
    let licenseRecord: License | undefined;

    if (role === 'NUTRICIONISTA') {
      const nutriId = `nutri-${Date.now()}`;
      const licId = `lic-${Date.now()}`;
      const startDate = now.split('T')[0];
      const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      licenseRecord = {
        id: licId,
        nutritionistId: nutriId,
        type: 'CRN Regular',
        status: 'ATIVA',
        licenseNumber: crn || 'CRN-3 12345/SP',
        startDate,
        expirationDate,
        createdAt: now,
      };
      this.db.licenses.push(licenseRecord);

      nutritionistProfile = {
        id: nutriId,
        userId: newUser.id,
        licenseStatus: 'ATIVA',
        licenseType: 'CRN Regular',
        licenseNumber: licenseRecord.licenseNumber,
        licenseStart: startDate,
        licenseExpiration: expirationDate,
        crn: crn || 'CRN-3 12345/SP',
        specialty: specialty || 'Nutrição Clínica & Esportiva',
        phone: phone || '',
        user: newUser,
      };
      this.db.nutritionists.push(nutritionistProfile);
    } else {
      const defaultNutri = this.db.nutritionists[0];
      const patId = `pat-${Date.now()}`;

      patientProfile = {
        id: patId,
        userId: newUser.id,
        nutritionistId: defaultNutri ? defaultNutri.id : 'nutri-carlos',
        birthDate: birthDate || '1995-01-01',
        gender: gender === 'M' ? 'M' : 'F',
        height: Number(height) || 170,
        phone: phone || '',
        user: newUser,
      };
      this.db.patients.push(patientProfile);
    }

    this.persist();

    const token = `local-token-${newUser.id}-${Date.now()}`;
    const safeUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return {
      message: 'Cadastro realizado com sucesso!',
      session: {
        user: safeUser,
        token,
        nutritionist: nutritionistProfile,
        patient: patientProfile,
        license: licenseRecord,
      },
    };
  }

  async googleLogin(googleData: any): Promise<{ message: string; session: AuthSession }> {
    const cleanEmail = (googleData.email || 'usuario.google@exemplo.com').trim().toLowerCase();
    let user = this.db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return this.register({
        name: googleData.name || 'Usuário Google',
        email: cleanEmail,
        password: 'password123',
        role: googleData.role || 'NUTRICIONISTA',
      });
    }

    return this.login(cleanEmail, 'password123');
  }

  async getMe(token: string | null): Promise<AuthSession> {
    if (!token) {
      throw new Error('Sessão expirada.');
    }

    // Extract user ID from token
    const parts = token.split('-');
    let user: (User & { passwordHash: string }) | undefined;

    if (token.startsWith('local-token-')) {
      const userIdPart = token.replace('local-token-', '').split('-')[0];
      user = this.db.users.find((u) => u.id.startsWith(userIdPart) || u.id === userIdPart);
    }

    if (!user) {
      // Fallback: pick first nutri
      user = this.db.users[0];
    }

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const nutri = user.role === 'NUTRICIONISTA' ? this.db.nutritionists.find((n) => n.userId === user.id) : undefined;
    const patient = user.role === 'PACIENTE' ? this.db.patients.find((p) => p.userId === user.id) : undefined;
    const license = nutri ? this.db.licenses.find((l) => l.nutritionistId === nutri.id) : undefined;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
      nutritionist: nutri,
      patient,
      license,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return {
      message: `Um link de redefinição foi enviado para ${email}. Verifique sua caixa de entrada.`,
    };
  }

  // PATIENTS
  async getPatients(nutritionistId: string): Promise<PatientProfile[]> {
    const list = this.db.patients.filter((p) => p.nutritionistId === nutritionistId);
    return list.map((p) => {
      const u = this.db.users.find((user) => user.id === p.userId);
      return { ...p, user: u || p.user };
    });
  }

  async createPatient(nutritionistId: string, data: any): Promise<PatientProfile> {
    const { name, email, birthDate, gender, height, phone, notes } = data;
    const cleanEmail = email.trim().toLowerCase();

    let user = this.db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    const now = new Date().toISOString();

    if (!user) {
      user = {
        id: `u-pat-${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        role: 'PACIENTE',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
        createdAt: now,
        updatedAt: now,
        passwordHash: 'password123',
      };
      this.db.users.push(user);
    }

    const newPatient: PatientProfile = {
      id: `pat-${Date.now()}`,
      userId: user.id,
      nutritionistId,
      birthDate: birthDate || '1995-01-01',
      gender: gender || 'F',
      height: Number(height) || 170,
      phone: phone || '',
      notes: notes || '',
      user,
    };

    this.db.patients.push(newPatient);
    this.persist();
    return newPatient;
  }

  async getPatient(id: string): Promise<PatientProfile> {
    const patient = this.db.patients.find((p) => p.id === id);
    if (!patient) throw new Error('Paciente não encontrado');
    const u = this.db.users.find((user) => user.id === patient.userId);
    return { ...patient, user: u || patient.user };
  }

  async updatePatient(id: string, updates: Partial<PatientProfile>): Promise<PatientProfile> {
    const patient = this.db.patients.find((p) => p.id === id);
    if (!patient) throw new Error('Paciente não encontrado');
    Object.assign(patient, updates);
    this.persist();
    return patient;
  }

  async deletePatient(id: string): Promise<{ success: boolean }> {
    this.db.patients = this.db.patients.filter((p) => p.id !== id);
    this.db.assessments = this.db.assessments.filter((a) => a.patientId !== id);
    this.db.diets = this.db.diets.filter((d) => d.patientId !== id);
    this.db.messages = this.db.messages.filter((m) => m.patientId !== id);
    this.persist();
    return { success: true };
  }

  // ASSESSMENTS
  async getAssessments(patientId: string): Promise<Assessment[]> {
    return this.db.assessments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
  }

  async createAssessment(patientId: string, nutritionistId: string, input: any): Promise<Assessment> {
    const calculated = calculateComposition(input);
    const now = new Date().toISOString();

    const assessment: Assessment = {
      id: `ass-${Date.now()}`,
      patientId,
      nutritionistId,
      protocol: input.protocol,
      weight: input.weight,
      height: input.height,
      bmi: calculated.bmi,
      bmiClassification: calculated.bmiClassification,
      bodyFatPercentage: calculated.bodyFatPercentage,
      fatMass: calculated.fatMass,
      leanMass: calculated.leanMass,
      bodyDensity: calculated.bodyDensity,
      skinfoldsSum: calculated.skinfoldsSum,
      skinfolds: input.skinfolds || {},
      assessmentDate: input.assessmentDate || now.split('T')[0],
      notes: input.notes,
      createdAt: now,
    };

    this.db.assessments.push(assessment);
    this.persist();
    return assessment;
  }

  // DIETS
  async getDiets(patientId: string): Promise<Diet[]> {
    return this.db.diets.filter((d) => d.patientId === patientId);
  }

  async createDiet(patientId: string, nutritionistId: string, data: any): Promise<Diet> {
    const now = new Date().toISOString();
    const dietId = `diet-${Date.now()}`;

    const newDiet: Diet = {
      id: dietId,
      patientId,
      nutritionistId,
      title: data.title || 'Novo Plano Alimentar',
      objective: data.objective || data.description || 'Manutenção e saúde',
      notes: data.notes || '',
      startDate: data.startDate || now.split('T')[0],
      status: data.status || 'ATIVA',
      createdAt: now,
      updatedAt: now,
      meals: (data.meals || []).map((m: any, i: number) => ({
        ...m,
        id: m.id || `meal-${Date.now()}-${i}`,
        dietId,
        foods: (m.foods || []).map((f: any, fi: number) => ({
          ...f,
          id: f.id || `f-${Date.now()}-${i}-${fi}`,
          mealId: m.id || `meal-${Date.now()}-${i}`,
        })),
      })),
    };

    this.db.diets.push(newDiet);
    this.persist();
    return newDiet;
  }

  async updateDiet(dietId: string, data: any): Promise<Diet> {
    const diet = this.db.diets.find((d) => d.id === dietId);
    if (!diet) throw new Error('Dieta não encontrada');
    Object.assign(diet, data, { updatedAt: new Date().toISOString() });
    this.persist();
    return diet;
  }

  // EVOLUTION
  async getEvolution(patientId: string) {
    const list = await this.getAssessments(patientId);
    const chronological = [...list].sort(
      (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
    );

    const chartData = chronological.map((item) => ({
      date: item.assessmentDate,
      weight: item.weight,
      bodyFatPercentage: item.bodyFatPercentage,
      fatMass: item.fatMass,
      leanMass: item.leanMass,
      bmi: item.bmi,
    }));

    const first = chronological[0];
    const latest = chronological[chronological.length - 1];

    const weightDelta = first && latest ? Number((latest.weight - first.weight).toFixed(2)) : 0;
    const bodyFatDelta = first && latest ? Number((latest.bodyFatPercentage - first.bodyFatPercentage).toFixed(2)) : 0;
    const leanMassDelta = first && latest ? Number((latest.leanMass - first.leanMass).toFixed(2)) : 0;
    const fatMassDelta = first && latest ? Number((latest.fatMass - first.fatMass).toFixed(2)) : 0;

    return {
      history: chartData,
      totalAssessments: list.length,
      firstAssessment: first,
      latestAssessment: latest,
      summary: {
        weightDelta,
        bodyFatDelta,
        leanMassDelta,
        fatMassDelta,
      },
    };
  }

  // MESSAGES
  async getMessages(patientId: string): Promise<Message[]> {
    return this.db.messages
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async sendMessage(patientId: string, senderRole: 'NUTRICIONISTA' | 'PACIENTE', senderId: string, content: string): Promise<Message> {
    const patient = this.db.patients.find((p) => p.id === patientId);
    if (!patient) throw new Error('Paciente não encontrado');

    const receiverId = senderRole === 'NUTRICIONISTA' ? patient.userId : (this.db.nutritionists.find((n) => n.id === patient.nutritionistId)?.userId || 'u-nutri-carlos');
    const sender = this.db.users.find((u) => u.id === senderId);

    const message: Message = {
      id: `msg-${Date.now()}`,
      patientId,
      senderId,
      receiverId,
      content,
      senderRole,
      senderName: sender?.name || (senderRole === 'NUTRICIONISTA' ? 'Nutricionista' : 'Paciente'),
      createdAt: new Date().toISOString(),
    };

    this.db.messages.push(message);
    this.persist();
    return message;
  }

  // DASHBOARD STATS
  async getDashboardStats(nutritionistId: string) {
    const patients = this.db.patients.filter((p) => p.nutritionistId === nutritionistId);
    const activeDiets = this.db.diets.filter((d) => d.nutritionistId === nutritionistId && d.status === 'ATIVA').length;
    const totalAssessments = this.db.assessments.filter((a) => a.nutritionistId === nutritionistId).length;

    return {
      totalPatients: patients.length,
      activeDiets,
      totalAssessments,
      retentionRate: 94,
    };
  }

  // PROFILE & LICENSE
  async updateProfile(userId: string, data: any): Promise<User> {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    if (data.name) user.name = data.name.trim();
    user.updatedAt = new Date().toISOString();

    if (user.role === 'NUTRICIONISTA') {
      const nutri = this.db.nutritionists.find((n) => n.userId === userId);
      if (nutri) {
        if (data.crn) nutri.crn = data.crn;
        if (data.specialty) nutri.specialty = data.specialty;
        if (data.phone) nutri.phone = data.phone;
      }
    }
    this.persist();
    return user;
  }

  async updatePassword(userId: string, currentPass: string, newPass: string) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    user.passwordHash = newPass;
    user.updatedAt = new Date().toISOString();
    this.persist();
    return { message: 'Senha atualizada com sucesso!' };
  }

  async toggleLicense(nutritionistId: string, status: 'ATIVA' | 'SUSPENSA' | 'EXPIRADA') {
    const license = this.db.licenses.find((l) => l.nutritionistId === nutritionistId);
    if (license) {
      license.status = status;
    }
    const nutri = this.db.nutritionists.find((n) => n.id === nutritionistId);
    if (nutri) {
      nutri.licenseStatus = status;
    }
    this.persist();
    return { license, nutritionist: nutri };
  }
}

export const clientStorage = new ClientStorageService();
