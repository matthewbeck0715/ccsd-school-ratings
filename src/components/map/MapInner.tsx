'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import { useCallback, useEffect } from 'react'
import { useSchools } from '@/hooks/useSchools'
import { createUserLocationIcon } from '@/utils/markerColors'
import { COUNTY_VIEWS } from '@/utils/countyViews'
import type { FilterState, School } from '@/types/school'
import ZoneBoundaries from './ZoneBoundaries'
import CountyClusterMarkers from './CountyClusterMarkers'

interface MapInnerProps {
  filters: FilterState
  selectedSchool?: School | null
  isVisible?: boolean
  onSelectSchool?: (school: School) => void
  onCountyFilter?: (county: string) => void
}

const NEVADA_CENTER: [number, number] = [38.8, -116.8]
const NEVADA_BOUNDS: [[number, number], [number, number]] = [[34.5, -120.5], [42.5, -113.5]]
const MILES_TO_METERS = 1609.344


function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    map.setView([lat, lng], 12)
  }, [map, lat, lng])
  return null
}

function FlyToSchool({ school }: { school: School }) {
  const map = useMap()
  useEffect(() => {
    if (school.lat && school.lng) {
      map.flyTo([school.lat, school.lng], 12)
    }
  }, [school, map])
  return null
}

function InvalidateOnShow({ isVisible }: { isVisible: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => map.invalidateSize())
    }
  }, [isVisible, map])
  return null
}

function CountyFocus({ county }: { county: string | null }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    if (county && COUNTY_VIEWS[county]) {
      const { center, zoom } = COUNTY_VIEWS[county]
      map.flyTo(center, zoom)
    } else if (!county) {
      map.flyTo(NEVADA_CENTER, 6)
    }
  }, [map, county])
  return null
}

export default function MapInner({ filters, selectedSchool, isVisible, onSelectSchool, onCountyFilter }: MapInnerProps) {
  const { schools, loading, error } = useSchools(filters)

  const handleZoneClick = useCallback((schoolId: string) => {
    if (!onSelectSchool) return
    const school = schools.find(s => s.id === schoolId)
    if (school) onSelectSchool(school)
  }, [schools, onSelectSchool])
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
      center={proximity ? [proximity.lat, proximity.lng] : NEVADA_CENTER}
      zoom={proximity ? 12 : 6}
      minZoom={proximity ? 12 : 6}
      maxBounds={NEVADA_BOUNDS}
      maxBoundsViscosity={1.0}
      className="w-full h-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <InvalidateOnShow isVisible={isVisible ?? true} />
      {selectedSchool && <FlyToSchool school={selectedSchool} />}
      {!proximity && <CountyFocus county={filters.county} />}
      {proximity && (
        <>
          <RecenterMap lat={proximity.lat} lng={proximity.lng} />
          {proximity.radiusMiles > 0 && <Circle
            center={[proximity.lat, proximity.lng]}
            radius={proximity.radiusMiles * MILES_TO_METERS}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 0.08,
              weight: 2,
            }}
          />}
          <Marker
            position={[proximity.lat, proximity.lng]}
            icon={createUserLocationIcon()}
          />
        </>
      )}
      {proximity && proximity.radiusMiles === 0 && filters.zonedSchoolIds.length > 0 && (
        <ZoneBoundaries zonedSchoolIds={filters.zonedSchoolIds} selectedSchoolId={selectedSchool?.id ?? null} onZoneClick={handleZoneClick} />
      )}
      <CountyClusterMarkers
        schools={schools}
        selectedSchool={selectedSchool}
        onSelectSchool={onSelectSchool}
        forceIndividual={!!filters.county || !!filters.proximity}
        onCountyFilter={onCountyFilter}
      />
    </MapContainer>
  )
}
