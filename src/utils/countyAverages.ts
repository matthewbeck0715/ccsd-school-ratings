import type { School, SchoolLevel } from '@/types/school'

// Official county averages published by NDE (Nevada Report Card), not computed
// from our own school list -- averaging school-level averages is statistically
// invalid because it ignores school size. NDE only publishes proficiency at the
// county level, so there are no growth or index-score averages to compare against.
// Regenerate with `node scripts/fetch-county-averages.mjs`.
export interface CountyLevelAverages {
  county: string
  level: SchoolLevel
  elaProficiency: number | null
  mathProficiency: number | null
}

// The key the statewide rows are filed under in the averages data.
export const STATE_SCOPE = 'State'

export function countyLevelKey(county: string, level: SchoolLevel): string {
  return `${county}:${level}`
}

export function scopeLabel(scope: string): string {
  return scope === STATE_SCOPE ? 'Nevada statewide' : scope
}

// Both scopes a school is charted against. Deliberately independent of the filters: the
// chart always shows the school's own county and the state, whatever the list is filtered to.
export function countyAndStateAverages(
  averages: Map<string, CountyLevelAverages> | null,
  school: School
): { county: CountyLevelAverages | null; state: CountyLevelAverages | null } {
  if (!averages) return { county: null, state: null }
  return {
    county: (school.county && averages.get(countyLevelKey(school.county, school.level))) || null,
    state: averages.get(countyLevelKey(STATE_SCOPE, school.level)) ?? null,
  }
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
