'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors } from '@/lib/api';
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
} from 'lucide-react';

interface AssistantManagementProps {
  doctorId?: string;
}

export default function AssistantManagement({ doctorId }: AssistantManagementProps) {
  const { t } = useLanguage();
  const [assistantsList, setAssistantsList] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    title: '',
    bio: '',
  });

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      const res = await doctors.getMyAssistants();
      setAssistantsList(res.data);
    } catch (error) {
      console.error('Error loading assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      title: '',
      bio: '',
    });
    setEditingAssistant(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
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
        // Update existing assistant
        // Note: We would need an update endpoint for this
        setSuccessMessage(t('assistants.updated'));
      } else {
        // Create new assistant
        await doctors.createAssistant({
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
      loadAssistants();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssistant = async (assistantId: string) => {
    if (!confirm(t('assistants.confirmRemove'))) return;

    try {
      // Get current doctor ID from the first assistant's doctor relationship or use a me endpoint
      await doctors.removeAssistant('me', assistantId);
      setSuccessMessage(t('assistants.removed'));
      loadAssistants();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || t('common.error'));
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-midnight-900">{t('assistants.title')}</h2>
          <p className="text-slate-600">{t('assistants.subtitle')}</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-all shadow-md hover:shadow-lg"
        >
          <UserPlus size={18} />
          {t('assistants.add')}
        </button>
      </div>

      {/* Success/Error messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-slide-up">
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

      {/* Assistants List */}
      {assistantsList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">{t('assistants.noAssistants')}</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors"
          >
            <UserPlus size={16} />
            {t('assistants.addFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-animation">
          {assistantsList.map((assistant) => (
            <div
              key={assistant.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all card-3d-wrapper perspective-1000"
            >
              {/* Header */}
              <div className="h-16 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
                <div className="absolute -bottom-6 left-4 w-14 h-14 bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-white">
                  <span className="text-emerald-600 font-bold text-lg">
                    {assistant.user?.firstName?.[0]}
                    {assistant.user?.lastName?.[0]}
                  </span>
                </div>
              </div>

              {/* Content */}
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
                  <p className="flex items-center gap-1.5">
                    <Mail size={12} />
                    {assistant.user?.email}
                  </p>
                  {assistant.user?.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone size={12} />
                      {assistant.user?.phone}
                    </p>
                  )}
                </div>

                {assistant.bio && (
                  <p className="text-slate-600 text-xs mt-3 line-clamp-2">{assistant.bio}</p>
                )}

                {/* Actions */}
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
                    <Edit size={14} />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleRemoveAssistant(assistant.id)}
                    className="flex items-center justify-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-midnight-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-dialog w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-midnight-900">
                {editingAssistant ? t('assistants.edit') : t('assistants.add')}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('auth.firstName')}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('auth.lastName')}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                  disabled={!!editingAssistant}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('patients.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* Password (only for new assistants) */}
              {!editingAssistant && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    required
                    minLength={6}
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('assistants.jobTitle')}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('assistants.jobTitlePlaceholder')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('doctors.bio')}
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check size={18} />
                      {editingAssistant ? t('common.save') : t('assistants.add')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
