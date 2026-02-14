'use client';

import { useEffect, useState } from 'react';
import { doctors, appointments } from '@/lib/api';
import { Doctor, Appointment, UserRole, AvailabilityCheck } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function DoctorsPage() {
  const { user } = useAuth();
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await doctors.getAll();
      setDoctorsList(res.data.filter((d: Doctor) => d.isAvailable));
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const checkAvailability = async () => {
    if (!selectedDoctor || !bookingDate || !bookingTime) return;
    
    setCheckingAvailability(true);
    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`);
      const res = await appointments.checkAvailability(
        selectedDoctor.id,
        dateTime.toISOString(),
        selectedDoctor.consultationDuration
      );
      setAvailability(res.data);
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (bookingDate && bookingTime) {
      checkAvailability();
    } else {
      setAvailability(null);
    }
  }, [bookingDate, bookingTime]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedDoctor || !bookingDate || !bookingTime) {
      setError('Please fill in all fields');
      return;
    }

    if (availability && !availability.available) {
      setError(availability.reason || 'This time slot is not available');
      return;
    }

    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`);
      await appointments.create({
        doctorId: selectedDoctor.id,
        dateTime: dateTime.toISOString(),
        reason,
        duration: selectedDoctor.consultationDuration,
      });
      setMessage('Appointment booked successfully! It is now pending approval.');
      setSelectedDoctor(null);
      setBookingDate('');
      setBookingTime('');
      setReason('');
      setAvailability(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setBookingDate('');
    setBookingTime('');
    setReason('');
    setAvailability(null);
    setError('');
    setMessage('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctors</h1>
      <p className="text-gray-500 mb-8">Find and book appointments with our doctors</p>

      {message && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{message}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctorsList.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-xl font-bold">
                  {doctor.user.firstName[0]}
                  {doctor.user.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Dr. {doctor.user.firstName} {doctor.user.lastName}
                </h3>
                <p className="text-sm text-gray-500">{doctor.specialty}</p>
              </div>
            </div>

            {doctor.bio && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{doctor.bio}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {doctor.consultationDuration} min consultation
              </span>
              {user?.role === UserRole.PATIENT && (
                <button
                  onClick={() => setSelectedDoctor(doctor)}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Book Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Book with Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Specialty: {selectedDoctor.specialty} | Duration: {selectedDoctor.consultationDuration} min
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setAvailability(null);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select
                  value={bookingTime}
                  onChange={(e) => {
                    setBookingTime(e.target.value);
                    setAvailability(null);
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  required
                >
                  <option value="">Select a time</option>
                  {Array.from({ length: 20 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 8;
                    const minute = (i % 2) * 30;
                    if (hour >= 18) return null;
                    return (
                      <option key={i} value={`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}>
                        {`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {availability && (
                <div className={`p-3 rounded-lg ${availability.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {availability.available ? '✓ Time slot is available' : `✗ ${availability.reason}`}
                </div>
              )}

              {checkingAvailability && (
                <div className="text-sm text-gray-500">Checking availability...</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Visit
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  rows={3}
                  placeholder="Describe your symptoms..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!availability?.available || checkingAvailability}
                  className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
