import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, nutritionist, license, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'senha' | 'licenca'>('perfil');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(nutritionist?.phone || '');
  const [specialty, setSpecialty] = useState(nutritionist?.specialty || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // License state simulation
  const [togglingLicense, setTogglingLicense] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      await api.updateProfile({ name, phone, specialty });
      await refreshSession();
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar perfil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'A confirmação de senha não confere.' });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao alterar senha.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleLicense = async (status: 'ATIVA' | 'INATIVA' | 'EXPIRADA') => {
    setTogglingLicense(true);
    setMessage(null);
    try {
      const res = await api.toggleLicense(status);
      await refreshSession();
      setMessage({ type: 'success', text: `Status da licença alterado para: ${status}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao alterar licença.' });
    } finally {
      setTogglingLicense(false);
    }
  };

  const isNutri = user?.role === 'NUTRICIONISTA';
  const currentLicenseStatus = nutritionist?.licenseStatus || license?.status || 'ATIVA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-purple-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Configurações da Conta</h3>
        <p className="text-xs text-neutral-400 mb-6">Gerencie seus dados pessoais, senha e licença</p>

        {/* Tabs */}
        <div className="flex rounded-xl bg-neutral-950 p-1 mb-6 border border-neutral-800 text-xs">
          <button
            onClick={() => {
              setActiveTab('perfil');
              setMessage(null);
            }}
            className={`flex-1 py-2 font-semibold rounded-lg transition ${
              activeTab === 'perfil' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Meu Perfil
          </button>
          <button
            onClick={() => {
              setActiveTab('senha');
              setMessage(null);
            }}
            className={`flex-1 py-2 font-semibold rounded-lg transition ${
              activeTab === 'senha' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Segurança & Senha
          </button>
          {isNutri && (
            <button
              onClick={() => {
                setActiveTab('licenca');
                setMessage(null);
              }}
              className={`flex-1 py-2 font-semibold rounded-lg transition ${
                activeTab === 'licenca' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Licença CRN
            </button>
          )}
        </div>

        {/* Message toast */}
        {message && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* TAB 1: PERFIL */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">E-mail (não alterável)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-neutral-950/50 border border-neutral-800/50 rounded-xl px-3 py-2 text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            {isNutri && (
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Especialidade Clínica</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Nutrição Esportiva & Clínica"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full mt-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition disabled:opacity-50"
            >
              {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        )}

        {/* TAB 2: SENHA */}
        {activeTab === 'senha' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Senha Atual</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                (Senha padrão do ambiente de teste: password123)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Nova Senha</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Pelo menos 6 caracteres"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full mt-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition disabled:opacity-50"
            >
              {savingPassword ? 'Alterando...' : 'Atualizar Senha'}
            </button>
          </form>
        )}

        {/* TAB 3: LICENÇA CRN */}
        {activeTab === 'licenca' && isNutri && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-400">Status Atual:</span>
                <span
                  className={`font-bold px-3 py-1 rounded-full text-[11px] ${
                    currentLicenseStatus === 'ATIVA'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                  }`}
                >
                  {currentLicenseStatus}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Número de Registro:</span>
                <span className="font-mono text-purple-300">{nutritionist?.crn || 'CRN-3 48190/SP'}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Validade:</span>
                <span>{nutritionist?.licenseExpiration || '31/12/2026'}</span>
              </div>
            </div>

            {/* License State Tester */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-purple-950/40 space-y-2">
              <p className="font-bold text-white text-[11px] flex items-center">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                Simulador de Licença (Validação Backend - Etapa 6 & 9)
              </p>
              <p className="text-[11px] text-neutral-400">
                Alterne o status da licença para validar que o backend bloqueia cadastros e prescrições quando
                inativo:
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleLicense('ATIVA')}
                  disabled={togglingLicense}
                  className="py-2 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900 font-bold transition text-center"
                >
                  Ativar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLicense('INATIVA')}
                  disabled={togglingLicense}
                  className="py-2 rounded-xl bg-amber-950 border border-amber-700/60 text-amber-300 hover:bg-amber-900 font-bold transition text-center"
                >
                  Suspender
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLicense('EXPIRADA')}
                  disabled={togglingLicense}
                  className="py-2 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-300 hover:bg-rose-900 font-bold transition text-center"
                >
                  Expirar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
