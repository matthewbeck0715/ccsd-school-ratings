'use client'

import { useState, useEffect } from 'react'
import type { FilterState } from '@/types/school'
import SchoolSearch from './SchoolSearch'
import ProximitySearch from './ProximitySearch'
import CountyFilter from './CountyFilter'
import LevelFilter from './LevelFilter'
import TypeFilter from './TypeFilter'
import StarFilter from './StarFilter'
import ProximityStatus from './ProximityStatus'

interface FilterDrawerProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
  filterCount: number
  schoolCount: number
}

export default function FilterDrawer({ filters, onChange, onClear, filterCount, schoolCount }: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl xl:hidden flex flex-col overflow-hidden max-h-[85vh] transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 4.5rem))', boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Drag handle + header row */}
        <div
          className="w-full shrink-0 h-18 cursor-pointer"
          onClick={() => setIsOpen((o) => !o)}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1.5" />
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900">Filter By</span>
              <span className="text-xs text-gray-500">
                {filterCount > 0
                  ? `${filterCount} filter${filterCount !== 1 ? 's' : ''} applied`
                  : 'No filters applied'}
              </span>
            </div>
            {isOpen ? (
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                aria-label="Close filters"
                className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <span className="text-sm text-gray-600">{schoolCount === 0 ? 'No' : schoolCount} {schoolCount === 1 ? 'school' : 'schools'} matched</span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 shrink-0" />

        {/* Scrollable body */}
        <div className="overflow-y-auto px-4 py-4 space-y-6">

          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">School</p>
            <SchoolSearch
              value={filters.search}
              onChange={(search) => onChange({ ...filters, search })}
            />
          </section>

          <section>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${addressError ? 'text-red-600' : 'text-gray-500'}`}>
              {addressError ? 'Address Not Found' : 'Address'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ProximitySearch
                proximity={filters.proximity}
                onChange={(proximity, county) => onChange({ ...filters, proximity: proximity ?? null, county: county ?? filters.county })}
                onError={setAddressError}
              />
            </div>
          </section>

          {filters.proximity && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distance</p>
              <ProximityStatus
                proximity={filters.proximity}
                onChange={(proximity) =>
                  onChange({ ...filters, proximity: proximity ?? null, zonedSchoolIds: proximity === null ? [] : filters.zonedSchoolIds })
                }
              />
            </section>
          )}

          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">County</p>
            <CountyFilter
              value={filters.county}
              onChange={(county) => onChange({ ...filters, county })}
            />
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Level</p>
            <LevelFilter
              value={filters.schoolLevels}
              onChange={(schoolLevels) => onChange({ ...filters, schoolLevels })}
            />
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Type</p>
            <TypeFilter
              value={filters.schoolTypes}
              onChange={(schoolTypes) => onChange({ ...filters, schoolTypes })}
            />
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stars</p>
            <StarFilter
              value={filters.starRatings}
              onChange={(starRatings) => onChange({ ...filters, starRatings })}
            />
          </section>

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-3 border-t border-gray-200 shrink-0">
          <button
            onClick={onClear}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View {schoolCount} {schoolCount === 1 ? 'School' : 'Schools'}
          </button>
        </div>

      </div>
    </>
  )
}
