'use client'

import type { FilterState, SchoolLevel, StarRating } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'

const ALL_LEVELS: SchoolLevel[] = ['Elementary', 'Middle', 'High']
const ALL_STARS: StarRating[] = [1, 2, 3, 4, 5]

interface FilterControlsProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export default function FilterControls({ filters, onChange }: FilterControlsProps) {
  const hasActive =
    filters.search !== '' ||
    filters.schoolLevels.length > 0 ||
    filters.starRatings.length > 0

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
    onChange({ search: '', schoolLevels: [], starRatings: [] })
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <input
          type="search"
          placeholder="Search school name…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-[160px] max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
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
      </div>
    </div>
  )
}
