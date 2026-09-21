import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { PatientProfile } from '../../types.ts';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Flame,
  MessageSquare,
  Plus,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface NutritionistDashboardProps {
  onNavigate: (view: string, patientId?: string) => void;
  onOpenNewPatientModal: () => void;
}

export const NutritionistDashboard: React.FC<NutritionistDashboardProps> = ({
  onNavigate,
  onOpenNewPatientModal,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, patientsData] = await Promise.all([
        api.getDashboardStats(),
        api.getPatients(),
      ]);
      setStats(statsData);
      setPatients(patientsData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Activity chart mock data for weekly evaluation progress
  const weeklyActivityData = [
    { day: 'Seg', avaliacoes: 4, consultas: 6 },
    { day: 'Ter', avaliacoes: 6, consultas: 8 },
    { day: 'Qua', avaliacoes: 5, consultas: 5 },
    { day: 'Qui', avaliacoes: 8, consultas: 9 },
    { day: 'Sex', avaliacoes: 7, consultas: 7 },
    { day: 'Sáb', avaliacoes: 3, consultas: 4 },
  ];

  // Objective distribution
  const objectiveData = [
    { name: 'Hipertrofia', value: 45, color: '#9333ea' },
    { name: 'Emagrecimento', value: 35, color: '#3b82f6' },
    { name: 'Saúde & Longevidade', value: 20, color: '#10b981' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-900 border border-neutral-800" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-neutral-900 border border-neutral-800" />
      </div>
    );
  }

  const totalPatients = stats?.totalPatients ?? patients.length;
  const activePatients = stats?.activePatients ?? patients.length;
  const assessmentsThisMonth = stats?.assessmentsThisMonth ?? 8;
  const unreadMessages = stats?.unreadMessages ?? 2;

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Painel do Nutricionista
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Visão geral clínica, indicadores de pacientes e próximas avaliações.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenNewPatientModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div
          onClick={() => onNavigate('patients')}
          className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/50 border border-purple-950/40 hover:border-purple-800/60 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400">Total de Pacientes</span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalPatients}</span>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% este mês
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">{activePatients} com planos ativos</p>
        </div>

        {/* Assessments This Week / Month */}
        <div
          onClick={() => onNavigate('patients')}
          className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/50 border border-purple-950/40 hover:border-purple-800/60 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400">Avaliações este mês</span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{assessmentsThisMonth}</span>
            <span className="text-[11px] font-semibold text-purple-400 flex items-center">
              <Activity className="w-3 h-3 mr-1" /> Fórmulas Jackson & Pollock
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">Dobra cutânea e composição</p>
        </div>

        {/* New Messages */}
        <div
          onClick={() => onNavigate('messages')}
          className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/50 border border-purple-950/40 hover:border-purple-800/60 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400">Mensagens não lidas</span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{unreadMessages}</span>
            {unreadMessages > 0 ? (
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800/40">
                Aguardando resposta
              </span>
            ) : (
              <span className="text-[11px] text-neutral-500">Tudo em dia</span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">Chat nutricionista ↔ paciente</p>
        </div>

        {/* License Status Card */}
        <div
          onClick={() => onNavigate('settings')}
          className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/50 border border-purple-950/40 hover:border-purple-800/60 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400">Status da Licença</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">ATIVA</span>
            <span className="text-[11px] font-semibold text-neutral-400">CRN Regular</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">Expira em 180 dias • Acesso Pro Total</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluations and Consultations Bar/Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Atendimentos e Avaliações na Semana</h3>
              <p className="text-xs text-neutral-400">Acompanhamento diário de produtividade clínica</p>
            </div>
            <span className="text-xs font-semibold text-purple-400 bg-purple-950/80 border border-purple-800/40 px-3 py-1 rounded-full">
              Semana Vigente
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="day" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #3b0764',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avaliacoes"
                  name="Avaliações"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#purpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Objectives Distribution */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Distribuição de Objetivos</h3>
            <p className="text-xs text-neutral-400 mb-4">Metas principais dos pacientes</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={objectiveData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {objectiveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #262626',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-neutral-800">
            {objectiveData.map((obj, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: obj.color }} />
                  <span className="text-neutral-300 font-medium">{obj.name}</span>
                </div>
                <span className="text-neutral-400 font-bold">{obj.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Patients Table & Quick Links */}
      <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Pacientes Recentes</h3>
            <p className="text-xs text-neutral-400">Acesse a ficha completa com 1 clique</p>
          </div>
          <button
            onClick={() => onNavigate('patients')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center space-x-1 transition"
          >
            <span>Ver todos ({patients.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Paciente</th>
                <th className="pb-3">Última Avaliação</th>
                <th className="pb-3">Peso Atual</th>
                <th className="pb-3">% Gordura</th>
                <th className="pb-3">IMC</th>
                <th className="pb-3 text-right pr-2">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {patients.slice(0, 5).map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => onNavigate('patients', patient.id)}
                  className="hover:bg-neutral-800/40 cursor-pointer transition group"
                >
                  <td className="py-3 pl-2 flex items-center space-x-3">
                    <img
                      src={
                        patient.user?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patient.user?.name || 'P')}`
                      }
                      alt={patient.user?.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-neutral-700 group-hover:ring-purple-500 transition"
                    />
                    <div>
                      <p className="font-bold text-white group-hover:text-purple-300 transition">
                        {patient.user?.name}
                      </p>
                      <p className="text-[11px] text-neutral-500">{patient.user?.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-neutral-300">
                    {patient.lastAssessmentDate
                      ? new Date(patient.lastAssessmentDate).toLocaleDateString('pt-BR')
                      : 'Não realizada'}
                  </td>
                  <td className="py-3 font-semibold text-white">
                    {patient.currentWeight ? `${patient.currentWeight} kg` : '—'}
                  </td>
                  <td className="py-3 text-purple-300 font-semibold">
                    {patient.currentBodyFat ? `${patient.currentBodyFat}%` : '—'}
                  </td>
                  <td className="py-3 text-neutral-300">
                    {patient.currentBmi ? `${patient.currentBmi}` : '—'}
                  </td>
                  <td className="py-3 text-right pr-2">
                    <span className="inline-flex items-center text-purple-400 group-hover:translate-x-1 transition font-medium">
                      Abrir ficha <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
