'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors } from '@/lib/api';
import { Doctor, DoctorSettings } from '@/types';
import { Settings, Save, RotateCcw, MapPin, Check } from 'lucide-react';

interface SettingField {
  key: keyof Omit<DoctorSettings, 'globals'>;
  globalKey: keyof DoctorSettings['globals'];
  labelKey: string;
  descriptionKey: string;
  min: number;
  unit: string;
}

const FIELDS: SettingField[] = [
  {
    key: 'maxAppointmentsPerDay',
    globalKey: 'maxAppointmentsPerDay',
    labelKey: 'doctorSettings.maxAppointmentsPerDay',
    descriptionKey: 'doctorSettings.maxAppointmentsPerDayDesc',
    min: 1,
    unit: 'doctorSettings.unitAppointments',
  },
  {
    key: 'minAppointmentDuration',
    globalKey: 'minAppointmentDuration',
    labelKey: 'doctorSettings.minAppointmentDuration',
    descriptionKey: 'doctorSettings.minAppointmentDurationDesc',
    min: 5,
    unit: 'doctorSettings.unitMinutes',
  },
  {
    key: 'maxAppointmentDuration',
    globalKey: 'maxAppointmentDuration',
    labelKey: 'doctorSettings.maxAppointmentDuration',
    descriptionKey: 'doctorSettings.maxAppointmentDurationDesc',
    min: 5,
    unit: 'doctorSettings.unitMinutes',
  },
  {
    key: 'maxFamilyPatients',
    globalKey: 'maxFamilyPatients',
    labelKey: 'doctorSettings.maxFamilyPatients',
    descriptionKey: 'doctorSettings.maxFamilyPatientsDesc',
    min: 1,
    unit: 'doctorSettings.unitPatients',
  },
];

export default function DoctorSettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<DoctorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  // ── Cabinet address ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [addrStreet, setAddrStreet] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrCountry, setAddrCountry] = useState('');
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrMsg, setAddrMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await doctors.getMyProfile();
      const d = res.data;
      setProfile(d);
      setAddrStreet(d.street ?? '');
      setAddrPostal(d.postalCode ?? '');
      setAddrCity(d.city ?? '');
      setAddrProvince(d.province ?? '');
      setAddrCountry(d.country ?? '');
    } catch { /* ignore */ }
  };

  const handleSaveAddress = async () => {
    setAddrSaving(true);
    setAddrMsg(null);
    try {
      await doctors.updateMyProfile({
        street: addrStreet,
        postalCode: addrPostal,
        city: addrCity,
        province: addrProvince,
        country: addrCountry,
      });
      setAddrMsg({ ok: true, text: 'Adresse sauvegardée. Géocodage en cours…' });
      await loadProfile();
      setTimeout(() => setAddrMsg(null), 4000);
    } catch {
      setAddrMsg({ ok: false, text: t('common.error') });
    } finally {
      setAddrSaving(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await doctors.getMySettings();
      setSettings(res.data);
      const v: Record<string, string> = {};
      FIELDS.forEach((f) => {
        v[f.key] = res.data[f.key] != null ? String(res.data[f.key]) : '';
      });
      setValues(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (field: SettingField) => {
    if (!settings) return;
    setSaving(field.key);
    try {
      const raw = values[field.key];
      const value = raw === '' ? null : Number(raw);
      await doctors.updateMySettings({ [field.key]: value });
      await loadSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (field: SettingField) => {
    setSaving(field.key + '_reset');
    try {
      await doctors.updateMySettings({ [field.key]: null });
      await loadSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-midnight-900 flex items-center gap-2">
          <Settings size={24} />
          {t('doctorSettings.title')}
        </h1>
        <p className="text-midnight-600 mt-1">{t('doctorSettings.subtitle')}</p>
      </div>

      {/* ── Cabinet address section ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <MapPin size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-800">Adresse du cabinet</h2>
          {profile?.latitude && profile?.longitude && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Check size={11} /> Géocodé ({profile.latitude.toFixed(5)}, {profile.longitude.toFixed(5)})
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Rue / N°</label>
            <input type="text" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)}
              placeholder="12 rue de la Paix"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Code postal</label>
            <input type="text" value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)}
              placeholder="75001"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Ville</label>
            <input type="text" value={addrCity} onChange={(e) => setAddrCity(e.target.value)}
              placeholder="Paris"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Département / Province</label>
            <input type="text" value={addrProvince} onChange={(e) => setAddrProvince(e.target.value)}
              placeholder="Île-de-France"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Pays</label>
            <input type="text" value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)}
              placeholder="France"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
        </div>

        {addrMsg && (
          <div className={`mt-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${addrMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {addrMsg.ok ? <Check size={12} /> : null}
            {addrMsg.text}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">Les coordonnées sont calculées automatiquement via OpenStreetMap.</p>
          <button
            onClick={handleSaveAddress}
            disabled={addrSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            <Save size={14} />
            {addrSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        {t('doctorSettings.notice')}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        {FIELDS.map((field) => {
          const globalValue = settings.globals[field.globalKey];
          const currentValue = settings[field.key];
          const isOverridden = currentValue != null;
          const inputValue = values[field.key] ?? '';
          const hasChanged = inputValue !== (currentValue != null ? String(currentValue) : '');

          return (
            <div key={field.key} className="p-5">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-midnight-900">{t(field.labelKey)}</p>
                    {isOverridden ? (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        {t('doctorSettings.customized')}
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {t('doctorSettings.usingGlobal')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-midnight-500">{t(field.descriptionKey)}</p>
                  <p className="text-xs text-midnight-400 mt-1">
                    {t('doctorSettings.globalValue')}: <span className="font-medium">{globalValue} {t(field.unit)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    min={field.min}
                    value={inputValue}
                    placeholder={String(globalValue)}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  />
                  <span className="text-sm text-midnight-500 w-16">{t(field.unit)}</span>

                  {hasChanged && (
                    <button
                      onClick={() => handleSave(field)}
                      disabled={saving === field.key}
                      className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      title={t('common.save')}
                    >
                      <Save size={15} />
                    </button>
                  )}

                  {isOverridden && !hasChanged && (
                    <button
                      onClick={() => handleReset(field)}
                      disabled={saving === field.key + '_reset'}
                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                      title={t('doctorSettings.resetToGlobal')}
                    >
                      <RotateCcw size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
