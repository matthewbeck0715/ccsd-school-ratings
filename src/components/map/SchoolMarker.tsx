'use client'

import React, { useEffect, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'
import type L from 'leaflet'
import { createMarkerIcon, getMarkerColor } from '@/utils/markerColors'
import { formatPercentile } from '@/utils/format'
import type { SchoolWithDistance } from '@/types/school'

interface SchoolMarkerProps {
  school: SchoolWithDistance
  isSelected?: boolean
  onSelect?: (school: SchoolWithDistance) => void
  isMapVisible?: boolean
  isComparing?: boolean
  onToggleCompare?: (school: SchoolWithDistance) => void
  canAddCompare?: boolean
}

export default React.memo(function SchoolMarker({ school, isSelected, onSelect, isMapVisible = true, isComparing, onToggleCompare, canAddCompare = true }: SchoolMarkerProps) {
  const icon = createMarkerIcon(school.starRating)
  const markerRef = useRef<L.Marker>(null)

  // The popup is open exactly while its school is selected and the map is the view on screen.
  // Driving it from both means it closes when the user leaves for the list and comes back on
  // return — the map is only CSS-hidden, so a popup left open would otherwise still be there.
  const showPopup = isSelected && isMapVisible

  useEffect(() => {
    if (!markerRef.current) return
    if (showPopup) {
      markerRef.current.openPopup()
    } else {
      markerRef.current.closePopup()
    }
  }, [showPopup])

  if (school.lat === null || school.lng === null) return null

  return (
    <Marker ref={markerRef} position={[school.lat, school.lng]} icon={icon} eventHandlers={{ click: () => onSelect?.(school) }}>
      <Popup>
        <div className="min-w-[220px]">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm truncate min-w-0">{school.name}</p>
            <span className="shrink-0 text-xs font-medium" style={{ color: getMarkerColor(school.starRating) }}>
              {school.starRating !== null ? '★'.repeat(school.starRating) : 'NR'}
            </span>
            {school.distanceMiles != null && (
              <span className="text-xs font-medium text-gray-500 shrink-0">{school.distanceMiles.toFixed(1)} mi</span>
            )}
            <span
              className="ml-auto shrink-0 text-sm font-bold"
              style={{ color: getMarkerColor(school.starRating) }}
            >
              {school.indexScore.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">{school.level} · {school.type}</p>
          {school.address && school.city && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name}, ${school.address}, ${school.city}, NV ${school.zip ?? ''}`.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline mb-1 block"
            >
              <span className="block">{school.address}</span>
              <span className="block">{school.city}, NV{school.zip ? ` ${school.zip}` : ''}</span>
            </a>
          )}
          <div className="grid grid-cols-2 gap-x-0.5 gap-y-1 text-xs mt-0">
            <div>
              <div className="text-gray-400">ELA Proficiency</div>
              <div className="font-medium">{school.elaProficiency != null ? `${school.elaProficiency}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Proficiency</div>
              <div className="font-medium">{school.mathProficiency != null ? `${school.mathProficiency}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA % Met AGP</div>
              <div className="font-medium">{school.elaGrowth != null ? `${school.elaGrowth}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math % Met AGP</div>
              <div className="font-medium">{school.mathGrowth != null ? `${school.mathGrowth}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA MGP</div>
              <div className="font-medium">{school.elaMgp != null ? formatPercentile(school.elaMgp) : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math MGP</div>
              <div className="font-medium">{school.mathMgp != null ? formatPercentile(school.mathMgp) : '—'}</div>
            </div>
          </div>
          {onToggleCompare && (
            <button
              onClick={() => onToggleCompare(school)}
              disabled={!isComparing && !canAddCompare}
              className={`mt-2 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                isComparing
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-blue-200 text-blue-600 hover:bg-blue-50'
              }`}
            >
              Compare
              <span className="w-2.5 text-center">{isComparing ? '×' : '+'}</span>
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  )
}, (prev, next) =>
  prev.school.id === next.school.id
  && prev.isSelected === next.isSelected
  && prev.onSelect === next.onSelect
  && prev.isMapVisible === next.isMapVisible
  && prev.isComparing === next.isComparing
  && prev.onToggleCompare === next.onToggleCompare
  && prev.canAddCompare === next.canAddCompare
)
