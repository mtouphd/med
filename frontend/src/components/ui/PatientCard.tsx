'use client';

import { useState } from 'react';
import { User, Mail, Phone, Heart, Pill, AlertTriangle, Syringe, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { Patient, MedicalRecordSummary } from '@/types';
import { ViewMode } from './ViewToggle';

interface PatientWithSummary extends Patient {
  medicalSummary?: MedicalRecordSummary;
}

interface PatientCardProps {
  patient: PatientWithSummary;
  viewMode: ViewMode;
  isSelected?: boolean;
  onSelect: (patient: PatientWithSummary) => void;
}

export default function PatientCard({
  patient,
  viewMode,
  isSelected = false,
  onSelect,
}: PatientCardProps) {
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
        <button
          onClick={() => onSelect(patient)}
          className={`card-3d w-full text-start bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-500 ${
            isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-slate-100'
          } ${isHovered ? 'card-3d-hover' : ''}`}
          style={{
            transform: isHovered
              ? 'rotateY(5deg) rotateX(-5deg) translateZ(20px)'
              : 'rotateY(0) rotateX(0) translateZ(0)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Gradient header */}
          <div className="h-20 bg-gradient-to-br from-cyan-500 via-primary-500 to-primary-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.3) 0%, transparent 35%)'
              }}></div>
            </div>
            <div
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-white transition-transform duration-500"
              style={{
                transform: isHovered ? 'translateZ(25px) scale(1.1)' : 'translateZ(0) scale(1)',
              }}
            >
              <User className="w-7 h-7 text-primary-600" />
            </div>
          </div>

          {/* Content */}
          <div className="pt-12 pb-5 px-5 text-center">
            <h3 className="font-bold text-base text-midnight-900 mb-0.5">
              {patient.user?.firstName} {patient.user?.lastName}
            </h3>
            <p className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-3">
              <Mail size={11} />
              {patient.user?.email}
            </p>

            {patient.user?.phone && (
              <p className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-3">
                <Phone size={11} />
                {patient.user?.phone}
              </p>
            )}

            {/* Medical Summary Stats */}
            {patient.medicalSummary && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-red-50 rounded-lg p-2">
                  <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-600">
                    {patient.medicalSummary.activeConditionsCount}
                  </p>
                  <p className="text-[10px] text-slate-500">{t('medicalRecord.conditions')}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-orange-600">
                    {patient.medicalSummary.allergiesCount}
                  </p>
                  <p className="text-[10px] text-slate-500">{t('medicalRecord.allergies')}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <Pill className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600">
                    {patient.medicalSummary.activeMedicationsCount}
                  </p>
                  <p className="text-[10px] text-slate-500">{t('medicalRecord.medications')}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <Syringe className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-600">
                    {patient.medicalSummary.vaccinationsCount}
                  </p>
                  <p className="text-[10px] text-slate-500">{t('medicalRecord.vaccinations')}</p>
                </div>
              </div>
            )}

            {patient.medicalSummary?.bloodType && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {patient.medicalSummary.bloodType}
              </div>
            )}

            {/* View details indicator */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-primary-600 text-xs font-medium">
              <FileText size={12} />
              {t('common.view')} {t('common.details')}
            </div>
          </div>

          {/* 3D reflection effect */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
            style={{
              background: isHovered
                ? 'linear-gradient(145deg, rgba(255,255,255,0.25) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)'
                : 'transparent',
            }}
          ></div>
        </button>
      </div>
    );
  }

  // List view
  return (
    <button
      onClick={() => onSelect(patient)}
      className={`w-full text-start p-4 hover:bg-slate-50 transition-all rounded-xl border-2 ${
        isSelected
          ? 'bg-primary-50 border-primary-300'
          : 'bg-white border-transparent hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white font-medium">
            {patient.user?.firstName?.[0]}{patient.user?.lastName?.[0]}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-midnight-900">
            {patient.user?.firstName} {patient.user?.lastName}
          </p>
          <p className="text-sm text-slate-500 truncate">{patient.user?.email}</p>
        </div>

        {/* Quick Stats */}
        {patient.medicalSummary && (
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {patient.medicalSummary.bloodType && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {patient.medicalSummary.bloodType}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <AlertTriangle size={12} className="text-orange-500" />
              {patient.medicalSummary.allergiesCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Pill size={12} className="text-blue-500" />
              {patient.medicalSummary.activeMedicationsCount}
            </span>
          </div>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
        )}
      </div>
    </button>
  );
}
