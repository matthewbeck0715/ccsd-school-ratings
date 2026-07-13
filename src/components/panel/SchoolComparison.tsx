'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { School } from '@/types/school'
import StarRating from '@/components/StarRating'
import { getMarkerColor } from '@/utils/markerColors'
import { useCountyAverages } from '@/hooks/useCountyAverages'
import { countyAndStateAverages, formatDelta, deltaColor, scopeLabel } from '@/utils/countyAverages'
import { formatPercentile } from '@/utils/format'
import { getMapsUrl } from '@/utils/maps'

// School, county, and state each get their own bar on the same 0–100% scale, so their
// literal lengths are directly comparable rather than one bar plus reference marks.
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

// Three separate bars (school, county, state) rather than one bar with reference marks —
// each row is its own literal length, so "how does this school stack up" reads directly off
// the chart instead of requiring the reader to interpret a tick's position within a fill.
function Bar({ rowLabel, value, unit, color, title }: {
  rowLabel: string
  value: number
  unit: Unit
  color: string
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 truncate text-[11px] text-gray-500" title={rowLabel}>{rowLabel}</span>
      <div className="relative h-2.5 flex-1 rounded-sm bg-gray-100">
        <div className={`absolute inset-y-0 left-0 rounded-r ${color}`} style={{ width: pos(value) }} title={title} />
        {/* Sits right after the fill's edge, on the bar's own line. min() caps how far right
            it can start so there's always room for the longest label ("100th percentile")
            before the track's right edge, rather than running off it. */}
        <span
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-1.5 text-[11px] font-semibold text-gray-900 tabular-nums"
          style={{ left: `min(${pos(value)}, calc(100% - 7rem))` }}
        >
          {fmt(value, unit)}
        </span>
      </div>
    </div>
  )
}

// county/state are null for the growth-percentage metrics — NDE publishes no averages for them,
// so those bars carry only the school's row.
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

  return (
    <div>
      <div className="flex min-w-0 items-center gap-1 text-xs font-semibold text-gray-700">
        {label}
        {tooltip && <InfoTooltip {...tooltip} />}
      </div>

      <div className="mt-1.5 flex flex-col gap-1.5">
        <Bar rowLabel="This school" value={value} unit={unit} color="bg-blue-600" title={`This school: ${fmt(value, unit)}`} />
        {county !== null && (
          <Bar rowLabel={countyName ?? 'County'} value={county} unit={unit} color="bg-gray-500" title={`${countyName}: ${fmt(county, unit)}`} />
        )}
        {state !== null && (
          <Bar rowLabel="Nevada" value={state} unit={unit} color="bg-gray-300" title={`Nevada: ${fmt(state, unit)}`} />
        )}
      </div>

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
        // Never let a shared link carry the proximity search — it can reveal the sharer's
        // home/work address. The URL sync effect strips these within ~300ms of any change, but
        // don't rely on that timing here.
        url.searchParams.delete('lat')
        url.searchParams.delete('lng')
        url.searchParams.delete('radius')
        url.searchParams.delete('label')
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
