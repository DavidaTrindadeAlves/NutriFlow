import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import {
  Assessment,
  AssessmentCalculationResult,
  AssessmentProtocol,
  Diet,
  Message,
  PatientInvitation,
  PatientProfile,
} from '../../types.ts';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  KeyRound,
  LineChart as LineChartIcon,
  MessageSquare,
  Minus,
  Plus,
  Scale,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Utensils,
  X,
} from 'lucide-react';
import { PatientInvitationModal } from './PatientInvitationModal.tsx';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PatientDetailViewProps {
  patientId: string;
  onBack: () => void;
  initialTab?: 'resumo' | 'avaliacoes' | 'dietas' | 'evolucao' | 'chat';
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patientId,
  onBack,
  initialTab = 'resumo',
}) => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'resumo' | 'avaliacoes' | 'dietas' | 'evolucao' | 'chat'>(initialTab);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [evolutionData, setEvolutionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Chat input
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Patient invitation modal
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<PatientInvitation | null>(null);

  const handleOpenInvitation = async () => {
    if (!patient) return;
    try {
      const inv = await api.getPatientInvitation(patient.id);
      setCurrentInvitation(inv);
      setInvitationModalOpen(true);
    } catch {
      setCurrentInvitation({
        patientId: patient.id,
        patientName: patient.user?.name || 'Paciente',
        email: patient.user?.email || '',
        temporaryPassword: patient.temporaryPassword || 'NF-PROV123',
        status: patient.invitationStatus || 'PENDENTE',
        sentAt: patient.invitationSentAt || new Date().toISOString(),
      });
      setInvitationModalOpen(true);
    }
  };

  // New Assessment Drawer / Modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [protocol, setProtocol] = useState<AssessmentProtocol>('pollock_7');
  const [weightInput, setWeightInput] = useState<number>(65);
  const [heightInput, setHeightInput] = useState<number>(168);
  const [skinfoldsInput, setSkinfoldsInput] = useState<Record<string, number>>({
    triceps: 14,
    subscapular: 12,
    pectoral: 10,
    midaxillary: 11,
    suprailiac: 15,
    abdominal: 18,
    thigh: 20,
  });
  const [calcPreview, setCalcPreview] = useState<AssessmentCalculationResult | null>(null);
  const [savingAssessment, setSavingAssessment] = useState(false);

  // New Diet Drawer / Modal state
  const [showDietModal, setShowDietModal] = useState(false);
  const [dietTitle, setDietTitle] = useState('Plano Nutricional Personalizado');
  const [dietObjective, setDietObjective] = useState('Emagrecimento com manutenção de massa magra');
  const [dietNotes, setDietNotes] = useState('Beber pelo menos 2,5L de água por dia.');
  const [meals, setMeals] = useState<any[]>([
    {
      name: 'Café da Manhã',
      time: '07:30',
      foods: [
        { name: 'Ovos mexidos', quantity: '2', unit: 'unidades', calories: 156, protein: 12, carbs: 1, fats: 10 },
        { name: 'Pão integral', quantity: '2', unit: 'fatias', calories: 130, protein: 5, carbs: 24, fats: 1.5 },
        { name: 'Mamão papaia', quantity: '1/2', unit: 'unidade', calories: 60, protein: 1, carbs: 15, fats: 0.1 },
      ],
    },
    {
      name: 'Almoço',
      time: '12:30',
      foods: [
        { name: 'Peito de frango grelhado', quantity: '150', unit: 'g', calories: 240, protein: 46, carbs: 0, fats: 5 },
        { name: 'Arroz integral', quantity: '100', unit: 'g', calories: 124, protein: 3, carbs: 26, fats: 1 },
        { name: 'Feijão preto cozido', quantity: '80', unit: 'g', calories: 73, protein: 5, carbs: 14, fats: 0.5 },
        { name: 'Salada verde à vontade com azeite', quantity: '1', unit: 'prato', calories: 80, protein: 1, carbs: 3, fats: 7 },
      ],
    },
    {
      name: 'Lanche da Tarde',
      time: '16:00',
      foods: [
        { name: 'Iogurte natural desnatado', quantity: '170', unit: 'g', calories: 85, protein: 10, carbs: 9, fats: 0 },
        { name: 'Whey Protein Isolado', quantity: '1', unit: 'scoop (30g)', calories: 120, protein: 26, carbs: 2, fats: 1 },
      ],
    },
  ]);
  const [savingDiet, setSavingDiet] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [patientId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [patData, assData, dietsData, evoData, msgData] = await Promise.all([
        api.getPatient(patientId),
        api.getAssessments(patientId),
        api.getDiets(patientId),
        api.getEvolution(patientId),
        api.getMessages(patientId),
      ]);

      setPatient(patData);
      setAssessments(assData);
      setDiets(dietsData);
      setEvolutionData(evoData);
      setMessages(msgData);

      if (patData) {
        setWeightInput(patData.currentWeight || 65);
        setHeightInput(patData.height || 170);
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time calculation preview when inputs change
  useEffect(() => {
    if (!patient) return;
    const updatePreview = async () => {
      try {
        let age = 28;
        if (patient.birthDate) {
          const birth = new Date(patient.birthDate);
          age = new Date().getFullYear() - birth.getFullYear();
        }

        const preview = await api.previewCalculation({
          gender: patient.gender,
          age,
          weight: Number(weightInput),
          height: Number(heightInput),
          protocol,
          skinfolds: skinfoldsInput,
        });
        setCalcPreview(preview);
      } catch (err) {
        // silently handle preview calculation error
      }
    };
    updatePreview();
  }, [protocol, weightInput, heightInput, skinfoldsInput, patient]);

  // Skinfold change handler
  const handleFoldChange = (fold: string, val: number) => {
    setSkinfoldsInput((prev) => ({
      ...prev,
      [fold]: val,
    }));
  };

  // Save new assessment
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAssessment(true);
    try {
      await api.createAssessment(patientId, {
        protocol,
        weight: weightInput,
        height: heightInput,
        skinfolds: skinfoldsInput,
        assessmentDate: new Date().toISOString().split('T')[0],
        notes: 'Avaliação física realizada em consultório.',
      });
      setShowAssessmentModal(false);
      await loadAllData();
      setActiveTab('avaliacoes');
    } catch (err: any) {
      alert('Erro ao salvar avaliação: ' + err.message);
    } finally {
      setSavingAssessment(false);
    }
  };

  // Delete assessment
  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    try {
      await api.deleteAssessment(id);
      await loadAllData();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Save new diet
  const handleSaveDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDiet(true);
    try {
      await api.createDiet(patientId, {
        title: dietTitle,
        objective: dietObjective,
        notes: dietNotes,
        meals,
      });
      setShowDietModal(false);
      await loadAllData();
      setActiveTab('dietas');
    } catch (err: any) {
      alert('Erro ao salvar dieta: ' + err.message);
    } finally {
      setSavingDiet(false);
    }
  };

  // Send Chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setSendingMsg(true);
    try {
      const newMsg = await api.sendMessage(patientId, chatMessage);
      setMessages((prev) => [...prev, newMsg]);
      setChatMessage('');
    } catch (err: any) {
      alert('Erro ao enviar mensagem: ' + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading || !patient) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-10 w-48 bg-neutral-900 rounded-xl" />
        <div className="h-44 bg-neutral-900 rounded-2xl" />
        <div className="h-96 bg-neutral-900 rounded-2xl" />
      </div>
    );
  }

  const latestAssessment = assessments[assessments.length - 1];
  const comparison = evolutionData?.comparison;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {patient.user?.name}
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800/40 text-purple-300">
                Prontuário Ativo
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {patient.user?.email} • {patient.phone || 'Sem telefone'} • Altura: {patient.height} cm • Gênero:{' '}
              {patient.gender === 'M' ? 'Masculino' : 'Feminino'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenInvitation}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-amber-800/50 hover:bg-neutral-800 text-amber-300 text-xs font-bold transition flex items-center space-x-1.5"
            title="Ver senha provisória e convite de acesso do paciente"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Acesso & Convite</span>
          </button>
          <button
            onClick={() => setShowAssessmentModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition flex items-center space-x-1.5"
          >
            <Scale className="w-4 h-4" />
            <span>Nova Avaliação</span>
          </button>
          <button
            onClick={() => setShowDietModal(true)}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-purple-800/40 hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Utensils className="w-4 h-4 text-purple-400" />
            <span>Criar Dieta</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-neutral-800 text-xs font-semibold text-neutral-400 space-x-1 scrollbar-none">
        {[
          { key: 'resumo', label: 'Resumo Clínico', icon: User },
          { key: 'avaliacoes', label: `Avaliações (${assessments.length})`, icon: Scale },
          { key: 'dietas', label: `Planos Alimentares (${diets.length})`, icon: Utensils },
          { key: 'evolucao', label: 'Evolução & Gráficos', icon: LineChartIcon },
          { key: 'chat', label: `Chat (${messages.length})`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-purple-500 text-white font-bold bg-neutral-900/50 rounded-t-xl'
                  : 'border-transparent hover:text-white hover:border-neutral-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-neutral-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RESUMO CLÍNICO */}
      {/* ========================================================= */}
      {activeTab === 'resumo' && (
        <div className="space-y-6">
          {/* 4 Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Peso Atual</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                {latestAssessment?.weight || patient.currentWeight || '—'}{' '}
                <span className="text-xs font-normal text-neutral-400">kg</span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Último registro: {latestAssessment ? latestAssessment.assessmentDate : '—'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">% Gordura Corporal</span>
              <div className="text-2xl font-extrabold text-purple-400 mt-1">
                {latestAssessment?.bodyFatPercentage || patient.currentBodyFat || '—'}{' '}
                <span className="text-xs font-normal text-purple-400/80">%</span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Fórmula: {latestAssessment?.protocol ? latestAssessment.protocol.toUpperCase() : 'Pollock'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Massa Magra</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {latestAssessment?.leanMass ? `${latestAssessment.leanMass}` : '—'}{' '}
                <span className="text-xs font-normal text-emerald-400/80">kg</span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Massa gorda: {latestAssessment?.fatMass ? `${latestAssessment.fatMass} kg` : '—'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Índice IMC</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                {latestAssessment?.bmi || patient.currentBmi || '—'}
              </div>
              <span className="text-[10px] text-purple-300 bg-purple-950/80 border border-purple-800/40 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                {latestAssessment?.bmiClassification || 'Normal'}
              </span>
            </div>
          </div>

          {/* Body Composition Progress Bar */}
          {latestAssessment && (
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-purple-950/40">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Distribuição de Composição Corporal
              </h3>
              <div className="h-6 w-full rounded-xl bg-neutral-950 overflow-hidden flex p-1 border border-neutral-800">
                <div
                  style={{ width: `${100 - latestAssessment.bodyFatPercentage}%` }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg h-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  title={`Massa Magra: ${latestAssessment.leanMass} kg (${(100 - latestAssessment.bodyFatPercentage).toFixed(1)}%)`}
                >
                  Massa Magra {(100 - latestAssessment.bodyFatPercentage).toFixed(1)}%
                </div>
                <div
                  style={{ width: `${latestAssessment.bodyFatPercentage}%` }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg h-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ml-1"
                  title={`Gordura: ${latestAssessment.fatMass} kg (${latestAssessment.bodyFatPercentage}%)`}
                >
                  Gordura {latestAssessment.bodyFatPercentage}%
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                  Massa Magra: {latestAssessment.leanMass} kg
                </span>
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5" />
                  Massa Gorda: {latestAssessment.fatMass} kg
                </span>
              </div>
            </div>
          )}

          {/* Quick Comparison between last two evaluations */}
          {comparison && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-neutral-900/80 border border-purple-900/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                  Evolução Recente (Última vs Penúltima Avaliação)
                </h3>
                <span className="text-[11px] text-neutral-400">{comparison.daysBetween} dias de intervalo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase font-medium">Variação de Peso</span>
                  <p
                    className={`text-base font-extrabold mt-0.5 flex items-center justify-center ${
                      comparison.weightDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {comparison.weightDiff <= 0 ? (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    )}
                    {comparison.weightDiff > 0 ? `+${comparison.weightDiff}` : comparison.weightDiff} kg
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase font-medium">% Gordura</span>
                  <p
                    className={`text-base font-extrabold mt-0.5 flex items-center justify-center ${
                      comparison.bodyFatDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {comparison.bodyFatDiff <= 0 ? (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    )}
                    {comparison.bodyFatDiff > 0 ? `+${comparison.bodyFatDiff}` : comparison.bodyFatDiff}%
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase font-medium">Massa Magra</span>
                  <p
                    className={`text-base font-extrabold mt-0.5 flex items-center justify-center ${
                      comparison.leanMassDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {comparison.leanMassDiff >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {comparison.leanMassDiff > 0 ? `+${comparison.leanMassDiff}` : comparison.leanMassDiff} kg
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase font-medium">Massa Gorda</span>
                  <p
                    className={`text-base font-extrabold mt-0.5 flex items-center justify-center ${
                      comparison.fatMassDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {comparison.fatMassDiff <= 0 ? (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    )}
                    {comparison.fatMassDiff > 0 ? `+${comparison.fatMassDiff}` : comparison.fatMassDiff} kg
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Patient notes */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-purple-950/40">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Observações Clínicas & Anamnese
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {patient.notes ||
                'Paciente em acompanhamento nutricional com foco em hipertrofia e definição muscular. Boa adesão ao plano de hidratação.'}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AVALIAÇÕES CORPORAIS COM DOBRAS */}
      {/* ========================================================= */}
      {activeTab === 'avaliacoes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Histórico de Avaliações Antropométricas</h2>
              <p className="text-xs text-neutral-400">
                Registros com protocolos Pollock, Faulkner, Petroski e Guedes
              </p>
            </div>
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Avaliação</span>
            </button>
          </div>

          {assessments.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800">
              <Scale className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Nenhuma avaliação realizada ainda</p>
              <p className="text-xs text-neutral-400 mt-1 mb-4">
                Clique no botão acima para registrar a primeira avaliação com dobras cutâneas.
              </p>
              <button
                onClick={() => setShowAssessmentModal(true)}
                className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl"
              >
                Avaliar Agora
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((a, idx) => (
                <div
                  key={a.id}
                  className="p-5 rounded-2xl bg-neutral-900/80 border border-purple-950/40 hover:border-purple-800/60 transition shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800/50 flex items-center justify-center text-purple-400 font-bold text-xs">
                        #{assessments.length - idx}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">
                          Avaliação em {new Date(a.assessmentDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[11px] text-purple-400 uppercase font-semibold">
                          Protocolo: {a.protocol.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteAssessment(a.id)}
                        className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Excluir avaliação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calculated metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">Peso</span>
                      <span className="text-sm font-extrabold text-white">{a.weight} kg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">% Gordura</span>
                      <span className="text-sm font-extrabold text-purple-300">{a.bodyFatPercentage}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">Massa Magra</span>
                      <span className="text-sm font-extrabold text-emerald-400">{a.leanMass} kg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">Massa Gorda</span>
                      <span className="text-sm font-extrabold text-rose-400">{a.fatMass} kg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">IMC</span>
                      <span className="text-sm font-extrabold text-white">{a.bmi}</span>
                    </div>
                  </div>

                  {/* Skinfolds pills */}
                  {a.skinfolds && Object.keys(a.skinfolds).length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-400 block mb-2">
                        Dobras Cutâneas registradas (mm):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(a.skinfolds).map(([foldName, val]) => (
                          <span
                            key={foldName}
                            className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 flex items-center space-x-1"
                          >
                            <span className="capitalize text-neutral-500">{foldName}:</span>
                            <span className="font-bold text-white">{val} mm</span>
                          </span>
                        ))}
                        {a.skinfoldsSum && (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800/40 text-[11px] text-purple-300 font-bold">
                            $\Sigma$ Dobras: {a.skinfoldsSum} mm
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {a.notes && (
                    <p className="text-xs text-neutral-400 italic bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-800/50">
                      "{a.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DIETAS & PLANOS ALIMENTARES */}
      {/* ========================================================= */}
      {activeTab === 'dietas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Planos Alimentares</h2>
              <p className="text-xs text-neutral-400">Dietas organizadas por horários, refeições e macronutrientes</p>
            </div>
            <button
              onClick={() => setShowDietModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Cardápio</span>
            </button>
          </div>

          {diets.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800">
              <Utensils className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Nenhum plano alimentar cadastrado</p>
              <p className="text-xs text-neutral-400 mt-1 mb-4">
                Prescreva uma dieta com horários, refeições e quantidades personalizadas.
              </p>
              <button
                onClick={() => setShowDietModal(true)}
                className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl"
              >
                Criar Primeiro Cardápio
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {diets.map((diet) => (
                <div
                  key={diet.id}
                  className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white">{diet.title}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                          {diet.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{diet.objective}</p>
                    </div>

                    <span className="text-xs text-neutral-500">
                      Início: {new Date(diet.startDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Meals list */}
                  <div className="space-y-4">
                    {diet.meals?.map((meal, mIdx) => (
                      <div
                        key={meal.id || mIdx}
                        className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span className="font-bold text-white text-xs">{meal.name}</span>
                            <span className="text-[11px] text-purple-400 font-semibold bg-purple-950 px-2 py-0.5 rounded-md border border-purple-900/50">
                              {meal.time}
                            </span>
                          </div>
                        </div>

                        {/* Foods table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-neutral-800 text-neutral-500 font-medium">
                                <th className="pb-1.5 font-normal">Alimento</th>
                                <th className="pb-1.5 font-normal">Quantidade</th>
                                <th className="pb-1.5 font-normal">Kcal</th>
                                <th className="pb-1.5 font-normal">Prot</th>
                                <th className="pb-1.5 font-normal">Carb</th>
                                <th className="pb-1.5 font-normal">Gord</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-900 text-neutral-300">
                              {meal.foods?.map((food, fIdx) => (
                                <tr key={food.id || fIdx} className="hover:bg-neutral-900/50">
                                  <td className="py-2 text-white font-medium">{food.name}</td>
                                  <td className="py-2 text-neutral-400">
                                    {food.quantity} {food.unit}
                                  </td>
                                  <td className="py-2 text-neutral-300">{food.calories || 0}</td>
                                  <td className="py-2 text-purple-300">{food.protein || 0}g</td>
                                  <td className="py-2 text-neutral-300">{food.carbs || 0}g</td>
                                  <td className="py-2 text-neutral-300">{food.fats || 0}g</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>

                  {diet.notes && (
                    <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/30 text-xs text-purple-300">
                      <strong>Recomendações gerais:</strong> {diet.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: EVOLUÇÃO & GRÁFICOS INTERATIVOS */}
      {/* ========================================================= */}
      {activeTab === 'evolucao' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Curvas de Evolução Corporal</h2>
              <p className="text-xs text-neutral-400">
                Acompanhamento temporal de peso, percentual de gordura e massa magra
              </p>
            </div>
          </div>

          {evolutionData?.timeSeries?.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800">
              <LineChartIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Dados insuficientes para gráficos</p>
              <p className="text-xs text-neutral-400 mt-1">
                Realize pelo menos duas avaliações corporais para visualizar o progresso longitudinal.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Weight chart */}
              <div className="p-5 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                  <Scale className="w-4 h-4 mr-2 text-purple-400" />
                  Evolução de Peso Corporal (kg)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                      <YAxis stroke="#737373" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171717',
                          border: '1px solid #3b0764',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        name="Peso (kg)"
                        stroke="#a855f7"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#9333ea' }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* % Fat & Lean Mass chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-purple-400" />
                    Percentual de Gordura (%)
                  </h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evolutionData.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                        <YAxis stroke="#737373" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#171717',
                            border: '1px solid #3b0764',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="bodyFatPercentage"
                          name="% Gordura"
                          stroke="#ec4899"
                          strokeWidth={3}
                          fill="url(#fatGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                    <Flame className="w-4 h-4 mr-2 text-emerald-400" />
                    Massa Magra vs Massa Gorda (kg)
                  </h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evolutionData.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                        <YAxis stroke="#737373" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#171717',
                            border: '1px solid #3b0764',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="leanMass" name="Massa Magra" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fatMass" name="Massa Gorda" fill="#9333ea" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: CHAT DIRETO */}
      {/* ========================================================= */}
      {activeTab === 'chat' && (
        <div className="rounded-2xl bg-neutral-900/80 border border-purple-950/40 overflow-hidden shadow-sm flex flex-col h-[520px]">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={
                  patient.user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patient.user?.name || 'P')}`
                }
                alt={patient.user?.name}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-purple-500/40"
              />
              <div>
                <h4 className="text-xs font-bold text-white">{patient.user?.name}</h4>
                <p className="text-[10px] text-emerald-400 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Chat ativo com o paciente
                </p>
              </div>
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 text-xs">
                Inicie a conversa com {patient.user?.name}. Tire dúvidas sobre a dieta ou acompanhamento.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderRole === 'NUTRICIONISTA';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-purple-600 text-white rounded-br-xs shadow-md'
                          : 'bg-neutral-800 text-neutral-200 rounded-bl-xs'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-[10px] text-purple-200/80 mt-1 block text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-800 bg-neutral-950 flex space-x-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Digite uma mensagem para o paciente..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs transition disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER / MODAL: NOVA AVALIAÇÃO CORPORAL */}
      {/* ========================================================= */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-purple-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <button
              onClick={() => setShowAssessmentModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Nova Avaliação Física & Dobras</h3>
                <p className="text-xs text-neutral-400">
                  Paciente: {patient.user?.name} • Gênero: {patient.gender === 'M' ? 'Masculino' : 'Feminino'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-5 text-xs">
              {/* Protocol selector */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">
                  Protocolo Científico de Avaliação *
                </label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as AssessmentProtocol)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="pollock_7">Pollock 7 Dobras (Mais preciso e completo)</option>
                  <option value="pollock_3">Pollock 3 Dobras (Rápido e prático)</option>
                  <option value="faulkner_4">Faulkner 4 Dobras (Clínica e esportiva)</option>
                  <option value="petroski_4">Petroski 4 Dobras (População brasileira)</option>
                  <option value="guedes_3">Guedes 3 Dobras (Universitários / Jovens)</option>
                  <option value="basico">Básico / Bioimpedância (Peso + Altura)</option>
                </select>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Peso Corporal (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightInput}
                    onChange={(e) => setWeightInput(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Estatura / Altura (cm) *</label>
                  <input
                    type="number"
                    required
                    value={heightInput}
                    onChange={(e) => setHeightInput(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Skinfolds inputs depending on selected protocol */}
              {protocol !== 'basico' && (
                <div>
                  <label className="block font-semibold text-neutral-300 mb-2">
                    Medidas das Dobras Cutâneas (em milímetros - mm)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                    <div>
                      <span className="text-[11px] text-neutral-400 block mb-1">Tríceps</span>
                      <input
                        type="number"
                        step="0.5"
                        value={skinfoldsInput.triceps ?? 12}
                        onChange={(e) => handleFoldChange('triceps', Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block mb-1">Subescapular</span>
                      <input
                        type="number"
                        step="0.5"
                        value={skinfoldsInput.subscapular ?? 11}
                        onChange={(e) => handleFoldChange('subscapular', Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block mb-1">Supra-ilíaca</span>
                      <input
                        type="number"
                        step="0.5"
                        value={skinfoldsInput.suprailiac ?? 14}
                        onChange={(e) => handleFoldChange('suprailiac', Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block mb-1">Abdominal</span>
                      <input
                        type="number"
                        step="0.5"
                        value={skinfoldsInput.abdominal ?? 16}
                        onChange={(e) => handleFoldChange('abdominal', Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                      />
                    </div>

                    {(protocol === 'pollock_7' || protocol === 'pollock_3') && (
                      <>
                        <div>
                          <span className="text-[11px] text-neutral-400 block mb-1">Peitoral</span>
                          <input
                            type="number"
                            step="0.5"
                            value={skinfoldsInput.pectoral ?? 10}
                            onChange={(e) => handleFoldChange('pectoral', Number(e.target.value))}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-400 block mb-1">Coxa</span>
                          <input
                            type="number"
                            step="0.5"
                            value={skinfoldsInput.thigh ?? 18}
                            onChange={(e) => handleFoldChange('thigh', Number(e.target.value))}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                          />
                        </div>
                      </>
                    )}

                    {protocol === 'pollock_7' && (
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-1">Axilar Média</span>
                        <input
                          type="number"
                          step="0.5"
                          value={skinfoldsInput.midaxillary ?? 12}
                          onChange={(e) => handleFoldChange('midaxillary', Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                        />
                      </div>
                    )}

                    {(protocol === 'petroski_4' || protocol === 'faulkner_4') && (
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-1">Panturrilha</span>
                        <input
                          type="number"
                          step="0.5"
                          value={skinfoldsInput.calf ?? 10}
                          onChange={(e) => handleFoldChange('calf', Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Real-time calculated preview box */}
              {calcPreview && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 to-neutral-950 border border-purple-800/50 shadow-inner">
                  <div className="flex items-center space-x-2 text-purple-300 font-bold mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Resultado em Tempo Real (Cálculo Científico)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block uppercase font-medium">% Gordura</span>
                      <span className="text-base font-extrabold text-purple-300">
                        {calcPreview.bodyFatPercentage}%
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block uppercase font-medium">Massa Magra</span>
                      <span className="text-base font-extrabold text-emerald-400">{calcPreview.leanMass} kg</span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block uppercase font-medium">Massa Gorda</span>
                      <span className="text-base font-extrabold text-rose-400">{calcPreview.fatMass} kg</span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block uppercase font-medium">IMC</span>
                      <span className="text-base font-extrabold text-white">{calcPreview.bmi}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAssessment}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110 active:scale-95 transition shadow-lg shadow-purple-900/30"
                >
                  {savingAssessment ? 'Salvando...' : 'Registrar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER / MODAL: NOVO PLANO ALIMENTAR */}
      {/* ========================================================= */}
      {showDietModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-neutral-900 border border-purple-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <button
              onClick={() => setShowDietModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Criar Novo Cardápio / Dieta</h3>
                <p className="text-xs text-neutral-400">Monte o planejamento alimentar de {patient.user?.name}</p>
              </div>
            </div>

            <form onSubmit={handleSaveDiet} className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Título do Plano *</label>
                <input
                  type="text"
                  required
                  value={dietTitle}
                  onChange={(e) => setDietTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Objetivo Nutricional</label>
                <input
                  type="text"
                  value={dietObjective}
                  onChange={(e) => setDietObjective(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Meals builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-300">Refeições Estruturadas ({meals.length})</span>
                  <button
                    type="button"
                    onClick={() =>
                      setMeals((prev) => [
                        ...prev,
                        {
                          name: `Refeição ${prev.length + 1}`,
                          time: '19:30',
                          foods: [{ name: 'Novo Alimento', quantity: '100', unit: 'g', calories: 150, protein: 10, carbs: 15, fats: 4 }],
                        },
                      ])
                    }
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>Adicionar Refeição</span>
                  </button>
                </div>

                {meals.map((meal, mIdx) => (
                  <div key={mIdx} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={meal.name}
                        onChange={(e) => {
                          const updated = [...meals];
                          updated[mIdx].name = e.target.value;
                          setMeals(updated);
                        }}
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-bold flex-1"
                      />
                      <input
                        type="text"
                        value={meal.time}
                        onChange={(e) => {
                          const updated = [...meals];
                          updated[mIdx].time = e.target.value;
                          setMeals(updated);
                        }}
                        className="w-20 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-white text-center"
                      />
                      {meals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMeals(meals.filter((_, i) => i !== mIdx))}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Food Items in this meal */}
                    <div className="space-y-2">
                      {meal.foods.map((food: any, fIdx: number) => (
                        <div key={fIdx} className="flex items-center space-x-2 text-[11px]">
                          <input
                            type="text"
                            placeholder="Alimento"
                            value={food.name}
                            onChange={(e) => {
                              const updated = [...meals];
                              updated[mIdx].foods[fIdx].name = e.target.value;
                              setMeals(updated);
                            }}
                            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-white"
                          />
                          <input
                            type="text"
                            placeholder="Qtd"
                            value={food.quantity}
                            onChange={(e) => {
                              const updated = [...meals];
                              updated[mIdx].foods[fIdx].quantity = e.target.value;
                              setMeals(updated);
                            }}
                            className="w-14 bg-neutral-900 border border-neutral-800 rounded-lg px-1.5 py-1 text-white text-center"
                          />
                          <input
                            type="text"
                            placeholder="Unidade"
                            value={food.unit}
                            onChange={(e) => {
                              const updated = [...meals];
                              updated[mIdx].foods[fIdx].unit = e.target.value;
                              setMeals(updated);
                            }}
                            className="w-16 bg-neutral-900 border border-neutral-800 rounded-lg px-1.5 py-1 text-white text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...meals];
                              updated[mIdx].foods = updated[mIdx].foods.filter((_: any, i: number) => i !== fIdx);
                              setMeals(updated);
                            }}
                            className="text-neutral-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...meals];
                          updated[mIdx].foods.push({
                            name: '',
                            quantity: '1',
                            unit: 'unidade',
                            calories: 100,
                            protein: 5,
                            carbs: 10,
                            fats: 2,
                          });
                          setMeals(updated);
                        }}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        + Adicionar alimento a esta refeição
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Orientações e Hidratação</label>
                <textarea
                  rows={2}
                  value={dietNotes}
                  onChange={(e) => setDietNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDietModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDiet}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110 active:scale-95 transition shadow-lg shadow-purple-900/30"
                >
                  {savingDiet ? 'Salvando...' : 'Salvar Plano Alimentar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Invitation / Temporary Password Modal */}
      <PatientInvitationModal
        isOpen={invitationModalOpen}
        onClose={() => setInvitationModalOpen(false)}
        invitation={currentInvitation}
      />
    </div>
  );
};
