import dynamic from 'next/dynamic'
import type { FilterState, School } from '@/types/school'

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
      Loading map…
    </div>
  ),
})

interface MapViewProps {
  filters: FilterState
  allSchools: School[]
  selectedSchool?: School | null
  isVisible?: boolean
  onSelectSchool?: (school: School) => void
  onCountyFilter?: (county: string) => void
  compareIds?: Set<string>
  onToggleCompare?: (school: School) => void
  canAddCompare?: boolean
}

export default function MapView({ filters, allSchools, selectedSchool, isVisible, onSelectSchool, onCountyFilter, compareIds, onToggleCompare, canAddCompare }: MapViewProps) {
  return (
    <div className="w-full h-full">
      <MapInner
        filters={filters}
        allSchools={allSchools}
        selectedSchool={selectedSchool}
        isVisible={isVisible}
        onSelectSchool={onSelectSchool}
        onCountyFilter={onCountyFilter}
        compareIds={compareIds}
        onToggleCompare={onToggleCompare}
        canAddCompare={canAddCompare}
      />
    </div>
  )
}
