interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: {
    house_number?: string
    road?: string
    county?: string
    city?: string
  }
}

function parseCounty(address?: NominatimResult['address']): string | null {
  if (!address) return null
  if (address.county) return address.county.replace(/ County$/, '')
  if (address.city === 'Carson City') return 'Carson City'
  return null
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; label: string; county: string | null }> {
  const params = new URLSearchParams({
    q: `${address}, Nevada`,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
    viewbox: '-120.0,42.0,-114.0,35.0',
    addressdetails: '1',
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
    label: [data[0].address?.house_number, data[0].address?.road].filter(Boolean).join(' ') || address.split(',')[0].trim(),
    county: parseCounty(data[0].address),
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ county: string | null; label: string | null }> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  })

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    {
      headers: { 'User-Agent': 'nv-school-ratings/1.0' },
    }
  )

  if (!res.ok) return { county: null, label: null }

  const data: NominatimResult = await res.json()
  const label =
    [data.address?.house_number, data.address?.road].filter(Boolean).join(' ') ||
    data.display_name.split(',')[0].trim()
  return { county: parseCounty(data.address), label }
}
