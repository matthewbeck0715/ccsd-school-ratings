'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { FilterState, School } from '@/types/school'
import { DEFAULT_FILTERS } from '@/types/school'
import { useSchools } from '@/hooks/useSchools'
import { useSchoolZones } from '@/hooks/useSchoolZones'
import { findSchoolZonesForPoint, type ZoneLookupResult } from '@/utils/findSchoolZones'
import { haversineDistanceMiles } from '@/utils/haversine'
import SchoolCard, { METRIC_GRID_CLASS } from './SchoolCard'
import { useCountyAverages } from '@/hooks/useCountyAverages'
import { countyLevelKey, STATE_SCOPE } from '@/utils/countyAverages'
import type { SchoolLevel } from '@/types/school'

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

// Carson City is an independent city, not a county — "Carson City County" would be wrong.
function scopeLabel(scope: string): string {
  if (scope === STATE_SCOPE) return 'Nevada statewide'
  return scope === 'Carson City' ? scope : `${scope} County`
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
  onSelectSchool: (school: School) => void
  onZoneResult: (ids: string[]) => void
}

function ProximityPanel({ filters, onSelectSchool, onZoneResult }: FilterResultsProps) {
  const proximity = filters.proximity!
  const isZone = proximity.radiusMiles === 0

  const { schools: allSchools } = useSchools(DEFAULT_FILTERS)
  const countyAvgMap = useCountyAverages()
  const avgScope = filters.county ?? STATE_SCOPE
  const { geojson, loading: zonesLoading } = useSchoolZones(true)
  const [zoneResult, setZoneResult] = useState<ZoneLookupResult | null>(null)
  const onZoneResultRef = useRef(onZoneResult)
  onZoneResultRef.current = onZoneResult

  useEffect(() => {
    if (!geojson || !allSchools.length) return
    const r = findSchoolZonesForPoint(proximity.lat, proximity.lng, geojson as never, allSchools)
    setZoneResult(r)
    const ids = [r.Elementary?.id, r.Middle?.id, r.High?.id].filter((id): id is string => id != null)
    onZoneResultRef.current(ids)
  }, [proximity.lat, proximity.lng, geojson, allSchools])

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
        <p className="text-xs text-gray-500 font-medium mb-2">
          {zonedSchools.length} {zonedSchools.length === 1 ? 'school' : 'schools'} matched
        </p>
        <div className="flex flex-col gap-3">
          {zonedSchools.map((s) => (
            <SchoolCard
              key={s.id}
              school={s}
              distanceMiles={s.lat != null && s.lng != null ? haversineDistanceMiles(proximity.lat, proximity.lng, s.lat, s.lng) : null}
              countyAvg={countyAvgMap ? countyAvgMap.get(countyLevelKey(avgScope, s.level)) ?? null : null}
              onSelect={onSelectSchool}
            />
          ))}
        </div>
      </div>
    )
  }

  const radiusOptions = [...BASE_OPTIONS, DISTANCE_OPTION]

  return (
    <div className="bg-white px-4 py-3 h-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 font-medium">
{nearbySchools.length === 0 ? 'No' : nearbySchools.length} {nearbySchools.length === 1 ? 'school' : 'schools'} matched
        </p>
        <SortBar sortKey={sortKey} sortAsc={sortAsc} options={radiusOptions} onSortKeyChange={setSortKey} onSortAscChange={setSortAsc} />
      </div>
      <div className="flex flex-col gap-3">
        {sortedNearby.map((school) => (
          <SchoolCard key={school.id} school={school} distanceMiles={school.distanceMiles} countyAvg={countyAvgMap ? countyAvgMap.get(countyLevelKey(avgScope, school.level)) ?? null : null} onSelect={onSelectSchool} />
        ))}
      </div>
    </div>
  )
}

function NonProximityPanel({ filters, onSelectSchool }: Pick<FilterResultsProps, 'filters' | 'onSelectSchool'>) {
  const { schools, loading } = useSchools(filters)
  const countyAvgMap = useCountyAverages()

  const [sortKey, setSortKey] = useState<SortKey>('indexScore')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = useMemo(
    () => sortSchools(schools, sortKey, sortAsc),
    [schools, sortKey, sortAsc]
  )

  const LEVELS: SchoolLevel[] = ['Elementary', 'Middle', 'High']
  // Drive the order from LEVELS, not filters.schoolLevels — the latter is ordered by
  // the sequence the user clicked the filters in.
  const activeLevels = LEVELS.filter(
    l => filters.schoolLevels.length === 0 || filters.schoolLevels.includes(l)
  )
  // With no county selected there is no county to average, so fall back to statewide.
  const avgScope = filters.county ?? STATE_SCOPE
  const countyLevelAvgs = countyAvgMap
    ? activeLevels.map(l => countyAvgMap.get(countyLevelKey(avgScope, l))).filter(Boolean)
    : []

  if (loading) return (
    <div className="bg-white px-4 py-2 text-xs text-gray-500">
      Loading…
    </div>
  )

  return (
    <div className="bg-white px-4 py-3 h-full">
      {countyLevelAvgs.length > 0 && (
        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-700">
          <div className="font-semibold text-blue-800 text-sm leading-tight mb-1">{scopeLabel(avgScope)} averages</div>
          <div className="flex flex-col gap-2">
            {countyLevelAvgs.map(a => a && (
              <div key={a.level} className="flex gap-4 items-start">
                <div className="flex-1 min-w-0 text-xs font-semibold text-blue-800">{a.level}</div>
                <div className={METRIC_GRID_CLASS}>
                  <div>
                    <div className="text-blue-400">ELA Proficient</div>
                    <div className="font-medium">{a.elaProficient != null ? `${a.elaProficient.toFixed(1)}%` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-blue-400">Math Proficient</div>
                    <div className="font-medium">{a.mathProficient != null ? `${a.mathProficient.toFixed(1)}%` : '—'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 font-medium">
{schools.length === 0 ? 'No' : schools.length} {schools.length === 1 ? 'school' : 'schools'} matched
        </p>
        <SortBar sortKey={sortKey} sortAsc={sortAsc} options={BASE_OPTIONS} onSortKeyChange={setSortKey} onSortAscChange={setSortAsc} />
      </div>
      <div className="flex flex-col gap-3">
        {sorted.map((school) => (
          <SchoolCard
            key={school.id}
            school={school}
            countyAvg={countyAvgMap ? countyAvgMap.get(countyLevelKey(avgScope, school.level)) ?? null : null}
            onSelect={onSelectSchool}
          />
        ))}
      </div>
    </div>
  )
}

export default function FilterResults({ filters, onSelectSchool, onZoneResult }: FilterResultsProps) {
  if (filters.proximity) {
    return <ProximityPanel filters={filters} onSelectSchool={onSelectSchool} onZoneResult={onZoneResult} />
  }
  return <NonProximityPanel filters={filters} onSelectSchool={onSelectSchool} />
}
