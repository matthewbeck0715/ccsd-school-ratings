'use client'

import type { School } from '@/types/school'

// Sits under the filter bar, in both map and list views, so a school checked for
// comparison while browsing the map is still there when the user switches to the list tab.
export default function CompareTray({
  schools,
  onRemove,
  onView,
}: {
  schools: School[]
  onRemove: (schoolId: string) => void
  onView: () => void
}) {
  const hasSchools = schools.length > 0
  const canView = schools.length >= 2

  return (
    // Row 1 (label + view) and row 2 (chips, or an invisible same-sized spacer when empty) are
    // always both mounted — including when nothing is pinned — so the tray's height never jumps
    // when the first/last school is added or removed. Below xl they stack; at xl the
    // label-and-buttons div goes `contents` so its children re-flatten into a single wrapping row
    // with the chips row (xl:order-2) between the label (xl:order-1) and the view button (xl:order-3).
    <div className="flex flex-col gap-2 border-b border-gray-200 bg-blue-50 px-4 py-2 xl:flex-row xl:flex-wrap xl:items-center xl:gap-0">
      <div className="flex items-center justify-between gap-3 xl:contents">
        <span className={`shrink-0 text-xs font-semibold text-gray-600 ${hasSchools ? 'xl:w-36' : ''}`}>
          {hasSchools ? (
            `Comparing ${schools.length} ${schools.length === 1 ? 'school' : 'schools'}`
          ) : (
            <>
              Tap <span className="text-blue-600">Compare</span> on 2 or more schools to see them side by side
            </>
          )}
        </span>
        <div className="flex shrink-0 items-center gap-3 xl:order-3 xl:ml-auto">
          {/* Always exactly one pill-sized element here (rounded border, px-2.5 py-0.5, text-xs) —
              an invisible spacer, the "pick more" hint, or the button — so this row's height stays
              the same whether 0, 1, or 2+ schools are pinned. */}
          {!hasSchools && (
            <span aria-hidden="true" className="invisible rounded border px-2.5 py-0.5 text-xs font-bold">
              spacer
            </span>
          )}
          {hasSchools && !canView && (
            <span className="rounded border border-transparent px-2.5 py-0.5 text-xs text-gray-400">
              Pick at least 1 more to compare
            </span>
          )}
          {canView && (
            <button
              onClick={onView}
              className="rounded border border-blue-600 bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
            >
              View Comparison
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 xl:order-2">
        {hasSchools ? (
          schools.map((school) => (
            <button
              key={school.id}
              onClick={() => onRemove(school.id)}
              aria-label={`Remove ${school.name} from comparison`}
              className="inline-flex max-w-[12rem] items-center gap-1.5 rounded border border-blue-600 bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
            >
              <span className="truncate">{school.name}</span>
              <span aria-hidden="true" className="shrink-0 text-blue-100">
                ×
              </span>
            </button>
          ))
        ) : (
          <span
            aria-hidden="true"
            className="invisible inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-bold"
          >
            spacer
          </span>
        )}
      </div>
    </div>
  )
}
