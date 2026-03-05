import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schoolsPath = join(__dirname, '..', 'public', 'data', 'schools.json')

const DELAY_MS = 1100 // Nominatim rate limit: 1 req/sec
const USER_AGENT = 'nv-school-ratings/1.0 (github.com/nv-school-ratings)'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function expandName(name, type) {
  let n = name
  // Strip JHS/JSHS — they don't help with geocoding
  n = n.replace(/ JHS /, ' ').replace(/ JSHS /, ' ')
  // ACAD → Academy
  n = n.replace(/ ACAD /, ' Academy ').replace(/ ACAD$/, ' Academy')
  // CTA → Career Technical Academy
  n = n.replace(/CTA /, 'Career Technical Academy ').replace(/CTA$/, 'Career Technical Academy')

  if (type === 'Charter') {
    return n.replace(/ (ES|MS|HS)$/, ' Charter School')
  }
  return n
    .replace(/ ES$/, ' Elementary School')
    .replace(/ MS$/, ' Middle School')
    .replace(/ HS$/, ' High School')
}

async function geocode(name, type) {
  const query = `${expandName(name, type)}, Clark County, Nevada`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }
  return null
}

const schools = JSON.parse(readFileSync(schoolsPath, 'utf8'))
const todo = schools.filter((s) => s.lat === null)
const done = schools.filter((s) => s.lat !== null).length

console.log(`Total: ${schools.length} | Already geocoded: ${done} | Remaining: ${todo.length}`)
if (todo.length === 0) { console.log('Nothing to do.'); process.exit(0) }

const failures = []
let geocoded = 0

for (let i = 0; i < todo.length; i++) {
  const school = todo[i]
  process.stdout.write(`[${i + 1}/${todo.length}] ${school.name} ... `)

  try {
    const result = await geocode(school.name, school.type)
    if (result) {
      school.lat = result.lat
      school.lng = result.lng
      process.stdout.write(`${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}\n`)
      geocoded++
    } else {
      process.stdout.write('not found\n')
      failures.push(school.name)
    }
  } catch (err) {
    process.stdout.write(`error: ${err.message}\n`)
    failures.push(school.name)
  }

  // Save progress every 25 schools
  if ((i + 1) % 25 === 0) {
    writeFileSync(schoolsPath, JSON.stringify(schools, null, 2))
    console.log(`  → Saved progress (${i + 1} processed)`)
  }

  if (i < todo.length - 1) await sleep(DELAY_MS)
}

writeFileSync(schoolsPath, JSON.stringify(schools, null, 2))
console.log(`\nDone. Geocoded: ${geocoded}, Failed: ${failures.length}`)
if (failures.length > 0) {
  console.log('\nNot found:')
  failures.forEach((n) => console.log(`  ${n}`))
}
