'use client'

import type { School } from '@/types/school'
import SchoolComparison from './SchoolComparison'

// Reuses the existing single-school detail panel per column rather than a bespoke table —
// "Back to results" on any column exits compare mode the same way it exits a solo selection,
// leaving the pinned set intact so the tray can be used to swap schools back in.
export default function CompareColumns({
  schools,
  onExit,
  getDistanceMiles,
}: {
  schools: School[]
  onExit: () => void
  getDistanceMiles?: (school: School) => number | null
}) {
  return (
    // Below xl the columns can't fit side by side, so they stack and the whole panel scrolls
    // vertically instead — each column keeps its own overflow-y-auto only at xl, where the
    // columns sit in a fixed-height row instead of a page-length stack.
    <div className="flex flex-col xl:flex-row h-full divide-y xl:divide-y-0 xl:divide-x divide-gray-200 overflow-y-auto xl:overflow-y-hidden xl:overflow-x-auto bg-white">
      {schools.map((school, index) => {
        // divide-x only borders between existing columns, so with fewer than 3 schools the
        // last one has no border on its right — leaving the boundary with the blank leftover
        // third unmarked. Add it explicitly there. Only relevant at xl since below that the
        // columns stack full-width and divide-y already borders every gap.
        const isLastOfFewer = index === schools.length - 1 && schools.length < 3
        return (
          <div
            key={school.id}
            className={`w-full xl:w-1/3 xl:min-w-[320px] shrink-0 xl:overflow-y-auto px-4 py-3 ${isLastOfFewer ? 'xl:border-r border-gray-200' : ''}`}
          >
            <SchoolComparison
              school={school}
              distanceMiles={getDistanceMiles ? getDistanceMiles(school) : null}
              onClear={onExit}
            />
          </div>
        )
      })}
    </div>
  )
}
