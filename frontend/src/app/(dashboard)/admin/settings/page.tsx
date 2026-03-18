'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { systemSettings } from '@/lib/api';
import { SystemSetting } from '@/types';
import { Settings, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await systemSettings.getAll();
      setSettings(res.data);
      const values: Record<string, string> = {};
      res.data.forEach((s: SystemSetting) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await systemSettings.update(key, editedValues[key]);
      loadSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const renderInput = (setting: SystemSetting) => {
    const value = editedValues[setting.key] ?? setting.value;
    const hasChanged = value !== setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value === 'true'}
                onChange={(e) => handleChange(setting.key, e.target.checked ? 'true' : 'false')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
            {hasChanged && (
              <button
                onClick={() => handleSave(setting.key)}
                disabled={saving === setting.key}
                className="p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                <Save size={14} />
              </button>
            )}
          </div>
        );
      case 'number':
        return (
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            {hasChanged && (
              <button
                onClick={() => handleSave(setting.key)}
                disabled={saving === setting.key}
                className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                <Save size={16} />
              </button>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            {hasChanged && (
              <button
                onClick={() => handleSave(setting.key)}
                disabled={saving === setting.key}
                className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                <Save size={16} />
              </button>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-midnight-900">{t('admin.settings')}</h1>
        <p className="text-midnight-600">{t('admin.settingsSubtitle')}</p>
      </div>

      {Object.keys(groupedSettings).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <Settings className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
          <p className="text-midnight-600">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-midnight-900 capitalize">{category}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {categorySettings.map((setting) => (
                  <div key={setting.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-midnight-900">{setting.label}</p>
                        {setting.description && (
                          <p className="text-sm text-midnight-500 mt-1">{setting.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {renderInput(setting)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
