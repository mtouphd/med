'use client';

import { useEffect, useState } from 'react';
import { doctors, appointments, familyDoctorRequests, patients } from '@/lib/api';
import { Doctor, Appointment, UserRole, AvailabilityCheck, FamilyDoctorRequest, FamilyDoctorRequestStatus, Patient } from '@/types';
import { useAuth } from '@/lib/auth-context';
import Badge from '@/components/ui/Badge';
import { Users, Calendar, Heart } from 'lucide-react';

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
  const [myRequests, setMyRequests] = useState<FamilyDoctorRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDoctor, setRequestDoctor] = useState<Doctor | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadDoctors();
    if (user?.role === UserRole.PATIENT) {
      loadMyRequests();
      loadCurrentPatient();
    }
  }, [user]);

  const loadDoctors = async () => {
    try {
      const res = await doctors.getAll();
      setDoctorsList(res.data.filter((d: Doctor) => d.isAvailable));
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const loadMyRequests = async () => {
    try {
      const res = await familyDoctorRequests.getMy();
      setMyRequests(res.data);
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  };

  const loadCurrentPatient = async () => {
    try {
      const res = await patients.getMyProfile();
      setCurrentPatient(res.data);
    } catch (err) {
      console.error('Error loading patient profile:', err);
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

  const handleRequestFamilyDoctor = async (doctor: Doctor) => {
    // Check if already has pending request for this doctor
    const hasPendingRequest = myRequests.some(
      (req) =>
        req.doctorId === doctor.id &&
        req.status === FamilyDoctorRequestStatus.PENDING
    );

    if (hasPendingRequest) {
      setError('You already have a pending request for this doctor');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check if this doctor is already the family doctor
    if (currentPatient?.familyDoctorId === doctor.id) {
      setError('This doctor is already your family doctor');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setRequestDoctor(doctor);
    setShowRequestModal(true);
  };

  const submitFamilyDoctorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDoctor) return;

    try {
      await familyDoctorRequests.create({
        doctorId: requestDoctor.id,
        requestReason: requestReason,
      });
      setMessage('Family doctor request submitted successfully!');
      setShowRequestModal(false);
      setRequestDoctor(null);
      setRequestReason('');
      await loadMyRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const getRequestStatus = (doctorId: string) => {
    const request = myRequests.find((r) => r.doctorId === doctorId);
    return request;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctors</h1>
        <p className="text-gray-500">Find and book appointments with our doctors</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg">{message}</div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* My Family Doctor Requests Section - Only for Patients */}
      {user?.role === UserRole.PATIENT && myRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="text-primary-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">My Family Doctor Requests</h2>
          </div>
          <div className="space-y-3">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Dr. {request.doctor?.user.firstName} {request.doctor?.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{request.doctor?.specialty}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested: {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                  {request.responseReason && request.status !== FamilyDoctorRequestStatus.PENDING && (
                    <p className="text-sm text-gray-700 mt-2 italic">{request.responseReason}</p>
                  )}
                </div>
                <Badge
                  variant={
                    request.status === FamilyDoctorRequestStatus.APPROVED
                      ? 'success'
                      : request.status === FamilyDoctorRequestStatus.REJECTED
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {doctor.consultationDuration} min consultation
                </span>
              </div>

              {user?.role === UserRole.PATIENT && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDoctor(doctor)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                  >
                    <Calendar size={16} />
                    Book Now
                  </button>
                  {(() => {
                    const requestStatus = getRequestStatus(doctor.id);
                    const isCurrentFamilyDoctor = currentPatient?.familyDoctorId === doctor.id;

                    if (isCurrentFamilyDoctor) {
                      return (
                        <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 text-sm">
                          <Heart size={16} className="fill-current" />
                          My Doctor
                        </div>
                      );
                    } else if (requestStatus) {
                      return (
                        <Badge
                          variant={
                            requestStatus.status === FamilyDoctorRequestStatus.APPROVED
                              ? 'success'
                              : requestStatus.status === FamilyDoctorRequestStatus.REJECTED
                              ? 'danger'
                              : 'warning'
                          }
                          className="flex-1"
                        >
                          {requestStatus.status}
                        </Badge>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => handleRequestFamilyDoctor(doctor)}
                          className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 text-sm"
                        >
                          <Users size={16} />
                          Request
                        </button>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Family Doctor Request Modal */}
      {showRequestModal && requestDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Request Dr. {requestDoctor.user.firstName} {requestDoctor.user.lastName} as Family Doctor
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Your family doctor will have ongoing access to your medical records and can provide continuous care.
            </p>

            <form onSubmit={submitFamilyDoctorRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Request (Optional)
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  rows={3}
                  placeholder="Why would you like this doctor as your family doctor?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestDoctor(null);
                    setRequestReason('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
