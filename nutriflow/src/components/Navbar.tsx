import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Activity,
  Award,
  ChevronDown,
  KeyRound,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings?: () => void;
  onNavigateToChat?: () => void;
  unreadMessagesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onNavigateToChat,
  unreadMessagesCount = 0,
}) => {
  const { user, nutritionist, license, logout, quickSwitchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  if (!user) return null;

  const isNutri = user.role === 'NUTRICIONISTA';
  const licenseStatus = nutritionist?.licenseStatus || license?.status || 'ATIVA';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-950/40 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/30 ring-1 ring-purple-400/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">NutriFlow</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/40 text-purple-300">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">Plataforma Clínica & Pacientes</p>
          </div>
        </div>

        {/* Demo Switcher Pill */}
        <div className="hidden md:flex items-center space-x-2 bg-neutral-900/90 border border-neutral-800/80 rounded-full px-3 py-1 text-xs">
          <span className="text-neutral-400">Demo Rápida:</span>
          <button
            onClick={() => quickSwitchUser('dr.carlos@nutriflow.com')}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
              isNutri
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Dr. Carlos (Nutri)
          </button>
          <span className="text-neutral-600">|</span>
          <button
            onClick={() => quickSwitchUser('mariana.silva@email.com')}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
              !isNutri
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Mariana (Paciente)
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-4">
          {/* License badge for Nutritionist */}
          {isNutri && (
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                licenseStatus === 'ATIVA'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
              }`}
              title={`Licença: ${licenseStatus} - ${nutritionist?.crn || ''}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Licença {licenseStatus}</span>
            </div>
          )}

          {/* Quick Chat Shortcut */}
          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              className="relative p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 transition border border-transparent hover:border-neutral-800"
              title="Mensagens"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-purple-500/40"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-white truncate max-w-[130px]">{user.name}</p>
                <p className="text-[10px] text-purple-400 font-semibold">{user.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-neutral-800">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                    {user.role}
                  </span>
                </div>

                <div className="py-1">
                  {onOpenSettings && (
                    <button
                      onClick={onOpenSettings}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-xl transition text-left"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span>Configurações da Conta</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-neutral-800">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-xl transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
