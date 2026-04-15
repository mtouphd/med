'use client';

import { useState, useEffect } from 'react';
import { X, ClipboardList, Check, AlertCircle, Save, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { consultations as consultationsApi } from '@/lib/api';
import { Appointment, AppointmentStatus, Consultation } from '@/types';

interface ConsultationModalProps {
  appointment: Appointment;
  onSaved: () => void;
  onClose: () => void;
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea = false, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; textarea?: boolean; disabled?: boolean;
}) {
  const cls = `w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 ${
    disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'
  }`;
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            rows={3} className={`${cls} resize-none`} disabled={disabled} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder} className={cls} disabled={disabled} />
      }
    </div>
  );
}

function Feedback({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${
      ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      {ok ? <Check size={15} /> : <AlertCircle size={15} />} {msg}
    </div>
  );
}

export default function ConsultationModal({ appointment: apt, onSaved, onClose }: ConsultationModalProps) {
  const { t, locale } = useLanguage();
  const [existing, setExisting] = useState<Consultation | null>(null);

  const [chiefComplaint, setChiefComplaint] = useState(apt.reason || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [treatment, setTreatment] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isCompleted = apt.status === AppointmentStatus.COMPLETED;
  const dt = new Date(apt.dateTime);

  // The "Terminer" button is only active once the appointment time has passed
  const canComplete = new Date() >= dt;

  const patientName = `${apt.patient?.user?.firstName ?? ''} ${apt.patient?.user?.lastName ?? ''}`.trim();
  const dateStr = dt.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  // Load existing consultation on open
  useEffect(() => {
    consultationsApi.getByAppointment(apt.id)
      .then((res) => {
        if (res.data) {
          const c: Consultation = res.data;
          setExisting(c);
          setChiefComplaint(c.chiefComplaint || apt.reason || '');
          setDiagnosis(c.diagnosis || '');
          setNotes(c.notes || '');
          setTreatment(c.treatment || '');
          setPrescriptions(c.prescriptions || '');
          setFollowUpDate(c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '');
          setFollowUpNotes(c.followUpNotes || '');
        }
      })
      .catch(() => {});
  }, [apt.id]);

  const payload = () => ({
    chiefComplaint, diagnosis, notes, treatment, prescriptions,
    followUpDate: followUpDate || undefined,
    followUpNotes,
  });

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (existing) {
        await consultationsApi.update(existing.id, payload());
      } else {
        const res = await consultationsApi.save({ appointmentId: apt.id, ...payload() });
        setExisting(res.data);
      }
      setSuccess(t('common.success'));
      setTimeout(() => setSuccess(''), 2000);
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!canComplete) return;
    setSaving(true); setError('');
    try {
      await consultationsApi.complete(apt.id, payload());
      setSuccess(t('consultation.saved'));
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-primary-600" />
              <p className="text-base font-bold text-slate-800">{patientName}</p>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{dateStr} — {timeStr} · {apt.duration} min</p>
            {existing && (
              <span className="inline-block mt-1 text-xs text-primary-600 font-medium">
                {t('consultation.draftSaved')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {success && <Feedback msg={success} ok />}
          {error && <Feedback msg={error} ok={false} />}

          {/* "Terminer" locked notice */}
          {!isCompleted && !canComplete && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm border bg-amber-50 border-amber-200 text-amber-700">
              <Clock size={15} className="flex-shrink-0" />
              <span>
                Le bouton <strong>Terminer</strong> sera disponible à partir du{' '}
                <strong>{dateStr} à {timeStr}</strong>.
              </span>
            </div>
          )}

          <Field label={t('consultation.chiefComplaint')} value={chiefComplaint} onChange={setChiefComplaint}
            placeholder={t('consultation.chiefComplaintPlaceholder')} textarea disabled={isCompleted} />
          <Field label={t('consultation.diagnosis')} value={diagnosis} onChange={setDiagnosis}
            placeholder={t('consultation.diagnosisPlaceholder')} textarea disabled={isCompleted} />
          <Field label={t('consultation.notes')} value={notes} onChange={setNotes}
            placeholder={t('consultation.notesPlaceholder')} textarea disabled={isCompleted} />
          <Field label={t('consultation.treatment')} value={treatment} onChange={setTreatment}
            placeholder={t('consultation.treatmentPlaceholder')} textarea disabled={isCompleted} />
          <Field label={t('consultation.prescriptions')} value={prescriptions} onChange={setPrescriptions}
            placeholder={t('consultation.prescriptionsPlaceholder')} textarea disabled={isCompleted} />

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('consultation.followUpDate')} value={followUpDate} onChange={setFollowUpDate}
              type="date" disabled={isCompleted} />
            <Field label={t('consultation.followUpNotes')} value={followUpNotes} onChange={setFollowUpNotes}
              placeholder={t('consultation.optional')} disabled={isCompleted} />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
          {isCompleted ? (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors">
                <Save size={15} /> {saving ? t('common.saving') : t('common.save')}
              </button>
              <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                <Check size={15} /> {t('appointments.status.completed')}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition-colors">
                <Save size={15} /> {saving ? t('common.saving') : t('common.save')}
              </button>
              <button
                onClick={handleComplete}
                disabled={saving || !canComplete}
                title={!canComplete ? `Disponible à partir du ${dateStr} à ${timeStr}` : undefined}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Check size={15} />
                {saving ? t('common.saving') : t('consultation.complete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
