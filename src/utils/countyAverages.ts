import type { SchoolLevel } from '@/types/school'

// Official county averages published by NDE (Nevada Report Card), not computed
// from our own school list -- averaging school-level averages is statistically
// invalid because it ignores school size. NDE only publishes proficiency at the
// county level, so there are no growth or index-score averages to compare against.
// Regenerate with `node scripts/fetch-county-averages.mjs`.
export interface CountyLevelAverages {
  county: string
  level: SchoolLevel
  elaProficient: number | null
  mathProficient: number | null
}

// Scope used for the statewide figures, which stand in when no county is selected.
export const STATE_SCOPE = 'State'

export function countyLevelKey(county: string, level: SchoolLevel): string {
  return `${county}:${level}`
}

export function formatDelta(school: number | null, countyAvg: number | null): string | null {
  if (school == null || countyAvg == null) return null
  const d = school - countyAvg
  return (d >= 0 ? '+' : '') + d.toFixed(1)
}

export function deltaColor(delta: string | null): string {
  if (!delta) return 'text-gray-400'
  return parseFloat(delta) >= 0 ? 'text-green-600' : 'text-red-500'
}
