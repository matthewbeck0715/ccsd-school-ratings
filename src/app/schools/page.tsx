'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FilterState, School, SchoolWithDistance } from '@/types/school'
import { DEFAULT_FILTERS } from '@/types/school'
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
import FilterResults from '@/components/panel/FilterResults'
import CompareColumns from '@/components/panel/CompareColumns'
import CompareTray from '@/components/panel/CompareTray'
import { hasActiveFilters, parseFilters, parseSchoolIds, serializeFilters, serializeSchoolIds } from '@/utils/filterParams'
import { haversineDistanceMiles } from '@/utils/haversine'

// Tailwind's xl breakpoint — the width at which the results panel appears beside the map.
const DESKTOP_QUERY = '(min-width: 1280px)'
// "2-3 schools" per the comparison feature spec — enough to compare without the columns
// getting unreadable on mobile.
const MAX_COMPARE = 3

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<'map' | 'list'>('map')
  const [filters, setFilters] = useState<FilterState>(() => parseFilters(searchParams))
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [pendingSchoolId] = useState<string | null>(() => parseSchoolIds(searchParams)[0] ?? null)
  const [pinnedForCompare, setPinnedForCompare] = useState<School[]>([])
  const [compareMode, setCompareMode] = useState(false)
  const [pendingCompareIds] = useState<string[]>(() => parseSchoolIds(searchParams, 'compare'))
  const isPopState = useRef(false)
  const mobileListRef = useRef<HTMLDivElement>(null)

  // Unfiltered list, used only to resolve a deep-linked school id (from ?ids=) against — the
  // "filtered" school list depends on filter state that hasn't necessarily been set to match it.
  const { schools: allSchools } = useSchools(DEFAULT_FILTERS)
  const allSchoolsRef = useRef<School[]>(allSchools)
  allSchoolsRef.current = allSchools

  // Resolves a school id from the URL on first load — once, since selection afterward is driven
  // by clicks (and popstate, below), not by re-reading the initial searchParams.
  const resolvedPendingSchool = useRef(false)
  useEffect(() => {
    if (resolvedPendingSchool.current || !pendingSchoolId || allSchools.length === 0) return
    resolvedPendingSchool.current = true
    const match = allSchools.find((s) => s.id === pendingSchoolId)
    if (!match) return
    setSelectedSchool(match)
    // Mobile's map view has no side panel — only a marker popup — so the comparison panel needs
    // the list tab to be visible there. Desktop keeps the map, where the panel already
    // renders alongside it.
    setView(window.matchMedia(DESKTOP_QUERY).matches ? 'map' : 'list')
  }, [pendingSchoolId, allSchools])

  // Same deep-link pattern as pendingSchoolId above, but for a shared comparison link
  // (?compare=id1,id2) — resolves once, then opens straight into the compare view (which
  // covers the whole main area regardless of the map/list toggle) so "look at these two
  // options" links work without extra clicks.
  const resolvedPendingCompare = useRef(false)
  useEffect(() => {
    if (resolvedPendingCompare.current || pendingCompareIds.length === 0 || allSchools.length === 0) return
    resolvedPendingCompare.current = true
    const matches = pendingCompareIds
      .map((id) => allSchools.find((s) => s.id === id))
      .filter((s): s is SchoolWithDistance => !!s)
      .slice(0, MAX_COMPARE)
    if (matches.length === 0) return
    setPinnedForCompare(matches)
    if (matches.length >= 2) setCompareMode(true)
  }, [pendingCompareIds, allSchools])

  // The chart takes the banner's place at the top of the list, so a card tapped further down
  // would swap in a chart the user can't see. Bring it back into view.
  useEffect(() => {
    if (selectedSchool) mobileListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedSchool])

  useEffect(() => {
    function handlePopState() {
      isPopState.current = true
      const params = new URLSearchParams(window.location.search)
      setFilters(parseFilters(params))
      const id = parseSchoolIds(params)[0] ?? null
      setSelectedSchool(id ? allSchoolsRef.current.find((s) => s.id === id) ?? null : null)
      const compareMatches = parseSchoolIds(params, 'compare')
        .map((cid) => allSchoolsRef.current.find((s) => s.id === cid))
        .filter((s): s is SchoolWithDistance => !!s)
        .slice(0, MAX_COMPARE)
      setPinnedForCompare(compareMatches)
      setCompareMode(compareMatches.length >= 2)
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
    const idsParam = serializeSchoolIds(selectedSchool ? [selectedSchool.id] : [])
    if (idsParam) params.set('ids', idsParam)
    const compareParam = serializeSchoolIds(pinnedForCompare.map((s) => s.id))
    if (compareParam) params.set('compare', compareParam)
    const qs = params.toString()
    const timer = setTimeout(() => {
      router.push(qs ? `/schools?${qs}` : '/schools', { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, selectedSchool, pinnedForCompare, router])

  // Dropping below 2 pinned schools (via the tray's × chips) closes the compare view — the
  // same way a solo school falls back to browsing.
  useEffect(() => {
    if (compareMode && pinnedForCompare.length < 2) setCompareMode(false)
  }, [compareMode, pinnedForCompare])

  const handleSelectSchool = useCallback((school: School) => {
    setSelectedSchool(school)
    // Below xl there is no side panel next to the map, so the comparison chart lives in the
    // list itself — jumping to the map would be jumping away from the thing just selected.
    if (window.matchMedia(DESKTOP_QUERY).matches) setView('map')
  }, [])

  const hasActive = hasActiveFilters(filters)
  const showPanel = view === 'list' || hasActive || selectedSchool !== null

  const clearSelection = useCallback(() => setSelectedSchool(null), [])

  const handleToggleCompare = useCallback((school: School) => {
    setPinnedForCompare((prev) => {
      if (prev.some((s) => s.id === school.id)) return prev.filter((s) => s.id !== school.id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, school]
    })
  }, [])

  const handleRemoveCompare = useCallback((schoolId: string) => {
    setPinnedForCompare((prev) => prev.filter((s) => s.id !== schoolId))
  }, [])

  const handleClearCompare = useCallback(() => {
    setPinnedForCompare([])
    setCompareMode(false)
  }, [])

  const handleViewCompare = useCallback(() => setCompareMode(true), [])
  const handleBackFromCompare = useCallback(() => setCompareMode(false), [])

  const compareIds = useMemo(() => new Set(pinnedForCompare.map((s) => s.id)), [pinnedForCompare])
  const canAddCompare = pinnedForCompare.length < MAX_COMPARE
  const showCompareView = compareMode && pinnedForCompare.length >= 2

  const getCompareDistanceMiles = useCallback((school: School) => {
    const proximity = filters.proximity
    if (!proximity || school.lat == null || school.lng == null) return null
    return haversineDistanceMiles(proximity.lat, proximity.lng, school.lat, school.lng)
  }, [filters.proximity])

  const { schools: filteredSchools } = useSchools(filters)

  const filterCount =
    filters.schoolTypes.length +
    filters.schoolLevels.length +
    filters.starRatings.length +
    (filters.county !== null ? 1 : 0) +
    (filters.proximity !== null ? 1 : 0)

  function clearFilters() {
    setFilters(parseFilters(new URLSearchParams()))
    handleClearCompare()
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
              className={`w-14 py-0.5 text-xs font-bold text-center transition-colors ${view === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:border-gray-400'}`}
            >
              Map
            </button>
            {/* The selection survives the trip, so coming back to the map lands on the same
                school with its popup open. */}
            <button
              onClick={() => setView('list')}
              className={`w-14 py-0.5 text-xs font-bold text-center border-l border-gray-300 transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:border-gray-400'}`}
            >
              List
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
        onViewSchools={() => { setView('list'); clearSelection(); handleBackFromCompare() }}
        filterCount={filterCount}
        schoolCount={filteredSchools.length}
      />

      {/* Comparison tray — sits under the filter bar so it's visible from both map and list
          views. Hidden once the compare view itself is open, since "Back to results" on any
          column already provides a way out. */}
      {pinnedForCompare.length > 0 && !compareMode && (
        <CompareTray
          schools={pinnedForCompare}
          onRemove={handleRemoveCompare}
          onClear={handleClearCompare}
          onView={handleViewCompare}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {/* Compare view covers the whole main area — the same space the map or list tab
            would otherwise fill — rather than being squeezed into the 1/3 side panel. Kept as a
            CSS-hidden sibling (not conditionally unmounted) so the map underneath keeps its
            zoom/pan state across compare toggles, matching the existing map/list pattern. */}
        <div className={showCompareView ? 'h-full' : 'hidden'}>
          <CompareColumns schools={pinnedForCompare} onExit={handleBackFromCompare} getDistanceMiles={getCompareDistanceMiles} />
        </div>
        <div className={showCompareView ? 'hidden' : 'flex xl:flex-row h-full'}>
          {showPanel && (
            <div
              ref={mobileListRef}
              className={
                view === 'list'
                  ? 'w-full h-full overflow-y-auto'
                  : 'hidden xl:block shrink-0 xl:w-1/3 overflow-y-auto'
              }
            >
              <FilterResults
                filters={filters}
                selectedSchool={selectedSchool}
                onSelectSchool={handleSelectSchool}
                onClearSelection={clearSelection}
                onZoneResult={(ids) => setFilters((f) => ({ ...f, zonedSchoolIds: ids }))}
                onZoneFallback={handleZoneFallback}
                compareIds={compareIds}
                onToggleCompare={handleToggleCompare}
                canAddCompare={canAddCompare}
              />
            </div>
          )}
          <div className={view === 'map' ? 'flex-1 min-h-0' : 'hidden'}>
            <MapView
              filters={filters}
              selectedSchool={selectedSchool}
              isVisible={view === 'map' && !showCompareView}
              onSelectSchool={handleSelectSchool}
              onCountyFilter={(county) => setFilters((f) => ({ ...f, county }))}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              canAddCompare={canAddCompare}
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
