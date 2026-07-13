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
}

export default React.memo(function SchoolMarker({ school, isSelected, onSelect, isMapVisible = true }: SchoolMarkerProps) {
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
        <div className="min-w-[280px]">
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
              {Math.trunc(school.indexScore)}
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-0">
            <div>
              <div className="text-gray-400">ELA Proficiency</div>
              <div className="font-medium">{school.elaProficiency != null ? `${school.elaProficiency}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Proficiency</div>
              <div className="font-medium">{school.mathProficiency != null ? `${school.mathProficiency}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA Growth - AGP</div>
              <div className="font-medium">{school.elaGrowth != null ? `${school.elaGrowth}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Growth - AGP</div>
              <div className="font-medium">{school.mathGrowth != null ? `${school.mathGrowth}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA Growth - MGP</div>
              <div className="font-medium">{school.elaMgp != null ? formatPercentile(school.elaMgp) : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Growth - MGP</div>
              <div className="font-medium">{school.mathMgp != null ? formatPercentile(school.mathMgp) : '—'}</div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}, (prev, next) =>
  prev.school.id === next.school.id
  && prev.isSelected === next.isSelected
  && prev.onSelect === next.onSelect
  && prev.isMapVisible === next.isMapVisible
)
