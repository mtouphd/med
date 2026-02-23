'use client';

import { useEffect, useState } from 'react';
import { systemSettings } from '@/lib/api';
import { SystemSetting } from '@/types';
import { Settings, Save, CheckCircle, AlertCircle, Clock, Calendar, Heart } from 'lucide-react';

interface CategoryConfig {
  title: string;
  description: string;
  icon: any;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  appointments: {
    title: 'Gestion des Rendez-vous',
    description:
      'Configurez les paramètres relatifs à la planification et à la gestion des rendez-vous médicaux.',
    icon: Calendar,
  },
  family_doctor: {
    title: 'Médecin de Famille',
    description:
      'Configurez les paramètres relatifs à l\'attribution et à la gestion des médecins de famille.',
    icon: Heart,
  },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSettings = async () => {
    try {
      const res = await systemSettings.getAll();
      setSettings(res.data);
      const values: Record<string, string> = {};
      res.data.forEach((s) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (err) {
      console.error('Error loading settings:', err);
      setMessage({ text: 'Erreur lors du chargement des paramètres.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    const newValue = editedValues[key];
    if (newValue === undefined) return;

    const setting = settings.find((s) => s.key === key);
    if (setting && setting.value === newValue) {
      setMessage({ text: 'Aucune modification détectée.', type: 'error' });
      return;
    }

    if (setting?.type === 'number') {
      const num = parseInt(newValue, 10);
      if (isNaN(num) || num < 1) {
        setMessage({ text: 'Veuillez entrer une valeur numérique valide (minimum 1).', type: 'error' });
        return;
      }
    }

    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await systemSettings.update(key, newValue);
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? res.data : s)),
      );
      setMessage({ text: 'Paramètre mis à jour avec succès.', type: 'success' });
    } catch (err) {
      console.error('Error saving setting:', err);
      setMessage({ text: 'Erreur lors de la sauvegarde du paramètre.', type: 'error' });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveCategory = async (category: string) => {
    const categorySettings = settings.filter((s) => s.category === category);
    const changed = categorySettings.filter(
      (s) => editedValues[s.key] !== undefined && editedValues[s.key] !== s.value,
    );

    if (changed.length === 0) {
      setMessage({ text: 'Aucune modification détectée dans cette section.', type: 'error' });
      return;
    }

    for (const s of changed) {
      if (s.type === 'number') {
        const num = parseInt(editedValues[s.key], 10);
        if (isNaN(num) || num < 1) {
          setMessage({
            text: `Valeur invalide pour "${s.label}". Veuillez entrer un nombre supérieur à 0.`,
            type: 'error',
          });
          return;
        }
      }
    }

    for (const s of changed) {
      setSaving((prev) => ({ ...prev, [s.key]: true }));
    }

    try {
      for (const s of changed) {
        const res = await systemSettings.update(s.key, editedValues[s.key]);
        setSettings((prev) =>
          prev.map((setting) => (setting.key === s.key ? res.data : setting)),
        );
      }
      setMessage({ text: 'Paramètres mis à jour avec succès.', type: 'success' });
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ text: 'Erreur lors de la sauvegarde des paramètres.', type: 'error' });
    } finally {
      for (const s of changed) {
        setSaving((prev) => ({ ...prev, [s.key]: false }));
      }
    }
  };

  const isChanged = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting && editedValues[key] !== setting.value;
  };

  const isCategoryChanged = (category: string) => {
    return settings
      .filter((s) => s.category === category)
      .some((s) => isChanged(s.key));
  };

  const getUnit = (key: string) => {
    if (key.includes('duration')) return 'minutes';
    if (key.includes('max_appointments')) return 'rendez-vous';
    if (key.includes('patients')) return 'patients';
    return '';
  };

  // Group settings by category
  const categories = settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    },
    {} as Record<string, SystemSetting[]>,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary-100 p-2 rounded-lg">
            <Settings className="text-primary-600" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres du Système</h1>
        </div>
        <p className="text-gray-500 ml-12">
          Configurez les règles et limites globales du système médical. Les modifications s'appliquent immédiatement à l'ensemble de la plateforme.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(categories).map(([category, categorySettings]) => {
          const config = CATEGORY_CONFIG[category] || {
            title: category,
            description: '',
            icon: Settings,
          };
          const CategoryIcon = config.icon;

          return (
            <div
              key={category}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <CategoryIcon className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                  </div>
                </div>
              </div>

              {/* Settings List */}
              <div className="divide-y divide-gray-100">
                {categorySettings.map((setting) => {
                  const unit = getUnit(setting.key);
                  const changed = isChanged(setting.key);
                  const isSaving = saving[setting.key];

                  return (
                    <div
                      key={setting.key}
                      className={`px-6 py-5 transition-colors ${
                        changed ? 'bg-yellow-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={setting.key}
                            className="block text-sm font-semibold text-gray-900 mb-1"
                          >
                            {setting.label}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {setting.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <Clock size={12} />
                            <span>
                              Dernière modification :{' '}
                              {new Date(setting.updatedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="relative">
                            <input
                              id={setting.key}
                              type={setting.type === 'number' ? 'number' : 'text'}
                              min={setting.type === 'number' ? 1 : undefined}
                              value={editedValues[setting.key] ?? setting.value}
                              onChange={(e) =>
                                setEditedValues((prev) => ({
                                  ...prev,
                                  [setting.key]: e.target.value,
                                }))
                              }
                              className={`w-24 px-3 py-2 text-center border rounded-lg text-sm font-medium transition-colors ${
                                changed
                                  ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400'
                                  : 'border-gray-300 bg-white'
                              } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                            />
                            {unit && (
                              <span className="absolute -bottom-5 left-0 right-0 text-center text-xs text-gray-400">
                                {unit}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleSave(setting.key)}
                            disabled={!changed || isSaving}
                            className={`p-2 rounded-lg transition-colors ${
                              changed && !isSaving
                                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title="Enregistrer"
                          >
                            {isSaving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <Save size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Category Save All Button */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {isCategoryChanged(category)
                    ? 'Des modifications non enregistrées sont en attente.'
                    : 'Tous les paramètres sont à jour.'}
                </p>
                <button
                  onClick={() => handleSaveCategory(category)}
                  disabled={!isCategoryChanged(category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCategoryChanged(category)
                      ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save size={16} />
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
