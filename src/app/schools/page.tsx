'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FilterState, School } from '@/types/school'
import SchoolSearch from '@/components/filters/SchoolSearch'
import CountyFilter from '@/components/filters/CountyFilter'
import LevelFilter from '@/components/filters/LevelFilter'
import TypeFilter from '@/components/filters/TypeFilter'
import StarFilter from '@/components/filters/StarFilter'
import ProximitySearch from '@/components/filters/ProximitySearch'
import ProximityStatus from '@/components/filters/ProximityStatus'
import FilterDrawer from '@/components/filters/FilterDrawer'
import { useSchools } from '@/hooks/useSchools'
import MapView from '@/components/map/MapView'
import TableView from '@/components/table/TableView'
import FilterResults from '@/components/panel/FilterResults'
import SchoolComparison from '@/components/panel/SchoolComparison'
import { hasActiveFilters, parseFilters, serializeFilters } from '@/utils/filterParams'

// Tailwind's xl breakpoint — the width at which the results panel appears beside the map.
const DESKTOP_QUERY = '(min-width: 1280px)'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<'map' | 'table'>('map')
  const [filters, setFilters] = useState<FilterState>(() => parseFilters(searchParams))
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)
  const isPopState = useRef(false)
  const mobileListRef = useRef<HTMLDivElement>(null)

  // The chart takes the banner's place at the top of the list, so a card tapped further down
  // would swap in a chart the user can't see. Bring it back into view.
  useEffect(() => {
    if (selectedSchool) mobileListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedSchool])

  useEffect(() => {
    function handlePopState() {
      isPopState.current = true
      setFilters(parseFilters(new URLSearchParams(window.location.search)))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (isPopState.current) {
      isPopState.current = false
      return
    }
    const params = serializeFilters(filters)
    const qs = params.toString()
    const timer = setTimeout(() => {
      router.push(qs ? `/schools?${qs}` : '/schools', { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, router])

  const handleSelectSchool = useCallback((school: School) => {
    setSelectedSchool(school)
    // Below xl there is no side panel next to the map, so the comparison chart lives in the
    // list itself — jumping to the map would be jumping away from the thing just selected.
    if (window.matchMedia(DESKTOP_QUERY).matches) setView('map')
  }, [])

  const hasActive = hasActiveFilters(filters)

  const clearSelection = useCallback(() => setSelectedSchool(null), [])

  const { schools: filteredSchools } = useSchools(filters)

  const filterCount =
    filters.schoolTypes.length +
    filters.schoolLevels.length +
    filters.starRatings.length +
    (filters.county !== null ? 1 : 0) +
    (filters.proximity !== null ? 1 : 0)

  function clearFilters() {
    setFilters(parseFilters(new URLSearchParams()))
  }

  const handleZoneFallback = useCallback(() => {
    setFilters((f) =>
      f.proximity && f.proximity.radiusMiles === 0
        ? { ...f, proximity: { ...f.proximity, radiusMiles: 5 } }
        : f
    )
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/favicon.svg`}
            alt=""
            width={28}
            height={28}
          />
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            Nevada School Ratings
          </h1>
        </div>
        <Link href="/about" className="text-sm text-blue-600 hover:text-blue-800 hover:underline shrink-0">
          About
        </Link>
      </header>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 xl:space-y-3 shrink-0">
        {/* Row 1: search + proximity + clear + view toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="hidden xl:flex xl:flex-col xl:gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">School</span>
            <SchoolSearch
              value={filters.search}
              onChange={(search) => setFilters((f) => ({ ...f, search }))}
            />
          </div>

          <div className="hidden xl:flex xl:flex-col xl:gap-1">
            <span className={`text-xs font-semibold uppercase tracking-wide ${addressError ? 'text-red-600' : 'text-gray-500'}`}>
              {addressError ? 'Address Not Found' : 'Address'}
            </span>
            <div className="flex items-center gap-3">
              <ProximitySearch
                proximity={filters.proximity}
                onChange={(proximity, county) => setFilters((f) => ({ ...f, proximity, county }))}
                onError={setAddressError}
              />
            </div>
          </div>
          <div className="flex rounded border border-gray-300 overflow-hidden shrink-0 ml-auto">
            <button
              onClick={() => setView('map')}
              className={`px-2.5 py-0.5 text-xs font-bold transition-colors ${view === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:border-gray-400'}`}
            >
              Map
            </button>
            {/* The selection survives the trip, so coming back to the map lands on the same
                school with its popup open. */}
            <button
              onClick={() => setView('table')}
              className={`px-2.5 py-0.5 text-xs font-bold border-l border-gray-300 transition-colors ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:border-gray-400'}`}
            >
              <span className="xl:hidden">List</span>
              <span className="hidden xl:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Row 2: filter pills — desktop only */}
        <div className="hidden xl:flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">County</span>
            <CountyFilter
              value={filters.county}
              onChange={(county) => setFilters((f) => ({ ...f, county }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</span>
            <LevelFilter
              value={filters.schoolLevels}
              onChange={(schoolLevels) => setFilters((f) => ({ ...f, schoolLevels }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</span>
            <TypeFilter
              value={filters.schoolTypes}
              onChange={(schoolTypes) => setFilters((f) => ({ ...f, schoolTypes }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stars</span>
            <StarFilter
              value={filters.starRatings}
              onChange={(starRatings) => setFilters((f) => ({ ...f, starRatings }))}
            />
          </div>
          {filters.proximity && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distance</span>
              <ProximityStatus
                proximity={filters.proximity}
                county={filters.county}
                onChange={(proximity) => setFilters((f) => ({ ...f, proximity, zonedSchoolIds: proximity === null ? [] : f.zonedSchoolIds }))}
              />
            </div>
          )}
          {hasActive && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide invisible">Clear</span>
              <button
                onClick={clearFilters}
                className="px-2.5 py-0.5 rounded text-xs font-bold border bg-white text-gray-600 border-gray-300 hover:border-gray-400 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer — always mounted, manages its own open/close.
          Unlike the view toggle, "View Schools" drops the selection: the chart covers the
          list, and this button is a request for the list. */}
      <FilterDrawer
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        onViewSchools={() => { setView('table'); clearSelection() }}
        filterCount={filterCount}
        schoolCount={filteredSchools.length}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className={view === 'map' ? 'flex xl:flex-row h-full' : 'hidden'}>
          {(hasActive || selectedSchool) && (
            <div className="hidden xl:block shrink-0 xl:w-1/3 xl:border-r border-gray-200 overflow-y-auto">
              {hasActive ? (
                <FilterResults
                  filters={filters}
                  selectedSchool={selectedSchool}
                  onSelectSchool={handleSelectSchool}
                  onClearSelection={clearSelection}
                  onZoneResult={(ids) => setFilters((f) => ({ ...f, zonedSchoolIds: ids }))}
                  onZoneFallback={handleZoneFallback}
                />
              ) : selectedSchool && (
                // Marker clicked on an unfiltered map: the panel opens purely to carry the
                // chart. Rendering the results list here would list every school in Nevada.
                <div className="bg-white px-4 py-3 h-full">
                  <SchoolComparison school={selectedSchool} onClear={clearSelection} />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-h-0">
            <MapView filters={filters} selectedSchool={selectedSchool} isVisible={view === 'map'} onSelectSchool={handleSelectSchool} onCountyFilter={(county) => setFilters((f) => ({ ...f, county }))} />
          </div>
        </div>
        <div className={view === 'table' ? 'h-full' : 'hidden'}>
          {/* Desktop: full table */}
          <div className="hidden xl:block h-full">
            <TableView filters={filters} onSelectSchool={handleSelectSchool} />
          </div>
          {/* Mobile: scrollable card list */}
          <div ref={mobileListRef} className="xl:hidden h-full overflow-y-auto">
            <FilterResults
              filters={filters}
              selectedSchool={selectedSchool}
              onSelectSchool={handleSelectSchool}
              onClearSelection={clearSelection}
              onZoneResult={(ids) => setFilters((f) => ({ ...f, zonedSchoolIds: ids }))}
              onZoneFallback={handleZoneFallback}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SchoolsPage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
