'use client';

import { useEffect, useState } from 'react';
import { appointments, familyDoctorRequests } from '@/lib/api';
import { Appointment, FamilyDoctorRequest, FamilyDoctorRequestStatus, AppointmentStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Calendar, Heart, CheckCircle, XCircle, User, Clock, FileText, AlertCircle } from 'lucide-react';

type TabType = 'appointments' | 'familyDoctor';

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('appointments');
  const [appointmentRequests, setAppointmentRequests] = useState<Appointment[]>([]);
  const [familyDoctorRequestsList, setFamilyDoctorRequestsList] = useState<FamilyDoctorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedFDRequest, setSelectedFDRequest] = useState<FamilyDoctorRequest | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showFDModal, setShowFDModal] = useState(false);
  const [responseReason, setResponseReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, fdRequestsRes] = await Promise.all([
        appointments.getPendingDoctor(),
        familyDoctorRequests.getMyDoctorRequests(),
      ]);
      setAppointmentRequests(appointmentsRes.data);
      setFamilyDoctorRequestsList(fdRequestsRes.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Appointment handlers
  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      setProcessing(true);
      await appointments.approveByDoctor(appointmentId);
      await loadData();
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error approving appointment:', error);
      alert('Failed to approve appointment');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectAppointment = async (appointmentId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await appointments.rejectByDoctor(appointmentId, reason);
      await loadData();
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
      setResponseReason('');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Failed to reject appointment');
    } finally {
      setProcessing(false);
    }
  };

  // Family doctor request handlers
  const handleApproveFDRequest = async (requestId: string, reason?: string) => {
    try {
      setProcessing(true);
      await familyDoctorRequests.approveByDoctor(requestId, reason);
      await loadData();
      setShowFDModal(false);
      setSelectedFDRequest(null);
      setResponseReason('');
    } catch (error: any) {
      console.error('Error approving family doctor request:', error);
      alert(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectFDRequest = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await familyDoctorRequests.rejectByDoctor(requestId, reason);
      await loadData();
      setShowFDModal(false);
      setSelectedFDRequest(null);
      setResponseReason('');
    } catch (error) {
      console.error('Error rejecting family doctor request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const pendingAppointmentsCount = appointmentRequests.length;
  const pendingFDRequestsCount = familyDoctorRequestsList.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
          <p className="text-gray-600 mt-1">Manage appointment and family doctor requests</p>
        </div>
        {(pendingAppointmentsCount > 0 || pendingFDRequestsCount > 0) && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <span className="text-yellow-900 font-semibold">
              {pendingAppointmentsCount + pendingFDRequestsCount} Pending Request
              {pendingAppointmentsCount + pendingFDRequestsCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar size={18} />
            Appointment Requests
            {pendingAppointmentsCount > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                {pendingAppointmentsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('familyDoctor')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'familyDoctor'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart size={18} />
            Family Doctor Requests
            {pendingFDRequestsCount > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                {pendingFDRequestsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Appointment Requests Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointmentRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Appointments</h3>
              <p className="text-gray-600">All appointment requests have been processed</p>
            </div>
          ) : (
            appointmentRequests.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-200 transition-all p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {appointment.patient?.user.firstName} {appointment.patient?.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{appointment.patient?.user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="text-sm">
                          {new Date(appointment.dateTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-sm">
                          {new Date(appointment.dateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {appointment.reason && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={16} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Reason</span>
                        </div>
                        <p className="text-gray-900 text-sm">{appointment.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowAppointmentModal(true);
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleApproveAppointment(appointment.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowAppointmentModal(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Family Doctor Requests Tab */}
      {activeTab === 'familyDoctor' && (
        <div className="space-y-4">
          {familyDoctorRequestsList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-600">All family doctor requests have been processed</p>
            </div>
          ) : (
            familyDoctorRequestsList.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-200 transition-all p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Heart className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {request.patient?.user.firstName} {request.patient?.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{request.patient?.user.email}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      Requested on: {new Date(request.requestedAt).toLocaleDateString()}
                    </div>

                    {request.requestReason && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={16} className="text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Patient's Reason</span>
                        </div>
                        <p className="text-purple-900 text-sm">{request.requestReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedFDRequest(request);
                        setShowFDModal(true);
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleApproveFDRequest(request.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFDRequest(request);
                        setShowFDModal(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Appointment Details Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
          setResponseReason('');
        }}
        title="Appointment Request Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Patient Information</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-blue-700 font-medium">Name:</span>{' '}
                  <span className="text-blue-900">
                    {selectedAppointment.patient?.user.firstName} {selectedAppointment.patient?.user.lastName}
                  </span>
                </p>
                <p>
                  <span className="text-blue-700 font-medium">Email:</span>{' '}
                  <span className="text-blue-900">{selectedAppointment.patient?.user.email}</span>
                </p>
                {selectedAppointment.patient?.user.phone && (
                  <p>
                    <span className="text-blue-700 font-medium">Phone:</span>{' '}
                    <span className="text-blue-900">{selectedAppointment.patient.user.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-700 font-medium">Date:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(selectedAppointment.dateTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </p>
                <p>
                  <span className="text-gray-700 font-medium">Time:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(selectedAppointment.dateTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
                <p>
                  <span className="text-gray-700 font-medium">Duration:</span>{' '}
                  <span className="text-gray-900">{selectedAppointment.duration} minutes</span>
                </p>
              </div>
            </div>

            {selectedAppointment.reason && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">Reason for Visit</h4>
                <p className="text-yellow-900 text-sm">{selectedAppointment.reason}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Note (optional for approval, required for rejection)
              </label>
              <textarea
                value={responseReason}
                onChange={(e) => setResponseReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Add a note about your decision..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApproveAppointment(selectedAppointment.id)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={20} />
                {processing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleRejectAppointment(selectedAppointment.id, responseReason)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <XCircle size={20} />
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Family Doctor Request Details Modal */}
      <Modal
        isOpen={showFDModal}
        onClose={() => {
          setShowFDModal(false);
          setSelectedFDRequest(null);
          setResponseReason('');
        }}
        title="Family Doctor Request Details"
        size="lg"
      >
        {selectedFDRequest && (
          <div className="space-y-6">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">Patient Information</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-purple-700 font-medium">Name:</span>{' '}
                  <span className="text-purple-900">
                    {selectedFDRequest.patient?.user.firstName} {selectedFDRequest.patient?.user.lastName}
                  </span>
                </p>
                <p>
                  <span className="text-purple-700 font-medium">Email:</span>{' '}
                  <span className="text-purple-900">{selectedFDRequest.patient?.user.email}</span>
                </p>
                {selectedFDRequest.patient?.user.phone && (
                  <p>
                    <span className="text-purple-700 font-medium">Phone:</span>{' '}
                    <span className="text-purple-900">{selectedFDRequest.patient.user.phone}</span>
                  </p>
                )}
                {selectedFDRequest.patient?.address && (
                  <p>
                    <span className="text-purple-700 font-medium">Address:</span>{' '}
                    <span className="text-purple-900">{selectedFDRequest.patient.address}</span>
                  </p>
                )}
              </div>
            </div>

            {selectedFDRequest.requestReason && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Patient's Reason</h4>
                <p className="text-gray-700">{selectedFDRequest.requestReason}</p>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> By approving this request, {selectedFDRequest.patient?.user.firstName}{' '}
                {selectedFDRequest.patient?.user.lastName} will become your family patient, and you'll have ongoing
                access to their medical records.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Note (optional for approval, required for rejection)
              </label>
              <textarea
                value={responseReason}
                onChange={(e) => setResponseReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Add a note about your decision..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApproveFDRequest(selectedFDRequest.id, responseReason)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={20} />
                {processing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleRejectFDRequest(selectedFDRequest.id, responseReason)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <XCircle size={20} />
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
