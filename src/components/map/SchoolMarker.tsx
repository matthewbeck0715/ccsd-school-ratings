'use client'

import { Marker, Popup } from 'react-leaflet'
import { createMarkerIcon } from '@/utils/markerColors'
import type { SchoolWithDistance } from '@/types/school'

interface SchoolMarkerProps {
  school: SchoolWithDistance
}

export default function SchoolMarker({ school }: SchoolMarkerProps) {
  const icon = createMarkerIcon(school.starRating)

  if (school.lat === null || school.lng === null) return null

  return (
    <Marker position={[school.lat, school.lng]} icon={icon}>
      <Popup>
        <div className="min-w-[180px]">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-sm">{school.name}</p>
            {school.distanceMiles != null && (
              <span className="text-xs font-medium text-gray-500 shrink-0">{school.distanceMiles.toFixed(1)} mi</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">{school.level} · {school.type}</p>
          {school.address && school.city && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name}, ${school.address}, ${school.city}, NV ${school.zip ?? ''}`.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline mb-1 block"
            >
              {school.address}, {school.city}, NV{school.zip ? ` ${school.zip}` : ''}
            </a>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-0">
            <div>
              <div className="text-gray-400">Stars</div>
              <div className="font-medium">{school.starRating !== null ? '★'.repeat(school.starRating) : 'NR'}</div>
            </div>
            <div>
              <div className="text-gray-400">Score</div>
              <div className="font-medium">{school.indexScore}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA Proficiency</div>
              <div className="font-medium">{school.elaProficiency != null ? `${school.elaProficiency}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Proficiency</div>
              <div className="font-medium">{school.mathProficiency != null ? `${school.mathProficiency}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA Growth</div>
              <div className="font-medium">{school.elaGrowth != null ? `${school.elaGrowth}%` : '—'}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Growth</div>
              <div className="font-medium">{school.mathGrowth != null ? `${school.mathGrowth}%` : '—'}</div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
