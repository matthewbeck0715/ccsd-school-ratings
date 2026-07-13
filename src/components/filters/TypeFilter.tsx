'use client'

import type { SchoolType } from '@/types/school'

const ALL_TYPES: SchoolType[] = ['District', 'Charter', 'Magnet']

interface TypeFilterProps {
  value: SchoolType[]
  onChange: (value: SchoolType[]) => void
}

export default function TypeFilter({ value, onChange }: TypeFilterProps) {
  function toggle(type: SchoolType) {
    const next = value.includes(type)
      ? value.filter((t) => t !== type)
      : [...value, type]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {ALL_TYPES.map((type) => {
        const active = value.includes(type)
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {type}
            <span aria-hidden="true" className="inline-block w-2.5 text-center opacity-70">
              {active ? '×' : '+'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
