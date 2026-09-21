import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import { User, NutritionistProfile, PatientProfile, License } from '../src/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'nutrigestao-super-secret-jwt-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'NUTRICIONISTA' | 'PACIENTE';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  tokenPayload?: TokenPayload;
  nutritionist?: NutritionistProfile;
  patient?: PatientProfile;
  license?: License;
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Sessão expirada ou token inválido' });
    return;
  }

  const user = db.getUserById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'Usuário não encontrado' });
    return;
  }

  req.user = user;
  req.tokenPayload = payload;

  if (user.role === 'NUTRICIONISTA') {
    const nutri = db.getNutritionistByUserId(user.id);
    if (nutri) {
      req.nutritionist = nutri;
      const license = db.getLicenseByNutritionistId(nutri.id);
      if (license) {
        req.license = license;
      }
    }
  } else if (user.role === 'PACIENTE') {
    const patient = db.getPatientByUserId(user.id);
    if (patient) {
      req.patient = patient;
    }
  }

  next();
}

export function requireRole(role: 'NUTRICIONISTA' | 'PACIENTE') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: `Acesso restrito a ${role.toLowerCase()}s` });
      return;
    }
    next();
  };
}

export function requireActiveLicense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.nutritionist) {
    res.status(403).json({ error: 'Perfil de nutricionista não encontrado' });
    return;
  }

  if (req.nutritionist.licenseStatus !== 'ATIVA') {
    res.status(403).json({
      error: `Sua licença profissional está ${req.nutritionist.licenseStatus}. Regularize sua licença para continuar operando.`,
      licenseStatus: req.nutritionist.licenseStatus,
    });
    return;
  }
  next();
}
