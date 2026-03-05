'use client'

import { useState, useEffect, useMemo } from 'react'
import type { School, FilterState, SchoolWithDistance } from '@/types/school'
import { haversineDistanceMiles } from '@/utils/haversine'

export function useSchools(filters: FilterState) {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    fetch(`${basePath}/data/schools.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
        return res.json()
      })
      .then((data: School[]) => {
        setSchools(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const result: SchoolWithDistance[] = []

    for (const school of schools) {
      if (
        filters.search &&
        !school.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        continue
      }
      if (
        filters.schoolTypes.length > 0 &&
        !filters.schoolTypes.includes(school.type)
      ) {
        continue
      }
      if (
        filters.schoolLevels.length > 0 &&
        !filters.schoolLevels.includes(school.level)
      ) {
        continue
      }
      if (
        filters.starRatings.length > 0 &&
        !filters.starRatings.includes(school.starRating)
      ) {
        continue
      }

      let distanceMiles: number | null = null

      if (filters.proximity) {
        if (school.lat === null || school.lng === null) continue
        distanceMiles = haversineDistanceMiles(
          filters.proximity.lat,
          filters.proximity.lng,
          school.lat,
          school.lng
        )
        if (distanceMiles > filters.proximity.radiusMiles) continue
      }

      result.push({ ...school, distanceMiles })
    }

    if (filters.proximity) {
      result.sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
    }

    return result
  }, [schools, filters])

  return { schools: filtered, loading, error }
}
