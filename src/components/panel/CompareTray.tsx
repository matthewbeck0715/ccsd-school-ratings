'use client'

import type { School } from '@/types/school'

// Sits under the filter bar, in both map and table views, so a school checked for
// comparison while browsing the map is still there when the user switches to the table.
export default function CompareTray({
  schools,
  onRemove,
  onClear,
  onView,
}: {
  schools: School[]
  onRemove: (schoolId: string) => void
  onClear: () => void
  onView: () => void
}) {
  const canView = schools.length >= 2

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-blue-50 px-4 py-2">
      <span className="shrink-0 text-xs font-semibold text-gray-600">
        Comparing {schools.length} {schools.length === 1 ? 'school' : 'schools'}:
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {schools.map((school) => (
          <span
            key={school.id}
            className="inline-flex max-w-[12rem] items-center gap-1.5 rounded border border-blue-600 bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white"
          >
            <span className="truncate">{school.name}</span>
            <button
              onClick={() => onRemove(school.id)}
              aria-label={`Remove ${school.name} from comparison`}
              className="shrink-0 text-blue-100 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {!canView && (
          <span className="text-xs text-gray-400">Pick at least 1 more to compare</span>
        )}
        {canView && (
          <button
            onClick={onView}
            className="rounded border border-blue-600 bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
          >
            View Comparison
          </button>
        )}
        <button
          onClick={onClear}
          className="rounded border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-bold text-gray-600 transition-colors hover:border-gray-400"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
