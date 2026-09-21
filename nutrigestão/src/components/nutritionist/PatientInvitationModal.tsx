import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { PatientInvitation } from '../../types.ts';

interface PatientInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: PatientInvitation | null;
}

export const PatientInvitationModal: React.FC<PatientInvitationModalProps> = ({
  isOpen,
  onClose,
  invitation,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  if (!isOpen || !invitation) return null;

  const appUrl = window.location.origin;

  const messageText = `Olá ${invitation.patientName}! 👋\n\nSou seu(sua) nutricionista no NutriFlow. Seu portal de acompanhamento nutricional já está disponível!\n\n🌐 Acesso: ${appUrl}\n📧 E-mail: ${invitation.email}\n🔑 Senha provisória: ${invitation.temporaryPassword}\n\n⚠️ Ao entrar pela primeira vez, o sistema solicitará que você cadastre sua senha pessoal definitiva para garantir a privacidade dos seus dados.`;

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(invitation.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFullText = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent('Seu acesso ao Portal NutriFlow');
    const body = encodeURIComponent(messageText);
    window.open(`mailto:${invitation.email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-purple-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-extrabold text-white">Convite de Acesso do Paciente</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Senha Provisória
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Envie estes dados para <strong>{invitation.patientName}</strong> acessar o NutriFlow.
            </p>
          </div>
        </div>

        {/* Temporary Credentials Box */}
        <div className="bg-neutral-950/80 border border-purple-900/40 rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">E-mail de Login:</span>
            <span className="font-mono text-neutral-200 font-semibold">{invitation.email}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800/70">
            <span className="text-neutral-400">Senha Provisória:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-black text-purple-300 px-2 py-0.5 rounded-lg bg-purple-950 border border-purple-800">
                {invitation.temporaryPassword}
              </span>
              <button
                onClick={handleCopyPassword}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                title="Copiar senha"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* Informative Note */}
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-neutral-300 text-xs flex items-start space-x-2.5 mb-5">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            O paciente usará esta senha no primeiro login. O sistema exigirá automaticamente que ele cadastre
            sua própria senha pessoal antes de acessar a dieta e o histórico.
          </p>
        </div>

        {/* Action Buttons: WhatsApp & Email & Copy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={handleOpenWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-950"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            onClick={handleOpenEmail}
            className="py-2.5 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-950"
          >
            <Mail className="w-4 h-4" />
            <span>Abrir no E-mail</span>
          </button>
        </div>

        <button
          onClick={handleCopyFullText}
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold text-xs transition flex items-center justify-center space-x-2 border border-neutral-700/60"
        >
          {copiedFull ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-bold">Mensagem Completa Copiada!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-neutral-400" />
              <span>Copiar Texto Completo do Convite</span>
            </>
          )}
        </button>

        <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-white text-xs font-semibold transition"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
