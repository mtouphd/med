'use client';

import { useEffect, useRef } from 'react';
import { Doctor } from '@/types';

interface DoctorsMapProps {
  doctors: Doctor[];
  onBookAppointment?: (doctor: Doctor) => void;
  onRequestFamilyDoctor?: (doctorId: string) => void;
  /** Mode sélection : clic "Choisir" → sélectionner le médecin sans ouvrir RDV */
  onSelectDoctor?: (doctor: Doctor) => void;
  selectedDoctorId?: string;
  height?: number;
}

export default function DoctorsMap({
  doctors: doctorsList,
  onBookAppointment,
  onRequestFamilyDoctor,
  onSelectDoctor,
  selectedDoctorId,
  height = 500,
}: DoctorsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // ── Init map once ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      // Fix broken default icon paths (webpack issue)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // StrictMode / hot-reload may leave _leaflet_id on the container — clear it
      delete (containerRef.current as any)._leaflet_id;

      const map = L.map(containerRef.current!, { scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      map.setView([36.737, 3.086], 8); // Algiers default
      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Update markers whenever doctors / selection / callbacks change ──────
  useEffect(() => {
    if (!mapRef.current) {
      // Map not ready yet — retry shortly
      const t = setTimeout(() => {
        updateMarkers();
      }, 300);
      return () => clearTimeout(t);
    }
    updateMarkers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorsList, selectedDoctorId, onSelectDoctor, onBookAppointment, onRequestFamilyDoctor]);

  function updateMarkers() {
    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const withCoords = doctorsList.filter((d) => d.latitude != null && d.longitude != null);

      // Fit bounds
      if (withCoords.length === 1) {
        map.setView([withCoords[0].latitude!, withCoords[0].longitude!], 13);
      } else if (withCoords.length > 1) {
        const bounds = L.latLngBounds(withCoords.map((d) => [d.latitude!, d.longitude!] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      withCoords.forEach((doctor) => {
        const isSelected = selectedDoctorId === doctor.id;
        const iconColor = isSelected ? 'gold' : doctor.isAvailable ? 'green' : 'grey';
        const icon = new L.Icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: isSelected ? [30, 49] : [25, 41],
          iconAnchor: isSelected ? [15, 49] : [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        const addressLine = [doctor.street, doctor.postalCode, doctor.city].filter(Boolean).join(', ');
        const availBadge = doctor.isAvailable
          ? `<span style="background:#d1fae5;color:#065f46;padding:2px 6px;border-radius:9999px;font-size:11px;font-weight:600">Disponible</span>`
          : `<span style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:9999px;font-size:11px;font-weight:600">Indisponible</span>`;

        // Build action buttons HTML
        let actionsHtml = '';
        if (onSelectDoctor) {
          const btnLabel = isSelected ? '✓ Sélectionné' : 'Choisir ce médecin';
          const btnStyle = isSelected
            ? 'background:#16a34a;color:#fff;border:none;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;width:100%'
            : 'background:#2563eb;color:#fff;border:none;padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;width:100%';
          actionsHtml = `<button class="map-select-btn" data-id="${doctor.id}" style="${btnStyle}">${btnLabel}</button>`;
        } else {
          if (onBookAppointment) {
            actionsHtml += `<button class="map-book-btn" data-id="${doctor.id}" ${!doctor.isAvailable ? 'disabled' : ''} style="background:#2563eb;color:#fff;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;flex:1;opacity:${!doctor.isAvailable ? '0.5' : '1'}">📅 RDV</button>`;
          }
          if (onRequestFamilyDoctor) {
            actionsHtml += `<button class="map-family-btn" data-id="${doctor.id}" style="background:#fee2e2;color:#991b1b;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600">❤</button>`;
          }
          if (actionsHtml) actionsHtml = `<div style="display:flex;gap:6px;margin-top:8px">${actionsHtml}</div>`;
        }

        const popupHtml = `
          <div style="font-family:sans-serif;min-width:200px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <div style="width:36px;height:36px;border-radius:10px;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1d4ed8;font-size:13px;flex-shrink:0">
                ${(doctor.user?.firstName?.[0] ?? '?')}${(doctor.user?.lastName?.[0] ?? '')}
              </div>
              <div>
                <p style="margin:0;font-weight:700;font-size:13px;color:#1e293b">Dr. ${doctor.user?.firstName} ${doctor.user?.lastName}</p>
                <p style="margin:0;font-size:11px;color:#2563eb">${doctor.specialty}</p>
              </div>
            </div>
            ${addressLine ? `<p style="margin:0 0 4px;font-size:11px;color:#64748b">📍 ${addressLine}</p>` : ''}
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <p style="margin:0;font-size:11px;color:#64748b">⏱ ${doctor.consultationDuration} min</p>
              ${availBadge}
            </div>
            ${actionsHtml}
          </div>
        `;

        const marker = L.marker([doctor.latitude!, doctor.longitude!], { icon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 260 });

        // Wire up button clicks after popup opens
        marker.on('popupopen', () => {
          const selectBtn = document.querySelector(`.map-select-btn[data-id="${doctor.id}"]`);
          if (selectBtn && onSelectDoctor) {
            selectBtn.addEventListener('click', () => onSelectDoctor(doctor));
          }
          const bookBtn = document.querySelector(`.map-book-btn[data-id="${doctor.id}"]`);
          if (bookBtn && onBookAppointment) {
            bookBtn.addEventListener('click', () => onBookAppointment(doctor));
          }
          const familyBtn = document.querySelector(`.map-family-btn[data-id="${doctor.id}"]`);
          if (familyBtn && onRequestFamilyDoctor) {
            familyBtn.addEventListener('click', () => onRequestFamilyDoctor(doctor.id));
          }
        });

        markersRef.current.push(marker);
      });
    });
  }

  const withoutCoords = doctorsList.filter((d) => d.latitude == null || d.longitude == null);

  return (
    <div className="flex flex-col gap-2">
      {withoutCoords.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
          📍 {withoutCoords.length} médecin{withoutCoords.length > 1 ? 's' : ''} sans adresse géocodée — non affiché{withoutCoords.length > 1 ? 's' : ''} sur la carte.
        </p>
      )}
      <div ref={containerRef} style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }} />
    </div>
  );
}
