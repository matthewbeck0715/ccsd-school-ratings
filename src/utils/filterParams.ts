import type { FilterState, SchoolType, SchoolLevel, StarRating } from '@/types/school'
import { DEFAULT_FILTERS } from '@/types/school'

const VALID_TYPES = new Set<string>(['District', 'Charter', 'Magnet'])
const VALID_LEVELS = new Set<string>(['Elementary', 'Middle', 'High'])
const VALID_STARS = new Set<number>([1, 2, 3, 4, 5])

export function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.search) params.set('q', filters.search)
  if (filters.schoolTypes.length) params.set('types', filters.schoolTypes.join(','))
  if (filters.schoolLevels.length) params.set('levels', filters.schoolLevels.join(','))
  if (filters.starRatings.length) {
    params.set('stars', filters.starRatings.map(s => (s === null ? '0' : String(s))).join(','))
  }
  if (filters.county) params.set('county', filters.county)
  if (filters.proximity) {
    params.set('lat', String(filters.proximity.lat))
    params.set('lng', String(filters.proximity.lng))
    params.set('radius', String(filters.proximity.radiusMiles))
    params.set('label', filters.proximity.label)
  }

  return params
}

export function parseFilters(params: URLSearchParams): FilterState {
  const search = params.get('q') ?? ''

  const typesStr = params.get('types')
  const schoolTypes = typesStr
    ? (typesStr.split(',').filter(t => VALID_TYPES.has(t)) as SchoolType[])
    : []

  const levelsStr = params.get('levels')
  const schoolLevels = levelsStr
    ? (levelsStr.split(',').filter(l => VALID_LEVELS.has(l)) as SchoolLevel[])
    : []

  const starsStr = params.get('stars')
  const starRatings: (StarRating | null)[] = starsStr
    ? starsStr.split(',').flatMap(s => {
        if (s === '0') return [null]
        const n = parseInt(s, 10)
        return VALID_STARS.has(n) ? [(n as StarRating)] : []
      })
    : []

  const county = params.get('county')

  const latStr = params.get('lat')
  const lngStr = params.get('lng')
  const radiusStr = params.get('radius')
  const label = params.get('label') ?? ''
  const proximity =
    latStr && lngStr && radiusStr
      ? { lat: Number(latStr), lng: Number(lngStr), radiusMiles: Number(radiusStr), label }
      : null

  return {
    ...DEFAULT_FILTERS,
    search,
    schoolTypes,
    schoolLevels,
    starRatings,
    county,
    proximity,
  }
}
