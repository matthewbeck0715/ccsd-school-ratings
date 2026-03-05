'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSchools } from '@/hooks/useSchools'
import StarRatingComponent from '@/components/StarRating'
import type { FilterState, SchoolWithDistance } from '@/types/school'

type SortKey = 'name' | 'level' | 'type' | 'starRating' | 'indexScore' | 'elaProficiency' | 'mathProficiency' | 'elaGrowth' | 'mathGrowth' | 'distanceMiles'

interface TableViewProps {
  filters: FilterState
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 0] as const // 0 = all

export default function TableView({ filters }: TableViewProps) {
  const { schools, loading, error } = useSchools(filters)
  const [sortKey, setSortKey] = useState<SortKey>('indexScore')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(25)

  const hasProximity = filters.proximity !== null
  const colCount = hasProximity ? 10 : 9

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
  }, [hasProximity]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className={colClass} onClick={() => handleSort('name')}>
                School{indicator('name')}
              </th>
              {hasProximity && (
                <th className={colClass + ' w-0 text-right'} onClick={() => handleSort('distanceMiles')}>
                  Distance{indicator('distanceMiles')}
                </th>
              )}
              <th className={colClass + ' w-0 hidden sm:table-cell'} onClick={() => handleSort('level')}>
                Level{indicator('level')}
              </th>
              <th className={colClass + ' w-0 hidden sm:table-cell'} onClick={() => handleSort('type')}>
                Type{indicator('type')}
              </th>
              <th className={colClass + ' w-0'} onClick={() => handleSort('starRating')}>
                Stars{indicator('starRating')}
              </th>
              <th className={colClass + ' w-0 text-right'} onClick={() => handleSort('indexScore')}>
                Score{indicator('indexScore')}
              </th>
              <th className={colClass + ' w-0 text-right hidden md:table-cell'} onClick={() => handleSort('elaProficiency')}>ELA Proficiency{indicator('elaProficiency')}</th>
              <th className={colClass + ' w-0 text-right hidden md:table-cell'} onClick={() => handleSort('mathProficiency')}>Math Proficiency{indicator('mathProficiency')}</th>
              <th className={colClass + ' w-0 text-right hidden md:table-cell'} onClick={() => handleSort('elaGrowth')}>ELA Growth{indicator('elaGrowth')}</th>
              <th className={colClass + ' w-0 text-right hidden md:table-cell'} onClick={() => handleSort('mathGrowth')}>Math Growth{indicator('mathGrowth')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pageSlice.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400">
                  No schools match your filters.
                </td>
              </tr>
            ) : (
              pageSlice.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{school.name}</td>
                  {hasProximity && (
                    <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-right">
                      {school.distanceMiles != null
                        ? `${school.distanceMiles.toFixed(1)} mi`
                        : '—'}
                    </td>
                  )}
                  <td className="px-4 py-2 w-0 text-gray-500 hidden sm:table-cell">{school.level}</td>
                  <td className="px-4 py-2 w-0 text-gray-500 hidden sm:table-cell">{school.type}</td>
                  <td className="px-4 py-2 w-0">
                    <StarRatingComponent rating={school.starRating} />
                  </td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-right">{school.indexScore.toFixed(1)}</td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-right hidden md:table-cell">
                    {school.elaProficiency != null ? `${Number(school.elaProficiency).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-right hidden md:table-cell">
                    {school.mathProficiency != null ? `${Number(school.mathProficiency).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-right hidden md:table-cell">
                    {school.elaGrowth != null ? `${Number(school.elaGrowth).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-2 w-0 text-gray-700 tabular-nums text-right hidden md:table-cell">
                    {school.mathGrowth != null ? `${Number(school.mathGrowth).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-white text-sm">
          <span className="text-gray-500">
            {sorted.length} schools{totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
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
