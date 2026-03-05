'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { useSchools } from '@/hooks/useSchools'
import { createUserLocationIcon } from '@/utils/markerColors'
import type { FilterState } from '@/types/school'
import SchoolMarker from './SchoolMarker'

interface MapInnerProps {
  filters: FilterState
}

const LAS_VEGAS_CENTER: [number, number] = [36.1716, -115.1391]
const MILES_TO_METERS = 1609.344

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 12)
  }, [map, lat, lng])
  return null
}

export default function MapInner({ filters }: MapInnerProps) {
  const { schools, loading, error } = useSchools(filters)
  const proximity = filters.proximity

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
      center={proximity ? [proximity.lat, proximity.lng] : LAS_VEGAS_CENTER}
      zoom={proximity ? 12 : 11}
      className="w-full h-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {proximity && (
        <>
          <RecenterMap lat={proximity.lat} lng={proximity.lng} />
          <Circle
            center={[proximity.lat, proximity.lng]}
            radius={proximity.radiusMiles * MILES_TO_METERS}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 0.08,
              weight: 2,
            }}
          />
          <Marker
            position={[proximity.lat, proximity.lng]}
            icon={createUserLocationIcon()}
          />
        </>
      )}
      {schools.map((school) => (
        <SchoolMarker key={school.id} school={school} />
      ))}
    </MapContainer>
  )
}
