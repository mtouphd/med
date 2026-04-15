'use client';

import { useState } from 'react';
import { MapPin, Clock, Heart, Calendar } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { Doctor } from '@/types';
import { ViewMode } from './ViewToggle';

interface DoctorCardProps {
  doctor: Doctor;
  viewMode: ViewMode;
  onBookAppointment: (doctor: Doctor) => void;
  onRequestFamilyDoctor: (doctorId: string) => void;
  isRequesting?: boolean;
}

export default function DoctorCard({
  doctor,
  viewMode,
  onBookAppointment,
  onRequestFamilyDoctor,
  isRequesting = false,
}: DoctorCardProps) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  // Box view - 3D card
  if (viewMode === 'box') {
    return (
      <div
        className="card-3d-wrapper perspective-1000"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`card-3d bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden transition-all duration-500 ${
            isHovered ? 'card-3d-hover' : ''
          }`}
          style={{
            transform: isHovered
              ? 'rotateY(-5deg) rotateX(5deg) translateZ(20px)'
              : 'rotateY(0) rotateX(0) translateZ(0)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Gradient header */}
          <div className="h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-cyan-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 40%)'
              }}></div>
            </div>
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white transition-transform duration-500"
              style={{
                transform: isHovered ? 'translateZ(30px) scale(1.1)' : 'translateZ(0) scale(1)',
              }}
            >
              <span className="text-primary-600 font-bold text-xl">
                {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="pt-14 pb-6 px-6 text-center">
            <h3 className="font-bold text-lg text-midnight-900 mb-1">
              Dr. {doctor.user?.firstName} {doctor.user?.lastName}
            </h3>
            <p className="text-primary-600 font-medium text-sm mb-3">{doctor.specialty}</p>

            {(doctor.city || doctor.street) && (
              <p className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-3">
                <MapPin size={12} />
                {[doctor.street, doctor.postalCode, doctor.city].filter(Boolean).join(', ')}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 mb-4 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock size={12} />
                {doctor.consultationDuration} min
              </span>
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  doctor.isAvailable
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    doctor.isAvailable ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                {doctor.isAvailable ? t('doctors.available') : t('doctors.unavailable')}
              </span>
            </div>

            {doctor.bio && (
              <p className="text-slate-600 text-xs line-clamp-2 mb-4">{doctor.bio}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onBookAppointment(doctor)}
                disabled={!doctor.isAvailable}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Calendar size={14} />
                {t('appointments.book')}
              </button>
              <button
                onClick={() => onRequestFamilyDoctor(doctor.id)}
                disabled={isRequesting}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50 text-xs font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Heart size={14} />
              </button>
            </div>
          </div>

          {/* 3D shadow effect */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
            style={{
              background: isHovered
                ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
                : 'transparent',
            }}
          ></div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all hover:border-primary-200">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white font-semibold text-lg">
            {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-midnight-900">
            Dr. {doctor.user?.firstName} {doctor.user?.lastName}
          </h3>
          <p className="text-primary-600 text-sm">{doctor.specialty}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {doctor.city && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                <span className="truncate max-w-[150px]">{[doctor.city, doctor.province].filter(Boolean).join(', ')}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {doctor.consultationDuration} min
            </span>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              doctor.isAvailable
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                doctor.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            ></span>
            {doctor.isAvailable ? t('doctors.available') : t('doctors.unavailable')}
          </span>

          <button
            onClick={() => onBookAppointment(doctor)}
            disabled={!doctor.isAvailable}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
          >
            <Calendar size={14} />
            <span className="hidden md:inline">{t('appointments.book')}</span>
          </button>

          <button
            onClick={() => onRequestFamilyDoctor(doctor.id)}
            disabled={isRequesting}
            className="flex items-center justify-center p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all disabled:opacity-50"
            title={t('doctors.requestFamily')}
          >
            <Heart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
