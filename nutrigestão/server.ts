import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import {
  authMiddleware,
  AuthenticatedRequest,
  comparePassword,
  generateToken,
  hashPassword,
  requireActiveLicense,
  requireRole,
} from './server/auth.ts';
import { calculateBmi, calculateComposition } from './server/calc.ts';
import {
  Assessment,
  AssessmentCalculationInput,
  Diet,
  License,
  Message,
  NutritionistProfile,
  PatientProfile,
  User,
} from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password, role, crn, specialty, phone, birthDate, gender, height } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ error: 'Preencha todos os campos obrigatórios (nome, e-mail, senha e tipo de conta).' });
        return;
      }

      if (role !== 'NUTRICIONISTA' && role !== 'PACIENTE') {
        res.status(400).json({ error: 'Tipo de usuário inválido.' });
        return;
      }

      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const existingUser = db.getUserByEmail(cleanEmail);
      if (existingUser) {
        res.status(409).json({ error: 'Este e-mail já está cadastrado no sistema.' });
        return;
      }

      const userId = `u-${Date.now()}`;
      const now = new Date().toISOString();
      const passwordHash = hashPassword(password);

      const newUser: User & { passwordHash: string } = {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        createdAt: now,
        updatedAt: now,
        passwordHash,
      };

      db.createUser(newUser);

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
        db.createLicense(licenseRecord);

        nutritionistProfile = {
          id: nutriId,
          userId: newUser.id,
          licenseStatus: 'ATIVA',
          licenseType: 'CRN Regular',
          licenseNumber: licenseRecord.licenseNumber,
          licenseStart: startDate,
          licenseExpiration: expirationDate,
          crn: crn || 'CRN-3 12345/SP',
          specialty: specialty || 'Nutrição Clínica',
          phone: phone || '',
          user: newUser,
        };
        db.createNutritionist(nutritionistProfile);
      } else {
        // Link to Dr. Carlos by default if no nutritionist specified
        const defaultNutri = db.getNutritionistById('nutri-carlos') || db.getNutritionistByUserId('u-nutri-carlos');
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
        db.createPatient(patientProfile);
      }

      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json({
        message: 'Cadastro realizado com sucesso!',
        session: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
          },
          token,
          nutritionist: nutritionistProfile,
          patient: patientProfile,
          license: licenseRecord,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Erro ao cadastrar usuário: ' + (err.message || 'tente novamente.') });
    }
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = db.getUserByEmail(cleanEmail);
      if (!user) {
        res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        return;
      }

      const isPasswordValid = comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const nutri = user.role === 'NUTRICIONISTA' ? db.getNutritionistByUserId(user.id) : undefined;
      const patient = user.role === 'PACIENTE' ? db.getPatientByUserId(user.id) : undefined;
      const license = nutri ? db.getLicenseByNutritionistId(nutri.id) : undefined;

      res.json({
        message: 'Login realizado com sucesso!',
        session: {
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
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Erro ao autenticar: ' + err.message });
    }
  });

  // Google Sign-In Simulation / Handler
  app.post('/api/auth/google', (req, res) => {
    try {
      const { name, email, avatar, role = 'NUTRICIONISTA' } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Dados do Google inválidos' });
        return;
      }

      let user = db.getUserByEmail(email);
      const now = new Date().toISOString();

      if (!user) {
        const userId = `u-google-${Date.now()}`;
        const newUser: User & { passwordHash: string } = {
          id: userId,
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          role: role === 'PACIENTE' ? 'PACIENTE' : 'NUTRICIONISTA',
          avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
          createdAt: now,
          updatedAt: now,
          passwordHash: hashPassword('google_oauth_authorized_' + Date.now()),
        };
        db.createUser(newUser);
        user = newUser;

        if (user.role === 'NUTRICIONISTA') {
          const nutriId = `nutri-${Date.now()}`;
          const licId = `lic-${Date.now()}`;
          const startDate = now.split('T')[0];
          const expDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const lic: License = {
            id: licId,
            nutritionistId: nutriId,
            type: 'CRN Regular',
            status: 'ATIVA',
            licenseNumber: 'CRN-Google 55210',
            startDate,
            expirationDate: expDate,
            createdAt: now,
          };
          db.createLicense(lic);

          const nutriProfile: NutritionistProfile = {
            id: nutriId,
            userId: user.id,
            licenseStatus: 'ATIVA',
            licenseType: 'CRN Regular',
            licenseNumber: lic.licenseNumber,
            licenseStart: startDate,
            licenseExpiration: expDate,
            crn: lic.licenseNumber,
            specialty: 'Nutrição Integrativa',
            user,
          };
          db.createNutritionist(nutriProfile);
        } else {
          const defaultNutri = db.getNutritionistById('nutri-carlos') || db.getNutritionistByUserId('u-nutri-carlos');
          const patProfile: PatientProfile = {
            id: `pat-${Date.now()}`,
            userId: user.id,
            nutritionistId: defaultNutri ? defaultNutri.id : 'nutri-carlos',
            birthDate: '1996-03-20',
            gender: 'F',
            height: 165,
            user,
          };
          db.createPatient(patProfile);
        }
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const nutri = user.role === 'NUTRICIONISTA' ? db.getNutritionistByUserId(user.id) : undefined;
      const patient = user.role === 'PACIENTE' ? db.getPatientByUserId(user.id) : undefined;
      const license = nutri ? db.getLicenseByNutritionistId(nutri.id) : undefined;

      res.json({
        message: 'Autenticado com Google com sucesso!',
        session: {
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
        },
      });
    } catch (err: any) {
      console.error('Google Auth error:', err);
      res.status(500).json({ error: 'Erro ao logar com Google' });
    }
  });

  // Me (current authenticated session)
  app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      nutritionist: req.nutritionist,
      patient: req.patient,
      license: req.license,
    });
  });

  // Forgot password
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Informe o seu e-mail.' });
      return;
    }
    const user = db.getUserByEmail(email);
    if (!user) {
      // Return success anyway for security best practice
      res.json({ message: 'Se o e-mail estiver cadastrado, as instruções de recuperação foram enviadas.' });
      return;
    }
    res.json({
      message: `Instruções de redefinição de senha foram enviadas para ${email}. Para demonstração, a senha padrão é "password123".`,
    });
  });

  // ==========================================
  // BODY COMPOSITION CALCULATOR PREVIEW
  // ==========================================

  app.post('/api/calc/preview', (req, res) => {
    try {
      const input: AssessmentCalculationInput = req.body;
      const result = calculateComposition(input);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: 'Erro nos parâmetros de cálculo: ' + err.message });
    }
  });

  // ==========================================
  // PATIENTS MANAGEMENT (NUTRITIONIST ONLY)
  // ==========================================

  // List patients
  app.get('/api/patients', authMiddleware, requireRole('NUTRICIONISTA'), (req: AuthenticatedRequest, res) => {
    try {
      const nutriId = req.nutritionist!.id;
      const patients = db.getPatientsByNutritionist(nutriId);

      // Hydrate patient users
      const hydrated = patients.map((p) => {
        const u = db.getUserById(p.userId);
        return {
          ...p,
          user: u
            ? {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                avatar: u.avatar,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
              }
            : p.user,
        };
      });

      res.json(hydrated);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar pacientes: ' + err.message });
    }
  });

  // Create patient
  app.post(
    '/api/patients',
    authMiddleware,
    requireRole('NUTRICIONISTA'),
    requireActiveLicense,
    (req: AuthenticatedRequest, res) => {
      try {
        const { name, email, birthDate, gender, height, phone, notes } = req.body;
        if (!name || !email) {
          res.status(400).json({ error: 'Nome e e-mail do paciente são obrigatórios.' });
          return;
        }

        const existingUser = db.getUserByEmail(email);
        if (existingUser) {
          res.status(409).json({ error: 'Já existe um usuário com este e-mail no sistema.' });
          return;
        }

        const now = new Date().toISOString();
        const userId = `u-pat-${Date.now()}`;
        const patId = `pat-${Date.now()}`;

        const newUser: User & { passwordHash: string } = {
          id: userId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: 'PACIENTE',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          createdAt: now,
          updatedAt: now,
          passwordHash: hashPassword('password123'),
        };
        db.createUser(newUser);

        const newPatient: PatientProfile = {
          id: patId,
          userId: newUser.id,
          nutritionistId: req.nutritionist!.id,
          birthDate: birthDate || '1995-06-15',
          gender: gender === 'M' ? 'M' : 'F',
          height: Number(height) || 170,
          phone: phone || '',
          notes: notes || '',
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
          },
        };

        db.createPatient(newPatient);

        res.status(201).json({
          message: 'Paciente cadastrado com sucesso! A senha inicial de acesso é password123.',
          patient: newPatient,
        });
      } catch (err: any) {
        res.status(500).json({ error: 'Erro ao cadastrar paciente: ' + err.message });
      }
    }
  );

  // Get specific patient profile (with authorization)
  app.get('/api/patients/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const patientId = req.params.id;
      const patient = db.getPatientById(patientId);

      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      // Authorization check: Nutritionist must own patient, or patient must be self
      if (req.user!.role === 'NUTRICIONISTA') {
        if (patient.nutritionistId !== req.nutritionist?.id) {
          res.status(403).json({ error: 'Acesso não autorizado aos dados deste paciente.' });
          return;
        }
      } else if (req.user!.role === 'PACIENTE') {
        if (patient.userId !== req.user!.id) {
          res.status(403).json({ error: 'Você só pode visualizar seus próprios dados.' });
          return;
        }
      }

      const u = db.getUserById(patient.userId);
      const hydrated = {
        ...patient,
        user: u
          ? {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              avatar: u.avatar,
              createdAt: u.createdAt,
              updatedAt: u.updatedAt,
            }
          : patient.user,
      };

      res.json(hydrated);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao carregar dados do paciente.' });
    }
  });

  // Update patient profile
  app.put('/api/patients/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const patientId = req.params.id;
      const patient = db.getPatientById(patientId);
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      if (req.user!.role === 'NUTRICIONISTA') {
        if (patient.nutritionistId !== req.nutritionist?.id) {
          res.status(403).json({ error: 'Não autorizado.' });
          return;
        }
      } else if (req.user!.role === 'PACIENTE') {
        if (patient.userId !== req.user!.id) {
          res.status(403).json({ error: 'Não autorizado.' });
          return;
        }
      }

      const { name, birthDate, gender, height, phone, notes } = req.body;

      if (name) {
        db.updateUser(patient.userId, { name });
      }

      const updated = db.updatePatient(patientId, {
        birthDate: birthDate || patient.birthDate,
        gender: gender || patient.gender,
        height: height ? Number(height) : patient.height,
        phone: phone !== undefined ? phone : patient.phone,
        notes: notes !== undefined ? notes : patient.notes,
      });

      res.json({ message: 'Paciente atualizado com sucesso.', patient: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar paciente.' });
    }
  });

  // Delete patient
  app.delete('/api/patients/:id', authMiddleware, requireRole('NUTRICIONISTA'), (req: AuthenticatedRequest, res) => {
    const patientId = req.params.id;
    const patient = db.getPatientById(patientId);
    if (!patient || patient.nutritionistId !== req.nutritionist?.id) {
      res.status(404).json({ error: 'Paciente não encontrado ou não pertence a você.' });
      return;
    }

    db.deletePatient(patientId);
    res.json({ message: 'Paciente e seus registros foram removidos com sucesso.' });
  });

  // ==========================================
  // ASSESSMENTS & SKINFOLDS (AVALIAÇÃO CORPORAL)
  // ==========================================

  // List assessments for a patient
  app.get('/api/patients/:patientId/assessments', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const patientId = req.params.patientId;
      const patient = db.getPatientById(patientId);
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      // Security check
      if (req.user!.role === 'NUTRICIONISTA' && patient.nutritionistId !== req.nutritionist?.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }
      if (req.user!.role === 'PACIENTE' && patient.userId !== req.user!.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }

      const assessments = db.getAssessmentsByPatient(patientId);
      res.json(assessments);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao listar avaliações.' });
    }
  });

  // Create new assessment
  app.post(
    '/api/patients/:patientId/assessments',
    authMiddleware,
    requireRole('NUTRICIONISTA'),
    requireActiveLicense,
    (req: AuthenticatedRequest, res) => {
      try {
        const patientId = req.params.patientId;
        const patient = db.getPatientById(patientId);
        if (!patient || patient.nutritionistId !== req.nutritionist?.id) {
          res.status(404).json({ error: 'Paciente não encontrado.' });
          return;
        }

        const { protocol, weight, height, skinfolds, assessmentDate, notes } = req.body;
        if (!protocol || !weight || !height) {
          res.status(400).json({ error: 'Protocolo, peso e altura são obrigatórios.' });
          return;
        }

        // Calculate age from birthDate
        let age = 28;
        if (patient.birthDate) {
          const birth = new Date(patient.birthDate);
          const now = new Date();
          age = now.getFullYear() - birth.getFullYear();
          if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
            age--;
          }
        }

        // Run scientific calculations via isolated calculator service
        const calcResult = calculateComposition({
          gender: patient.gender,
          age,
          weight: Number(weight),
          height: Number(height),
          protocol,
          skinfolds: skinfolds || {},
        });

        const assessmentId = `ass-${Date.now()}`;
        const newAssessment: Assessment = {
          id: assessmentId,
          patientId,
          nutritionistId: req.nutritionist!.id,
          protocol,
          weight: Number(weight),
          height: Number(height),
          bmi: calcResult.bmi,
          bmiClassification: calcResult.bmiClassification,
          bodyFatPercentage: calcResult.bodyFatPercentage,
          fatMass: calcResult.fatMass,
          leanMass: calcResult.leanMass,
          bodyDensity: calcResult.bodyDensity,
          skinfoldsSum: calcResult.skinfoldsSum,
          skinfolds: skinfolds || {},
          assessmentDate: assessmentDate || new Date().toISOString().split('T')[0],
          notes: notes || '',
          createdAt: new Date().toISOString(),
        };

        db.createAssessment(newAssessment);

        res.status(201).json({
          message: 'Avaliação corporal registrada com sucesso!',
          assessment: newAssessment,
        });
      } catch (err: any) {
        console.error('Assessment creation error:', err);
        res.status(500).json({ error: 'Erro ao registrar avaliação: ' + err.message });
      }
    }
  );

  // Delete assessment
  app.delete(
    '/api/assessments/:id',
    authMiddleware,
    requireRole('NUTRICIONISTA'),
    requireActiveLicense,
    (req: AuthenticatedRequest, res) => {
      const assessment = db.getAssessmentById(req.params.id);
      if (!assessment || assessment.nutritionistId !== req.nutritionist?.id) {
        res.status(404).json({ error: 'Avaliação não encontrada ou não autorizada.' });
        return;
      }
      db.deleteAssessment(req.params.id);
      res.json({ message: 'Avaliação excluída com sucesso.' });
    }
  );

  // ==========================================
  // DIETS (GESTÃO DE DIETAS)
  // ==========================================

  // List diets for a patient
  app.get('/api/patients/:patientId/diets', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const patientId = req.params.patientId;
      const patient = db.getPatientById(patientId);
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      if (req.user!.role === 'NUTRICIONISTA' && patient.nutritionistId !== req.nutritionist?.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }
      if (req.user!.role === 'PACIENTE' && patient.userId !== req.user!.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }

      const diets = db.getDietsByPatient(patientId);
      res.json(diets);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar dietas.' });
    }
  });

  // Create diet
  app.post(
    '/api/patients/:patientId/diets',
    authMiddleware,
    requireRole('NUTRICIONISTA'),
    requireActiveLicense,
    (req: AuthenticatedRequest, res) => {
      try {
        const patientId = req.params.patientId;
        const patient = db.getPatientById(patientId);
        if (!patient || patient.nutritionistId !== req.nutritionist?.id) {
          res.status(404).json({ error: 'Paciente não encontrado.' });
          return;
        }

        const { title, objective, notes, startDate, endDate, meals } = req.body;
        if (!title || !meals || !Array.isArray(meals)) {
          res.status(400).json({ error: 'Título da dieta e pelo menos uma refeição são obrigatórios.' });
          return;
        }

        const dietId = `diet-${Date.now()}`;
        const now = new Date().toISOString();

        const formattedMeals = meals.map((m: any, mIdx: number) => ({
          id: m.id || `meal-${dietId}-${mIdx + 1}`,
          dietId,
          name: m.name || 'Refeição',
          time: m.time || '08:00',
          notes: m.notes || '',
          orderIndex: mIdx + 1,
          foods: (m.foods || []).map((f: any, fIdx: number) => ({
            id: f.id || `food-${dietId}-${mIdx}-${fIdx}`,
            mealId: m.id || `meal-${dietId}-${mIdx + 1}`,
            name: f.name,
            quantity: f.quantity,
            unit: f.unit || 'unidade',
            notes: f.notes || '',
            calories: Number(f.calories) || 0,
            protein: Number(f.protein) || 0,
            carbs: Number(f.carbs) || 0,
            fats: Number(f.fats) || 0,
          })),
        }));

        const newDiet: Diet = {
          id: dietId,
          patientId,
          nutritionistId: req.nutritionist!.id,
          title: title.trim(),
          objective: objective || '',
          notes: notes || '',
          startDate: startDate || now.split('T')[0],
          endDate: endDate || '',
          status: 'ATIVA',
          meals: formattedMeals,
          createdAt: now,
          updatedAt: now,
        };

        db.createDiet(newDiet);
        res.status(201).json({ message: 'Plano alimentar criado com sucesso!', diet: newDiet });
      } catch (err: any) {
        res.status(500).json({ error: 'Erro ao criar dieta: ' + err.message });
      }
    }
  );

  // Update diet
  app.put(
    '/api/diets/:id',
    authMiddleware,
    requireRole('NUTRICIONISTA'),
    requireActiveLicense,
    (req: AuthenticatedRequest, res) => {
      try {
        const diet = db.getDietById(req.params.id);
        if (!diet || diet.nutritionistId !== req.nutritionist?.id) {
          res.status(404).json({ error: 'Dieta não encontrada.' });
          return;
        }

        const { title, objective, notes, startDate, endDate, status, meals } = req.body;
        const updated = db.updateDiet(diet.id, {
          title: title || diet.title,
          objective: objective !== undefined ? objective : diet.objective,
          notes: notes !== undefined ? notes : diet.notes,
          startDate: startDate || diet.startDate,
          endDate: endDate !== undefined ? endDate : diet.endDate,
          status: status || diet.status,
          meals: meals || diet.meals,
        });

        res.json({ message: 'Dieta atualizada com sucesso!', diet: updated });
      } catch (err: any) {
        res.status(500).json({ error: 'Erro ao atualizar dieta.' });
      }
    }
  );

  // Delete diet
  app.delete(
    '/api/diets/:id',
    authMiddleware,
    requireRole('NUTRICIONISTA'),
    requireActiveLicense,
    (req: AuthenticatedRequest, res) => {
      const diet = db.getDietById(req.params.id);
      if (!diet || diet.nutritionistId !== req.nutritionist?.id) {
        res.status(404).json({ error: 'Dieta não encontrada.' });
        return;
      }
      db.deleteDiet(diet.id);
      res.json({ message: 'Dieta excluída com sucesso.' });
    }
  );

  // ==========================================
  // EVOLUTION DATA & COMPARISON
  // ==========================================

  app.get('/api/patients/:patientId/evolution', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const patientId = req.params.patientId;
      const patient = db.getPatientById(patientId);
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      if (req.user!.role === 'NUTRICIONISTA' && patient.nutritionistId !== req.nutritionist?.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }
      if (req.user!.role === 'PACIENTE' && patient.userId !== req.user!.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }

      const assessments = db.getAssessmentsByPatient(patientId);

      // Format time series
      const timeSeries = assessments.map((a) => ({
        id: a.id,
        date: a.assessmentDate,
        weight: a.weight,
        bodyFatPercentage: a.bodyFatPercentage,
        fatMass: a.fatMass,
        leanMass: a.leanMass,
        bmi: a.bmi,
        skinfoldsSum: a.skinfoldsSum || 0,
        skinfolds: a.skinfolds,
      }));

      let previousAssessment = null;
      let currentAssessment = null;
      let comparison = null;

      if (assessments.length > 0) {
        currentAssessment = assessments[assessments.length - 1];
        if (assessments.length > 1) {
          previousAssessment = assessments[assessments.length - 2];
          comparison = {
            weightDiff: Number((currentAssessment.weight - previousAssessment.weight).toFixed(2)),
            bodyFatDiff: Number((currentAssessment.bodyFatPercentage - previousAssessment.bodyFatPercentage).toFixed(2)),
            leanMassDiff: Number((currentAssessment.leanMass - previousAssessment.leanMass).toFixed(2)),
            fatMassDiff: Number((currentAssessment.fatMass - previousAssessment.fatMass).toFixed(2)),
            daysBetween: Math.round(
              (new Date(currentAssessment.assessmentDate).getTime() -
                new Date(previousAssessment.assessmentDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          };
        }
      }

      res.json({
        patient,
        assessmentsCount: assessments.length,
        timeSeries,
        currentAssessment,
        previousAssessment,
        comparison,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao calcular evolução.' });
    }
  });

  // ==========================================
  // CHAT / MESSAGES
  // ==========================================

  // Get messages for patient
  app.get('/api/messages/:patientId', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const patientId = req.params.patientId;
      const patient = db.getPatientById(patientId);
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      if (req.user!.role === 'NUTRICIONISTA' && patient.nutritionistId !== req.nutritionist?.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }
      if (req.user!.role === 'PACIENTE' && patient.userId !== req.user!.id) {
        res.status(403).json({ error: 'Não autorizado.' });
        return;
      }

      // Mark received messages as read
      db.markMessagesRead(patientId, req.user!.id);

      const messages = db.getMessagesBetween(patientId);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao carregar mensagens.' });
    }
  });

  // Send message
  app.post('/api/messages', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { patientId, content } = req.body;
      if (!patientId || !content || !content.trim()) {
        res.status(400).json({ error: 'Mensagem vazia ou paciente não especificado.' });
        return;
      }

      const patient = db.getPatientById(patientId);
      if (!patient) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }

      let receiverId = '';
      if (req.user!.role === 'NUTRICIONISTA') {
        if (patient.nutritionistId !== req.nutritionist?.id) {
          res.status(403).json({ error: 'Não autorizado.' });
          return;
        }
        receiverId = patient.userId;
      } else {
        if (patient.userId !== req.user!.id) {
          res.status(403).json({ error: 'Não autorizado.' });
          return;
        }
        const nutri = db.getNutritionistById(patient.nutritionistId);
        receiverId = nutri ? nutri.userId : '';
      }

      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        senderId: req.user!.id,
        receiverId,
        patientId,
        content: content.trim(),
        readAt: null,
        createdAt: new Date().toISOString(),
        senderName: req.user!.name,
        senderRole: req.user!.role,
      };

      db.createMessage(newMsg);
      res.status(201).json(newMsg);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
  });

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  app.get('/api/dashboard/stats', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role === 'NUTRICIONISTA') {
        const nutriId = req.nutritionist!.id;
        const patients = db.getPatientsByNutritionist(nutriId);
        const unreadCount = db.getUnreadCountForUser(req.user!.id);

        let totalAssessmentsThisMonth = 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const allAssessments = getDbAssessmentsForNutri(nutriId);
        allAssessments.forEach((a) => {
          const d = new Date(a.assessmentDate);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            totalAssessmentsThisMonth++;
          }
        });

        // Recent assessments list
        const recentAssessments = allAssessments
          .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())
          .slice(0, 5)
          .map((a) => {
            const pat = patients.find((p) => p.id === a.patientId);
            return {
              ...a,
              patientName: pat?.user.name || 'Paciente',
            };
          });

        res.json({
          totalPatients: patients.length,
          activePatients: patients.filter((p) => (p.currentWeight || 0) > 0).length || patients.length,
          assessmentsThisMonth: totalAssessmentsThisMonth,
          unreadMessages: unreadCount,
          licenseStatus: req.nutritionist!.licenseStatus,
          licenseType: req.nutritionist!.licenseType,
          licenseExpiration: req.nutritionist!.licenseExpiration,
          recentAssessments,
        });
      } else {
        // Patient dashboard
        const pat = req.patient;
        if (!pat) {
          res.status(404).json({ error: 'Perfil de paciente não encontrado.' });
          return;
        }

        const assessments = db.getAssessmentsByPatient(pat.id);
        const diets = db.getDietsByPatient(pat.id);
        const unreadCount = db.getUnreadCountForUser(req.user!.id);

        const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;
        const activeDiet = diets.find((d) => d.status === 'ATIVA') || diets[0] || null;

        res.json({
          patient: pat,
          currentWeight: pat.currentWeight || latestAssessment?.weight,
          currentBodyFat: pat.currentBodyFat || latestAssessment?.bodyFatPercentage,
          currentBmi: pat.currentBmi || latestAssessment?.bmi,
          lastAssessmentDate: pat.lastAssessmentDate || latestAssessment?.assessmentDate,
          assessmentsCount: assessments.length,
          unreadMessages: unreadCount,
          activeDiet,
          latestAssessment,
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao carregar estatísticas do dashboard.' });
    }
  });

  function getDbAssessmentsForNutri(nutriId: string): Assessment[] {
    const patients = db.getPatientsByNutritionist(nutriId);
    const patIds = new Set(patients.map((p) => p.id));
    return (db as any).getDb().assessments.filter((a: Assessment) => patIds.has(a.patientId));
  }

  // ==========================================
  // LICENSE MANAGEMENT
  // ==========================================

  app.get('/api/license', authMiddleware, requireRole('NUTRICIONISTA'), (req: AuthenticatedRequest, res) => {
    const license = db.getLicenseByNutritionistId(req.nutritionist!.id);
    res.json(license || req.license);
  });

  app.put('/api/license/toggle', authMiddleware, requireRole('NUTRICIONISTA'), (req: AuthenticatedRequest, res) => {
    const { status, type } = req.body;
    const license = db.getLicenseByNutritionistId(req.nutritionist!.id);
    if (!license) {
      res.status(404).json({ error: 'Licença não encontrada.' });
      return;
    }

    if (status) {
      license.status = status;
      db.updateNutritionist(req.nutritionist!.id, { licenseStatus: status });
    }
    if (type) {
      license.type = type;
      db.updateNutritionist(req.nutritionist!.id, { licenseType: type });
    }

    db.updateLicense(license.id, license);

    res.json({
      message: `Licença atualizada para ${license.status} (${license.type}).`,
      license,
    });
  });

  // ==========================================
  // PROFILE SETTINGS & PASSWORD CHANGE
  // ==========================================

  app.put('/api/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { name, phone, specialty, clinicName, height, birthDate, avatar } = req.body;
      const userId = req.user!.id;

      if (name) {
        db.updateUser(userId, { name, avatar: avatar || req.user!.avatar });
      }

      if (req.user!.role === 'NUTRICIONISTA' && req.nutritionist) {
        db.updateNutritionist(req.nutritionist.id, {
          phone: phone !== undefined ? phone : req.nutritionist.phone,
          specialty: specialty !== undefined ? specialty : req.nutritionist.specialty,
          clinicName: clinicName !== undefined ? clinicName : req.nutritionist.clinicName,
        });
      } else if (req.user!.role === 'PACIENTE' && req.patient) {
        db.updatePatient(req.patient.id, {
          phone: phone !== undefined ? phone : req.patient.phone,
          height: height ? Number(height) : req.patient.height,
          birthDate: birthDate || req.patient.birthDate,
        });
      }

      res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
  });

  app.put('/api/profile/password', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Preencha a senha atual e a nova senha.' });
        return;
      }

      const user = db.getUserById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      if (!comparePassword(currentPassword, (user as any).passwordHash)) {
        res.status(401).json({ error: 'A senha atual está incorreta.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'A nova senha deve possuir pelo menos 6 caracteres.' });
        return;
      }

      const newHash = hashPassword(newPassword);
      db.updateUserPassword(user.id, newHash);

      res.json({ message: 'Senha alterada com sucesso!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao trocar senha.' });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NutriGestão Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
