import type { School, SchoolLevel } from '@/types/school'

export interface CountyLevelAverages {
  county: string
  level: SchoolLevel
  schoolCount: number
  ratedCount: number
  avgStarRating: number | null
  avgIndexScore: number
  avgElaProficiency: number | null
  avgMathProficiency: number | null
  avgScienceProficiency: number | null
  avgElaGrowth: number | null
  avgMathGrowth: number | null
}

export function countyLevelKey(county: string, level: SchoolLevel): string {
  return `${county}:${level}`
}

function numericVal(v: number | string | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'string' ? parseFloat(v) : v
  return isNaN(n) ? null : n
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function computeCountyAverages(schools: School[]): Map<string, CountyLevelAverages> {
  const byKey = new Map<string, School[]>()
  for (const school of schools) {
    if (!school.county || school.type === 'Charter') continue
    const key = countyLevelKey(school.county, school.level)
    const list = byKey.get(key) ?? []
    list.push(school)
    byKey.set(key, list)
  }

  const result = new Map<string, CountyLevelAverages>()
  for (const [key, list] of byKey) {
    const county = list[0].county!
    const level = list[0].level
    const stars = list.map(s => s.starRating).filter((r): r is NonNullable<typeof r> => r !== null).map(r => r as number)
    const scores = list.map(s => s.indexScore)
    const ela = list.map(s => numericVal(s.elaProficiency)).filter((v): v is number => v !== null)
    const math = list.map(s => numericVal(s.mathProficiency)).filter((v): v is number => v !== null)
    const sci = list.map(s => numericVal(s.scienceProficiency)).filter((v): v is number => v !== null)
    const elaGrowth = list.map(s => numericVal(s.elaGrowth)).filter((v): v is number => v !== null)
    const mathGrowth = list.map(s => numericVal(s.mathGrowth)).filter((v): v is number => v !== null)

    result.set(key, {
      county,
      level,
      schoolCount: list.length,
      ratedCount: stars.length,
      avgStarRating: avg(stars),
      avgIndexScore: avg(scores) ?? 0,
      avgElaProficiency: avg(ela),
      avgMathProficiency: avg(math),
      avgScienceProficiency: avg(sci),
      avgElaGrowth: avg(elaGrowth),
      avgMathGrowth: avg(mathGrowth),
    })
  }

  return result
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
