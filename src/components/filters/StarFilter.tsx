'use client'

import type { StarRating } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'

const ALL_STARS: (StarRating | null)[] = [null, 1, 2, 3, 4, 5]

interface StarFilterProps {
  value: (StarRating | null)[]
  onChange: (value: (StarRating | null)[]) => void
}

export default function StarFilter({ value, onChange }: StarFilterProps) {
  function toggle(star: StarRating | null) {
    const next = value.includes(star)
      ? value.filter((s) => s !== star)
      : [...value, star]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {ALL_STARS.map((star) => {
        const active = value.includes(star)
        const color = getMarkerColor(star)
        return (
          <button
            key={star ?? 'nr'}
            onClick={() => toggle(star)}
            title={star !== null ? `${star} star${star !== 1 ? 's' : ''}` : 'Not Rated'}
            className={`inline-flex items-center justify-center gap-0.5 w-10 py-0.5 rounded text-xs font-bold border transition-colors ${
              active ? 'text-white border-transparent' : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
            style={active ? { backgroundColor: color, borderColor: color } : { color }}
          >
            {star !== null ? `${star}★` : 'NR'}
            <span aria-hidden="true" className="inline-block w-2.5 text-center opacity-70">
              {active ? '×' : '+'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
