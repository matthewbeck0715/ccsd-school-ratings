'use client'

import React, { useEffect, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'
import type L from 'leaflet'
import { createMarkerIcon, getMarkerColor } from '@/utils/markerColors'
import type { SchoolWithDistance } from '@/types/school'
import { useCountyAverages } from '@/hooks/useCountyAverages'
import { formatDelta, deltaColor, countyLevelKey } from '@/utils/countyAverages'

interface SchoolMarkerProps {
  school: SchoolWithDistance
  isSelected?: boolean
  onSelect?: (school: SchoolWithDistance) => void
}

export default React.memo(function SchoolMarker({ school, isSelected, onSelect }: SchoolMarkerProps) {
  const icon = createMarkerIcon(school.starRating)
  const markerRef = useRef<L.Marker>(null)
  const countyAvgMap = useCountyAverages()
  const countyAvg = school.county && countyAvgMap ? countyAvgMap.get(countyLevelKey(school.county, school.level)) ?? null : null
  const scoreDelta = countyAvg ? formatDelta(school.indexScore, countyAvg.avgIndexScore) : null
  const elaDelta = countyAvg ? formatDelta(typeof school.elaProficiency === 'number' ? school.elaProficiency : null, countyAvg.avgElaProficiency) : null
  const mathDelta = countyAvg ? formatDelta(typeof school.mathProficiency === 'number' ? school.mathProficiency : null, countyAvg.avgMathProficiency) : null
  const elaGrowthDelta = countyAvg ? formatDelta(typeof school.elaGrowth === 'number' ? school.elaGrowth : null, countyAvg.avgElaGrowth) : null
  const mathGrowthDelta = countyAvg ? formatDelta(typeof school.mathGrowth === 'number' ? school.mathGrowth : null, countyAvg.avgMathGrowth) : null

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup()
    }
  }, [isSelected])

  if (school.lat === null || school.lng === null) return null

  return (
    <Marker ref={markerRef} position={[school.lat, school.lng]} icon={icon} eventHandlers={{ click: () => onSelect?.(school) }}>
      <Popup>
        <div className="min-w-[220px]">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-sm truncate min-w-0">{school.name}</p>
            {school.distanceMiles != null && (
              <span className="text-xs font-medium text-gray-500 shrink-0">{school.distanceMiles.toFixed(1)} mi</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">{school.level} · {school.type}</p>
          {school.address && school.city && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name}, ${school.address}, ${school.city}, NV ${school.zip ?? ''}`.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline mb-1 block"
            >
              <span className="block">{school.address}</span>
              <span className="block">{school.city}, NV{school.zip ? ` ${school.zip}` : ''}</span>
            </a>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-0">
            <div>
              <div className="text-gray-400">Stars</div>
              <div className="font-medium" style={{ color: getMarkerColor(school.starRating) }}>{school.starRating !== null ? '★'.repeat(school.starRating) : 'NR'}</div>
            </div>
            <div>
              <div className="text-gray-400">Score</div>
              <div className="font-medium">{school.indexScore}{scoreDelta && <span className={`ml-1 font-normal ${deltaColor(scoreDelta)}`}>({scoreDelta})</span>}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA Proficiency</div>
              <div className="font-medium">{school.elaProficiency != null ? `${school.elaProficiency}%` : '—'}{elaDelta && <span className={`ml-1 font-normal ${deltaColor(elaDelta)}`}>({elaDelta}%)</span>}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Proficiency</div>
              <div className="font-medium">{school.mathProficiency != null ? `${school.mathProficiency}%` : '—'}{mathDelta && <span className={`ml-1 font-normal ${deltaColor(mathDelta)}`}>({mathDelta}%)</span>}</div>
            </div>
            <div>
              <div className="text-gray-400">ELA Growth</div>
              <div className="font-medium">{school.elaGrowth != null ? `${school.elaGrowth}%` : '—'}{elaGrowthDelta && <span className={`ml-1 font-normal ${deltaColor(elaGrowthDelta)}`}>({elaGrowthDelta}%)</span>}</div>
            </div>
            <div>
              <div className="text-gray-400">Math Growth</div>
              <div className="font-medium">{school.mathGrowth != null ? `${school.mathGrowth}%` : '—'}{mathGrowthDelta && <span className={`ml-1 font-normal ${deltaColor(mathGrowthDelta)}`}>({mathGrowthDelta}%)</span>}</div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}, (prev, next) =>
  prev.school.id === next.school.id
  && prev.isSelected === next.isSelected
  && prev.onSelect === next.onSelect
)
