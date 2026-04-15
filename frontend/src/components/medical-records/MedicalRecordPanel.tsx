'use client';

import { useState } from 'react';
import {
  Heart, AlertTriangle, Pill, Syringe,
  Droplets, Ruler, Weight, ShieldCheck, Plus,
  Edit2, Check, X, StopCircle, FileText,
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { medicalRecords as api } from '@/lib/api';
import {
  MedicalRecord, MedicalCondition, Allergy, Medication, Vaccination,
  MedicalConditionStatus, AllergyType, AllergySeverity, MedicationStatus,
} from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

type MedTab = 'conditions' | 'allergies' | 'medications' | 'vaccinations';

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

function fmt(d: Date | string | undefined, locale: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label}
    </span>
  );
}

function conditionColor(status: MedicalConditionStatus) {
  switch (status) {
    case MedicalConditionStatus.ACTIVE:   return 'bg-red-100 text-red-700';
    case MedicalConditionStatus.CHRONIC:  return 'bg-orange-100 text-orange-700';
    case MedicalConditionStatus.MANAGED:  return 'bg-blue-100 text-blue-700';
    case MedicalConditionStatus.RESOLVED: return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function severityColor(s?: string) {
  switch (s) {
    case 'CRITICAL':
    case 'ANAPHYLACTIC':
    case 'SEVERE': return 'bg-red-100 text-red-700';
    case 'MODERATE': return 'bg-orange-100 text-orange-700';
    case 'MILD': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-slate-100 text-slate-500';
  }
}

function medicationColor(s: MedicationStatus) {
  switch (s) {
    case MedicationStatus.ACTIVE:    return 'bg-emerald-100 text-emerald-700';
    case MedicationStatus.STOPPED:   return 'bg-slate-100 text-slate-500';
    case MedicationStatus.COMPLETED: return 'bg-blue-100 text-blue-700';
    default: return 'bg-slate-100 text-slate-500';
  }
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-sm text-slate-700 align-top ${className}`}>
      {children}
    </td>
  );
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-8 text-center text-sm text-slate-400">
        {label}
      </td>
    </tr>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 ${className}`}
    />
  );
}

function Select({ value, onChange, children, className = '' }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 ${className}`}
    >
      {children}
    </select>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

interface Props {
  patientId: string;
  record: MedicalRecord | null;
  onRefresh: () => void;
}

export default function MedicalRecordPanel({ patientId, record, onRefresh }: Props) {
  const { t, locale } = useLanguage();
  const [tab, setTab] = useState<MedTab>('conditions');

  const r = record;
  const conditions  = r?.conditions   ?? [];
  const allergies   = r?.allergies    ?? [];
  const medications = r?.medications  ?? [];
  const vaccinations= r?.vaccinations ?? [];

  const TABS = [
    { key: 'conditions'   as MedTab, icon: <Heart size={14} />,          label: 'Conditions',    count: conditions.length },
    { key: 'allergies'    as MedTab, icon: <AlertTriangle size={14} />,  label: 'Allergies',     count: allergies.length },
    { key: 'medications'  as MedTab, icon: <Pill size={14} />,           label: 'Médicaments',   count: medications.length },
    { key: 'vaccinations' as MedTab, icon: <Syringe size={14} />,        label: 'Vaccinations',  count: vaccinations.length },
  ];

  return (
    <div className="space-y-4">
      {/* ── VITAUX ── */}
      <VitalsSection patientId={patientId} record={r} onRefresh={onRefresh} />

      {/* ── SOUS-ONGLETS ── */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map(({ key, icon, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex-shrink-0 ${
                tab === key
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {icon}
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {tab === 'conditions'  && <ConditionsTab   patientId={patientId} items={conditions}   locale={locale} onRefresh={onRefresh} />}
          {tab === 'allergies'   && <AllergiesTab    patientId={patientId} items={allergies}    locale={locale} onRefresh={onRefresh} />}
          {tab === 'medications' && <MedicationsTab  patientId={patientId} items={medications}  locale={locale} onRefresh={onRefresh} />}
          {tab === 'vaccinations'&& <VaccinationsTab patientId={patientId} items={vaccinations} locale={locale} onRefresh={onRefresh} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VITAUX
// ═══════════════════════════════════════════════════════════════════

function VitalsSection({ patientId, record, onRefresh }: { patientId: string; record: MedicalRecord | null; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bloodType, setBloodType]   = useState(record?.bloodType   ?? '');
  const [height, setHeight]         = useState(record?.height?.toString() ?? '');
  const [weight, setWeight]         = useState(record?.weight?.toString() ?? '');
  const [organDonor, setOrganDonor] = useState(record?.organDonor ?? false);
  const [generalNotes, setGeneralNotes] = useState((record as any)?.generalNotes ?? '');

  const bmi = record?.height && record?.weight
    ? (record.weight / Math.pow(record.height / 100, 2)).toFixed(1)
    : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMedicalRecord(patientId, {
        bloodType: bloodType || undefined,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        organDonor,
        generalNotes: generalNotes || undefined,
      });
      setEditing(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBloodType(record?.bloodType ?? '');
    setHeight(record?.height?.toString() ?? '');
    setWeight(record?.weight?.toString() ?? '');
    setOrganDonor(record?.organDonor ?? false);
    setGeneralNotes((record as any)?.generalNotes ?? '');
    setEditing(false);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FileText size={15} className="text-primary-500" />
          Données vitales
        </p>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Edit2 size={12} /> Modifier
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60"
            >
              <Check size={12} /> {saving ? '...' : 'Enregistrer'}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={12} /> Annuler
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Groupe sanguin</span>
              <Select value={bloodType} onChange={setBloodType}>
                <option value="">—</option>
                {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Taille (cm)</span>
              <Input type="number" value={height} onChange={setHeight} placeholder="175" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Poids (kg)</span>
              <Input type="number" value={weight} onChange={setWeight} placeholder="70" />
            </label>
            <label className="flex items-center gap-2 col-span-1">
              <input
                type="checkbox"
                checked={organDonor}
                onChange={(e) => setOrganDonor(e.target.checked)}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm text-slate-700">Donneur d'organes</span>
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-xs font-medium text-slate-500">Notes générales</span>
              <textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                rows={2}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <VitalCard
              icon={<Droplets size={20} className="text-red-500" />}
              label="Groupe sanguin"
              value={record?.bloodType}
              bg="bg-red-50"
            />
            <VitalCard
              icon={<Ruler size={20} className="text-blue-500" />}
              label="Taille"
              value={record?.height ? `${record.height} cm` : undefined}
              bg="bg-blue-50"
            />
            <VitalCard
              icon={<Weight size={20} className="text-green-500" />}
              label="Poids"
              value={record?.weight ? `${record.weight} kg` : undefined}
              bg="bg-green-50"
            />
            <VitalCard
              icon={<ShieldCheck size={20} className="text-purple-500" />}
              label="IMC"
              value={bmi ? `${bmi}` : undefined}
              bg="bg-purple-50"
            />
            {record?.organDonor !== undefined && (
              <div className="col-span-2 sm:col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-50 border border-pink-100">
                <Heart size={16} className={record.organDonor ? 'text-pink-500' : 'text-slate-400'} />
                <span className="text-sm text-slate-700">
                  {record.organDonor ? 'Donneur d\'organes ✓' : 'Non donneur d\'organes'}
                </span>
              </div>
            )}
            {(record as any)?.generalNotes && (
              <div className="col-span-2 sm:col-span-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-600">
                {(record as any).generalNotes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VitalCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value?: string; bg: string }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 ${bg}`}>
      {icon}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value ?? <span className="text-slate-400 font-normal">—</span>}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONDITIONS
// ═══════════════════════════════════════════════════════════════════

function ConditionsTab({ patientId, items, locale, onRefresh }: { patientId: string; items: MedicalCondition[]; locale: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [status, setStatus]       = useState<MedicalConditionStatus>(MedicalConditionStatus.ACTIVE);
  const [severity, setSeverity]   = useState('');
  const [diagnosedDate, setDiag]  = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes]         = useState('');

  const reset = () => { setName(''); setDesc(''); setStatus(MedicalConditionStatus.ACTIVE); setSeverity(''); setDiag(''); setTreatment(''); setNotes(''); };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.addCondition(patientId, {
        name, description: description || undefined,
        status, severity: severity as any || undefined,
        diagnosedDate: diagnosedDate || undefined,
        treatment: treatment || undefined,
        notes: notes || undefined,
      });
      reset(); setOpen(false); onRefresh();
    } finally { setSaving(false); }
  };

  return (
    <div>
      {/* Add form */}
      {open && (
        <div className="p-4 bg-primary-50 border-b border-primary-100 space-y-3">
          <p className="text-sm font-semibold text-primary-800">Nouvelle condition médicale</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Input value={name} onChange={setName} placeholder="Nom de la condition *" className="col-span-2 sm:col-span-1" />
            <Select value={status} onChange={(v) => setStatus(v as MedicalConditionStatus)}>
              <option value="ACTIVE">Actif</option>
              <option value="CHRONIC">Chronique</option>
              <option value="MANAGED">Géré</option>
              <option value="RESOLVED">Résolu</option>
            </Select>
            <Select value={severity} onChange={setSeverity}>
              <option value="">Sévérité (optionnel)</option>
              <option value="MILD">Légère</option>
              <option value="MODERATE">Modérée</option>
              <option value="SEVERE">Sévère</option>
              <option value="CRITICAL">Critique</option>
            </Select>
            <Input type="date" value={diagnosedDate} onChange={setDiag} className="col-span-1" />
            <Input value={description} onChange={setDesc} placeholder="Description" className="col-span-2" />
            <Input value={treatment} onChange={setTreatment} placeholder="Traitement" className="col-span-2 sm:col-span-1" />
            <Input value={notes} onChange={setNotes} placeholder="Notes" className="col-span-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { reset(); setOpen(false); }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !name.trim()} className="text-xs px-4 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
              {saving ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th>Condition</Th>
              <Th>Statut</Th>
              <Th>Sévérité</Th>
              <Th>Diagnostiqué</Th>
              <Th>Résolu</Th>
              <Th>Traitement</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0
              ? <EmptyRow cols={7} label="Aucune condition médicale enregistrée" />
              : items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-medium text-slate-800">
                    {c.name}
                    {c.description && <p className="text-xs text-slate-400 font-normal mt-0.5">{c.description}</p>}
                  </Td>
                  <Td><Badge label={c.status} color={conditionColor(c.status)} /></Td>
                  <Td>{c.severity ? <Badge label={c.severity} color={severityColor(c.severity)} /> : '—'}</Td>
                  <Td className="text-slate-500">{fmt(c.diagnosedDate, locale)}</Td>
                  <Td className="text-slate-500">{fmt(c.resolvedDate, locale)}</Td>
                  <Td className="text-slate-500 max-w-[150px] truncate">{c.treatment ?? '—'}</Td>
                  <Td className="text-slate-400 max-w-[150px] truncate">{c.notes ?? '—'}</Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Footer add button */}
      {!open && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-xs text-primary-700 hover:text-primary-800 font-medium transition-colors"
          >
            <Plus size={14} /> Ajouter une condition
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ALLERGIES
// ═══════════════════════════════════════════════════════════════════

function AllergiesTab({ patientId, items, locale: _locale, onRefresh }: { patientId: string; items: Allergy[]; locale: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allergen, setAllergen]   = useState('');
  const [type, setType]           = useState<AllergyType>(AllergyType.OTHER);
  const [severity, setSeverity]   = useState<AllergySeverity>(AllergySeverity.MILD);
  const [reaction, setReaction]   = useState('');
  const [notes, setNotes]         = useState('');

  const reset = () => { setAllergen(''); setType(AllergyType.OTHER); setSeverity(AllergySeverity.MILD); setReaction(''); setNotes(''); };

  const handleAdd = async () => {
    if (!allergen.trim()) return;
    setSaving(true);
    try {
      await api.addAllergy(patientId, { allergen, type, severity, reaction: reaction || undefined, notes: notes || undefined });
      reset(); setOpen(false); onRefresh();
    } finally { setSaving(false); }
  };

  const typeLabel: Record<AllergyType, string> = {
    MEDICATION: 'Médicament', FOOD: 'Alimentaire', ENVIRONMENTAL: 'Environnement', OTHER: 'Autre',
  };

  return (
    <div>
      {open && (
        <div className="p-4 bg-orange-50 border-b border-orange-100 space-y-3">
          <p className="text-sm font-semibold text-orange-800">Nouvelle allergie</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Input value={allergen} onChange={setAllergen} placeholder="Allergène *" className="col-span-2 sm:col-span-1" />
            <Select value={type} onChange={(v) => setType(v as AllergyType)}>
              <option value="OTHER">Autre</option>
              <option value="FOOD">Alimentaire</option>
              <option value="MEDICATION">Médicament</option>
              <option value="ENVIRONMENTAL">Environnement</option>
            </Select>
            <Select value={severity} onChange={(v) => setSeverity(v as AllergySeverity)}>
              <option value="MILD">Légère</option>
              <option value="MODERATE">Modérée</option>
              <option value="SEVERE">Sévère</option>
              <option value="ANAPHYLACTIC">Anaphylactique</option>
            </Select>
            <Input value={reaction} onChange={setReaction} placeholder="Réaction" className="col-span-2" />
            <Input value={notes} onChange={setNotes} placeholder="Notes" className="col-span-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { reset(); setOpen(false); }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !allergen.trim()} className="text-xs px-4 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60">
              {saving ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th>Allergène</Th>
              <Th>Type</Th>
              <Th>Sévérité</Th>
              <Th>Réaction</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0
              ? <EmptyRow cols={5} label="Aucune allergie enregistrée" />
              : items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-medium text-slate-800">{a.allergen}</Td>
                  <Td><span className="text-xs text-slate-500">{typeLabel[a.type]}</span></Td>
                  <Td><Badge label={a.severity} color={severityColor(a.severity)} /></Td>
                  <Td className="text-slate-500">{a.reaction ?? '—'}</Td>
                  <Td className="text-slate-400 max-w-[150px] truncate">{a.notes ?? '—'}</Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {!open && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-orange-700 hover:text-orange-800 font-medium transition-colors">
            <Plus size={14} /> Ajouter une allergie
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MÉDICAMENTS
// ═══════════════════════════════════════════════════════════════════

function MedicationsTab({ patientId, items, locale, onRefresh }: { patientId: string; items: Medication[]; locale: string; onRefresh: () => void }) {
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [stopping, setStopping] = useState<string | null>(null);
  const [stopReason, setStopReason] = useState('');
  const [stopId, setStopId]     = useState<string | null>(null);

  const [name, setName]           = useState('');
  const [dosage, setDosage]       = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStart]     = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes]         = useState('');

  const reset = () => { setName(''); setDosage(''); setFrequency(''); setStart(new Date().toISOString().split('T')[0]); setNotes(''); };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.addMedication(patientId, {
        name, dosage: dosage || '-', frequency: frequency || '-',
        startDate, notes: notes || undefined,
      });
      reset(); setOpen(false); onRefresh();
    } finally { setSaving(false); }
  };

  const handleStop = async (id: string) => {
    setStopping(id);
    try {
      await api.stopMedication(patientId, id, stopReason || undefined);
      setStopId(null); setStopReason(''); onRefresh();
    } finally { setStopping(null); }
  };

  return (
    <div>
      {open && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 space-y-3">
          <p className="text-sm font-semibold text-blue-800">Nouveau médicament</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Input value={name} onChange={setName} placeholder="Nom du médicament *" className="col-span-2 sm:col-span-1" />
            <Input value={dosage} onChange={setDosage} placeholder="Dosage (ex: 500 mg)" />
            <Input value={frequency} onChange={setFrequency} placeholder="Fréquence (ex: 2×/jour)" />
            <label className="flex flex-col gap-1">
              <span className="text-xs text-blue-700">Date de début</span>
              <Input type="date" value={startDate} onChange={setStart} />
            </label>
            <Input value={notes} onChange={setNotes} placeholder="Notes" className="col-span-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { reset(); setOpen(false); }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !name.trim()} className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th>Médicament</Th>
              <Th>Dosage</Th>
              <Th>Fréquence</Th>
              <Th>Début</Th>
              <Th>Fin</Th>
              <Th>Statut</Th>
              <Th>Notes</Th>
              <Th>{' '}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0
              ? <EmptyRow cols={8} label="Aucun médicament enregistré" />
              : items.map((m) => (
                <>
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <Td className="font-medium text-slate-800">{m.name}</Td>
                    <Td className="text-slate-500">{m.dosage ?? '—'}</Td>
                    <Td className="text-slate-500">{m.frequency ?? '—'}</Td>
                    <Td className="text-slate-500">{fmt(m.startDate, locale)}</Td>
                    <Td className="text-slate-500">{fmt(m.endDate, locale)}</Td>
                    <Td><Badge label={m.status} color={medicationColor(m.status)} /></Td>
                    <Td className="text-slate-400 max-w-[120px] truncate">{m.notes ?? '—'}</Td>
                    <Td>
                      {m.status === MedicationStatus.ACTIVE && (
                        <button
                          onClick={() => setStopId(stopId === m.id ? null : m.id)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
                        >
                          <StopCircle size={12} /> Arrêter
                        </button>
                      )}
                    </Td>
                  </tr>
                  {stopId === m.id && (
                    <tr key={`${m.id}-stop`} className="bg-red-50">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input value={stopReason} onChange={setStopReason} placeholder="Raison (optionnel)" className="flex-1" />
                          <button
                            onClick={() => handleStop(m.id)}
                            disabled={stopping === m.id}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 whitespace-nowrap"
                          >
                            {stopping === m.id ? '...' : 'Confirmer l\'arrêt'}
                          </button>
                          <button onClick={() => { setStopId(null); setStopReason(''); }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100">
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            }
          </tbody>
        </table>
      </div>

      {!open && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 font-medium transition-colors">
            <Plus size={14} /> Ajouter un médicament
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VACCINATIONS
// ═══════════════════════════════════════════════════════════════════

function VaccinationsTab({ patientId, items, locale, onRefresh }: { patientId: string; items: Vaccination[]; locale: string; onRefresh: () => void }) {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [name, setName]         = useState('');
  const [dateGiven, setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [manufacturer, setMfr]  = useState('');
  const [lotNumber, setLot]     = useState('');
  const [nextDoseDate, setNext] = useState('');
  const [notes, setNotes]       = useState('');

  const reset = () => { setName(''); setDate(new Date().toISOString().split('T')[0]); setMfr(''); setLot(''); setNext(''); setNotes(''); };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.addVaccination(patientId, {
        name, dateGiven, manufacturer: manufacturer || undefined,
        lotNumber: lotNumber || undefined, nextDoseDate: nextDoseDate || undefined,
        notes: notes || undefined,
      });
      reset(); setOpen(false); onRefresh();
    } finally { setSaving(false); }
  };

  return (
    <div>
      {open && (
        <div className="p-4 bg-green-50 border-b border-green-100 space-y-3">
          <p className="text-sm font-semibold text-green-800">Nouvelle vaccination</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Input value={name} onChange={setName} placeholder="Nom du vaccin *" className="col-span-2 sm:col-span-1" />
            <label className="flex flex-col gap-1">
              <span className="text-xs text-green-700">Date d'administration</span>
              <Input type="date" value={dateGiven} onChange={setDate} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-green-700">Prochain rappel</span>
              <Input type="date" value={nextDoseDate} onChange={setNext} />
            </label>
            <Input value={manufacturer} onChange={setMfr} placeholder="Fabricant" />
            <Input value={lotNumber} onChange={setLot} placeholder="N° de lot" />
            <Input value={notes} onChange={setNotes} placeholder="Notes" className="col-span-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { reset(); setOpen(false); }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !name.trim()} className="text-xs px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
              {saving ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th>Vaccin</Th>
              <Th>Date administré</Th>
              <Th>Fabricant</Th>
              <Th>N° de lot</Th>
              <Th>Prochain rappel</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0
              ? <EmptyRow cols={6} label="Aucune vaccination enregistrée" />
              : items.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <Td className="font-medium text-slate-800">{v.name}</Td>
                  <Td className="text-slate-500">{fmt(v.dateGiven, locale)}</Td>
                  <Td className="text-slate-500">{v.manufacturer ?? '—'}</Td>
                  <Td className="text-slate-500">{v.lotNumber ?? '—'}</Td>
                  <Td>
                    {v.nextDoseDate
                      ? <span className={`text-xs font-medium ${new Date(v.nextDoseDate) < new Date() ? 'text-red-600' : 'text-blue-600'}`}>
                          {fmt(v.nextDoseDate, locale)}
                        </span>
                      : '—'
                    }
                  </Td>
                  <Td className="text-slate-400 max-w-[150px] truncate">{v.notes ?? '—'}</Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {!open && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-medium transition-colors">
            <Plus size={14} /> Ajouter une vaccination
          </button>
        </div>
      )}
    </div>
  );
}
