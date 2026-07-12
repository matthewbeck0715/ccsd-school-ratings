'use client'

import type { School } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'
import type { CountyLevelAverages } from '@/utils/countyAverages'
import { formatDelta, deltaColor } from '@/utils/countyAverages'

// Shared by the county-averages banner so its tiles land in the same columns as the
// cards below it. The width is fixed rather than content-sized: each grid would
// otherwise size to its own widest cell and the two would drift out of alignment.
export const METRIC_GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-1 text-xs shrink-0 w-56'

interface SchoolCardProps {
  school: School
  distanceMiles?: number | null
  countyAvg?: CountyLevelAverages | null
  onSelect: (school: School) => void
}

function pct(val: number | string | null | undefined): string {
  return val != null ? `${val}%` : '—'
}

function getMapsUrl(query: string): string {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return `maps://?q=${encodeURIComponent(query)}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export default function SchoolCard({ school, distanceMiles, countyAvg, onSelect }: SchoolCardProps) {
  // NDE only publishes county proficiency, so those are the only deltas we can show.
  const elaDelta = countyAvg ? formatDelta(typeof school.elaProficient === 'number' ? school.elaProficient : null, countyAvg.elaProficient) : null
  const mathDelta = countyAvg ? formatDelta(typeof school.mathProficient === 'number' ? school.mathProficient : null, countyAvg.mathProficient) : null

  return (
    <button
      onClick={() => onSelect(school)}
      className="rounded-lg border border-gray-200 p-3 bg-white text-left hover:border-blue-400 hover:shadow-sm transition-colors"
    >
      {/* Title row */}
      <div className="flex items-baseline gap-2 mb-1">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{school.name}</p>
        {distanceMiles != null && (
          <span className="text-xs text-gray-400 shrink-0">{distanceMiles.toFixed(1)} mi</span>
        )}
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
            <div className="text-gray-400">Stars</div>
            <div className="font-medium" style={{ color: getMarkerColor(school.starRating) }}>{school.starRating !== null ? '★'.repeat(school.starRating) : 'NR'}</div>
          </div>
          <div>
            <div className="text-gray-400">Score</div>
            <div className="font-medium">{school.indexScore}</div>
          </div>
          <div>
            <div className="text-gray-400">ELA Proficient</div>
            <div className="font-medium">{pct(school.elaProficient)}{elaDelta && <span className={`ml-1 font-normal ${deltaColor(elaDelta)}`}>({elaDelta}%)</span>}</div>
          </div>
          <div>
            <div className="text-gray-400">Math Proficient</div>
            <div className="font-medium">{pct(school.mathProficient)}{mathDelta && <span className={`ml-1 font-normal ${deltaColor(mathDelta)}`}>({mathDelta}%)</span>}</div>
          </div>
          <div>
            <div className="text-gray-400">ELA Growth</div>
            <div className="font-medium">{pct(school.elaGrowth)}</div>
          </div>
          <div>
            <div className="text-gray-400">Math Growth</div>
            <div className="font-medium">{pct(school.mathGrowth)}</div>
          </div>
        </div>
      </div>
    </button>
  )
}
