'use client'

import { Marker, Popup } from 'react-leaflet'
import { createMarkerIcon } from '@/utils/markerColors'
import type { School } from '@/types/school'

interface SchoolMarkerProps {
  school: School
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
            <span className="text-gray-500">Index</span>
            <span className="font-medium">{school.indexScore}</span>
            <span className="text-gray-500">ELA%</span>
            <span className="font-medium">{school.elaProficiency ?? '—'}</span>
            <span className="text-gray-500">Math%</span>
            <span className="font-medium">{school.mathProficiency ?? '—'}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
