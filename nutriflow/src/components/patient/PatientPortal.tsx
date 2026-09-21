import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Assessment, Diet, Message } from '../../types.ts';
import {
  Activity,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Droplet,
  Flame,
  LineChart as LineChartIcon,
  MessageSquare,
  Scale,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Utensils,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const PatientPortal: React.FC = () => {
  const { user, patient } = useAuth();
  const [activeTab, setActiveTab] = useState<'inicio' | 'dieta' | 'evolucao' | 'avaliacoes' | 'chat'>('inicio');

  const [stats, setStats] = useState<any>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [evolutionData, setEvolutionData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loading, setLoading] = useState(true);

  // Water intake tracker interactive state
  const [waterGlasses, setWaterGlasses] = useState(5);
  const targetGlasses = 10; // 2.5 Liters

  useEffect(() => {
    if (patient) {
      loadData();
    }
  }, [patient?.id]);

  const loadData = async () => {
    if (!patient) return;
    try {
      setLoading(true);
      const [statsData, assData, dietsData, evoData, msgData] = await Promise.all([
        api.getDashboardStats(),
        api.getAssessments(patient.id),
        api.getDiets(patient.id),
        api.getEvolution(patient.id),
        api.getMessages(patient.id),
      ]);

      setStats(statsData);
      setAssessments(assData);
      setDiets(dietsData);
      setEvolutionData(evoData);
      setMessages(msgData);
    } catch (err) {
      console.error('Error loading patient portal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !patient) return;

    setSendingMsg(true);
    try {
      const newMsg = await api.sendMessage(patient.id, chatMessage);
      setMessages((prev) => [...prev, newMsg]);
      setChatMessage('');
    } catch (err: any) {
      alert('Erro ao enviar mensagem: ' + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-28 bg-neutral-900 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-neutral-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const latestAssessment = assessments[assessments.length - 1];
  const activeDiet = diets.find((d) => d.status === 'ATIVA') || diets[0];
  const comparison = evolutionData?.comparison;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/80 via-neutral-900 to-neutral-900 border border-purple-900/50 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={
                user?.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'P')}`
              }
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-lg shadow-purple-950"
            />
            <div>
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Portal do Paciente
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Olá, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-xs text-neutral-300 mt-1">
                Acompanhe seu plano alimentar, metas de hidratação e veja seus resultados evolutivos.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('chat')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Falar com Nutricionista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex overflow-x-auto border-b border-neutral-800 text-xs font-semibold text-neutral-400 space-x-2 pb-1 scrollbar-none">
        {[
          { key: 'inicio', label: 'Visão Geral', icon: Activity },
          { key: 'dieta', label: 'Minha Dieta', icon: Utensils },
          { key: 'evolucao', label: 'Evolução & Gráficos', icon: LineChartIcon },
          { key: 'avaliacoes', label: `Avaliações (${assessments.length})`, icon: Scale },
          { key: 'chat', label: `Chat com Nutri (${messages.length})`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-3 px-4 rounded-xl transition whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-950'
                  : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: VISÃO GERAL */}
      {/* ========================================================= */}
      {activeTab === 'inicio' && (
        <div className="space-y-6">
          {/* Key Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Meu Peso Atual</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                {latestAssessment?.weight || patient?.currentWeight || '—'}{' '}
                <span className="text-xs font-normal text-neutral-400">kg</span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Último registro: {latestAssessment ? latestAssessment.assessmentDate : '—'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">% Gordura</span>
              <div className="text-2xl font-extrabold text-purple-300 mt-1">
                {latestAssessment?.bodyFatPercentage || patient?.currentBodyFat || '—'}{' '}
                <span className="text-xs font-normal text-purple-300/80">%</span>
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">
                {comparison?.bodyFatDiff ? `${comparison.bodyFatDiff > 0 ? '+' : ''}${comparison.bodyFatDiff}% vs anterior` : 'Dentro da meta'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Massa Muscular</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {latestAssessment?.leanMass || '—'}{' '}
                <span className="text-xs font-normal text-emerald-400/80">kg</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">Massa magra ativa</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
              <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Índice IMC</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                {latestAssessment?.bmi || patient?.currentBmi || '—'}
              </div>
              <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold border border-purple-800/40">
                {latestAssessment?.bmiClassification || 'Normal'}
              </span>
            </div>
          </div>

          {/* Daily Interactive Water Tracker */}
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Meta de Hidratação Diária</h3>
                <p className="text-xs text-neutral-400">
                  {waterGlasses * 250} ml ingeridos de {(targetGlasses * 250) / 1000}L recomendados
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setWaterGlasses((prev) => Math.max(0, prev - 1))}
                className="w-8 h-8 rounded-lg bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition"
              >
                -
              </button>
              <span className="text-sm font-extrabold text-blue-400 px-3 py-1 rounded-xl bg-blue-950/80 border border-blue-800/40">
                {waterGlasses} / {targetGlasses} copos (250ml)
              </span>
              <button
                onClick={() => setWaterGlasses((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Active Diet Highlights */}
          {activeDiet && (
            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center">
                    <Utensils className="w-4 h-4 mr-2 text-purple-400" />
                    Plano Alimentar Atual: {activeDiet.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{activeDiet.objective}</p>
                </div>
                <button
                  onClick={() => setActiveTab('dieta')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300"
                >
                  Ver Cardápio Completo →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeDiet.meals?.slice(0, 3).map((meal, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{meal.name}</span>
                      <span className="text-[10px] text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded">
                        {meal.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {meal.foods?.map((f: any) => `${f.quantity} ${f.unit} de ${f.name}`).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MINHA DIETA */}
      {/* ========================================================= */}
      {activeTab === 'dieta' && (
        <div className="space-y-6">
          {!activeDiet ? (
            <div className="text-center py-16 p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800">
              <Utensils className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Nenhum plano alimentar liberado ainda</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Seu nutricionista ainda está elaborando seu plano personalizado.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">{activeDiet.title}</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">{activeDiet.objective}</p>
                  </div>
                  <span className="text-xs text-purple-300 bg-purple-950 px-3 py-1 rounded-full border border-purple-800/40 font-semibold self-start">
                    Status: ATIVA
                  </span>
                </div>

                <div className="space-y-4">
                  {activeDiet.meals?.map((meal, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-purple-900/40 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <h3 className="font-bold text-white text-sm">{meal.name}</h3>
                        </div>
                        <span className="text-xs font-semibold text-purple-300 bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-800/40">
                          Horário sugerido: {meal.time}
                        </span>
                      </div>

                      <div className="divide-y divide-neutral-900">
                        {meal.foods?.map((food: any, fIdx: number) => (
                          <div key={fIdx} className="py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              <span className="font-medium text-white">{food.name}</span>
                            </div>
                            <span className="font-bold text-neutral-300">
                              {food.quantity} {food.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {activeDiet.notes && (
                  <div className="mt-6 p-4 rounded-xl bg-purple-950/30 border border-purple-900/40 text-xs text-purple-200">
                    <strong>Recomendações do seu Nutricionista:</strong> {activeDiet.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: EVOLUÇÃO & GRÁFICOS */}
      {/* ========================================================= */}
      {activeTab === 'evolucao' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center">
              <Scale className="w-4 h-4 mr-2 text-purple-400" />
              Evolução do Meu Peso (kg)
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Acompanhe seu progresso ao longo das semanas</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData?.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-purple-400" />
                Percentual de Gordura (%)
              </h3>
              <p className="text-xs text-neutral-400 mb-4">Medição por dobras cutâneas</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData?.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="patientFat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
                      stroke="#a855f7"
                      strokeWidth={3}
                      fill="url(#patientFat)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center">
                <Flame className="w-4 h-4 mr-2 text-emerald-400" />
                Ganho de Massa Magra (kg)
              </h3>
              <p className="text-xs text-neutral-400 mb-4">Massa muscular ativa</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolutionData?.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Bar dataKey="leanMass" name="Massa Magra (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: HISTÓRICO DE AVALIAÇÕES */}
      {/* ========================================================= */}
      {activeTab === 'avaliacoes' && (
        <div className="space-y-4">
          {assessments.map((a, idx) => (
            <div
              key={a.id}
              className="p-5 rounded-2xl bg-neutral-900/80 border border-purple-950/40 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Avaliação em {new Date(a.assessmentDate).toLocaleDateString('pt-BR')}
                  </h4>
                  <span className="text-[10px] text-purple-400 font-semibold uppercase">
                    Protocolo: {a.protocol.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-semibold">
                  IMC: {a.bmi} ({a.bmiClassification})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block uppercase">Peso</span>
                  <span className="text-sm font-extrabold text-white">{a.weight} kg</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block uppercase">% Gordura</span>
                  <span className="text-sm font-extrabold text-purple-300">{a.bodyFatPercentage}%</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block uppercase">Massa Magra</span>
                  <span className="text-sm font-extrabold text-emerald-400">{a.leanMass} kg</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block uppercase">Massa Gorda</span>
                  <span className="text-sm font-extrabold text-rose-400">{a.fatMass} kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: CHAT COM O NUTRICIONISTA */}
      {/* ========================================================= */}
      {activeTab === 'chat' && (
        <div className="rounded-2xl bg-neutral-900/80 border border-purple-950/40 overflow-hidden shadow-sm flex flex-col h-[520px]">
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/40 flex items-center justify-center text-purple-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Dr. Carlos Mendes (Nutricionista)</h4>
                <p className="text-[10px] text-emerald-400 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Online para atendimento
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderRole === 'PACIENTE';
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
            })}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-800 bg-neutral-950 flex space-x-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Digite sua dúvida ou relato para o Dr. Carlos..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
