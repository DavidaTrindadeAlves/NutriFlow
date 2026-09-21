import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Activity, AlertCircle, CheckCircle2, Lock, Mail, Phone, ShieldCheck, User, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<'NUTRICIONISTA' | 'PACIENTE'>('NUTRICIONISTA');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [crn, setCrn] = useState('');
  const [specialty, setSpecialty] = useState('Nutrição Esportiva & Clínica');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('1995-05-14');
  const [gender, setGender] = useState<'M' | 'F'>('F');
  const [height, setHeight] = useState(168);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        setError('Por favor, informe seu e-mail.');
        setLoading(false);
        return;
      }

      if (!password) {
        setError('Por favor, digite sua senha.');
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        await login(cleanEmail, password);
        onClose();
      } else if (mode === 'register') {
        if (!name.trim()) {
          setError('Por favor, informe seu nome completo.');
          setLoading(false);
          return;
        }
        await register({
          name: name.trim(),
          email: cleanEmail,
          password,
          role,
          crn,
          specialty,
          phone,
          birthDate,
          gender,
          height,
        });
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(cleanEmail);
        setSuccess(res.message || 'Instruções enviadas com sucesso.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('password123');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-purple-900/40 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Acessar Conta' : mode === 'register' ? 'Criar Nova Conta' : 'Recuperar Senha'}
            </h3>
            <p className="text-xs text-neutral-400">NutriGestão — Sistema Clínico</p>
          </div>
        </div>

        {/* Mode switcher tabs */}
        {mode !== 'forgot' && (
          <div className="flex rounded-xl bg-neutral-950 p-1 mb-6 border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Tipo de Usuário</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('NUTRICIONISTA')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      role === 'NUTRICIONISTA'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-sm'
                        : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Nutricionista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('PACIENTE')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      role === 'PACIENTE'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-sm'
                        : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Paciente</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'NUTRICIONISTA' ? 'Ex: Dr. Roberto Alves' : 'Ex: Camila Mendes'}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Nutri specifics */}
              {role === 'NUTRICIONISTA' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">CRN / Registro</label>
                    <input
                      type="text"
                      value={crn}
                      onChange={(e) => setCrn(e.target.value)}
                      placeholder="CRN-3 48190"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Especialidade</label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Nutrição Esportiva"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Patient specifics */}
              {role === 'PACIENTE' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Gênero</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="F">Feminino</option>
                      <option value="M">Masculino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Nascimento</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      placeholder="170"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-300">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-900/30 transition disabled:opacity-50"
          >
            {loading
              ? 'Processando...'
              : mode === 'login'
              ? 'Entrar no Sistema'
              : mode === 'register'
              ? 'Cadastrar Conta'
              : 'Enviar Instruções'}
          </button>
        </form>

        {/* Back to login if forgot */}
        {mode === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="text-xs text-neutral-400 hover:text-white transition"
            >
              Voltar ao login
            </button>
          </div>
        )}

        {/* Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-neutral-900 px-3 text-neutral-500">ou acesse com</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-800 hover:bg-neutral-800/80 active:scale-95 transition flex items-center justify-center space-x-2 text-xs font-semibold text-neutral-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com Google</span>
            </button>

            {/* Quick Demo Fill Buttons */}
            <div className="mt-5 pt-4 border-t border-neutral-800/80">
              <p className="text-[11px] text-neutral-400 font-medium mb-2 text-center">
                Atalhos para demonstração:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('dr.carlos@nutrigestao.com')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 hover:border-purple-600 hover:text-white transition text-center"
                >
                  Dr. Carlos (Nutri)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('mariana.silva@email.com')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 hover:border-purple-600 hover:text-white transition text-center"
                >
                  Mariana (Paciente)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
