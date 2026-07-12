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
import { countyLevelKey, deltaScope, schoolDeltaAverage, STATE_SCOPE, type CountyLevelAverages } from '@/utils/countyAverages'
import type { SchoolLevel } from '@/types/school'

type SortKey = 'name' | 'starRating' | 'indexScore' | 'distanceMiles'

const LEVELS: SchoolLevel[] = ['Elementary', 'Middle', 'High']

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

// The banner is grouped by the same scope the cards' deltas are measured against, so the
// two always agree. In a proximity search that is each school's own county — normally one
// section, but two when the results straddle a county line. Levels track the schools shown.
function AveragesBanner({ filters, schools, countyAvgMap }: {
  filters: FilterState
  schools: School[]
  countyAvgMap: Map<string, CountyLevelAverages> | null
}) {
  const scopes = [...new Set(schools.map(s => deltaScope(s, filters)).filter((s): s is string => s != null))].sort()
  const sections = scopes
    .map(scope => ({
      scope,
      // Drive the order from LEVELS, not the school order, which is whatever the sort produced.
      rows: LEVELS
        .filter(l => schools.some(s => s.level === l && deltaScope(s, filters) === scope))
        .map(l => countyAvgMap?.get(countyLevelKey(scope, l)))
        .filter((a): a is CountyLevelAverages => a != null),
    }))
    .filter(section => section.rows.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-700 flex flex-col gap-3">
      {sections.map(({ scope, rows }) => (
        <div key={scope}>
          <div className="font-semibold text-blue-800 text-sm leading-tight mb-1">{scopeLabel(scope)} averages</div>
          <div className="flex flex-col gap-2">
            {rows.map(a => (
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
      ))}
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
  onSelectSchool: (school: School) => void
  onZoneResult: (ids: string[]) => void
}

function ProximityPanel({ filters, onSelectSchool, onZoneResult }: FilterResultsProps) {
  const proximity = filters.proximity!
  const isZone = proximity.radiusMiles === 0

  const { schools: allSchools } = useSchools(DEFAULT_FILTERS)
  const countyAvgMap = useCountyAverages()
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
        <AveragesBanner filters={filters} schools={zonedSchools} countyAvgMap={countyAvgMap} />
        <p className="text-xs text-gray-500 font-medium mb-2">
          {zonedSchools.length} {zonedSchools.length === 1 ? 'school' : 'schools'} matched
        </p>
        <div className="flex flex-col gap-3">
          {zonedSchools.map((s) => (
            <SchoolCard
              key={s.id}
              school={s}
              distanceMiles={s.lat != null && s.lng != null ? haversineDistanceMiles(proximity.lat, proximity.lng, s.lat, s.lng) : null}
              countyAvg={schoolDeltaAverage(countyAvgMap, s, filters)}
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
      <AveragesBanner filters={filters} schools={nearbySchools} countyAvgMap={countyAvgMap} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 font-medium">
{nearbySchools.length === 0 ? 'No' : nearbySchools.length} {nearbySchools.length === 1 ? 'school' : 'schools'} matched
        </p>
        <SortBar sortKey={sortKey} sortAsc={sortAsc} options={radiusOptions} onSortKeyChange={setSortKey} onSortAscChange={setSortAsc} />
      </div>
      <div className="flex flex-col gap-3">
        {sortedNearby.map((school) => (
          <SchoolCard key={school.id} school={school} distanceMiles={school.distanceMiles} countyAvg={schoolDeltaAverage(countyAvgMap, school, filters)} onSelect={onSelectSchool} />
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

  if (loading) return (
    <div className="bg-white px-4 py-2 text-xs text-gray-500">
      Loading…
    </div>
  )

  return (
    <div className="bg-white px-4 py-3 h-full">
      <AveragesBanner filters={filters} schools={schools} countyAvgMap={countyAvgMap} />
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
            countyAvg={schoolDeltaAverage(countyAvgMap, school, filters)}
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
