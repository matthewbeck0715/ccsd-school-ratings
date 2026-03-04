import dynamic from 'next/dynamic'
import type { FilterState } from '@/types/school'

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
}

export default function MapView({ filters }: MapViewProps) {
  return (
    <div className="w-full h-full">
      <MapInner filters={filters} />
    </div>
  )
}
