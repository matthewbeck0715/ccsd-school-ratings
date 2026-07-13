function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

// MGP is a percentile, published as a whole number. "62%" and "62" look identical at a
// glance, so this spells out the word rather than relying on the MGP label alone.
export function formatPercentile(val: number): string {
  const rounded = Math.round(val)
  return `${rounded}${ordinal(rounded)} percentile`
}
