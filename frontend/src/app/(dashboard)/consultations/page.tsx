'use client';

import { useEffect, useState } from 'react';
import { appointments } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { Calendar, User, FileText, Pill } from 'lucide-react';

export default function ConsultationsPage() {
  const { user } = useAuth();
  const [consultationsList, setConsultationsList] = useState<Appointment[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const res = await appointments.getMy();
      // Filter only COMPLETED appointments (consultations)
      const completed = res.data.filter((apt: Appointment) => apt.status === AppointmentStatus.COMPLETED);
      // Sort by date descending (most recent first)
      completed.sort((a: Appointment, b: Appointment) =>
        new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
      setConsultationsList(completed);
    } catch (err) {
      console.error('Error loading consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Consultation History</h1>
        <p className="text-gray-600">View all your past medical consultations and prescriptions</p>
      </div>

      {consultationsList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Consultations Yet</h3>
          <p className="text-gray-600">Your completed consultations will appear here</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {consultationsList.map((consultation) => (
            <div
              key={consultation.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-200 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <User className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Dr. {consultation.doctor?.user?.firstName} {consultation.doctor?.user?.lastName}
                      </h3>
                      <p className="text-sm text-primary-600 font-medium mt-1">
                        {consultation.doctor?.specialty}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{new Date(consultation.dateTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(consultation.dateTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                    COMPLETED
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 space-y-4">
                {/* Consultation Reason */}
                {consultation.reason && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Consultation Reason
                    </h4>
                    <p className="text-gray-900">{consultation.reason}</p>
                  </div>
                )}

                {/* Doctor's Notes */}
                {consultation.notes && (
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="text-blue-600" size={18} />
                      <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                        Doctor's Notes
                      </h4>
                    </div>
                    <p className="text-blue-900 leading-relaxed whitespace-pre-wrap">
                      {consultation.notes}
                    </p>
                  </div>
                )}

                {/* Prescribed Medications */}
                {consultation.medications && (
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Pill className="text-green-600" size={18} />
                      <h4 className="text-sm font-semibold text-green-900 uppercase tracking-wide">
                        Prescribed Medications
                      </h4>
                    </div>
                    <p className="text-green-900 leading-relaxed whitespace-pre-wrap">
                      {consultation.medications}
                    </p>
                  </div>
                )}

                {/* Doctor Contact Info */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Doctor Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {consultation.doctor?.user?.phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {consultation.doctor?.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Duration:</span> {consultation.duration} minutes
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
