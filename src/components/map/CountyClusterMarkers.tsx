'use client'

import { useMemo, useState, useCallback } from 'react'
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
  avgScope: string
}

export default function CountyClusterMarkers({
  schools,
  selectedSchool,
  onSelectSchool,
  forceIndividual,
  onCountyFilter,
  avgScope,
}: CountyClusterMarkersProps) {
  const map = useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  })
  const [zoom, setZoom] = useState(map.getZoom())

  const showIndividual = forceIndividual || zoom >= CLUSTER_ZOOM_THRESHOLD

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
        {schools.map((school) => (
          <SchoolMarker
            key={school.id}
            school={school}
            isSelected={selectedSchool?.id === school.id}
            onSelect={onSelectSchool}
            avgScope={avgScope}
          />
        ))}
      </>
    )
  }

  return <CountyPolygons countyGroups={countyGroups} onCountyClick={handleCountyClick} />
}
