import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthSession, License, NutritionistProfile, PatientProfile, User } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  nutritionist: NutritionistProfile | null;
  patient: PatientProfile | null;
  license: License | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (role?: 'NUTRICIONISTA' | 'PACIENTE') => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  quickSwitchUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [nutritionist, setNutritionist] = useState<NutritionistProfile | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  const setSessionData = (session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    api.setToken(session.token);
    setNutritionist(session.nutritionist || null);
    setPatient(session.patient || null);
    setLicense(session.license || null);
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    api.removeToken();
    setNutritionist(null);
    setPatient(null);
    setLicense(null);
  };

  const refreshSession = async () => {
    try {
      if (!api.getToken()) {
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setNutritionist(data.nutritionist || null);
      setPatient(data.patient || null);
      setLicense(data.license || null);
    } catch (err) {
      console.warn('Session refresh failed:', err);
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setSessionData(res.session);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (role: 'NUTRICIONISTA' | 'PACIENTE' = 'NUTRICIONISTA') => {
    setLoading(true);
    try {
      const isNutri = role === 'NUTRICIONISTA';
      const name = isNutri ? 'Dra. Gabriela Castro' : 'Lucas Ferreira';
      const email = isNutri ? 'dra.gabriela@gmail.com' : 'lucas.ferreira@email.com';
      const res = await api.googleLogin({
        name,
        email,
        role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      });
      setSessionData(res.session);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: any) => {
    setLoading(true);
    try {
      const res = await api.register(formData);
      setSessionData(res.session);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
  };

  const quickSwitchUser = async (email: string) => {
    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        nutritionist,
        patient,
        license,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshSession,
        quickSwitchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
