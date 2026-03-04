'use client'

import { useState, useMemo } from 'react'
import { useSchools } from '@/hooks/useSchools'
import StarRating from '@/components/StarRating'
import type { FilterState, School } from '@/types/school'

type SortKey = keyof Pick<School, 'name' | 'level' | 'starRating' | 'indexScore'>

interface TableViewProps {
  filters: FilterState
}

const PAGE_SIZE = 25

export default function TableView({ filters }: TableViewProps) {
  const { schools, loading, error } = useSchools(filters)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    return [...schools].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av < bv) return sortAsc ? -1 : 1
      if (av > bv) return sortAsc ? 1 : -1
      return 0
    })
  }, [schools, sortKey, sortAsc])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageSlice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
    setPage(0)
  }

  const colClass = 'px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap'
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
              <th className={colClass + ' hidden sm:table-cell'} onClick={() => handleSort('level')}>
                Level{indicator('level')}
              </th>
              <th className={colClass} onClick={() => handleSort('starRating')}>
                Stars{indicator('starRating')}
              </th>
              <th className={colClass} onClick={() => handleSort('indexScore')}>
                Index{indicator('indexScore')}
              </th>
              <th className={colClass + ' hidden md:table-cell'}>ELA%</th>
              <th className={colClass + ' hidden md:table-cell'}>Math%</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pageSlice.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  No schools match your filters.
                </td>
              </tr>
            ) : (
              pageSlice.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{school.name}</td>
                  <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{school.level}{school.type === 'Charter' ? ' · Charter' : ''}</td>
                  <td className="px-3 py-2">
                    <StarRating rating={school.starRating} />
                  </td>
                  <td className="px-3 py-2 text-gray-700">{school.indexScore}</td>
                  <td className="px-3 py-2 text-gray-700 hidden md:table-cell">
                    {school.elaProficiency ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-700 hidden md:table-cell">
                    {school.mathProficiency ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-white text-sm">
          <span className="text-gray-500">
            Page {page + 1} of {totalPages} ({sorted.length} schools)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
