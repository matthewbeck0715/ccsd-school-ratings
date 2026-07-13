'use client'

import type { School } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'
import { formatPercentile } from '@/utils/format'
import { getMapsUrl } from '@/utils/maps'

// Fixed width rather than content-sized, so the metric columns line up card to card
// instead of each grid sizing to its own widest cell. Narrower than the longest label
// ("Math Proficiency"), which wraps to two lines here — traded for a smaller footprint;
// gap is kept tight so the address column isn't squeezed more than necessary.
const METRIC_GRID_CLASS = 'grid grid-cols-2 gap-x-0.5 gap-y-1 text-xs shrink-0 w-52'

interface SchoolCardProps {
  school: School
  distanceMiles?: number | null
  onSelect: (school: School) => void
  isComparing?: boolean
  onToggleCompare?: (school: School) => void
  compareDisabled?: boolean
}

function pct(val: number | string | null | undefined): string {
  return val != null ? `${val}%` : '—'
}

function pctile(val: number | null | undefined): string {
  return val != null ? formatPercentile(val) : '—'
}

export default function SchoolCard({ school, distanceMiles, onSelect, isComparing, onToggleCompare, compareDisabled }: SchoolCardProps) {
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
      <div className="flex gap-4 items-stretch">
        <div className="flex-1 min-w-0 flex flex-col">
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
          {onToggleCompare && (
            <label
              className={`mt-auto pt-1.5 inline-flex items-center gap-1.5 text-xs ${compareDisabled && !isComparing ? 'text-gray-300' : 'text-gray-500'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!isComparing}
                disabled={compareDisabled && !isComparing}
                onChange={(e) => {
                  e.stopPropagation()
                  onToggleCompare(school)
                }}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Compare
            </label>
          )}
        </div>
        <div className={METRIC_GRID_CLASS}>
          <div>
            <div className="text-gray-400">ELA Proficiency</div>
            <div className="font-medium">{pct(school.elaProficiency)}</div>
          </div>
          <div>
            <div className="text-gray-400">Math Proficiency</div>
            <div className="font-medium">{pct(school.mathProficiency)}</div>
          </div>
          <div>
            <div className="text-gray-400">ELA % Met AGP</div>
            <div className="font-medium">{pct(school.elaGrowth)}</div>
          </div>
          <div>
            <div className="text-gray-400">Math % Met AGP</div>
            <div className="font-medium">{pct(school.mathGrowth)}</div>
          </div>
          <div>
            <div className="text-gray-400">ELA MGP</div>
            <div className="font-medium">{pctile(school.elaMgp)}</div>
          </div>
          <div>
            <div className="text-gray-400">Math MGP</div>
            <div className="font-medium">{pctile(school.mathMgp)}</div>
          </div>
        </div>
      </div>
    </button>
  )
}
