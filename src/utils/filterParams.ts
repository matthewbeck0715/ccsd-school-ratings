import type { FilterState, SchoolType, SchoolLevel, StarRating } from '@/types/school'
import { DEFAULT_FILTERS } from '@/types/school'

const VALID_TYPES = new Set<string>(['District', 'Charter', 'Magnet'])
const VALID_LEVELS = new Set<string>(['Elementary', 'Middle', 'High'])
const VALID_STARS = new Set<number>([1, 2, 3, 4, 5])

// Whether the user has narrowed the list at all. Gates the results panel, which without a
// filter would be a card for every school in Nevada.
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.search !== '' ||
    filters.schoolTypes.length > 0 ||
    filters.schoolLevels.length > 0 ||
    filters.starRatings.length > 0 ||
    filters.county !== null ||
    filters.proximity !== null
  )
}

export function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.search) params.set('q', filters.search)
  if (filters.schoolTypes.length) params.set('types', filters.schoolTypes.join(','))
  if (filters.schoolLevels.length) params.set('levels', filters.schoolLevels.join(','))
  if (filters.starRatings.length) {
    params.set('stars', filters.starRatings.map(s => (s === null ? '0' : String(s))).join(','))
  }
  if (filters.county) params.set('county', filters.county)
  // Proximity (lat/lng/radius/label) is deliberately never written to the URL — it can carry a
  // user's home/work address, and the URL is what gets copied, bookmarked, and logged. It still
  // gets parsed below for backward compatibility with old links, but never re-serialized.

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

// A separate top-level param rather than part of FilterState — selection isn't a filter. Written
// as a comma-separated list (like types/levels/stars); the caller decides which URL key it lands
// under ('ids' for the single viewed-school deep link, 'compare' for the comparison tray).
export function serializeSchoolIds(ids: string[]): string | null {
  return ids.length ? ids.join(',') : null
}

export function parseSchoolIds(params: URLSearchParams, key = 'ids'): string[] {
  const raw = params.get(key)
  return raw ? raw.split(',').filter(Boolean) : []
}
