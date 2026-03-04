'use client'

import { useState } from 'react'
import type { FilterState } from '@/types/school'
import FilterControls from '@/components/filters/FilterControls'
import MapView from '@/components/map/MapView'
import TableView from '@/components/table/TableView'

const DEFAULT_FILTERS: FilterState = {
  search: '',
  schoolLevels: [],
  starRatings: [],
}

export default function Home() {
  const [view, setView] = useState<'map' | 'table'>('map')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 leading-tight">
          CCSD School Ratings
        </h1>
        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm shrink-0">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 transition-colors ${
              view === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 border-l border-gray-300 transition-colors ${
              view === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Table
          </button>
        </div>
      </header>

      {/* Filters */}
      <FilterControls filters={filters} onChange={setFilters} />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'map' ? (
          <MapView filters={filters} />
        ) : (
          <TableView filters={filters} />
        )}
      </main>
    </div>
  )
}
