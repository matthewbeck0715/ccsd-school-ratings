'use client'

import { useState, useEffect, useMemo } from 'react'
import type { School, FilterState } from '@/types/school'

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
    return schools.filter((school) => {
      if (
        filters.search &&
        !school.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }
      if (
        filters.schoolLevels.length > 0 &&
        !filters.schoolLevels.includes(school.level)
      ) {
        return false
      }
      if (
        filters.starRatings.length > 0 &&
        !filters.starRatings.includes(school.starRating)
      ) {
        return false
      }
      return true
    })
  }, [schools, filters])

  return { schools: filtered, loading, error }
}
