'use client';

import { useEffect, useState, useMemo } from 'react';
import { appointments } from '@/lib/api';
import { Appointment, AppointmentStatus, UserRole } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { Calendar, User, FileText, Pill, Search, Filter, X } from 'lucide-react';

export default function ConsultationsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === UserRole.DOCTOR;

  const [consultationsList, setConsultationsList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const res = await appointments.getMy();
      const completed = res.data.filter(
        (apt: Appointment) => apt.status === AppointmentStatus.COMPLETED
      );
      completed.sort(
        (a: Appointment, b: Appointment) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
      setConsultationsList(completed);
    } catch (err) {
      console.error('Error loading consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth?: Date | string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const filteredConsultations = useMemo(() => {
    return consultationsList.filter((c) => {
      // Filter by patient/doctor name
      if (searchName) {
        const search = searchName.toLowerCase();
        if (isDoctor) {
          const patientName = `${c.patient?.user?.firstName || ''} ${c.patient?.user?.lastName || ''}`.toLowerCase();
          if (!patientName.includes(search)) return false;
        } else {
          const doctorName = `${c.doctor?.user?.firstName || ''} ${c.doctor?.user?.lastName || ''}`.toLowerCase();
          if (!doctorName.includes(search)) return false;
        }
      }

      // Filter by date range
      const consultDate = new Date(c.dateTime);
      if (dateFrom && consultDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        if (consultDate > toDate) return false;
      }

      // Filter by patient age (doctor only)
      if (isDoctor && (ageMin || ageMax)) {
        const age = calculateAge(c.patient?.dateOfBirth);
        if (age === null) return false;
        if (ageMin && age < parseInt(ageMin)) return false;
        if (ageMax && age > parseInt(ageMax)) return false;
      }

      return true;
    });
  }, [consultationsList, searchName, dateFrom, dateTo, ageMin, ageMax, isDoctor]);

  const clearFilters = () => {
    setSearchName('');
    setDateFrom('');
    setDateTo('');
    setAgeMin('');
    setAgeMax('');
  };

  const hasActiveFilters = searchName || dateFrom || dateTo || ageMin || ageMax;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isDoctor ? 'Consultation History' : 'My Consultation History'}
        </h1>
        <p className="text-gray-600">
          {isDoctor
            ? 'View all your past consultations with patients'
            : 'View all your past medical consultations and prescriptions'}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={isDoctor ? 'Search by patient name...' : 'Search by doctor name...'}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {/* Toggle filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            {isDoctor && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age min</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    placeholder="0"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age max</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    placeholder="150"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500">
        {filteredConsultations.length} consultation{filteredConsultations.length !== 1 ? 's' : ''} found
        {hasActiveFilters && ` (${consultationsList.length} total)`}
      </div>

      {/* List */}
      {filteredConsultations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'No matching consultations' : 'No Consultations Yet'}
          </h3>
          <p className="text-gray-600">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Your completed consultations will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsultations.map((consultation) => {
            const personName = isDoctor
              ? `${consultation.patient?.user?.firstName || ''} ${consultation.patient?.user?.lastName || ''}`
              : `Dr. ${consultation.doctor?.user?.firstName || ''} ${consultation.doctor?.user?.lastName || ''}`;

            const personSubtitle = isDoctor
              ? (() => {
                  const age = calculateAge(consultation.patient?.dateOfBirth);
                  return age !== null ? `${age} years old` : 'Age unknown';
                })()
              : consultation.doctor?.specialty || '';

            return (
              <div
                key={consultation.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2.5 rounded-lg shadow-sm">
                      <User className="text-primary-600" size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{personName}</h3>
                      <p className="text-sm text-primary-600 font-medium">{personSubtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Calendar size={16} />
                      <span>{new Date(consultation.dateTime).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(consultation.dateTime).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}{consultation.duration} min
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-3">
                  {consultation.reason && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reason</h4>
                      <p className="text-gray-900 text-sm">{consultation.reason}</p>
                    </div>
                  )}

                  {consultation.notes && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText className="text-blue-600" size={14} />
                        <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Notes</h4>
                      </div>
                      <p className="text-blue-900 text-sm whitespace-pre-wrap">{consultation.notes}</p>
                    </div>
                  )}

                  {consultation.medications && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Pill className="text-green-600" size={14} />
                        <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wide">Medications</h4>
                      </div>
                      <p className="text-green-900 text-sm whitespace-pre-wrap">{consultation.medications}</p>
                    </div>
                  )}

                  {!consultation.reason && !consultation.notes && !consultation.medications && (
                    <p className="text-sm text-gray-400 italic">No details recorded for this consultation</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
