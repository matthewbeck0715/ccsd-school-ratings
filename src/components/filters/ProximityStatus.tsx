'use client'

import type { ProximityFilter } from '@/types/school'
import { useZonedCounties } from '@/hooks/useZonedCounties'

interface ProximityStatusProps {
  proximity: ProximityFilter
  county: string | null
  onChange: (proximity: ProximityFilter | null) => void
}

export default function ProximityStatus({ proximity, county, onChange }: ProximityStatusProps) {
  const zonedCounties = useZonedCounties()
  // Before zone data has loaded, zonedCounties is empty — don't disable based on incomplete data.
  const zoneAvailable = zonedCounties.size === 0 || (county !== null && zonedCounties.has(county))

  return (
    <div className="flex flex-nowrap gap-1 items-center min-w-0">
      <button
        onClick={() => onChange(null)}
        className="inline-flex items-center gap-1 text-xs font-bold border rounded px-2.5 py-0.5 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors max-w-40 sm:max-w-xs"
      >
        <span className="truncate">{proximity.label}</span>
        <span aria-hidden="true" className="text-blue-100 shrink-0">×</span>
      </button>
      <div className="flex rounded border border-gray-300 overflow-hidden shrink-0">
        {([0, 3, 5, 10] as const).map((r, i) => {
          const disabled = r === 0 && !zoneAvailable
          return (
            <button
              key={r}
              onClick={() => onChange({ ...proximity, radiusMiles: r })}
              disabled={disabled}
              title={disabled ? 'No school zone data available for this area' : undefined}
              className={`px-2.5 py-0.5 text-xs font-bold transition-colors ${i > 0 ? 'border-l border-gray-300' : ''} ${
                disabled
                  ? 'bg-white text-gray-300 cursor-not-allowed'
                  : proximity.radiusMiles === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 0 ? 'Zone' : `${r} mi`}
            </button>
          )
        })}
      </div>
    </div>
  )
}
