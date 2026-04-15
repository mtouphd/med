'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/lib/language-context';
import {
  doctors as doctorsApi,
  medicalRecords,
  appointments as appointmentsApi,
  familyDoctorRequests,
  consultations as consultationsApi,
} from '@/lib/api';
import {
  Patient, MedicalRecord, Appointment, AppointmentStatus,
  Consultation, FamilyDoctorRequest, FamilyDoctorRequestStatus,
} from '@/types';
import {
  Search, User, Mail, Phone, MapPin,
  Calendar, Clock, FileText, Inbox, ChevronLeft,
  ChevronRight, LayoutGrid, List,
  PhoneCall, CalendarPlus, ShieldCheck, Heart,
} from 'lucide-react';
import { DoctorBookingModal, ConsultationModal } from '@/components/appointments';
import MedicalRecordPanel from '@/components/medical-records/MedicalRecordPanel';

type DetailTab = 'info' | 'medical' | 'appointments' | 'consultations' | 'requests';
type ViewMode = 'card' | 'list';
const PAGE_SIZE = 5;

export default function PatientsPage() {
  const { t, locale } = useLanguage();

  // ─── Patient list ─────────────────────────────────────────────────────────
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Patient | null>(null);

  // ─── Detail data ──────────────────────────────────────────────────────────
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultationModalApt, setConsultationModalApt] = useState<Appointment | null>(null);
  const [patientRequests, setPatientRequests] = useState<FamilyDoctorRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // ─── Load patient list ────────────────────────────────────────────────────
  useEffect(() => {
    doctorsApi.getMyPatients()
      .then((res) => setAllPatients(res.data))
      .finally(() => setListLoading(false));
  }, []);

  // ─── Filter + paginate ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allPatients.filter((p) =>
      `${p.user?.firstName} ${p.user?.lastName}`.toLowerCase().includes(q)
    );
  }, [allPatients, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPageClamped = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPageClamped - 1) * PAGE_SIZE, currentPageClamped * PAGE_SIZE);

  // reset page on search change
  useEffect(() => { setPage(1); }, [search]);

  // ─── Select patient → load detail data ────────────────────────────────────
  const handleSelect = (patient: Patient) => {
    setSelected(patient);
    setDetailTab('info');
    setRecord(null);
    setPatientAppointments([]);
    setPatientConsultations([]);
    setPatientRequests([]);
    loadRecord(patient.id);
    loadAppointments(patient.id);
    loadConsultations(patient.id);
    loadRequests(patient.id);
  };

  const loadRecord = async (patientId: string) => {
    setRecordLoading(true);
    try {
      const res = await medicalRecords.getMedicalRecord(patientId);
      setRecord(res.data);
    } catch { setRecord(null); }
    finally { setRecordLoading(false); }
  };

  const loadAppointments = async (patientId: string) => {
    setApptLoading(true);
    try {
      const res = await appointmentsApi.getByPatientId(patientId);
      setPatientAppointments(res.data);
    } catch { setPatientAppointments([]); }
    finally { setApptLoading(false); }
  };

  const loadConsultations = async (patientId: string) => {
    setConsultLoading(true);
    try {
      const res = await consultationsApi.getByPatient(patientId);
      setPatientConsultations(res.data);
    } catch { setPatientConsultations([]); }
    finally { setConsultLoading(false); }
  };

  const loadRequests = async (patientId: string) => {
    setReqLoading(true);
    try {
      const res = await familyDoctorRequests.getMyDoctorRequests();
      setPatientRequests(res.data.filter((r: FamilyDoctorRequest) => r.patientId === patientId));
    } catch { setPatientRequests([]); }
    finally { setReqLoading(false); }
  };

  // ─── Derived appointment lists ────────────────────────────────────────────
  const now = new Date();
  const upcomingApts = patientAppointments.filter(
    (a) => [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(a.status) && new Date(a.dateTime) >= now
  ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastApts = patientAppointments.filter(
    (a) => new Date(a.dateTime) < now || [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED].includes(a.status)
  ).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const completedApts = patientAppointments.filter((a) => a.status === AppointmentStatus.COMPLETED)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // ─── Tab bar component ────────────────────────────────────────────────────
  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'info',          label: t('patientDetail.tabInfo') },
    { key: 'medical',       label: t('patientDetail.tabMedical') },
    { key: 'appointments',  label: t('patientDetail.tabAppointments') },
    { key: 'consultations', label: t('patientDetail.tabConsultations') },
    { key: 'requests',      label: t('patientDetail.tabRequests') },
  ];

  const fmt = (date: Date | string) => new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (date: Date | string) => new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const statusPill = (status: AppointmentStatus) => {
    const map: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]:   'bg-amber-100 text-amber-800',
      [AppointmentStatus.CONFIRMED]: 'bg-emerald-100 text-emerald-800',
      [AppointmentStatus.COMPLETED]: 'bg-blue-100 text-blue-800',
      [AppointmentStatus.CANCELLED]: 'bg-slate-100 text-slate-600',
      [AppointmentStatus.REJECTED]:  'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-6">

      {/* ── SECTION LISTE ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-midnight-900">{t('patients.title')}</h1>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('patients.searchPlaceholder')}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 w-52"
              />
            </div>
            {/* View mode */}
            <div className="flex border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* List / Cards */}
        {listLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            {t('common.noData')}
          </div>
        ) : viewMode === 'card' ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {paginated.map((patient) => {
              const isSel = selected?.id === patient.id;
              return (
                <button
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                    isSel ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-slate-100 bg-white hover:border-primary-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow ${
                    isSel ? 'bg-primary-600' : 'bg-gradient-to-br from-cyan-500 to-primary-600'
                  }`}>
                    {patient.user?.firstName?.[0]}{patient.user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {patient.user?.firstName} {patient.user?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-[100px]">{patient.user?.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((patient) => {
              const isSel = selected?.id === patient.id;
              return (
                <button
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className={`w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors text-left ${isSel ? 'bg-primary-50' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isSel ? 'bg-primary-600' : 'bg-gradient-to-br from-cyan-500 to-primary-600'}`}>
                    {patient.user?.firstName?.[0]}{patient.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{patient.user?.firstName} {patient.user?.lastName}</p>
                    <p className="text-xs text-slate-400 truncate">{patient.user?.email}</p>
                  </div>
                  {patient.user?.phone && (
                    <p className="text-xs text-slate-400 hidden sm:block flex-shrink-0">{patient.user.phone}</p>
                  )}
                  {isSel && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!listLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">
              {filtered.length} {t('patients.title').toLowerCase()} • {t('common.page')} {currentPageClamped}/{totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPageClamped === 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    p === currentPageClamped ? 'bg-primary-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageClamped === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION DÉTAIL ────────────────────────────────────────────────── */}
      {selected ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Patient banner */}
          <div className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-primary-500 to-cyan-500 text-white">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {selected.user?.firstName?.[0]}{selected.user?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold">{selected.user?.firstName} {selected.user?.lastName}</h2>
              <p className="text-white/80 text-sm">{selected.user?.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex overflow-x-auto">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setDetailTab(key);
                    // Always reload fresh data when switching tabs
                    if (selected) {
                      if (key === 'consultations') loadConsultations(selected.id);
                      if (key === 'appointments')  loadAppointments(selected.id);
                      if (key === 'medical')       loadRecord(selected.id);
                    }
                  }}
                  className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    detailTab === key
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">

            {/* ── TAB: INFORMATIONS ── */}
            {detailTab === 'info' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<User size={15} />}    label={t('auth.firstName')}     value={selected.user?.firstName} />
                <InfoRow icon={<User size={15} />}    label={t('auth.lastName')}      value={selected.user?.lastName} />
                <InfoRow icon={<Mail size={15} />}    label={t('auth.email')}         value={selected.user?.email} />
                <InfoRow icon={<Phone size={15} />}   label={t('patients.phone')}     value={selected.user?.phone} />
                <InfoRow icon={<MapPin size={15} />}  label={t('patients.address')}   value={selected.address} />
                <InfoRow icon={<Calendar size={15} />} label={t('patients.dob')}     value={selected.dateOfBirth ? fmt(selected.dateOfBirth) : undefined} />
                <InfoRow icon={<PhoneCall size={15} />} label={t('patients.emergencyContact')} value={selected.emergencyContact} />
                {selected.familyDoctor && (
                  <InfoRow
                    icon={<ShieldCheck size={15} />}
                    label={t('patients.familyDoctor')}
                    value={`Dr. ${selected.familyDoctor.user?.firstName} ${selected.familyDoctor.user?.lastName}`}
                  />
                )}
              </div>
            )}

            {/* ── TAB: DOSSIER MÉDICAL ── */}
            {detailTab === 'medical' && (
              recordLoading ? <Spinner /> : (
                <MedicalRecordPanel
                  patientId={selected.id}
                  record={record}
                  onRefresh={() => loadRecord(selected.id)}
                />
              )
            )}

            {/* ── TAB: RENDEZ-VOUS ── */}
            {detailTab === 'appointments' && (
              apptLoading ? <Spinner /> : (
                <div className="space-y-5">
                  {/* New appointment button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setBookingOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                    >
                      <CalendarPlus size={15} />
                      {t('appointments.newAppointment')}
                    </button>
                  </div>

                  {/* Upcoming */}
                  <Section title={t('patientDetail.upcoming')} icon={<Calendar size={15} className="text-emerald-500" />}>
                    {upcomingApts.length === 0 ? <Empty /> : upcomingApts.map((apt) => (
                      <div key={apt.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar size={14} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{fmt(apt.dateTime)} — {fmtTime(apt.dateTime)}</p>
                          {apt.reason && <p className="text-xs text-slate-400 truncate">{apt.reason}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusPill(apt.status)}`}>{apt.status}</span>
                      </div>
                    ))}
                  </Section>

                  {/* Past */}
                  <Section title={t('patientDetail.past')} icon={<Clock size={15} className="text-slate-400" />}>
                    {pastApts.length === 0 ? <Empty /> : pastApts.map((apt) => (
                      <div key={apt.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock size={14} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{fmt(apt.dateTime)} — {fmtTime(apt.dateTime)}</p>
                          {apt.reason && <p className="text-xs text-slate-400 truncate">{apt.reason}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusPill(apt.status)}`}>{apt.status}</span>
                      </div>
                    ))}
                  </Section>
                </div>
              )
            )}

            {/* ── TAB: CONSULTATIONS ── */}
            {detailTab === 'consultations' && (
              consultLoading ? <Spinner /> : patientConsultations.length === 0 ? <Empty /> : (
                <div className="space-y-2">
                  {patientConsultations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => c.appointment && setConsultationModalApt(c.appointment as Appointment)}
                      disabled={!c.appointment}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {c.appointment ? fmt(c.appointment.dateTime) : fmt(c.createdAt)}
                          {c.appointment ? ` — ${fmtTime(c.appointment.dateTime)}` : ''}
                        </p>
                        {c.diagnosis
                          ? <p className="text-xs text-primary-600 truncate">{c.diagnosis}</p>
                          : c.chiefComplaint
                            ? <p className="text-xs text-slate-400 truncate">{c.chiefComplaint}</p>
                            : null
                        }
                      </div>
                      <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )
            )}

            {/* ── TAB: DEMANDES ── */}
            {detailTab === 'requests' && (
              reqLoading ? <Spinner /> : patientRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">{t('common.noData')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patientRequests.map((req) => (
                    <div key={req.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Heart size={15} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{t('patients.familyDoctorRequest')}</p>
                        <p className="text-xs text-slate-400">{fmt(req.requestedAt)}</p>
                        {req.requestReason && <p className="text-xs text-slate-500 mt-1">{req.requestReason}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        req.status === FamilyDoctorRequestStatus.PENDING  ? 'bg-amber-100 text-amber-800' :
                        req.status === FamilyDoctorRequestStatus.APPROVED ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-700'
                      }`}>{req.status}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('patients.selectPatient')}</p>
        </div>
      )}

      {/* Doctor booking modal for selected patient */}
      {bookingOpen && selected && (
        <DoctorBookingModal
          preselectedPatient={selected}
          onCreated={() => { loadAppointments(selected.id); }}
          onClose={() => setBookingOpen(false)}
        />
      )}

      {/* Consultation modal — same component as calendar view */}
      {consultationModalApt && selected && (
        <ConsultationModal
          appointment={consultationModalApt}
          onSaved={() => { loadConsultations(selected.id); }}
          onClose={() => setConsultationModalApt(null)}
        />
      )}
    </div>
  );
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-7 h-7 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
}

function Empty() {
  const { t } = useLanguage();
  return <p className="text-sm text-slate-400 py-3">{t('common.noData')}</p>;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-800 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}


function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
        {icon}
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}
