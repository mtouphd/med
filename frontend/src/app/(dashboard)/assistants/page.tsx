'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors as doctorsApi, assistants as assistantsApi } from '@/lib/api';
import { Assistant } from '@/types';
import {
  UserPlus,
  Users,
  X,
  Edit,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Check,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

type Tab = 'roster' | 'requests';

export default function AssistantsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('roster');

  // ─── Roster state ─────────────────────────────────────────────────────────
  const [assistantsList, setAssistantsList] = useState<Assistant[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', title: '', bio: '',
  });

  // ─── Requests state ───────────────────────────────────────────────────────
  const [pendingList, setPendingList] = useState<Assistant[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    loadRoster();
    loadRequests();
  }, []);

  // ─── Roster logic ─────────────────────────────────────────────────────────

  const loadRoster = async () => {
    try {
      const res = await doctorsApi.getMyAssistants();
      setAssistantsList(res.data);
    } finally {
      setRosterLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', title: '', bio: '' });
    setEditingAssistant(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingAssistant(null);
    resetForm();
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editingAssistant) {
        setSuccessMessage(t('assistants.updated'));
      } else {
        await doctorsApi.createAssistant({
          user: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          },
          title: formData.title,
          bio: formData.bio,
        });
        setSuccessMessage(t('assistants.created'));
      }
      handleCloseModal();
      loadRoster();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (assistantId: string) => {
    if (!confirm(t('assistants.confirmRemove'))) return;
    try {
      await doctorsApi.removeAssistant('me', assistantId);
      setSuccessMessage(t('assistants.removed'));
      loadRoster();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || t('common.error'));
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // ─── Requests logic ───────────────────────────────────────────────────────

  const loadRequests = async () => {
    try {
      const res = await assistantsApi.getPendingRequests();
      setPendingList(res.data);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await assistantsApi.approveAffiliation(id);
      loadRequests();
      loadRoster(); // approved assistant now appears in roster
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await assistantsApi.rejectAffiliation(id);
      loadRequests();
    } finally {
      setActionId(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('assistants.title')}</h1>
          <p className="text-midnight-600">{t('assistants.subtitle')}</p>
        </div>
        {activeTab === 'roster' && (
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-all shadow-md"
          >
            <UserPlus size={18} />
            {t('assistants.add')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'roster'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users size={16} />
            {t('assistants.tabRoster')}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'requests'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Clock size={16} />
            {t('assistants.tabRequests')}
            {pendingList.length > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center">
                {pendingList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Feedback messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* ── Tab: Roster ── */}
      {activeTab === 'roster' && (
        rosterLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : assistantsList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">{t('assistants.noAssistants')}</p>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors"
            >
              <UserPlus size={16} />
              {t('assistants.addFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assistantsList.map((assistant) => (
              <div key={assistant.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                <div className="h-16 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
                  <div className="absolute -bottom-6 left-4 w-14 h-14 bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-white">
                    <span className="text-emerald-600 font-bold text-lg">
                      {assistant.user?.firstName?.[0]}{assistant.user?.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div className="pt-10 pb-4 px-4">
                  <h3 className="font-semibold text-midnight-900">
                    {assistant.user?.firstName} {assistant.user?.lastName}
                  </h3>
                  {assistant.title && (
                    <p className="text-emerald-600 text-sm flex items-center gap-1 mt-1">
                      <Briefcase size={12} />
                      {assistant.title}
                    </p>
                  )}
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5"><Mail size={12} />{assistant.user?.email}</p>
                    {assistant.user?.phone && (
                      <p className="flex items-center gap-1.5"><Phone size={12} />{assistant.user?.phone}</p>
                    )}
                  </div>
                  {assistant.bio && <p className="text-slate-600 text-xs mt-3 line-clamp-2">{assistant.bio}</p>}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditingAssistant(assistant);
                        setFormData({
                          firstName: assistant.user?.firstName || '',
                          lastName: assistant.user?.lastName || '',
                          email: assistant.user?.email || '',
                          phone: assistant.user?.phone || '',
                          password: '',
                          title: assistant.title || '',
                          bio: assistant.bio || '',
                        });
                        setShowAddModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Edit size={14} />{t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleRemove(assistant.id)}
                      className="flex items-center justify-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Tab: Requests ── */}
      {activeTab === 'requests' && (
        requestsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : pendingList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{t('assistantRequests.noPending')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {pendingList.map((asst) => (
              <div key={asst.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-700 font-bold text-sm">
                      {asst.user?.firstName?.[0]}{asst.user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{asst.user?.firstName} {asst.user?.lastName}</p>
                    <p className="text-sm text-slate-500">{asst.user?.email}</p>
                    {asst.title && <p className="text-xs text-slate-400">{asst.title}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(asst.id)}
                    disabled={actionId === asst.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    <Check size={15} />{t('common.approve')}
                  </button>
                  <button
                    onClick={() => handleReject(asst.id)}
                    disabled={actionId === asst.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition-colors"
                  >
                    <X size={15} />{t('common.reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Add / Edit modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-midnight-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-dialog w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-midnight-900">
                {editingAssistant ? t('assistants.edit') : t('assistants.add')}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.firstName')}</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.lastName')}</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required disabled={!!editingAssistant} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('patients.phone')}</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              {!editingAssistant && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.password')}</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" required minLength={6} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('assistants.jobTitle')}</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder={t('assistants.jobTitlePlaceholder')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('doctors.bio')}</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
              </div>
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={18} />{editingAssistant ? t('common.save') : t('assistants.add')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
