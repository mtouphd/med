'use client';

import { useEffect, useState } from 'react';
import { appointments, doctors, patients } from '@/lib/api';
import { Appointment, AppointmentStatus, Doctor, UserRole, Patient } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle, XCircle, Clock, Calendar as CalendarIcon, List, Plus, User } from 'lucide-react';

type ViewMode = 'calendar' | 'list';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState('');
  const [reason, setReason] = useState('');
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [message, setMessage] = useState('');
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctorId, setDoctorId] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [doctorList, setDoctorList] = useState<Doctor[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    doctorId: '',
    dateTime: '',
    duration: 30,
    reason: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadDoctorId();
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.PATIENT || doctorId) {
      loadAppointments();
    }
  }, [user, doctorId, patientId, currentDate, calendarView]);

  const loadDoctorId = async () => {
    console.log('loadDoctorId called, user role:', user?.role);
    try {
      if (user?.role === UserRole.DOCTOR) {
        const res = await doctors.getAll();
        const doctor = res.data.find((d: Doctor) => d.userId === user.id);
        if (doctor) {
          setDoctorId(doctor.id);
        }
      }
      if (user?.role === UserRole.PATIENT) {
        const res = await patients.getMyProfile();
        if (res.data) {
          setPatientId(res.data.id);
        }
      }
      if (user?.role === UserRole.DOCTOR || user?.role === UserRole.ADMIN) {
        const patientsRes = await patients.getAll();
        setPatientList(patientsRes.data);
      }
      if (user?.role === UserRole.PATIENT || user?.role === UserRole.ADMIN) {
        console.log('Fetching doctors for role:', user?.role);
        const doctorsRes = await doctors.getAll();
        console.log('Doctors loaded:', doctorsRes.data);
        console.log('Number of doctors:', doctorsRes.data?.length);
        setDoctorList(doctorsRes.data);
      }
    } catch (err) {
      console.error('Error loading doctor:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      // Admin voit tous les rendez-vous
      if (user?.role === UserRole.ADMIN) {
        const res = await appointments.getAll();
        setAppointmentsList(res.data);
      }
      // Patient voit ses rendez-vous
      else if (user?.role === UserRole.PATIENT) {
        const res = await appointments.getMy();
        setAppointmentsList(res.data);
      }
      // Médecin voit ses rendez-vous
      else if (user?.role === UserRole.DOCTOR && doctorId) {
        if (calendarView === 'week') {
          const start = new Date(currentDate);
          start.setDate(start.getDate() - start.getDay());
          const end = new Date(start);
          end.setDate(end.getDate() + 7);

          const res = await appointments.getByDateRange(doctorId, start.toISOString(), end.toISOString());
          setAppointmentsList(res.data);
        } else if (calendarView === 'month') {
          const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

          const res = await appointments.getByDateRange(doctorId, start.toISOString(), end.toISOString());
          setAppointmentsList(res.data);
        } else {
          const start = new Date(currentDate.getFullYear(), 0, 1);
          const end = new Date(currentDate.getFullYear(), 11, 31);

          const res = await appointments.getByDateRange(doctorId, start.toISOString(), end.toISOString());
          setAppointmentsList(res.data);
        }
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
    try {
      await appointments.update(id, { status, notes, medications });
      setMessage('Appointment updated successfully!');
      setSelectedAppointment(null);
      setNotes('');
      setMedications('');
      loadAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const handleUpdateReason = async (id: string) => {
    try {
      await appointments.update(id, { reason });
      setMessage('Appointment reason updated successfully!');
      setSelectedAppointment(null);
      setReason('');
      setIsEditingReason(false);
      loadAppointments();
    } catch (err) {
      console.error('Error updating reason:', err);
      setMessage('Error updating reason. Please try again.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      if (user?.role === UserRole.ADMIN) {
        await appointments.approveByAdmin(id);
        setMessage('Appointment approved by admin! (Waiting for doctor approval)');
      } else if (user?.role === UserRole.DOCTOR) {
        await appointments.approveByDoctor(id);
        setMessage('Appointment approved successfully! (Waiting for admin approval)');
      }
      loadAppointments();
    } catch (err: any) {
      console.error('Error approving appointment:', err);
      setMessage(err.response?.data?.message || 'Error approving appointment. Please try again.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointments.cancel(id);
      setMessage('Appointment cancelled!');
      loadAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      if (user?.role === UserRole.PATIENT) {
        // Patient creates appointment with selected doctor
        await appointments.create({
          doctorId: newAppointment.doctorId,
          dateTime: newAppointment.dateTime,
          duration: newAppointment.duration,
          reason: newAppointment.reason,
          status: AppointmentStatus.PENDING,
        });
        setMessage('Appointment request submitted! Waiting for approval.');
      } else if (user?.role === UserRole.DOCTOR) {
        // Doctor creates appointment with selected patient
        await appointments.create({
          patientId: newAppointment.patientId,
          doctorId,
          dateTime: newAppointment.dateTime,
          duration: newAppointment.duration,
          reason: newAppointment.reason,
          status: AppointmentStatus.CONFIRMED,
        });
        setMessage('Appointment created successfully!');
      }
      setShowCreateModal(false);
      setNewAppointment({ patientId: '', doctorId: '', dateTime: '', duration: 30, reason: '' });
      loadAppointments();
    } catch (err) {
      console.error('Error creating appointment:', err);
      setMessage('Error creating appointment. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'CANCELLED':
        return <XCircle className="text-red-500" size={20} />;
      case 'COMPLETED':
        return <CheckCircle className="text-blue-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const navigateCalendar = (direction: number) => {
    const newDate = new Date(currentDate);
    if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointmentsList.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const formatCalendarHeader = () => {
    if (calendarView === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else if (calendarView === 'month') {
      return currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {user?.role === UserRole.PATIENT ? 'My Consultations' : 'Appointments'}
      </h1>
      <p className="text-gray-500 mb-8">
        {user?.role === UserRole.PATIENT
          ? 'View your consultation history and upcoming appointments'
          : 'Manage your appointments and patients'}
      </p>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              viewMode === 'calendar' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <CalendarIcon size={18} />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <List size={18} />
            List
          </button>
        </div>
        {(user?.role === UserRole.DOCTOR || user?.role === UserRole.PATIENT) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            {user?.role === UserRole.PATIENT ? 'Book Appointment' : 'New Appointment'}
          </button>
        )}
      </div>

      {message && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{message}</div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <button
              onClick={() => navigateCalendar(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setCalendarView('week')}
                className={`px-3 py-1 rounded ${calendarView === 'week' ? 'bg-primary-100 text-primary-600' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarView('month')}
                className={`px-3 py-1 rounded ${calendarView === 'month' ? 'bg-primary-100 text-primary-600' : ''}`}
              >
                Month
              </button>
              <button
                onClick={() => setCalendarView('year')}
                className={`px-3 py-1 rounded ${calendarView === 'year' ? 'bg-primary-100 text-primary-600' : ''}`}
              >
                Year
              </button>
            </div>
            <span className="font-medium">{formatCalendarHeader()}</span>
            <button
              onClick={() => navigateCalendar(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {calendarView === 'week' && (
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {getWeekDays().map((day, i) => (
                    <div key={i} className="p-3 text-center border-r border-gray-100 last:border-r-0">
                      <div className="text-sm text-gray-500">
                        {day.toLocaleDateString('default', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-medium ${day.toDateString() === new Date().toDateString() ? 'bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                        {day.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {calendarView === 'week' && (
                <div className="grid grid-cols-7 min-h-[400px]">
                  {getWeekDays().map((day, i) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    return (
                      <div key={i} className="border-r border-gray-100 last:border-r-0 p-2">
                        {dayAppointments.map(apt => (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`p-2 rounded-lg mb-2 cursor-pointer text-sm ${getStatusColor(apt.status)}`}
                          >
                            <div className="font-medium">
                              {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="truncate">
                              {user?.role === UserRole.PATIENT ? (
                                <>Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}</>
                              ) : (
                                <>{apt.patient?.user?.firstName} {apt.patient?.user?.lastName}</>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {calendarView === 'month' && (
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 42 }, (_, i) => {
                      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                      const dayOfWeek = firstDay.getDay();
                      const day = i - dayOfWeek + 1;
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const dayAppointments = appointmentsList.filter(apt => 
                        new Date(apt.dateTime).toDateString() === date.toDateString()
                      );
                      
                      return (
                        <div
                          key={i}
                          className={`min-h-[80px] p-2 border rounded-lg ${date.getMonth() === currentDate.getMonth() ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                          {dayAppointments.slice(0, 3).map(apt => (
                            <div
                              key={apt.id}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`text-xs p-1 rounded mb-1 cursor-pointer truncate ${getStatusColor(apt.status)}`}
                            >
                              {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {
                                user?.role === UserRole.PATIENT
                                  ? `Dr. ${apt.doctor?.user?.firstName}`
                                  : apt.patient?.user?.firstName
                              }
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-500">+{dayAppointments.length - 3} more</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {calendarView === 'year' && (
                <div className="p-4 grid grid-cols-4 gap-4">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthAppointments = appointmentsList.filter(apt => 
                      new Date(apt.dateTime).getMonth() === i &&
                      new Date(apt.dateTime).getFullYear() === currentDate.getFullYear()
                    );
                    return (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="font-medium mb-2">
                          {new Date(currentDate.getFullYear(), i, 1).toLocaleDateString('default', { month: 'long' })}
                        </div>
                        <div className="text-2xl font-bold text-primary-600">{monthAppointments.length}</div>
                        <div className="text-sm text-gray-500">appointments</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {appointmentsList.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
              {user?.role === UserRole.PATIENT ? 'No consultations found' : 'No appointments found'}
            </div>
          ) : (
            appointmentsList.map((apt) => (
              <div
                key={apt.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                  user?.role === UserRole.PATIENT
                    ? apt.status === AppointmentStatus.COMPLETED
                      ? 'border-blue-200'
                      : apt.status === AppointmentStatus.CONFIRMED
                      ? 'border-green-200'
                      : 'border-gray-200'
                    : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(apt.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            apt.status
                          )}`}
                        >
                          {apt.status}
                        </span>
                        {user?.role === UserRole.PATIENT && (
                          <span className="text-xs text-gray-500">
                            {new Date(apt.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {user?.role === UserRole.PATIENT ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary-100 p-2 rounded-lg">
                              <User className="text-primary-600" size={20} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                              </h3>
                              <p className="text-sm text-primary-600 font-medium">{apt.doctor?.specialty}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <CalendarIcon size={16} className="text-gray-400" />
                              <span>{new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock size={16} className="text-gray-400" />
                              <span>{apt.duration} minutes</span>
                            </div>
                          </div>

                          {apt.reason && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-medium text-gray-700 mb-1">Consultation Reason</p>
                              <p className="text-sm text-gray-900">{apt.reason}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                          </h3>
                          {user?.role === UserRole.ADMIN && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Doctor:</span> Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span>
                              {new Date(apt.dateTime).toLocaleDateString()} at{' '}
                              {new Date(apt.dateTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>{apt.duration} minutes</span>
                          </div>

                          {apt.reason && (
                            <p className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Reason:</span> {apt.reason}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {user?.role === UserRole.PATIENT ? (
                      <>
                        <button
                          onClick={() => setSelectedAppointment(apt)}
                          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium whitespace-nowrap"
                        >
                          View Full Details
                        </button>
                        {apt.status === AppointmentStatus.PENDING && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setReason(apt.reason || '');
                              setIsEditingReason(true);
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                          >
                            Update Reason
                          </button>
                        )}
                        {(apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.CONFIRMED) && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {apt.status === AppointmentStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleApprove(apt.id)}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleCancel(apt.id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {(apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.CONFIRMED) && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setNotes(apt.notes || '');
                              setMedications(apt.medications || '');
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Update
                          </button>
                        )}

                        {apt.status === AppointmentStatus.CONFIRMED && (
                          <button
                            onClick={() => handleStatusUpdate(apt.id, AppointmentStatus.COMPLETED)}
                            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

                {/* Medical Information for Patients - Shown in List */}
                {user?.role === UserRole.PATIENT && (apt.notes || apt.medications) && (
                  <div className="px-6 pb-6 pt-4 border-t border-gray-200 space-y-3">
                    {apt.notes && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1.5 uppercase tracking-wide">Doctor's Notes</p>
                        <p className="text-sm text-blue-800 leading-relaxed">{apt.notes}</p>
                      </div>
                    )}
                    {apt.medications && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-900 mb-1.5 uppercase tracking-wide">Prescribed Medications</p>
                        <p className="text-sm text-green-800 leading-relaxed">{apt.medications}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Medical Information for Doctor/Admin */}
                {user?.role !== UserRole.PATIENT && (apt.notes || apt.medications) && (
                  <div className="px-6 pb-6 pt-4 border-t border-gray-200 space-y-2">
                    {apt.notes && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {apt.notes}
                      </p>
                    )}
                    {apt.medications && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Medications:</span> {apt.medications}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.role === UserRole.PATIENT ? 'Consultation Details' : 'Appointment Details'}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                {selectedAppointment.status}
              </span>
            </div>

            {user?.role === UserRole.PATIENT ? (
              <div className="space-y-4">
                {/* Doctor Information */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg border border-primary-200">
                  <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                    <User size={18} />
                    Doctor Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-900">
                      <span className="font-medium">Name:</span> Dr. {selectedAppointment.doctor?.user?.firstName} {selectedAppointment.doctor?.user?.lastName}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Specialty:</span> {selectedAppointment.doctor?.specialty}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Phone:</span> {selectedAppointment.doctor?.user?.phone}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Address:</span> {selectedAppointment.doctor?.address}
                    </p>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CalendarIcon size={18} />
                    Appointment Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-900">
                      <span className="font-medium">Date:</span> {new Date(selectedAppointment.dateTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Time:</span> {new Date(selectedAppointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Duration:</span> {selectedAppointment.duration} minutes
                    </p>
                    {isEditingReason ? (
                      <div>
                        <label className="block font-medium text-gray-900 mb-1">Reason:</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={3}
                          placeholder="Enter the reason for your appointment..."
                        />
                      </div>
                    ) : selectedAppointment.reason ? (
                      <p className="text-gray-900">
                        <span className="font-medium">Reason:</span> {selectedAppointment.reason}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Doctor's Notes */}
                {selectedAppointment.notes && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Doctor's Notes</h3>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Medications */}
                {selectedAppointment.medications && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">Prescribed Medications</h3>
                    <p className="text-sm text-green-800 whitespace-pre-wrap">{selectedAppointment.medications}</p>
                  </div>
                )}

                {/* Approval Status for Pending */}
                {selectedAppointment.status === AppointmentStatus.PENDING && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-2">Approval Status</h3>
                    <div className="space-y-1 text-sm text-yellow-800">
                      <p>✓ Doctor Approval: {selectedAppointment.doctorApproved ? '✅ Approved' : '⏳ Pending'}</p>
                      <p>✓ Admin Approval: {selectedAppointment.adminApproved ? '✅ Approved' : '⏳ Pending'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 space-y-2">
                <p><span className="font-medium">Patient:</span> {selectedAppointment.patient?.user?.firstName} {selectedAppointment.patient?.user?.lastName}</p>
                {user?.role === UserRole.ADMIN && (
                  <p><span className="font-medium">Doctor:</span> Dr. {selectedAppointment.doctor?.user?.firstName} {selectedAppointment.doctor?.user?.lastName}</p>
                )}
                <p><span className="font-medium">Date:</span> {new Date(selectedAppointment.dateTime).toLocaleDateString()}</p>
                <p><span className="font-medium">Time:</span> {new Date(selectedAppointment.dateTime).toLocaleTimeString()}</p>
                <p><span className="font-medium">Duration:</span> {selectedAppointment.duration} minutes</p>
                {selectedAppointment.reason && <p><span className="font-medium">Reason:</span> {selectedAppointment.reason}</p>}
              </div>
            )}

            {user?.role !== UserRole.PATIENT && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    rows={3}
                    placeholder="Add notes about the appointment..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medications
                  </label>
                  <textarea
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    rows={2}
                    placeholder="Prescribe medications..."
                  />
                </div>
              </>
            )}

            {user?.role === UserRole.PATIENT && selectedAppointment.notes && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Notes
                </label>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">{selectedAppointment.notes}</p>
              </div>
            )}

            {user?.role === UserRole.PATIENT && selectedAppointment.medications && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medications
                </label>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">{selectedAppointment.medications}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {user?.role === UserRole.PATIENT ? (
                <>
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setNotes('');
                      setMedications('');
                      setReason('');
                      setIsEditingReason(false);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                  {isEditingReason && (
                    <button
                      onClick={() => handleUpdateReason(selectedAppointment.id)}
                      className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                    >
                      Save Reason
                    </button>
                  )}
                  {!isEditingReason && (selectedAppointment.status === AppointmentStatus.PENDING || selectedAppointment.status === AppointmentStatus.CONFIRMED) && (
                    <button
                      onClick={() => {
                        handleCancel(selectedAppointment.id);
                        setSelectedAppointment(null);
                      }}
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setNotes('');
                      setMedications('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, selectedAppointment.status)}
                    className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {user?.role === UserRole.PATIENT ? 'Book New Appointment' : 'Schedule New Appointment'}
            </h2>

            {user?.role === UserRole.PATIENT ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor
                </label>
                <select
                  value={newAppointment.doctorId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                >
                  <option value="">Select a doctor</option>
                  {doctorList.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user.firstName} {doctor.user.lastName} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient
                </label>
                <select
                  value={newAppointment.patientId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                >
                  <option value="">Select a patient</option>
                  {patientList.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user.firstName} {patient.user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={newAppointment.dateTime}
                onChange={(e) => setNewAppointment({ ...newAppointment, dateTime: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                value={newAppointment.duration}
                onChange={(e) => setNewAppointment({ ...newAppointment, duration: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-200 rounded-lg"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                value={newAppointment.reason}
                onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg"
                rows={3}
                placeholder="Reason for the appointment..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewAppointment({ patientId: '', doctorId: '', dateTime: '', duration: 30, reason: '' });
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={
                  (user?.role === UserRole.PATIENT && (!newAppointment.doctorId || !newAppointment.dateTime)) ||
                  (user?.role === UserRole.DOCTOR && (!newAppointment.patientId || !newAppointment.dateTime))
                }
                className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {user?.role === UserRole.PATIENT ? 'Book Appointment' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
