'use client'

import { useEffect, useState } from 'react'
import type { ProximityFilter } from '@/types/school'
import { geocodeAddress, reverseGeocode } from '@/utils/geocode'

interface ProximitySearchProps {
  proximity: ProximityFilter | null
  onChange: (proximity: ProximityFilter | null, county: string | null) => void
  onError?: (error: string | null) => void
}

export default function ProximitySearch({ proximity, onChange, onError }: ProximitySearchProps) {
  const [address, setAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (proximity === null) {
      setAddress('')
      setError(null)
      onError?.(null)
    }
  }, [proximity])

  async function handleSearch() {
    const trimmed = address.trim()
    if (!trimmed) return
    setSearching(true)
    setError(null); onError?.(null)
    try {
      const result = await geocodeAddress(trimmed)
      onChange({ ...result, radiusMiles: proximity?.radiusMiles ?? 0 }, result.county)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Geocoding failed'
      setError(msg); onError?.(msg)
    } finally {
      setSearching(false)
    }
  }

  function handleGeolocation() {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser'
      setError(msg); onError?.(msg)
      return
    }
    setSearching(true)
    setError(null); onError?.(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const { county, label } = await reverseGeocode(lat, lng)
        onChange({
          lat,
          lng,
          radiusMiles: proximity?.radiusMiles ?? 0,
          label: label ?? 'My location',
        }, county)
        if (label) setAddress(label)
        setSearching(false)
      },
      (err) => {
        const msg = err.message || 'Could not get your location'
        setError(msg); onError?.(msg)
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
        onChange={(e) => { setAddress(e.target.value); if (error) setError(null); onError?.(null) }}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        disabled={searching}
        className={`border rounded px-3 py-1.5 text-sm flex-1 min-w-[160px] xl:min-w-64 max-w-md focus:outline-none focus:ring-2 disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400'}`}
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
    </>
  )
}
