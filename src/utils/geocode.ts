interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; label: string }> {
  const params = new URLSearchParams({
    q: `${address}, Nevada`,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
    viewbox: '-120.0,42.0,-114.0,35.0',
  })

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { 'User-Agent': 'nv-school-ratings/1.0' },
    }
  )

  if (!res.ok) throw new Error('Geocoding request failed')

  const data: NominatimResult[] = await res.json()
  if (data.length === 0) throw new Error('Address not found')

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    label: address,
  }
}
