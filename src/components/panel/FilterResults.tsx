'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { FilterState, School } from '@/types/school'
import { DEFAULT_FILTERS } from '@/types/school'
import { useSchools } from '@/hooks/useSchools'
import { useSchoolZones } from '@/hooks/useSchoolZones'
import { findSchoolZonesForPoint, type ZoneLookupResult } from '@/utils/findSchoolZones'
import { haversineDistanceMiles } from '@/utils/haversine'
import SchoolCard from './SchoolCard'
import SchoolComparison from './SchoolComparison'

type SortKey = 'name' | 'starRating' | 'indexScore' | 'distanceMiles'

interface SortOption { label: string; value: SortKey }

const BASE_OPTIONS: SortOption[] = [
  { label: 'Name', value: 'name' },
  { label: 'Score', value: 'indexScore' },
]

const DISTANCE_OPTION: SortOption = { label: 'Distance', value: 'distanceMiles' }

function SortBar({ sortKey, sortAsc, options, onSortKeyChange, onSortAscChange }: {
  sortKey: SortKey
  sortAsc: boolean
  options: SortOption[]
  onSortKeyChange: (k: SortKey) => void
  onSortAscChange: (asc: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="text-xs font-bold border border-gray-300 rounded px-1.5 py-0.5"
        value={sortKey}
        onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        className="text-xs font-bold border border-gray-300 rounded px-1.5 py-0.5"
        onClick={() => onSortAscChange(!sortAsc)}
        title={sortAsc ? 'Ascending' : 'Descending'}
      >
        {sortAsc ? '↑' : '↓'}
      </button>
    </div>
  )
}

function sortSchools<T extends School>(schools: T[], sortKey: SortKey, sortAsc: boolean): T[] {
  return [...schools].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortKey]
    const bv = (b as Record<string, unknown>)[sortKey]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return sortAsc ? -1 : 1
    if (av > bv) return sortAsc ? 1 : -1
    return 0
  })
}

interface FilterResultsProps {
  filters: FilterState
  selectedSchool: School | null
  onSelectSchool: (school: School) => void
  onClearSelection: () => void
  onZoneResult: (ids: string[]) => void
  onZoneFallback: () => void
}

function ProximityPanel({ filters, selectedSchool, onSelectSchool, onClearSelection, onZoneResult, onZoneFallback }: FilterResultsProps) {
  const proximity = filters.proximity!
  const isZone = proximity.radiusMiles === 0

  const { schools: allSchools } = useSchools(DEFAULT_FILTERS)
  const { geojson, loading: zonesLoading } = useSchoolZones(true)
  const [zoneResult, setZoneResult] = useState<ZoneLookupResult | null>(null)
  const onZoneResultRef = useRef(onZoneResult)
  onZoneResultRef.current = onZoneResult
  const onZoneFallbackRef = useRef(onZoneFallback)
  onZoneFallbackRef.current = onZoneFallback

  useEffect(() => {
    if (!geojson || !allSchools.length) return
    const r = findSchoolZonesForPoint(proximity.lat, proximity.lng, geojson as never, allSchools)
    setZoneResult(r)
    const ids = [r.Elementary?.id, r.Middle?.id, r.High?.id].filter((id): id is string => id != null)
    onZoneResultRef.current(ids)
    // No school zone covers this point (data only exists for Clark/Washoe) — fall back to a
    // radius search instead of silently showing zero results.
    if (ids.length === 0 && proximity.radiusMiles === 0) {
      onZoneFallbackRef.current()
    }
  }, [proximity.lat, proximity.lng, geojson, allSchools, proximity.radiusMiles])

  const { schools: nearbySchools, loading: nearbyLoading } = useSchools(filters)

  const [sortKey, setSortKey] = useState<SortKey>('distanceMiles')
  const [sortAsc, setSortAsc] = useState(true)

  const sortedNearby = useMemo(
    () => sortSchools(nearbySchools, sortKey, sortAsc),
    [nearbySchools, sortKey, sortAsc]
  )

  const loading = isZone ? zonesLoading : nearbyLoading

  if (loading) return (
    <div className="bg-white px-4 py-2 text-xs text-gray-500">
      Loading…
    </div>
  )

  if (isZone) {
    if (!zoneResult || (!zoneResult.Elementary && !zoneResult.Middle && !zoneResult.High)) return null
    const zonedSchools = [zoneResult.Elementary, zoneResult.Middle, zoneResult.High].filter(Boolean) as School[]
    return (
      <div className="bg-white px-4 py-3 h-full">
        {selectedSchool ? (
          <SchoolComparison school={selectedSchool} onClear={onClearSelection} />
        ) : (
          <>
            <p className="text-xs text-gray-500 font-medium mb-2">
              {zonedSchools.length} {zonedSchools.length === 1 ? 'school' : 'schools'} matched
            </p>
            <div className="flex flex-col gap-3">
              {zonedSchools.map((s) => (
                <SchoolCard
                  key={s.id}
                  school={s}
                  distanceMiles={s.lat != null && s.lng != null ? haversineDistanceMiles(proximity.lat, proximity.lng, s.lat, s.lng) : null}
                  onSelect={onSelectSchool}
                />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const radiusOptions = [...BASE_OPTIONS, DISTANCE_OPTION]

  return (
    <div className="bg-white px-4 py-3 h-full">
      {selectedSchool ? (
        <SchoolComparison school={selectedSchool} onClear={onClearSelection} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">
              {nearbySchools.length === 0 ? 'No' : nearbySchools.length} {nearbySchools.length === 1 ? 'school' : 'schools'} matched
            </p>
            <SortBar sortKey={sortKey} sortAsc={sortAsc} options={radiusOptions} onSortKeyChange={setSortKey} onSortAscChange={setSortAsc} />
          </div>
          <div className="flex flex-col gap-3">
            {sortedNearby.map((school) => (
              <SchoolCard key={school.id} school={school} distanceMiles={school.distanceMiles} onSelect={onSelectSchool} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NonProximityPanel({ filters, selectedSchool, onSelectSchool, onClearSelection }: Pick<FilterResultsProps, 'filters' | 'selectedSchool' | 'onSelectSchool' | 'onClearSelection'>) {
  const { schools, loading } = useSchools(filters)

  const [sortKey, setSortKey] = useState<SortKey>('indexScore')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = useMemo(
    () => sortSchools(schools, sortKey, sortAsc),
    [schools, sortKey, sortAsc]
  )

  if (loading) return (
    <div className="bg-white px-4 py-2 text-xs text-gray-500">
      Loading…
    </div>
  )

  return (
    <div className="bg-white px-4 py-3 h-full">
      {selectedSchool ? (
        <SchoolComparison school={selectedSchool} onClear={onClearSelection} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">
              {schools.length === 0 ? 'No' : schools.length} {schools.length === 1 ? 'school' : 'schools'} matched
            </p>
            <SortBar sortKey={sortKey} sortAsc={sortAsc} options={BASE_OPTIONS} onSortKeyChange={setSortKey} onSortAscChange={setSortAsc} />
          </div>
          <div className="flex flex-col gap-3">
            {sorted.map((school) => (
              <SchoolCard key={school.id} school={school} onSelect={onSelectSchool} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function FilterResults(props: FilterResultsProps) {
  const { filters, selectedSchool, onSelectSchool, onClearSelection } = props

  if (filters.proximity) {
    return <ProximityPanel {...props} />
  }
  return (
    <NonProximityPanel
      filters={filters}
      selectedSchool={selectedSchool}
      onSelectSchool={onSelectSchool}
      onClearSelection={onClearSelection}
    />
  )
}
