'use client';

import { useEffect, useState } from 'react';
import { familyDoctorRequests, patients as patientsApi } from '@/lib/api';
import { FamilyDoctorRequest, FamilyDoctorRequestStatus } from '@/types';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { User, Stethoscope, Calendar, FileText, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';

export default function FamilyDoctorRequestsPage() {
  const [requestsList, setRequestsList] = useState<FamilyDoctorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<FamilyDoctorRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [responseReason, setResponseReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await familyDoctorRequests.getAll();
      setRequestsList(res.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, reason?: string) => {
    try {
      setProcessingAction(true);
      await familyDoctorRequests.approve(requestId, reason);
      await loadRequests();
      setShowModal(false);
      setResponseReason('');
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingAction(true);
      await familyDoctorRequests.reject(requestId, reason);
      await loadRequests();
      setShowModal(false);
      setResponseReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewDetails = (request: FamilyDoctorRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
    setResponseReason('');
  };

  const getStatusBadgeVariant = (status: FamilyDoctorRequestStatus) => {
    switch (status) {
      case FamilyDoctorRequestStatus.PENDING:
        return 'warning';
      case FamilyDoctorRequestStatus.APPROVED:
        return 'success';
      case FamilyDoctorRequestStatus.REJECTED:
        return 'danger';
      default:
        return 'default';
    }
  };

  const filteredRequests =
    filter === 'pending'
      ? requestsList.filter((r) => r.status === FamilyDoctorRequestStatus.PENDING)
      : requestsList;

  const pendingCount = requestsList.filter(
    (r) => r.status === FamilyDoctorRequestStatus.PENDING
  ).length;

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
          <h1 className="text-3xl font-bold text-gray-900">Family Doctor Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage patient requests for family doctors</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <span className="text-yellow-900 font-semibold">{pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Requests ({requestsList.length})
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'pending' ? 'No Pending Requests' : 'No Requests Yet'}
          </h3>
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'All family doctor requests have been processed'
              : 'Family doctor requests will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-primary-200 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Patient Info */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="text-blue-600" size={20} />
                      <h4 className="font-semibold text-blue-900">Patient</h4>
                    </div>
                    <p className="font-medium text-blue-900">
                      {request.patient?.user.firstName} {request.patient?.user.lastName}
                    </p>
                    <p className="text-sm text-blue-700">{request.patient?.user.email}</p>
                    {request.patient?.user.phone && (
                      <p className="text-sm text-blue-700">{request.patient.user.phone}</p>
                    )}
                  </div>

                  {/* Doctor Info */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="text-green-600" size={20} />
                      <h4 className="font-semibold text-green-900">Requested Doctor</h4>
                    </div>
                    <p className="font-medium text-green-900">
                      Dr. {request.doctor?.user.firstName} {request.doctor?.user.lastName}
                    </p>
                    <p className="text-sm text-green-700">{request.doctor?.specialty}</p>
                    {request.doctor?.maxFamilyPatients && (
                      <p className="text-sm text-green-700 mt-1">
                        Max Capacity: {request.doctor.maxFamilyPatients} patients
                      </p>
                    )}
                  </div>
                </div>

                {request.requestReason && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="text-gray-600" size={16} />
                      <span className="text-sm font-semibold text-gray-700">Request Reason</span>
                    </div>
                    <p className="text-gray-900">{request.requestReason}</p>
                  </div>
                )}

                {request.status !== FamilyDoctorRequestStatus.PENDING && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {request.status === FamilyDoctorRequestStatus.APPROVED ? 'Approved' : 'Rejected'} on{' '}
                        {request.respondedAt && new Date(request.respondedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {request.responseReason && (
                      <p className="text-gray-900 text-sm">{request.responseReason}</p>
                    )}
                  </div>
                )}

                {request.status === FamilyDoctorRequestStatus.PENDING && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FileText size={18} />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Approve this request without a note?')) {
                          handleApprove(request.id);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle size={18} />
                      Quick Approve
                    </button>
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Family Doctor Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Patient Details */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Patient Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Name:</span>
                  <p className="text-blue-900">
                    {selectedRequest.patient?.user.firstName} {selectedRequest.patient?.user.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Email:</span>
                  <p className="text-blue-900">{selectedRequest.patient?.user.email}</p>
                </div>
                {selectedRequest.patient?.user.phone && (
                  <div>
                    <span className="text-blue-700 font-medium">Phone:</span>
                    <p className="text-blue-900">{selectedRequest.patient.user.phone}</p>
                  </div>
                )}
                {selectedRequest.patient?.address && (
                  <div className="col-span-2">
                    <span className="text-blue-700 font-medium">Address:</span>
                    <p className="text-blue-900">{selectedRequest.patient.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Family Doctor */}
            {selectedRequest.patient?.familyDoctor ? (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-yellow-600" size={18} />
                  <h4 className="font-semibold text-yellow-900">Current Family Doctor</h4>
                </div>
                <p className="text-yellow-900">
                  Dr. {selectedRequest.patient.familyDoctor.user.firstName}{' '}
                  {selectedRequest.patient.familyDoctor.user.lastName}
                </p>
                <p className="text-sm text-yellow-700">
                  {selectedRequest.patient.familyDoctor.specialty}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600 text-sm">Patient has no current family doctor</p>
              </div>
            )}

            {/* Requested Doctor Details */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">Requested Family Doctor</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Name:</span>
                  <p className="text-green-900">
                    Dr. {selectedRequest.doctor?.user.firstName} {selectedRequest.doctor?.user.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Specialty:</span>
                  <p className="text-green-900">{selectedRequest.doctor?.specialty}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">License:</span>
                  <p className="text-green-900">{selectedRequest.doctor?.licenseNumber}</p>
                </div>
                {selectedRequest.doctor?.maxFamilyPatients && (
                  <div>
                    <span className="text-green-700 font-medium">Max Patients:</span>
                    <p className="text-green-900">{selectedRequest.doctor.maxFamilyPatients}</p>
                  </div>
                )}
                {selectedRequest.doctor?.address && (
                  <div className="col-span-2">
                    <span className="text-green-700 font-medium">Office:</span>
                    <p className="text-green-900">{selectedRequest.doctor.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Request Reason */}
            {selectedRequest.requestReason && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Patient's Reason</h4>
                <p className="text-gray-700">{selectedRequest.requestReason}</p>
              </div>
            )}

            {/* Action Buttons for Pending Requests */}
            {selectedRequest.status === FamilyDoctorRequestStatus.PENDING && (
              <div className="space-y-4">
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
                    onClick={() => handleApprove(selectedRequest.id, responseReason)}
                    disabled={processingAction}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={20} />
                    {processingAction ? 'Processing...' : 'Approve Request'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id, responseReason)}
                    disabled={processingAction}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={20} />
                    {processingAction ? 'Processing...' : 'Reject Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
