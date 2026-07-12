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
        className="text-xs font-bold border rounded px-2.5 py-0.5 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors truncate max-w-40 sm:max-w-xs"
      >
        {proximity.label}
      </button>
      {([0, 3, 5, 10] as const).map((r) => {
        const disabled = r === 0 && !zoneAvailable
        return (
          <button
            key={r}
            onClick={() => onChange({ ...proximity, radiusMiles: r })}
            disabled={disabled}
            title={disabled ? 'No school zone data available for this area' : undefined}
            className={`px-2.5 py-0.5 rounded text-xs font-bold border transition-colors ${
              disabled
                ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
                : proximity.radiusMiles === r
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {r === 0 ? 'Zone' : `${r} mi`}
          </button>
        )
      })}
    </div>
  )
}
