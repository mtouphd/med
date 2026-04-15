'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/lib/language-context';
import { doctors as doctorsApi, familyDoctorRequests, appointments } from '@/lib/api';
import { Doctor } from '@/types';
import { Stethoscope, Search, MapPin, LayoutGrid, List, Map, X, SlidersHorizontal, Locate } from 'lucide-react';
import { DoctorCard } from '@/components/ui';

// Leaflet only runs in browser (no SSR)
const DoctorsMap = dynamic(() => import('@/components/ui/DoctorsMap'), { ssr: false });

type ViewMode = 'box' | 'list' | 'map';

const SPECIALTIES = [
  'Médecin généraliste', 'Cardiologue', 'Dermatologue', 'Gynécologue',
  'Neurologue', 'Ophtalmologue', 'Orthopédiste', 'Pédiatre',
  'Psychiatre', 'Radiologue', 'Rhumatologue', 'Urologue',
];

const RADIUS_OPTIONS = [5, 10, 20, 50];

export default function DoctorsPage() {
  const { t } = useLanguage();
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('box');

  // Booking modal (inline)
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingReason, setBookingReason] = useState('');

  // Family doctor request
  const [requestingFamilyDoctor, setRequestingFamilyDoctor] = useState<string | null>(null);

  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [radiusFilter, setRadiusFilter] = useState<number>(10);
  const [useRadius, setUseRadius] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    doctorsApi.getAll()
      .then((res) => setAllDoctors(res.data))
      .catch(() => setAllDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  // Client-side filter (instant, no extra API call unless radius is active)
  const filtered = useMemo(() => {
    let list = allDoctors;

    if (specialtyFilter) {
      const q = specialtyFilter.toLowerCase();
      list = list.filter((d) => d.specialty.toLowerCase().includes(q));
    }

    if (cityFilter) {
      const q = cityFilter.toLowerCase();
      list = list.filter((d) =>
        (d.city?.toLowerCase().includes(q)) ||
        (d.province?.toLowerCase().includes(q))
      );
    }

    if (useRadius && userLocation) {
      list = list.filter((d) => {
        if (d.latitude == null || d.longitude == null) return false;
        const dist = haversine(userLocation.lat, userLocation.lng, d.latitude, d.longitude);
        return dist <= radiusFilter;
      });
    }

    return list;
  }, [allDoctors, cityFilter, specialtyFilter, useRadius, userLocation, radiusFilter]);

  const hasFilters = cityFilter || specialtyFilter || useRadius;

  const clearFilters = () => {
    setCityFilter('');
    setSpecialtyFilter('');
    setUseRadius(false);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseRadius(true);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`);
      await appointments.create({ doctorId: bookingDoctor.id, dateTime: dateTime.toISOString(), reason: bookingReason });
      setBookingDoctor(null);
      setBookingDate(''); setBookingTime(''); setBookingReason('');
      alert(t('appointments.booked'));
    } catch {
      alert(t('common.error'));
    }
  };

  const handleRequestFamilyDoctor = async (doctorId: string) => {
    setRequestingFamilyDoctor(doctorId);
    try {
      await familyDoctorRequests.create({ doctorId });
      alert(t('doctors.requestSent'));
    } catch {
      alert(t('common.error'));
    } finally {
      setRequestingFamilyDoctor(null);
    }
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
            {t('doctors.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} médecin{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ' (filtrés)' : ''}
            {allDoctors.length > 0 && filtered.length !== allDoctors.length ? ` sur ${allDoctors.length}` : ''}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
          {([
            { mode: 'box'  as ViewMode, icon: <LayoutGrid size={16} />, label: 'Cartes' },
            { mode: 'list' as ViewMode, icon: <List size={16} />,        label: 'Liste' },
            { mode: 'map'  as ViewMode, icon: <Map size={16} />,         label: 'Carte' },
          ] as { mode: ViewMode; icon: React.ReactNode; label: string }[]).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={label}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                viewMode === mode ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* City */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <MapPin size={11} /> Ville
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Paris, Lyon…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Specialty */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <SlidersHorizontal size={11} /> Spécialité
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                placeholder="Cardiologue, généraliste…"
                list="specialty-list"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <datalist id="specialty-list">
                {SPECIALTIES.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Locate size={11} /> Rayon
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLocate}
                disabled={locating}
                title="Utiliser ma position"
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                  useRadius && userLocation
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                } disabled:opacity-60`}
              >
                <Locate size={14} className={locating ? 'animate-spin' : ''} />
                {useRadius && userLocation ? `${radiusFilter} km` : 'Ma position'}
              </button>
              {useRadius && userLocation && (
                <select
                  value={radiusFilter}
                  onChange={(e) => setRadiusFilter(Number(e.target.value))}
                  className="py-2 pl-2 pr-6 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r} km</option>
                  ))}
                </select>
              )}
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

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Stethoscope className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">
            {hasFilters ? 'Aucun médecin ne correspond aux filtres.' : t('common.noData')}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-sm text-primary-600 hover:underline">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'map' ? (
        <DoctorsMap
          doctors={filtered}
          onBookAppointment={(d) => setBookingDoctor(d)}
          onRequestFamilyDoctor={handleRequestFamilyDoctor}
        />
      ) : viewMode === 'box' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              viewMode="box"
              onBookAppointment={(d) => setBookingDoctor(d)}
              onRequestFamilyDoctor={handleRequestFamilyDoctor}
              isRequesting={requestingFamilyDoctor === doctor.id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              viewMode="list"
              onBookAppointment={(d) => setBookingDoctor(d)}
              onRequestFamilyDoctor={handleRequestFamilyDoctor}
              isRequesting={requestingFamilyDoctor === doctor.id}
            />
          ))}
        </div>
      )}

      {/* Booking modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setBookingDoctor(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {t('appointments.bookWith')} Dr. {bookingDoctor.user?.firstName} {bookingDoctor.user?.lastName}
              </h2>
              <button onClick={() => setBookingDoctor(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('appointments.date')}</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('appointments.time')}</label>
                <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('appointments.reason')}</label>
                <textarea value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
              </div>
              <button type="submit"
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium">
                {t('appointments.book')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
