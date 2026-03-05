interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; label: string }> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    viewbox: '-115.9,36.8,-114.5,35.5',
    bounded: '1',
  })

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { 'User-Agent': 'nv-school-ratings/1.0' },
    }
  )

  if (!res.ok) throw new Error('Geocoding request failed')

  const data: NominatimResult[] = await res.json()
  if (data.length === 0) throw new Error('Address not found in Clark County area')

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    label: data[0].display_name.split(',').slice(0, 2).join(','),
  }
}
