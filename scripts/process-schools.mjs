import { readFileSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'public', 'data')

// Clark County SPCSA charter schools allowlist
const CLARK_COUNTY_CHARTER_NAMES = new Set([
  '100 Academy SET ES',
  '100 Academy SET MS',
  'Alpine Acad HS',
  'Amplus Durango ES',
  'Amplus Durango MS',
  'Amplus Durango HS',
  'Amplus Rainbow ES',
  'Battle Born Charter ES',
  'Battle Born Charter MS',
  'Beacon ACAD HS',
  'CASLV Cadence ES',
  'CASLV Cadence MS',
  'CASLV Cadence HS',
  'CASLV Centennial ES',
  'CASLV Centennial MS',
  'CASLV Eastgate ES',
  'CASLV Nellis AFB ES',
  'CASLV Nellis AFB MS',
  'CASLV Sandy Ridge MS',
  'CASLV Sandy Ridge HS',
  'CASLV Tamarus ES',
  'CASLV Windmill ES',
  'CASLV Windmill MS',
  'CIVICA Acad ES',
  'CIVICA Acad MS',
  'CIVICA Acad HS',
  'Delta Charter MS',
  'Delta Charter HS',
  'Discovery Hill Pointe ES',
  'Discovery Hill Pointe MS',
  'Discovery Sandhill ES',
  'Doral Cactus  ES',
  'Doral Cactus  MS',
  'Doral Fire Mesa ES',
  'Doral Fire Mesa MS',
  'Doral Red Rock ES',
  'Doral Red Rock MS',
  'Doral Red Rock HS',
  'Doral Saddle ES',
  'Doral Saddle MS',
  'Doral W Pebble ES',
  'Doral W Pebble MS',
  'DP Agassi ES',
  'DP Agassi MS',
  'DP Agassi  HS',
  'Equipo ACAD MS',
  'Equipo ACAD HS',
  'Expl Knowledge ES',
  'Expl Knowledge SEC MS',
  'Expl Knowledge SEC HS',
  'Explore ACAD MS',
  'Explore ACAD HS',
  'Founders ACAD ES',
  'Founders ACAD MS',
  'Founders ACAD HS',
  'Freedom Class ACAD ES',
  'Freedom Class ACAD MS',
  'Futuro ACAD ES',
  'Honors ACAD ES',
  'Honors ACAD MS',
  'Imagine Mtn View ES',
  'Imagine Mtn View MS',
  'Innovations ES',
  'Innovations SEC MS',
  'Innovations SEC HS',
  'Leadership ACAD MS',
  'Leadership ACAD HS',
  'Legacy Cadence ES',
  'Legacy Cadence MS',
  'Legacy N Valley ES',
  'Legacy N Valley MS',
  'Legacy SW ES',
  'Legacy SW MS',
  'Mater Bonanza ES',
  'Mater Bonanza MS',
  'Mater East ES',
  'Mater East MS',
  'Mater East HS',
  'Mater Mtn Vista  ES',
  'Mater Mtn Vista  MS',
  'Nevada Virtual MS',
  'Nevada Virtual HS',
  'NSHS Downtown HS',
  'NSHS DownTwn Hend HS',
  'NSHS Henderson HS',
  'NSHS North Las Vegas HS',
  'NSHS NW HS',
  'NSHS Summerlin HS',
  'NSHS Sunrise HS',
  'NSHS SW HS',
  'NV Connections ACAD HS',
  'NV Prep CS ES',
  'NV Prep CS MS',
  'NV Rise CS ES',
  'Odyssey ES',
  'Odyssey MS',
  'Odyssey HS',
  'pilotED Cactus Park ES',
  'Pinecrest Cadence ES',
  'Pinecrest Cadence MS',
  'Pinecrest Cadence HS',
  'Pinecrest Horizon ES',
  'Pinecrest Inspirada ES',
  'Pinecrest Inspirada MS',
  'Pinecrest Sloan ES',
  'Pinecrest Sloan MS',
  'Pinecrest Sloan HS',
  'Pinecrest Springs ES',
  'Pinecrest St Rose ES',
  'Pinecrest St Rose MS',
  'Pinecrest Virtual MS',
  'Pinecrest Virtual HS',
  'Quest Northwest ES',
  'Quest Northwest MS',
  'Rainbow Dreams ELA ES',
  'Sage Collegiate ES',
  'Sage Collegiate MS',
  'Signature Prep CS ES',
  'Signature Prep CS MS',
  'Silver Sands ES',
  'Silver Sands MS',
  'SLAM ES',
  'SLAM MS',
  'SLAM HS',
  'Somerset Aliante ES',
  'Somerset Aliante MS',
  'Somerset Lone Mtn ES',
  'Somerset Lone Mtn MS',
  'Somerset Losee ES',
  'Somerset Losee MS',
  'Somerset Losee HS',
  'Somerset NLV ES',
  'Somerset Sky Pointe ES',
  'Somerset Sky Pointe MS',
  'Somerset Sky Pointe HS',
  'Somerset Skye Canyon ES',
  'Somerset Skye Canyon MS',
  'Somerset Stephanie ES',
  'Somerset Stephanie MS',
  'Southern NV Trades HS',
  'Strong Start Academy ES',
  'Thrive Point Acad HS',
  'Vegas Vista Acad ES',
  'YWLA MS',
  'YWLA HS',
])

const EXCLUDED_TYPES = new Set(['Alternative', 'Correctional', 'Special Education'])

const LEVEL_ORDER = ['Elementary', 'Middle', 'High']

function inferLevel(name) {
  const n = name.toUpperCase()
  if (n.includes('K8') || n.includes('K-8')) return 'Other'
  if (/ ES$/.test(name)) return 'Elementary'
  if (/ MS$/.test(name)) return 'Middle'
  if (/ HS$/.test(name)) return 'High'
  if (/JSHS MS/.test(name)) return 'Middle'
  if (/JSHS HS/.test(name)) return 'High'
  return 'Other'
}

function parseNum(val) {
  if (val == null) return null
  const s = String(val).trim()
  if (s === '' || s === 'N/A' || s === '-') return null
  if (s === '<5') return 5
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function parseBool(val) {
  return String(val).trim().toUpperCase() === 'YES'
}

function parseStarRating(val) {
  const s = String(val).trim()
  const n = parseInt(s, 10)
  if (n >= 1 && n <= 5) return n
  return null
}

function loadCsv(filePath) {
  const content = readFileSync(filePath, 'utf8')
  return parse(content, { columns: true, skip_empty_lines: true, trim: true })
}

function processRow(row, schoolType) {
  const starRating = parseStarRating(row['Star Rating'])
  const indexScore = parseNum(row['Total Index Score'])

  // Exclude non-rated or insufficient data
  if (starRating === null || indexScore === null) return null

  const name = row['School Name'].trim()
  const level = inferLevel(name)

  return {
    id: row['NSPF School Code'].trim(),
    name,
    type: schoolType,
    level,
    starRating,
    indexScore,
    elaProficiency: parseNum(row['% Proficient ELA']),
    mathProficiency: parseNum(row['% Proficient Math']),
    scienceProficiency: parseNum(row['% Proficient Science']),
    elaGrowth: parseNum(row['% Meeting AGP ELA']),
    mathGrowth: parseNum(row['% Meeting AGP Math']),
    titleI: parseBool(row['Title I Status']),
    lat: null,
    lng: null,
  }
}

// Load and process SchoolRatings.csv (CCSD district schools)
const districtRows = loadCsv(join(dataDir, 'SchoolRatings.csv'))
let kept = 0, filtered = 0

const districtSchools = []
for (const row of districtRows) {
  const type = row['School Type'].trim()
  if (EXCLUDED_TYPES.has(type)) { filtered++; continue }
  const schoolType = type === 'District Charter' ? 'Charter' : 'Regular'
  const record = processRow(row, schoolType)
  if (!record) { filtered++; continue }
  districtSchools.push(record)
  kept++
}

// Load and process PublicCharterSchoolRatings.csv (SPCSA schools)
const charterRows = loadCsv(join(dataDir, 'PublicCharterSchoolRatings.csv'))
const charterSchools = []
for (const row of charterRows) {
  const name = row['School Name'].trim()
  if (!CLARK_COUNTY_CHARTER_NAMES.has(name)) { filtered++; continue }
  const record = processRow(row, 'Charter')
  if (!record) { filtered++; continue }
  charterSchools.push(record)
  kept++
}

// Combine and sort
const all = [...districtSchools, ...charterSchools]
all.sort((a, b) => {
  const li = LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  if (li !== 0) return li
  return a.name.localeCompare(b.name)
})

writeFileSync(join(dataDir, 'schools.json'), JSON.stringify(all, null, 2))

console.log(`Done. Kept: ${kept}, Filtered: ${filtered}, Total output: ${all.length}`)
console.log(`  District schools: ${districtSchools.length}`)
console.log(`  SPCSA Clark County schools: ${charterSchools.length}`)
console.log(`  Levels: ${LEVEL_ORDER.map(l => `${l}=${all.filter(s => s.level === l).length}`).join(', ')}`)
