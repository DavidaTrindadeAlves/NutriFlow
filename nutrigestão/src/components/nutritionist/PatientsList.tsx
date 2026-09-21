import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { PatientProfile } from '../../types.ts';
import {
  Activity,
  ArrowRight,
  Filter,
  Mail,
  Phone,
  Plus,
  Scale,
  Search,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface PatientsListProps {
  onSelectPatient: (patientId: string) => void;
  openNewPatientModal?: boolean;
  onCloseNewPatientModal?: () => void;
}

export const PatientsList: React.FC<PatientsListProps> = ({
  onSelectPatient,
  openNewPatientModal = false,
  onCloseNewPatientModal,
}) => {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'M' | 'F'>('ALL');
  const [showModal, setShowModal] = useState(openNewPatientModal);

  // New patient form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('F');
  const [newBirthDate, setNewBirthDate] = useState('1995-04-12');
  const [newHeight, setNewHeight] = useState(168);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (openNewPatientModal) {
      setShowModal(true);
    }
  }, [openNewPatientModal]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await api.createPatient({
        name: newName,
        email: newEmail,
        phone: newPhone,
        gender: newGender,
        birthDate: newBirthDate,
        height: newHeight,
        notes: newNotes,
      });

      // Reload
      await loadPatients();
      setShowModal(false);
      if (onCloseNewPatientModal) onCloseNewPatientModal();

      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewNotes('');

      // Open new patient right away
      if (res.patient?.id) {
        onSelectPatient(res.patient.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar paciente');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      (p.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
            <span>Meus Pacientes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-300 font-bold">
              {patients.length} cadastrados
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Gerencie prontuários, planos alimentares, avaliações físicas e evolução.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition flex items-center justify-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900/90 border border-purple-950/40">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-400 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Gênero:
          </span>
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              onClick={() => setGenderFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                genderFilter === 'ALL'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setGenderFilter('F')}
              className={`px-3 py-1 rounded-lg transition ${
                genderFilter === 'F'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Feminino
            </button>
            <button
              onClick={() => setGenderFilter('M')}
              className={`px-3 py-1 rounded-lg transition ${
                genderFilter === 'M'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Masculino
            </button>
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-neutral-900 border border-neutral-800" />
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800">
          <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Nenhum paciente encontrado</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
            {search ? 'Tente ajustar os filtros de busca.' : 'Cadastre seu primeiro paciente para começar a prescrever dietas e avaliações.'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Paciente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const lastDate = patient.lastAssessmentDate
              ? new Date(patient.lastAssessmentDate).toLocaleDateString('pt-BR')
              : 'Sem avaliação';

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-900/50 border border-purple-950/40 hover:border-purple-600/70 cursor-pointer transition group shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top card info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          patient.user?.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patient.user?.name || 'P')}`
                        }
                        alt={patient.user?.name}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-neutral-700 group-hover:ring-purple-500 transition"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-purple-300 transition">
                          {patient.user?.name}
                        </h4>
                        <p className="text-[11px] text-neutral-400">{patient.user?.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800/40 text-purple-300 uppercase">
                      {patient.gender === 'M' ? 'Masc' : 'Fem'}
                    </span>
                  </div>

                  {/* Anthropometric Metrics row */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-800/80 my-3 text-center">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">Peso</span>
                      <span className="text-xs font-extrabold text-white">
                        {patient.currentWeight ? `${patient.currentWeight} kg` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">% Gordura</span>
                      <span className="text-xs font-extrabold text-purple-300">
                        {patient.currentBodyFat ? `${patient.currentBodyFat}%` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">IMC</span>
                      <span className="text-xs font-extrabold text-neutral-300">
                        {patient.currentBmi ? `${patient.currentBmi}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="pt-2 flex items-center justify-between text-xs text-neutral-400">
                  <span className="text-[11px]">Última: {lastDate}</span>
                  <span className="text-purple-400 font-semibold group-hover:translate-x-1 transition flex items-center">
                    Ver ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-purple-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <button
              onClick={() => {
                setShowModal(false);
                if (onCloseNewPatientModal) onCloseNewPatientModal();
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cadastrar Novo Paciente</h3>
                <p className="text-xs text-neutral-400">Insira os dados clínicos iniciais do paciente</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Beatriz Lima"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="beatriz@exemplo.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Senha inicial: password123</span>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Gênero</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Nascimento</label>
                  <input
                    type="date"
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    value={newHeight}
                    onChange={(e) => setNewHeight(Number(e.target.value))}
                    placeholder="168"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Objetivo / Observações Clínicas</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Objetivo de hipertrofia e melhora no percentual de gordura. Pratica musculação 4x/semana."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (onCloseNewPatientModal) onCloseNewPatientModal();
                  }}
                  className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
