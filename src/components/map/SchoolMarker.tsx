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
          <p className="font-semibold text-sm">{school.name}</p>
          <p className="text-xs text-gray-500 mb-2">{school.level} · {school.type}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-gray-500">Stars</span>
            <span className="font-medium">{'★'.repeat(school.starRating)}</span>
            <span className="text-gray-500">Score</span>
            <span className="font-medium">{school.indexScore}</span>
            {school.distanceMiles != null && (
              <>
                <span className="text-gray-500">Distance</span>
                <span className="font-medium">{school.distanceMiles.toFixed(1)} mi</span>
              </>
            )}
            <span className="text-gray-500">ELA Prof.</span>
            <span className="font-medium">{school.elaProficiency ?? '—'}</span>
            <span className="text-gray-500">Math Prof.</span>
            <span className="font-medium">{school.mathProficiency ?? '—'}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
