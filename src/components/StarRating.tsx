import type { StarRating as StarRatingType } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'

interface StarRatingProps {
  rating: StarRatingType | null
}

export default function StarRating({ rating }: StarRatingProps) {
  if (rating === null) {
    return <span className="text-gray-400 text-xs font-medium">NR</span>
  }
  const color = getMarkerColor(rating)
  return (
    <span style={{ color }} className="font-medium tracking-tight" title={`${rating} star${rating !== 1 ? 's' : ''}`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}
