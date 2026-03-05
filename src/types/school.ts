export type SchoolType = 'Regular' | 'Charter'
export type SchoolLevel = 'Elementary' | 'Middle' | 'High'
export type StarRating = 1 | 2 | 3 | 4 | 5

export interface School {
  id: string
  name: string
  type: SchoolType
  level: SchoolLevel
  starRating: StarRating
  indexScore: number
  elaProficiency: number | string | null
  mathProficiency: number | string | null
  scienceProficiency: number | string | null
  elaGrowth: number | string | null
  mathGrowth: number | string | null
  titleI: boolean
  lat: number | null
  lng: number | null
}

export interface ProximityFilter {
  lat: number
  lng: number
  radiusMiles: number
  label: string
}

export interface FilterState {
  search: string
  schoolTypes: SchoolType[]
  schoolLevels: SchoolLevel[]
  starRatings: StarRating[]
  proximity: ProximityFilter | null
}

export interface SchoolWithDistance extends School {
  distanceMiles: number | null
}
