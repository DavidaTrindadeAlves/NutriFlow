import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { Message, PatientProfile } from '../../types.ts';
import { MessageSquare, Search, Send, User } from 'lucide-react';

interface ChatViewProps {
  selectedPatientId?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ selectedPatientId }) => {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(selectedPatientId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (activePatientId) {
      loadMessages(activePatientId);
    }
  }, [activePatientId]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      setPatients(data);
      if (data.length > 0 && !activePatientId) {
        setActivePatientId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading chat patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (patientId: string) => {
    try {
      const data = await api.getMessages(patientId);
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activePatientId) return;

    setSending(true);
    try {
      const msg = await api.sendMessage(activePatientId, chatInput);
      setMessages((prev) => [...prev, msg]);
      setChatInput('');
    } catch (err: any) {
      alert('Erro ao enviar mensagem: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const activePatient = patients.find((p) => p.id === activePatientId);
  const filteredPatients = patients.filter((p) =>
    (p.user?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-3xl bg-neutral-900/80 border border-purple-950/40 overflow-hidden shadow-2xl h-[650px] flex flex-col md:flex-row">
      {/* Left Sidebar: Patients conversation list */}
      <div className="w-full md:w-80 border-r border-neutral-800 flex flex-col bg-neutral-950/40">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-purple-400" />
            Mensagens & Atendimentos
          </h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-900">
          {filteredPatients.map((patient) => {
            const isSelected = patient.id === activePatientId;
            return (
              <button
                key={patient.id}
                onClick={() => setActivePatientId(patient.id)}
                className={`w-full p-3.5 flex items-center space-x-3 text-left transition ${
                  isSelected ? 'bg-purple-950/50 border-l-4 border-purple-500' : 'hover:bg-neutral-900/50'
                }`}
              >
                <img
                  src={
                    patient.user?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patient.user?.name || 'P')}`
                  }
                  alt={patient.user?.name}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-neutral-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{patient.user?.name}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{patient.user?.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col bg-neutral-900/40">
        {activePatient ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    activePatient.user?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activePatient.user?.name || 'P')}`
                  }
                  alt={activePatient.user?.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-purple-500/40"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{activePatient.user?.name}</h3>
                  <p className="text-[10px] text-purple-400">
                    {activePatient.gender === 'M' ? 'Masculino' : 'Feminino'} • Peso atual:{' '}
                    {activePatient.currentWeight ? `${activePatient.currentWeight} kg` : 'Sem avaliação'}
                  </p>
                </div>
              </div>
            </div>

            {/* Message stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-neutral-500 text-xs">
                  Nenhuma mensagem trocada ainda com este paciente.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderRole === 'NUTRICIONISTA';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs ${
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

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 bg-neutral-950 flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Mensagem para ${activePatient.user?.name}...`}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={sending || !chatInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs">
            Selecione um paciente para iniciar a conversa
          </div>
        )}
      </div>
    </div>
  );
};
