'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSchools } from '@/hooks/useSchools'
import StarRatingComponent from '@/components/StarRating'
import type { FilterState, School, SchoolWithDistance } from '@/types/school'

type SortKey = 'name' | 'level' | 'type' | 'starRating' | 'indexScore' | 'elaProficiency' | 'mathProficiency' | 'elaGrowth' | 'mathGrowth' | 'distanceMiles'

interface TableViewProps {
  filters: FilterState
  onSelectSchool?: (school: School) => void
  compareIds?: Set<string>
  onToggleCompare?: (school: School) => void
  canAddCompare?: boolean
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 0] as const // 0 = all

// Right-aligns the integer part in a fixed-width box (3ch = widest case, "100") so the
// decimal point lands in the same spot regardless of whether the integer part is 1, 2, or
// 3 digits. Padding with spaces doesn't work here: space glyphs aren't the same width as
// digit glyphs even with tabular-nums, so the padding amount would vary by font/zoom.
function DecimalValue({ val, suffix }: { val: number; suffix: string }) {
  const [intPart, decPart] = val.toFixed(1).split('.')
  return (
    <>
      <span className="inline-block w-[3ch] text-right">{intPart}</span>.{decPart}{suffix}
    </>
  )
}

function fmtPct(val: number | string | null | undefined, suffix = '%') {
  if (val == null || val === '') return '—'
  return <DecimalValue val={Number(val)} suffix={suffix} />
}

export default function TableView({ filters, onSelectSchool, compareIds, onToggleCompare, canAddCompare = true }: TableViewProps) {
  const { schools, loading, error } = useSchools(filters)
  const [sortKey, setSortKey] = useState<SortKey>('indexScore')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(25)

  const hasProximity = filters.proximity !== null
  const colCount = (hasProximity ? 10 : 9) + (onToggleCompare ? 1 : 0)

  // Auto-sort by distance when proximity activates
  useEffect(() => {
    if (hasProximity) {
      setSortKey('distanceMiles')
      setSortAsc(true)
      setPage(0)
    } else if (sortKey === 'distanceMiles') {
      setSortKey('name')
      setSortAsc(true)
      setPage(0)
    }
  }, [hasProximity])

  const sorted = useMemo(() => {
    return [...schools].sort((a, b) => {
      const av = a[sortKey as keyof SchoolWithDistance]
      const bv = b[sortKey as keyof SchoolWithDistance]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sortAsc ? -1 : 1
      if (av > bv) return sortAsc ? 1 : -1
      return 0
    })
  }, [schools, sortKey, sortAsc])

  const effectivePageSize = pageSize === 0 ? sorted.length : pageSize
  const totalPages = effectivePageSize > 0 ? Math.ceil(sorted.length / effectivePageSize) : 1
  const pageSlice = pageSize === 0 ? sorted : sorted.slice(page * pageSize, (page + 1) * pageSize)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
    setPage(0)
  }

  const colClass = 'px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap'
  const indicator = (key: SortKey) =>
    sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : ''

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading schools…</div>
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className={colClass + ' sticky left-0 z-20 bg-gray-50 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]'} onClick={() => handleSort('name')}>
                School{indicator('name')}
              </th>
              {onToggleCompare && (
                <th className={colClass + ' w-0 cursor-default'}>Compare</th>
              )}
              {hasProximity && (
                <th className={colClass + ' w-0 text-right'} onClick={() => handleSort('distanceMiles')}>
                  Distance{indicator('distanceMiles')}
                </th>
              )}
              <th className={colClass + ' w-0'} onClick={() => handleSort('level')}>
                Level{indicator('level')}
              </th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('type')}>
                Type{indicator('type')}
              </th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('starRating')}>
                Stars{indicator('starRating')}
              </th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('indexScore')}>
                Score{indicator('indexScore')}
              </th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('elaProficiency')}>ELA Proficiency{indicator('elaProficiency')}</th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('mathProficiency')}>Math Proficiency{indicator('mathProficiency')}</th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('elaGrowth')}>ELA Growth{indicator('elaGrowth')}</th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('mathGrowth')}>Math Growth{indicator('mathGrowth')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pageSlice.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                  No schools matched
                </td>
              </tr>
            ) : (
              pageSlice.map((school) => (
                <tr key={school.id} className="group hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900 sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                    {onSelectSchool ? (
                      <button
                        onClick={() => onSelectSchool(school)}
                        className="cursor-pointer text-blue-600 hover:underline text-left whitespace-nowrap"
                      >
                        {school.name}
                      </button>
                    ) : <span className="whitespace-nowrap">{school.name}</span>}
                  </td>
                  {onToggleCompare && (
                    <td className="px-4 py-2 w-0">
                      <input
                        type="checkbox"
                        checked={!!compareIds?.has(school.id)}
                        disabled={!canAddCompare && !compareIds?.has(school.id)}
                        onChange={() => onToggleCompare(school)}
                        aria-label={`Compare ${school.name}`}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {hasProximity && (
                    <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-right">
                      {school.distanceMiles != null
                        ? `${school.distanceMiles.toFixed(1)} mi`
                        : '—'}
                    </td>
                  )}
                  <td className="px-4 py-2 w-0 text-gray-500">{school.level}</td>
                  <td className="px-4 py-2 w-0 text-gray-500">{school.type}</td>
                  <td className="px-4 py-2 w-0">
                    <StarRatingComponent rating={school.starRating} />
                  </td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-left whitespace-nowrap"><DecimalValue val={school.indexScore} suffix="" /></td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-left whitespace-nowrap">{fmtPct(school.elaProficiency)}</td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-left whitespace-nowrap">{fmtPct(school.mathProficiency)}</td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-left whitespace-nowrap">{fmtPct(school.elaGrowth)}</td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-left whitespace-nowrap">{fmtPct(school.mathGrowth)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-white text-sm">
          {/* Mobile: size selector on left. Hidden on sm+. */}
          <div className="flex xl:hidden items-center gap-1">
            <span className="text-gray-500 text-xs">Show:</span>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => { setPageSize(size); setPage(0) }}
                className={`px-2 py-1 rounded text-xs border transition-colors ${
                  pageSize === size
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {size === 0 ? 'All' : size}
              </button>
            ))}
          </div>
          {/* Desktop: count label on left. Hidden on mobile. */}
          <span className="hidden xl:inline text-gray-500">
            {sorted.length === 0 ? 'No' : sorted.length} {sorted.length === 1 ? 'school' : 'schools'} matched{totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
          </span>
          {/* Right: size selector (desktop only) + Prev/Next */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-1">
              <span className="text-gray-500 text-xs">Show:</span>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => { setPageSize(size); setPage(0) }}
                  className={`px-2 py-1 rounded text-xs border transition-colors ${
                    pageSize === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {size === 0 ? 'All' : size}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || totalPages <= 1}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1 || totalPages <= 1}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}
