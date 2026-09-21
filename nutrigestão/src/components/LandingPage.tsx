import React from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Flame,
  LineChart,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onQuickLogin: (email: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onQuickLogin }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-purple-600 selection:text-white overflow-hidden">
      {/* Top Floating Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-900/30 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header / Nav */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-purple-950/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">NutriGestão</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-700/50">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Gestão Nutricional Inteligente</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenAuth('login')}
            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition"
          >
            Entrar
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-700/40 hover:brightness-110 active:scale-95 transition"
          >
            Começar agora
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-800/40 text-purple-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Solução definitiva para Nutricionistas e Pacientes</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Gestão nutricional inteligente{' '}
          <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            em um só lugar.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          Acompanhe avaliações físicas com protocolos científicos de dobras cutâneas, monte dietas
          personalizadas, analise a evolução corporal em gráficos dinâmicos e converse em tempo real com seus
          pacientes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-900/40 hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <span>Começar agora</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-2xl bg-neutral-900/90 border border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
          >
            Entrar na conta
          </button>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-purple-900/30 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-left">
            <span className="font-semibold text-purple-300 block">Experimentar Demonstração:</span>
            <span className="text-neutral-400">Acesse instantaneamente com dados pré-configurados</span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => onQuickLogin('dr.carlos@nutrigestao.com')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-700/50 text-purple-200 hover:bg-purple-900 transition font-medium"
            >
              Dr. Carlos (Nutri)
            </button>
            <button
              onClick={() => onQuickLogin('mariana.silva@email.com')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 transition font-medium"
            >
              Mariana (Paciente)
            </button>
          </div>
        </div>
      </section>

      {/* Funcionalidades Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-purple-950/30">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-3">Recursos Poderosos</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tudo o que você precisa para uma prática nutricional de excelência
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-purple-950/40 hover:border-purple-800/60 transition group shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-105 transition">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gestão de Pacientes</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Cadastro completo, filtros avançados, histórico de consultas, metas personalizadas e fichas de
              anamnese unificadas.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-purple-950/40 hover:border-purple-800/60 transition group shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-105 transition">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Prescrição de Dietas</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Crie planos alimentares organizados por horários, refeições e alimentos com cálculo automático de
              calorias e macronutrientes.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-purple-950/40 hover:border-purple-800/60 transition group shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-105 transition">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Avaliação Corporal & Dobras</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Cálculos científicos automatizados com Pollock 7, Pollock 3, Faulkner 4, Petroski e Guedes com
              fórmulas de Siri e densidade corporal.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-purple-950/40 hover:border-purple-800/60 transition group shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-105 transition">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Acompanhamento de Evolução</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Gráficos interativos de peso, massa magra, massa gorda e percentual de gordura ao longo do tempo,
              com comparativo direto de avaliações.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-purple-950/40 hover:border-purple-800/60 transition group shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-105 transition">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chat Nutricionista ↔ Paciente</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Canal de comunicação direto e privado para tirar dúvidas, ajustar horários e acompanhar a adesão
              com indicador de status e leitura.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 border border-purple-950/40 hover:border-purple-800/60 transition group shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-105 transition">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Relatórios & Licenciamento</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Controle de status de licença profissional (CRN), autorizações seguras no backend e relatórios
              claros para o nutricionista e para o paciente.
            </p>
          </div>
        </div>
      </section>

      {/* Seção Explicativa (Como Funciona) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-purple-950/30">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-3">Fluxo Simplificado</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Como o NutriGestão transforma seu atendimento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Cadastre pacientes',
              desc: 'Registre novos pacientes com dados antropométricos e objetivos.',
            },
            {
              step: '02',
              title: 'Registre avaliações',
              desc: 'Insira dobras cutâneas com cálculo instantâneo de composição.',
            },
            {
              step: '03',
              title: 'Monte as dietas',
              desc: 'Estruture cardápios completos divididos em refeições e alimentos.',
            },
            {
              step: '04',
              title: 'Acompanhe evolução',
              desc: 'Visualize curvas de evolução de peso e composição corporal.',
            },
            {
              step: '05',
              title: 'Converse via Chat',
              desc: 'Mantenha contato ágil e tire dúvidas diretamente na plataforma.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center relative flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-full bg-purple-950 border border-purple-700/50 flex items-center justify-center text-purple-300 font-bold text-sm mb-4">
                {item.step}
              </div>
              <h4 className="font-bold text-white text-sm mb-2">{item.title}</h4>
              <p className="text-xs text-neutral-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-purple-950/30">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-purple-950/60 to-neutral-900 border border-purple-800/40 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Pronto para modernizar seus atendimentos?
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Crie sua conta agora mesmo ou explore todas as funcionalidades disponíveis na demonstração completa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-900/40 hover:brightness-110 active:scale-95 transition"
            >
              Criar Conta Grátis
            </button>
            <button
              onClick={() => onQuickLogin('dr.carlos@nutrigestao.com')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-800/90 text-neutral-200 font-medium hover:bg-neutral-700 transition"
            >
              Testar com Dr. Carlos
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 py-8 px-4 text-center text-xs text-neutral-500">
        <p>© 2026 NutriGestão — Sistema de Gestão Nutricional. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
