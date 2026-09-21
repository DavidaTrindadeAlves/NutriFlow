import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { KeyRound, ShieldCheck, Check, AlertCircle, Sparkles, LogOut } from 'lucide-react';

export const FirstPasswordChangeModal: React.FC = () => {
  const { user, refreshSession, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password criteria
  const hasMinLength = newPassword.length >= 6;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      await api.changeFirstPassword(newPassword);
      setSuccess(true);
      setTimeout(async () => {
        await refreshSession();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao definir nova senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-purple-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 mb-3">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Primeiro Acesso ao NutriFlow</span>
          </span>
          <h2 className="text-xl font-extrabold text-white">Cadastre sua Senha Definitiva</h2>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed max-w-sm">
            Olá, <strong>{user?.name}</strong>! Você fez login usando uma senha provisória enviada pelo seu nutricionista.
            Para proteger seus dados de saúde, escolha uma nova senha pessoal.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Senha cadastrada com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">Nova Senha Pessoal</label>
            <input
              type="password"
              required
              disabled={loading || success}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite sua nova senha"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">Confirme a Nova Senha</label>
            <input
              type="password"
              required
              disabled={loading || success}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita sua nova senha"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>

          {/* Validation Checklist */}
          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-1.5 text-[11px]">
            <div className={`flex items-center space-x-2 ${hasMinLength ? 'text-emerald-400' : 'text-neutral-500'}`}>
              <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-400' : 'text-neutral-600'}`} />
              <span>Mínimo de 6 caracteres</span>
            </div>
            <div className={`flex items-center space-x-2 ${hasNumberOrSymbol ? 'text-emerald-400' : 'text-neutral-500'}`}>
              <Check className={`w-3.5 h-3.5 ${hasNumberOrSymbol ? 'text-emerald-400' : 'text-neutral-600'}`} />
              <span>Inclui número ou símbolo especial</span>
            </div>
            <div className={`flex items-center space-x-2 ${passwordsMatch ? 'text-emerald-400' : 'text-neutral-500'}`}>
              <Check className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-400' : 'text-neutral-600'}`} />
              <span>As duas senhas coincidem</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={!isValid || loading || success}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-bold transition shadow-lg shadow-purple-900/40 flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Senha e Entrar'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="py-3 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white font-medium transition flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
