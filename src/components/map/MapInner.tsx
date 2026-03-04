'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useSchools } from '@/hooks/useSchools'
import type { FilterState } from '@/types/school'
import SchoolMarker from './SchoolMarker'

interface MapInnerProps {
  filters: FilterState
}

const LAS_VEGAS_CENTER: [number, number] = [36.1716, -115.1391]

export default function MapInner({ filters }: MapInnerProps) {
  const { schools, loading, error } = useSchools(filters)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
        Loading schools…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 text-red-600">
        Error: {error}
      </div>
    )
  }

  return (
    <MapContainer
      center={LAS_VEGAS_CENTER}
      zoom={11}
      className="w-full h-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {schools.map((school) => (
        <SchoolMarker key={school.id} school={school} />
      ))}
    </MapContainer>
  )
}
