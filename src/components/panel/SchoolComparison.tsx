'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { School } from '@/types/school'
import StarRating from '@/components/StarRating'
import { getMarkerColor } from '@/utils/markerColors'
import { useCountyAverages } from '@/hooks/useCountyAverages'
import { countyAndStateAverages, formatDelta, deltaColor, scopeLabel } from '@/utils/countyAverages'
import { formatPercentile } from '@/utils/format'
import { getMapsUrl } from '@/utils/maps'

// The school is the subject: it gets the bar. The county and state are context, drawn as
// reference marks on the same 0–100% scale. They use different shapes rather than just
// different colors because Clark's averages sit within a point of the state's — two marks
// in the same plane would land on top of each other and become one smudge.
const CAP = 100

function toNum(val: number | string | null | undefined): number | null {
  if (val == null || val === '') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

function pos(val: number): string {
  return `${Math.max(0, Math.min(CAP, val))}%`
}

// Proficiency and growth are percentages; MGP is a percentile, formatted via formatPercentile.
type Unit = 'percent' | 'percentile'

function fmt(val: number, unit: Unit = 'percent'): string {
  return unit === 'percentile' ? formatPercentile(val) : `${val.toFixed(1)}%`
}

interface TooltipInfo {
  name: string
  description: string
}

// title gives desktop hover a native tooltip; the click-toggle popover is what makes this
// reachable on mobile, where there's no hover state to trigger title on. Every tooltip leads
// with the metric's name so the format reads the same regardless of which metric it's on.
function InfoTooltip({ name, description }: TooltipInfo) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('click', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        title={`${name}: ${description}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[9px] font-semibold leading-none text-gray-400 cursor-help"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-md border border-gray-200 bg-white p-2 text-[11px] leading-snug shadow-lg"
        >
          <span className="block font-semibold text-gray-900">{name}</span>
          <span className="mt-0.5 block font-normal text-gray-600">{description}</span>
        </span>
      )}
    </span>
  )
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
function MetricBar({ label, value, county = null, state = null, countyName = null, unit = 'percent', emptyLabel = 'Not reported', tooltip }: {
  label: string
  value: number | null
  county?: number | null
  state?: number | null
  countyName?: string | null
  unit?: Unit
  emptyLabel?: string
  tooltip?: TooltipInfo
}) {
  if (value === null) {
    return (
      <div>
        <div className="flex min-w-0 items-center gap-1 text-xs font-semibold text-gray-700">
          {label}
          {tooltip && <InfoTooltip {...tooltip} />}
        </div>
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
        <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-gray-700">
          {label}
          {tooltip && <InfoTooltip {...tooltip} />}
        </span>
        <span className="shrink-0 text-sm font-semibold text-gray-900">{fmt(value, unit)}</span>
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

      {(countyDelta || stateDelta) && (
        <div className="mt-1 text-[11px]">
          {countyDelta && (
            <span className={deltaColor(countyDelta)}>{countyDelta} vs {countyName}</span>
          )}
          {countyDelta && stateDelta && <span className="mx-1.5 text-gray-300">·</span>}
          {stateDelta && <span className={deltaColor(stateDelta)}>{stateDelta} vs Nevada</span>}
        </div>
      )}
    </div>
  )
}

function CopyLinkButton({ school }: { school: School }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        const url = new URL(window.location.href)
        url.searchParams.set('ids', school.id)
        // Set directly rather than relying on the debounced address-bar sync to have already run
        // — the link is correct even if copied immediately after selecting the school.
        if (school.county) url.searchParams.set('county', school.county)
        else url.searchParams.delete('county')
        url.searchParams.set('levels', school.level)
        try {
          await navigator.clipboard.writeText(url.toString())
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard unavailable (permissions, insecure context) — nothing more to do.
        }
      }}
      className="shrink-0 rounded px-1 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
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

export default function SchoolComparison({ school, distanceMiles, onClear }: {
  school: School
  distanceMiles?: number | null
  onClear: () => void
}) {
  const countyAvgMap = useCountyAverages()
  const { county, state } = countyAndStateAverages(countyAvgMap, school)
  const countyName = school.county ? scopeLabel(school.county) : null

  return (
    <div>
      {/* The chart stands in for the whole results list, so the way back is a back control,
          not a dismiss ✕ on something sitting above the list. */}
      <div className="mb-3 -ml-1 flex items-center justify-between">
        <button
          onClick={onClear}
          className="rounded px-1 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
        >
          ← Back to results
        </button>
        <CopyLinkButton school={school} />
      </div>

      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 font-semibold text-gray-900 text-sm leading-tight truncate">{school.name}</p>
          <span className="shrink-0 text-xs">
            <StarRating rating={school.starRating} />
          </span>
          {distanceMiles != null && (
            <span className="text-xs text-gray-400 shrink-0">{distanceMiles.toFixed(1)} mi</span>
          )}
          <span
            className="ml-auto shrink-0 text-sm font-bold"
            style={{ color: getMarkerColor(school.starRating) }}
          >
            {Math.trunc(school.indexScore)}
          </span>
        </div>
        <p className="text-xs text-gray-500">{school.level} · {school.type}</p>
        {school.address && school.city && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name}, ${school.address}, ${school.city}, NV ${school.zip ?? ''}`.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault()
              const query = `${school.name}, ${school.address}, ${school.city}, NV ${school.zip ?? ''}`.trim()
              window.open(getMapsUrl(query), '_blank', 'noopener,noreferrer')
            }}
            className="text-xs text-blue-500 hover:underline mt-0.5 inline-block"
          >
            <span className="block">{school.address}</span>
            <span className="block">{school.city}, NV{school.zip ? ` ${school.zip}` : ''}</span>
          </a>
        )}
      </div>

      <Section title="Proficiency">
        <MetricBar
          label="ELA Proficiency"
          value={toNum(school.elaProficiency)}
          county={county?.elaProficiency ?? null}
          state={state?.elaProficiency ?? null}
          countyName={countyName}
          tooltip={{
            name: 'Proficiency',
            description: 'Percentage of students who met grade-level standards on Nevada state assessments.',
          }}
        />
        <MetricBar
          label="Math Proficiency"
          value={toNum(school.mathProficiency)}
          county={county?.mathProficiency ?? null}
          state={state?.mathProficiency ?? null}
          countyName={countyName}
          tooltip={{
            name: 'Proficiency',
            description: 'Percentage of students who met grade-level standards on Nevada state assessments.',
          }}
        />
      </Section>

      {/* MGP isn't reported for high schools, and AGP alone doesn't earn the section — so
          high schools skip Growth entirely rather than show a half-empty chart. */}
      {school.level !== 'High' && (
        <Section title="Growth">
          <MetricBar
            label="ELA % Met AGP"
            value={toNum(school.elaGrowth)}
            tooltip={{
              name: 'Adequate Growth Percentile',
              description: "Each student has their own AGP, a growth target based on reaching or staying proficient. This metric is the percentage of students who met their individual AGP.",
            }}
          />
          <MetricBar
            label="ELA MGP"
            value={school.elaMgp}
            unit="percentile"
            tooltip={{
              name: 'Median Growth Percentile',
              description: "Each student gets a growth percentile from the Nevada Growth Model, based on their year-over-year progress compared to academic peers statewide with similar prior test scores. This metric is the median of those individual percentiles across the school; 50 is typical growth.",
            }}
          />
          <MetricBar
            label="Math % Met AGP"
            value={toNum(school.mathGrowth)}
            tooltip={{
              name: 'Adequate Growth Percentile',
              description: "Each student has their own AGP, a growth target based on reaching or staying proficient. This metric is the percentage of students who met their individual AGP.",
            }}
          />
          <MetricBar
            label="Math MGP"
            value={school.mathMgp}
            unit="percentile"
            tooltip={{
              name: 'Median Growth Percentile',
              description: "Each student gets a growth percentile from the Nevada Growth Model, based on their year-over-year progress compared to academic peers statewide with similar prior test scores. This metric is the median of those individual percentiles across the school; 50 is typical growth.",
            }}
          />
        </Section>
      )}
    </div>
  )
}
