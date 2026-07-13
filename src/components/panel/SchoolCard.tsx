'use client'

import type { School } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'

// Fixed width rather than content-sized, so the metric columns line up card to card
// instead of each grid sizing to its own widest cell. Wide enough for "Math Growth - MGP",
// the longest label, to sit on one line; gap is kept tight so the address column isn't
// squeezed more than necessary.
const METRIC_GRID_CLASS = 'grid grid-cols-2 gap-x-1 gap-y-1 text-xs shrink-0 w-64'

interface SchoolCardProps {
  school: School
  distanceMiles?: number | null
  onSelect: (school: School) => void
}

function pct(val: number | string | null | undefined): string {
  return val != null ? `${val}%` : '—'
}

function pctile(val: number | null | undefined): string {
  return val != null ? String(Math.round(val)) : '—'
}

function getMapsUrl(query: string): string {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return `maps://?q=${encodeURIComponent(query)}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export default function SchoolCard({ school, distanceMiles, onSelect }: SchoolCardProps) {
  return (
    <button
      onClick={() => onSelect(school)}
      className="rounded-lg border border-gray-200 p-3 bg-white text-left hover:border-blue-400 hover:shadow-sm transition-colors"
    >
      {/* Title row */}
      <div className="flex items-center gap-2 mb-1">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate min-w-0">{school.name}</p>
        <span className="shrink-0 text-xs font-medium" style={{ color: getMarkerColor(school.starRating) }}>
          {school.starRating !== null ? '★'.repeat(school.starRating) : 'NR'}
        </span>
        {distanceMiles != null && (
          <span className="text-xs text-gray-400 shrink-0">{distanceMiles.toFixed(1)} mi</span>
        )}
        <span
          className="ml-auto shrink-0 text-sm font-bold"
          style={{ color: getMarkerColor(school.starRating) }}
        >
          {Math.trunc(school.indexScore)}
        </span>
      </div>

      {/* Details + metrics */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">{school.level} · {school.type}</p>
          {school.address && school.city && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name}, ${school.address}, ${school.city}, NV ${school.zip ?? ''}`.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                const query = `${school.name}, ${school.address}, ${school.city}, NV ${school.zip ?? ''}`.trim()
                window.open(getMapsUrl(query), '_blank', 'noopener,noreferrer')
              }}
              className="text-xs text-blue-500 hover:underline mt-0.5 inline-block"
            >
              <span className="block">{school.address}</span>
              <span className="block">{school.city}, NV{school.zip ? ` ${school.zip}` : ''}</span>
            </a>
          )}
        </div>
        <div className={METRIC_GRID_CLASS}>
          <div>
            <div className="text-gray-400">ELA Proficient</div>
            <div className="font-medium">{pct(school.elaProficient)}</div>
          </div>
          <div>
            <div className="text-gray-400">Math Proficient</div>
            <div className="font-medium">{pct(school.mathProficient)}</div>
          </div>
          <div>
            <div className="text-gray-400">ELA Growth - AGP</div>
            <div className="font-medium">{pct(school.elaGrowth)}</div>
          </div>
          <div>
            <div className="text-gray-400">Math Growth - AGP</div>
            <div className="font-medium">{pct(school.mathGrowth)}</div>
          </div>
          <div>
            <div className="text-gray-400">ELA Growth - MGP</div>
            <div className="font-medium">{pctile(school.elaMgp)}</div>
          </div>
          <div>
            <div className="text-gray-400">Math Growth - MGP</div>
            <div className="font-medium">{pctile(school.mathMgp)}</div>
          </div>
        </div>
      </div>
    </button>
  )
}
