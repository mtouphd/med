'use client';

import { useEffect, useState } from 'react';
import { appointments, doctors } from '@/lib/api';
import { Appointment, AppointmentStatus, Doctor, UserRole } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle, XCircle, Clock, Calendar as CalendarIcon, List } from 'lucide-react';

type ViewMode = 'calendar' | 'list';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState('');
  const [message, setMessage] = useState('');
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctorId, setDoctorId] = useState<string>('');

  useEffect(() => {
    loadDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadAppointments();
    }
  }, [doctorId, currentDate, calendarView]);

  const loadDoctorId = async () => {
    if (user?.role === UserRole.DOCTOR) {
      try {
        const res = await doctors.getAll();
        const doctor = res.data.find((d: Doctor) => d.userId === user.id);
        if (doctor) {
          setDoctorId(doctor.id);
        }
      } catch (err) {
        console.error('Error loading doctor:', err);
      }
    }
  };

  const loadAppointments = async () => {
    try {
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

  const handleApprove = async (id: string) => {
    try {
      await appointments.approve(id);
      setMessage('Appointment approved successfully!');
      loadAppointments();
    } catch (err) {
      console.error('Error approving appointment:', err);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointments</h1>
      <p className="text-gray-500 mb-8">Manage your appointments and patients</p>

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
                              {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
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
                              {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {apt.patient?.user?.firstName}
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
              No appointments found
            </div>
          ) : (
            appointmentsList.map((apt) => (
              <div
                key={apt.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(apt.status)}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-lg">
                      {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                    </h3>

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

                    {apt.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {apt.notes}
                      </p>
                    )}

                    {apt.medications && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Medications:</span> {apt.medications}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Appointment Details
            </h2>

            <div className="mb-4 space-y-2">
              <p><span className="font-medium">Patient:</span> {selectedAppointment.patient?.user?.firstName} {selectedAppointment.patient?.user?.lastName}</p>
              <p><span className="font-medium">Date:</span> {new Date(selectedAppointment.dateTime).toLocaleDateString()}</p>
              <p><span className="font-medium">Time:</span> {new Date(selectedAppointment.dateTime).toLocaleTimeString()}</p>
              <p><span className="font-medium">Duration:</span> {selectedAppointment.duration} minutes</p>
              <p><span className="font-medium">Status:</span> {selectedAppointment.status}</p>
              {selectedAppointment.reason && <p><span className="font-medium">Reason:</span> {selectedAppointment.reason}</p>}
            </div>

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

            <div className="flex gap-3">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
