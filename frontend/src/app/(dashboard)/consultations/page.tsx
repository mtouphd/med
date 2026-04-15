'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { consultations as consultationsApi } from '@/lib/api';
import { Consultation, UserRole } from '@/types';
import {
  FileText, Calendar, Search, LayoutGrid, List,
  User, Stethoscope, ChevronDown, ChevronUp, X,
} from 'lucide-react';
// Calendar kept for appointment date display in rows/cards

type ViewMode = 'card' | 'list';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(d: Date | string | undefined, locale: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function patientName(c: Consultation) {
  return `${c.patient?.user?.firstName ?? ''} ${c.patient?.user?.lastName ?? ''}`.trim() || '—';
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 whitespace-pre-line">{value}</p>
    </div>
  );
}

// ─── Card view item ────────────────────────────────────────────────────────────

function ConsultationCard({ c, locale }: { c: Consultation; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const name = patientName(c);
  const date = fmt(c.createdAt, locale);
  const apptDate = c.appointment?.dateTime ? fmt(c.appointment.dateTime, locale) : date;

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-sm">
          {(c.patient?.user?.firstName?.[0] ?? '?')}{(c.patient?.user?.lastName?.[0] ?? '')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{name}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Calendar size={11} />{apptDate}</span>
            {c.appointment?.duration && <span>{c.appointment.duration} min</span>}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Summary always visible */}
      {c.chiefComplaint && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-400">Motif</p>
          <p className="text-sm text-slate-700 line-clamp-2">{c.chiefComplaint}</p>
        </div>
      )}
      {c.diagnosis && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-400">Diagnostic</p>
          <p className="text-sm font-medium text-slate-800 line-clamp-2">{c.diagnosis}</p>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-50 space-y-3">
          <Field label="Notes" value={c.notes} />
          <Field label="Traitement" value={c.treatment} />
          <Field label="Prescriptions" value={c.prescriptions} />
          {c.followUpDate && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Suivi</p>
              <p className="text-sm text-blue-600 font-medium">{fmt(c.followUpDate, locale)}</p>
              {c.followUpNotes && <p className="text-xs text-slate-500 mt-0.5">{c.followUpNotes}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── List view row ─────────────────────────────────────────────────────────────

function ConsultationRow({ c, locale }: { c: Consultation; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const name = patientName(c);
  const apptDate = c.appointment?.dateTime ? fmt(c.appointment.dateTime, locale) : fmt(c.createdAt, locale);

  return (
    <>
      <tr
        className="hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
              {(c.patient?.user?.firstName?.[0] ?? '?')}{(c.patient?.user?.lastName?.[0] ?? '')}
            </div>
            <span className="font-medium text-slate-800">{name}</span>
          </div>
        </td>
        <td className="hidden sm:table-cell px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{apptDate}</td>
        <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{c.chiefComplaint ?? '—'}</td>
        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-700 max-w-[200px] truncate">{c.diagnosis ?? '—'}</td>
        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-500 max-w-[150px] truncate">{c.treatment ?? '—'}</td>
        <td className="hidden sm:table-cell px-4 py-3 text-sm whitespace-nowrap">
          {c.followUpDate
            ? <span className="text-blue-600 font-medium">{fmt(c.followUpDate, locale)}</span>
            : <span className="text-slate-300">—</span>
          }
        </td>
        <td className="px-4 py-3 text-slate-400">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/80 border-t border-slate-100">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Motif" value={c.chiefComplaint} />
              <Field label="Diagnostic" value={c.diagnosis} />
              <Field label="Notes" value={c.notes} />
              <Field label="Traitement" value={c.treatment} />
              <Field label="Prescriptions" value={c.prescriptions} />
              {c.followUpDate && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Suivi prévu</p>
                  <p className="text-sm text-blue-600 font-medium">{fmt(c.followUpDate, locale)}</p>
                  {c.followUpNotes && <p className="text-xs text-slate-500">{c.followUpNotes}</p>}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ConsultationsPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();

  const [all, setAll] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  useEffect(() => {
    const load = async () => {
      try {
        const res = user?.role === UserRole.DOCTOR
          ? await consultationsApi.getMyDoctor()
          : await consultationsApi.getMy();
        setAll(res.data);
      } catch {
        setAll([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return all.filter((c) => {
      if (patientFilter) {
        const q = patientFilter.toLowerCase();
        if (!patientName(c).toLowerCase().includes(q)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const text = [c.chiefComplaint, c.diagnosis, c.notes, c.treatment, c.prescriptions].join(' ').toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [all, patientFilter, search]);

  const hasFilters = search || patientFilter;

  const clearFilters = () => {
    setSearch('');
    setPatientFilter('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900 flex items-center gap-2">
            <Stethoscope size={22} className="text-primary-600" />
            Consultations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} consultation{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ' (filtrées)' : ''}
            {all.length > 0 && filtered.length !== all.length ? ` sur ${all.length}` : ''}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('card')}
            title="Vue cartes"
            className={`px-3 py-2 transition-colors ${viewMode === 'card' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="Vue liste"
            className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Patient name */}
          {user?.role === UserRole.DOCTOR && (
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <User size={11} /> Patient
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                  placeholder="Nom du patient…"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>
          )}

          {/* Content search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-500">Recherche dans le contenu</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Diagnostic, notes, traitement…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors self-end"
            >
              <X size={14} /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">
            {hasFilters ? 'Aucune consultation ne correspond aux filtres.' : 'Aucune consultation pour l\'instant.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-sm text-primary-600 hover:underline">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* ── CARD GRID ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ConsultationCard key={c.id} c={c} locale={locale} />
          ))}
        </div>
      ) : (
        /* ── LIST TABLE ── */
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Date RDV</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Motif</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnostic</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Traitement</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Suivi prévu</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <ConsultationRow key={c.id} c={c} locale={locale} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
