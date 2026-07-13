'use client'

import type { SchoolLevel } from '@/types/school'

const ALL_LEVELS: SchoolLevel[] = ['Elementary', 'Middle', 'High']

interface LevelFilterProps {
  value: SchoolLevel[]
  onChange: (value: SchoolLevel[]) => void
}

export default function LevelFilter({ value, onChange }: LevelFilterProps) {
  function toggle(level: SchoolLevel) {
    const next = value.includes(level)
      ? value.filter((l) => l !== level)
      : [...value, level]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {ALL_LEVELS.map((level) => {
        const active = value.includes(level)
        return (
          <button
            key={level}
            onClick={() => toggle(level)}
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {level}
            <span aria-hidden="true" className="inline-block w-2.5 text-center opacity-70">
              {active ? '×' : '+'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
