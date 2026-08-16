'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import SchoolMarker from './SchoolMarker'
import CountyPolygons from './CountyPolygons'
import type { School, SchoolWithDistance } from '@/types/school'

const CLUSTER_ZOOM_THRESHOLD = 9

interface CountyClusterMarkersProps {
  schools: SchoolWithDistance[]
  selectedSchool?: School | null
  onSelectSchool?: (school: School) => void
  forceIndividual?: boolean
  onCountyFilter?: (county: string) => void
  // The selected school's popup is only open while the map is the view on screen — see SchoolMarker.
  isMapVisible?: boolean
  compareIds?: Set<string>
  onToggleCompare?: (school: School) => void
  canAddCompare?: boolean
}

export default function CountyClusterMarkers({
  schools,
  selectedSchool,
  onSelectSchool,
  forceIndividual,
  onCountyFilter,
  isMapVisible = true,
  compareIds,
  onToggleCompare,
  canAddCompare = true,
}: CountyClusterMarkersProps) {
  const scheduledFrame = useRef<number | null>(null)

  const map = useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    move: () => {
      if (scheduledFrame.current != null) return
      scheduledFrame.current = requestAnimationFrame(() => {
        scheduledFrame.current = null
        setBounds(map.getBounds().pad(1))
      })
    },
    moveend: () => {
      if (scheduledFrame.current != null) {
        cancelAnimationFrame(scheduledFrame.current)
        scheduledFrame.current = null
      }
      setBounds(map.getBounds().pad(1))
    },
  })
  const [zoom, setZoom] = useState(map.getZoom())
  const [bounds, setBounds] = useState(() => map.getBounds().pad(1))

  useEffect(() => {
    return () => {
      if (scheduledFrame.current != null) cancelAnimationFrame(scheduledFrame.current)
    }
  }, [])

  const showIndividual = forceIndividual || zoom >= CLUSTER_ZOOM_THRESHOLD

  const visibleSchools = useMemo(
    () => schools.filter((school) => school.lat != null && school.lng != null && bounds.contains([school.lat, school.lng])),
    [schools, bounds]
  )

  const countyGroups = useMemo(() => {
    const groups = new Map<string, SchoolWithDistance[]>()
    for (const school of schools) {
      const county = school.county ?? '__none__'
      let list = groups.get(county)
      if (!list) {
        list = []
        groups.set(county, list)
      }
      list.push(school)
    }
    return groups
  }, [schools])

  const handleCountyClick = useCallback(
    (county: string) => {
      if (onCountyFilter) onCountyFilter(county)
    },
    [onCountyFilter]
  )

  if (showIndividual) {
    return (
      <>
        {visibleSchools.map((school) => (
          <SchoolMarker
            key={school.id}
            school={school}
            isSelected={selectedSchool?.id === school.id}
            onSelect={onSelectSchool}
            isMapVisible={isMapVisible}
            isComparing={compareIds?.has(school.id)}
            onToggleCompare={onToggleCompare}
            canAddCompare={canAddCompare}
          />
        ))}
      </>
    )
  }

  return <CountyPolygons countyGroups={countyGroups} onCountyClick={handleCountyClick} />
}
