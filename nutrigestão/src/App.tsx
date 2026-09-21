import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { NutritionistDashboard } from './components/nutritionist/NutritionistDashboard.tsx';
import { PatientsList } from './components/nutritionist/PatientsList.tsx';
import { PatientDetailView } from './components/nutritionist/PatientDetailView.tsx';
import { ChatView } from './components/nutritionist/ChatView.tsx';
import { PatientPortal } from './components/patient/PatientPortal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';

function AppContent() {
  const { user, nutritionist, license, loading, quickSwitchUser } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'patients' | 'messages' | 'settings'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [newPatientModalOpen, setNewPatientModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center animate-bounce shadow-xl shadow-purple-900/40">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-neutral-400 font-medium">Carregando NutriGestão...</p>
      </div>
    );
  }

  // Not logged in: Show modern landing page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onQuickLogin={(email) => quickSwitchUser(email)}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </>
    );
  }

  const isNutri = user.role === 'NUTRICIONISTA';
  const licenseStatus = nutritionist?.licenseStatus || license?.status || 'ATIVA';

  // Navigation handlers
  const handleNavigate = (view: string, patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
      setCurrentView('patients');
    } else {
      setSelectedPatientId(null);
      setCurrentView(view as any);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setSettingsModalOpen(true)}
        onNavigateToChat={() => {
          if (isNutri) {
            setSelectedPatientId(null);
            setCurrentView('messages');
          }
        }}
        unreadMessagesCount={2}
      />

      {/* License Inactive Warning Banner (if toggled to INATIVA or EXPIRADA) */}
      {isNutri && licenseStatus !== 'ATIVA' && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto w-full">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Atenção:</strong> Sua licença profissional está com status{' '}
              <strong className="uppercase">{licenseStatus}</strong>. O cadastro de novos pacientes e prescrições
              estão bloqueados temporariamente.
            </span>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="ml-auto underline font-bold text-amber-300 hover:text-white shrink-0"
            >
              Regularizar Licença
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If user is a Nutritionist */}
        {isNutri ? (
          <div className="space-y-6">
            {/* Top Navigation Tabs for Nutritionist */}
            <div className="flex items-center space-x-2 border-b border-purple-950/40 pb-4 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setCurrentView('dashboard');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  currentView === 'dashboard' && !selectedPatientId
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Visão Geral</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setCurrentView('patients');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  currentView === 'patients' && !selectedPatientId
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Meus Pacientes</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setCurrentView('messages');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  currentView === 'messages' && !selectedPatientId
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                    : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Mensagens & Chat</span>
              </button>
            </div>

            {/* View Switching */}
            {selectedPatientId ? (
              <PatientDetailView
                patientId={selectedPatientId}
                onBack={() => setSelectedPatientId(null)}
              />
            ) : currentView === 'dashboard' ? (
              <NutritionistDashboard
                onNavigate={handleNavigate}
                onOpenNewPatientModal={() => {
                  setCurrentView('patients');
                  setNewPatientModalOpen(true);
                }}
              />
            ) : currentView === 'patients' ? (
              <PatientsList
                onSelectPatient={(id) => setSelectedPatientId(id)}
                openNewPatientModal={newPatientModalOpen}
                onCloseNewPatientModal={() => setNewPatientModalOpen(false)}
              />
            ) : currentView === 'messages' ? (
              <ChatView />
            ) : null}
          </div>
        ) : (
          /* Patient Portal View */
          <PatientPortal />
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
