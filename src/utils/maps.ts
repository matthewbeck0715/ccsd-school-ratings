export function getMapsUrl(query: string): string {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return `maps://?q=${encodeURIComponent(query)}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
