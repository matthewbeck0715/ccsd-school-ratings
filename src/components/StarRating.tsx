import type { StarRating as StarRatingType } from '@/types/school'
import { getMarkerColor } from '@/utils/markerColors'

interface StarRatingProps {
  rating: StarRatingType
}

export default function StarRating({ rating }: StarRatingProps) {
  const color = getMarkerColor(rating)
  return (
    <span style={{ color }} className="font-medium tracking-tight" title={`${rating} star${rating !== 1 ? 's' : ''}`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}
