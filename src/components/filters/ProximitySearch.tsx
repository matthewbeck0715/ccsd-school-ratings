'use client'

import { useState } from 'react'
import type { ProximityFilter } from '@/types/school'
import { geocodeAddress } from '@/utils/geocode'

interface ProximitySearchProps {
  proximity: ProximityFilter | null
  onChange: (proximity: ProximityFilter | null) => void
}

export default function ProximitySearch({ proximity, onChange }: ProximitySearchProps) {
  const [address, setAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    const trimmed = address.trim()
    if (!trimmed) return
    setSearching(true)
    setError(null)
    try {
      const result = await geocodeAddress(trimmed)
      onChange({ ...result, radiusMiles: proximity?.radiusMiles ?? 3 })
      setAddress('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Geocoding failed')
    } finally {
      setSearching(false)
    }
  }

  function handleGeolocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setSearching(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radiusMiles: proximity?.radiusMiles ?? 3,
          label: 'My location',
        })
        setSearching(false)
      },
      (err) => {
        setError(err.message || 'Could not get your location')
        setSearching(false)
      }
    )
  }

  return (
    <>
      <input
        type="text"
        placeholder="Enter address…"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        disabled={searching}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-[160px] max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
      />
      <button
        onClick={handleSearch}
        disabled={searching || !address.trim()}
        className="px-2.5 py-1.5 text-xs font-bold border rounded transition-colors bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
      >
        {searching ? 'Searching…' : 'Search'}
      </button>
      <button
        onClick={handleGeolocation}
        disabled={searching}
        className="px-2.5 py-1.5 text-xs font-bold border rounded transition-colors bg-white text-gray-600 border-gray-300 hover:border-gray-400 disabled:opacity-40 whitespace-nowrap"
      >
        Use my location
      </button>

      {error && (
        <p className="text-xs text-red-600 w-full">{error}</p>
      )}
    </>
  )
}
