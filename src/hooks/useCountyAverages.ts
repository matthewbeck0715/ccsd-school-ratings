'use client'

import { useState, useEffect } from 'react'
import type { School } from '@/types/school'
import { computeCountyAverages, type CountyLevelAverages } from '@/utils/countyAverages'

let _cache: Map<string, CountyLevelAverages> | null = null
let _pending: Promise<Map<string, CountyLevelAverages>> | null = null

export function useCountyAverages(): Map<string, CountyLevelAverages> | null {
  const [data, setData] = useState<Map<string, CountyLevelAverages> | null>(_cache)

  useEffect(() => {
    if (_cache) {
      setData(_cache)
      return
    }
    if (!_pending) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
      _pending = fetch(`${basePath}/data/nv-school-data.json`)
        .then(res => res.json())
        .then((schools: School[]) => {
          _cache = computeCountyAverages(schools)
          return _cache
        })
    }
    _pending.then(m => setData(m))
  }, [])

  return data
}
