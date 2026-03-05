'use client'

import type { FilterState, SchoolType, SchoolLevel, StarRating } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'
import ProximitySearch from './ProximitySearch'

const ALL_TYPES: SchoolType[] = ['Regular', 'Charter']
const ALL_LEVELS: SchoolLevel[] = ['Elementary', 'Middle', 'High']
const ALL_STARS: StarRating[] = [1, 2, 3, 4, 5]

interface FilterControlsProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export default function FilterControls({ filters, onChange }: FilterControlsProps) {
  const hasActive =
    filters.search !== '' ||
    filters.schoolTypes.length > 0 ||
    filters.schoolLevels.length > 0 ||
    filters.starRatings.length > 0 ||
    filters.proximity !== null

  function toggleType(type: SchoolType) {
    const next = filters.schoolTypes.includes(type)
      ? filters.schoolTypes.filter((t) => t !== type)
      : [...filters.schoolTypes, type]
    onChange({ ...filters, schoolTypes: next })
  }

  function toggleLevel(level: SchoolLevel) {
    const next = filters.schoolLevels.includes(level)
      ? filters.schoolLevels.filter((l) => l !== level)
      : [...filters.schoolLevels, level]
    onChange({ ...filters, schoolLevels: next })
  }

  function toggleStar(star: StarRating) {
    const next = filters.starRatings.includes(star)
      ? filters.starRatings.filter((s) => s !== star)
      : [...filters.starRatings, star]
    onChange({ ...filters, starRatings: next })
  }

  function clearAll() {
    onChange({ search: '', schoolTypes: [], schoolLevels: [], starRatings: [], proximity: null })
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* School name search */}
        <input
          type="search"
          placeholder="Search school name…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-[160px] max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* Address / proximity search */}
        <ProximitySearch
          proximity={filters.proximity}
          onChange={(proximity) => onChange({ ...filters, proximity })}
        />

        {/* Clear */}
        {hasActive && (
          <button
            onClick={clearAll}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {/* School level pills */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-gray-500 font-medium mr-1">Level:</span>
          {ALL_LEVELS.map((level) => {
            const active = filters.schoolLevels.includes(level)
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {level}
              </button>
            )
          })}
        </div>

        {/* School type pills */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-gray-500 font-medium mr-1">Type:</span>
          {ALL_TYPES.map((type) => {
            const active = filters.schoolTypes.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>

        {/* Star rating buttons */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-gray-500 font-medium mr-1">Stars:</span>
          {ALL_STARS.map((star) => {
            const active = filters.starRatings.includes(star)
            const color = getMarkerColor(star)
            return (
              <button
                key={star}
                onClick={() => toggleStar(star)}
                title={`${star} star${star !== 1 ? 's' : ''}`}
                className={`w-8 h-7 rounded text-xs font-bold border transition-colors ${
                  active ? 'text-white border-transparent' : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
                style={active ? { backgroundColor: color, borderColor: color } : { color }}
              >
                {star}★
              </button>
            )
          })}
        </div>

        {/* Proximity status */}
        {filters.proximity && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
              {filters.proximity.label}
            </span>
            {([3, 5, 10] as const).map((r) => (
              <button
                key={r}
                onClick={() => onChange({ ...filters, proximity: { ...filters.proximity!, radiusMiles: r } })}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  filters.proximity!.radiusMiles === r
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {r} mi
              </button>
            ))}
            <button
              onClick={() => onChange({ ...filters, proximity: null })}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
