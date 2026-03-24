'use client';

import { Sun, Moon, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { TimeSlot, groupSlotsByPeriod, formatDate } from './calendar-helpers';

interface TimeSlotPickerProps {
  selectedDate: Date;
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  loading?: boolean;
}

export default function TimeSlotPicker({
  selectedDate,
  slots,
  selectedSlot,
  onSlotSelect,
  loading = false,
}: TimeSlotPickerProps) {
  const { t, locale } = useLanguage();

  const { morning, afternoon } = groupSlotsByPeriod(slots);

  const getLocaleCode = () => {
    switch (locale) {
      case 'ar':
        return 'ar-SA';
      case 'fr':
        return 'fr-FR';
      default:
        return 'en-US';
    }
  };

  const isSelected = (slot: TimeSlot) => {
    if (!selectedSlot) return false;
    return slot.dateTime.getTime() === selectedSlot.dateTime.getTime();
  };

  const getSlotClasses = (slot: TimeSlot) => {
    const baseClasses = 'px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200';

    if (slot.isBooked) {
      return `${baseClasses} bg-slate-100 text-slate-400 cursor-not-allowed line-through`;
    }

    if (isSelected(slot)) {
      return `${baseClasses} bg-primary-600 text-white shadow-md ring-2 ring-primary-300`;
    }

    return `${baseClasses} bg-primary-50 text-primary-700 hover:bg-primary-100 hover:shadow-md cursor-pointer`;
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.isBooked) {
      onSlotSelect(slot);
    }
  };

  const availableMorning = morning.filter((s) => !s.isBooked);
  const availableAfternoon = afternoon.filter((s) => !s.isBooked);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
      {/* Selected date header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2 bg-primary-100 rounded-xl">
          <Clock className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-midnight-900">
            {t('calendar.selectTime')}
          </h3>
          <p className="text-sm text-slate-600 capitalize">
            {formatDate(selectedDate, getLocaleCode())}
          </p>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t('calendar.noSlots')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Morning slots */}
          {morning.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-medium text-slate-700">
                  {t('calendar.morning')}
                  <span className="text-slate-400 font-normal ml-2">
                    ({availableMorning.length} {t('doctors.availableSlots')})
                  </span>
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {morning.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slot.isBooked}
                    className={getSlotClasses(slot)}
                    title={slot.isBooked ? t('calendar.booked') : undefined}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Afternoon slots */}
          {afternoon.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-medium text-slate-700">
                  {t('calendar.afternoon')}
                  <span className="text-slate-400 font-normal ml-2">
                    ({availableAfternoon.length} {t('doctors.availableSlots')})
                  </span>
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {afternoon.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slot.isBooked}
                    className={getSlotClasses(slot)}
                    title={slot.isBooked ? t('calendar.booked') : undefined}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
