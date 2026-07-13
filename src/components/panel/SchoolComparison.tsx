'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { School } from '@/types/school'
import StarRating from '@/components/StarRating'
import { getMarkerColor } from '@/utils/markerColors'
import { useCountyAverages } from '@/hooks/useCountyAverages'
import { countyAndStateAverages, formatDelta, deltaColor, scopeLabel } from '@/utils/countyAverages'

// The school is the subject: it gets the bar. The county and state are context, drawn as
// reference marks on the same 0–100% scale. They use different shapes rather than just
// different colors because Clark's averages sit within a point of the state's — two marks
// in the same plane would land on top of each other and become one smudge.
const CAP = 100

// A growth percentile of 50 is the typical Nevada student by construction — the state median is
// the definition of the scale, not a figure we look up. It is the one reference the growth
// section can honestly draw, so MGP gets the state caret while the growth percentages get none.
const MEDIAN_PERCENTILE = 50

function mgpEmptyLabel(school: School): string {
  return school.level === 'High'
    ? 'Not reported for high schools'
    : 'Not reported'
}

function toNum(val: number | string | null | undefined): number | null {
  if (val == null || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

function pos(val: number): string {
  return `${Math.max(0, Math.min(CAP, val))}%`
}

// Proficiency and growth are percentages; MGP is a percentile, which takes no % sign and is
// published as a whole number.
type Unit = 'percent' | 'percentile'

function fmt(val: number, unit: Unit = 'percent'): string {
  return unit === 'percentile' ? String(Math.round(val)) : `${val.toFixed(1)}%`
}

function StateCaret({ className = '', style, title }: {
  className?: string
  style?: CSSProperties
  title?: string
}) {
  return (
    <span
      className={`h-0 w-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-gray-500 ${className}`}
      style={style}
      title={title}
    />
  )
}

// county/state are null for the growth-percentage metrics — NDE publishes no averages for them,
// so those bars carry the school's value alone. The bar still earns its place: it puts growth on
// the same 0–100 scale as proficiency, so the metrics read against each other at a glance.
function MetricBar({ label, value, county = null, state = null, countyName = null, unit = 'percent', sampleSize = null, emptyLabel = 'Not reported' }: {
  label: string
  value: number | null
  county?: number | null
  state?: number | null
  countyName?: string | null
  unit?: Unit
  sampleSize?: number | null
  emptyLabel?: string
}) {
  if (value === null) {
    return (
      <div>
        <div className="text-xs font-semibold text-gray-700">{label}</div>
        <div className="mt-1 text-xs text-gray-400">{emptyLabel}</div>
      </div>
    )
  }

  const countyDelta = county !== null ? formatDelta(value, county) : null
  const stateDelta = state !== null ? formatDelta(value, state) : null
  const hasMarks = county !== null || state !== null

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{fmt(value, unit)}</span>
      </div>

      {/* pt-2 reserves the plane above the track for the state caret */}
      <div className="relative pt-2">
        {state !== null && (
          <StateCaret
            className="absolute top-0 -translate-x-1/2"
            style={{ left: pos(state) }}
            title={`Nevada: ${fmt(state, unit)}`}
          />
        )}
        <div className="relative h-4 w-full rounded-sm bg-gray-100">
          <div
            className="absolute inset-y-0 left-0 rounded-r bg-blue-600"
            style={{ width: pos(value) }}
            title={`This school: ${fmt(value, unit)}`}
          />
          {county !== null && (
            // The 2px white gutters either side are the surface ring — they keep the tick
            // legible where it crosses the fill without drawing a border on the mark.
            <div
              className="absolute -inset-y-0.5 w-1.5 -translate-x-1/2 bg-white px-0.5"
              style={{ left: pos(county) }}
              title={`${countyName}: ${fmt(county, unit)}`}
            >
              <div className="h-full w-0.5 bg-gray-700" />
            </div>
          )}
        </div>
      </div>

      {/* Values live in the key, not on the marks — labelled ticks would collide whenever the
          county and state averages are close, which for Clark schools is always. With no marks
          to identify, the key would just restate the value already at the bar's tip. */}
      {hasMarks && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-600" />
            This school {fmt(value, unit)}
          </span>
          {county !== null && (
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-0.5 bg-gray-700" />
              {countyName} {fmt(county, unit)}
            </span>
          )}
          {state !== null && (
            <span className="inline-flex items-center gap-1">
              <StateCaret />
              Nevada {fmt(state, unit)}
            </span>
          )}
        </div>
      )}

      {(countyDelta || stateDelta || sampleSize != null) && (
        <div className="mt-1 text-[11px]">
          {countyDelta && (
            <span className={deltaColor(countyDelta)}>{countyDelta} vs {countyName}</span>
          )}
          {countyDelta && stateDelta && <span className="mx-1.5 text-gray-300">·</span>}
          {stateDelta && <span className={deltaColor(stateDelta)}>{stateDelta} vs Nevada</span>}
          {(countyDelta || stateDelta) && sampleSize != null && <span className="mx-1.5 text-gray-300">·</span>}
          {sampleSize != null && (
            <span className="text-gray-400">{sampleSize.toLocaleString()} students</span>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="mb-2 border-b border-gray-100 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

export default function SchoolComparison({ school, onClear }: {
  school: School
  onClear: () => void
}) {
  const countyAvgMap = useCountyAverages()
  const { county, state } = countyAndStateAverages(countyAvgMap, school)
  const countyName = school.county ? scopeLabel(school.county) : null

  return (
    <div>
      {/* The chart stands in for the whole results list, so the way back is a back control,
          not a dismiss ✕ on something sitting above the list. */}
      <button
        onClick={onClear}
        className="mb-3 -ml-1 rounded px-1 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
      >
        ← Back to results
      </button>

      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 font-semibold text-gray-900 text-sm leading-tight truncate">{school.name}</p>
          <span className="shrink-0 text-xs">
            <StarRating rating={school.starRating} />
          </span>
          <span
            className="ml-auto shrink-0 text-sm font-bold"
            style={{ color: getMarkerColor(school.starRating) }}
          >
            {Math.trunc(school.indexScore)}
          </span>
        </div>
        <p className="text-xs text-gray-500">{school.level} · {school.type}</p>
      </div>

      <Section title="Proficiency">
        <MetricBar
          label="ELA Proficient"
          value={toNum(school.elaProficient)}
          county={county?.elaProficient ?? null}
          state={state?.elaProficient ?? null}
          countyName={countyName}
        />
        <MetricBar
          label="Math Proficient"
          value={toNum(school.mathProficient)}
          county={county?.mathProficient ?? null}
          state={state?.mathProficient ?? null}
          countyName={countyName}
        />
      </Section>

      <Section title="Growth">
        <MetricBar label="ELA Growth - AGP" value={toNum(school.elaGrowth)} />
        <MetricBar
          label="ELA Growth - MGP"
          value={school.elaMgp}
          unit="percentile"
          state={MEDIAN_PERCENTILE}
          sampleSize={school.elaMgpN}
          emptyLabel={mgpEmptyLabel(school)}
        />
        <MetricBar label="Math Growth - AGP" value={toNum(school.mathGrowth)} />
        <MetricBar
          label="Math Growth - MGP"
          value={school.mathMgp}
          unit="percentile"
          state={MEDIAN_PERCENTILE}
          sampleSize={school.mathMgpN}
          emptyLabel={mgpEmptyLabel(school)}
        />
      </Section>
    </div>
  )
}
