import { readFileSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'public', 'data')

const EXCLUDED_TYPES = new Set(['Alternative', 'Correctional', 'Juvenile Correctional', 'Special Education', 'University'])

const MAGNET_IDS = new Set([
  '02073.1','02075.1','02145.1','02181.1','02202.1','02206.1','02217.1',
  '02219.1','02246.1','02249.1','02274.1','02285.1','02308.2','02313.2','02322.2',
  '02326.2','02331.2','02359.2','02369.2','02412.3','02418.3','02420.3',
  '02432.3','02433.3','02435.3','02620.3','02624.3','02628.3',
  // CSN and TMCC
  '02422.3','02423.3','02426.3','16603.3',
])

function inferLevel(name) {
  const n = name.toUpperCase()
  if (n.includes('K8') || n.includes('K-8')) return 'Other'
  if (/ ES$/.test(name)) return 'Elementary'
  if (/ MS$/.test(name)) return 'Middle'
  if (/ HS$/.test(name)) return 'High'
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

// --- Step A: Load CSVs ---
const ratingsRows = loadCsv(join(dataDir, 'nv-school-ratings.csv'))
const locationRows = loadCsv(join(dataDir, 'nv-school-locations.csv'))

// Nevada Growth Model medians, keyed by NSPF school code.
// Regenerate with `node scripts/fetch-growth-data.mjs`.
const growthById = JSON.parse(readFileSync(join(dataDir, 'nv-growth-2025.json'), 'utf8'))
const NO_GROWTH = { elaMgp: null, mathMgp: null, elaMgpN: null, mathMgpN: null }

// --- Step B: Build location lookups ---
// By exact lowercase name
const locationByName = {}
for (const loc of locationRows) {
  if (loc.NAME) locationByName[loc.NAME.trim().toLowerCase()] = loc
}

// By county (NMCNTY stripped of " County" suffix)
const locationsByCounty = {}
for (const loc of locationRows) {
  const county = (loc.NMCNTY?.trim() || '').replace(/ County$/, '')
  if (!locationsByCounty[county]) locationsByCounty[county] = []
  locationsByCounty[county].push(loc)
}

// --- Address normalization helpers ---
const STREET_ABBREVS = {
  Avenue: 'Ave', Boulevard: 'Blvd', Circle: 'Cir', Court: 'Ct',
  Drive: 'Dr', Expressway: 'Expy', Highway: 'Hwy', Lane: 'Ln',
  Parkway: 'Pkwy', Place: 'Pl', Road: 'Rd', Square: 'Sq',
  Street: 'St', Terrace: 'Ter', Trail: 'Trl',
}

function normalizeAddressField(str) {
  if (!str) return str
  let s = str
    .trim()
    .replace(/\s+/g, ' ')                    // collapse double spaces
    .replace(/\.(?=\s|$)/g, '')              // strip trailing periods ("S." → "S", "Dr." → "Dr")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()) // Title Case
  for (const [full, abbr] of Object.entries(STREET_ABBREVS)) {
    s = s.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr)
  }
  return s
}

function normalizeCity(str) {
  if (!str) return str
  const s = normalizeAddressField(str)
  return s.replace(/^N Las Vegas$/i, 'North Las Vegas')
}

// --- Step C: Manual map (ratings name → NCES name) ---
// Keys: 'District|School Name' using the District Name value from nv-school-ratings.csv
const MANUAL_MAP = {
  // Carson City
  'Carson City|Carson Montessori ES': 'Carson Montessori',
  // Clark
  'Clark|Adv Tech ACAD HS': 'Advanced Technologies Academy HS',
  'Clark|Burkholder MS': 'Burkholder Lyal Academy of Environmental Science',
  'Clark|Clark HS': 'Clark Ed W HS',
  'Clark|CSN East HS': 'College of So NV HS East',
  'Clark|CSN South HS': 'College of So NV HS South',
  'Clark|CSN West HS': 'College of So NV HS West',
  'Clark|CTTA HS': 'Central Technical Training Academy',
  'Clark|ECTA HS': 'East Career and Technical Academy HS',
  'Clark|Expl Knowledge ES': 'Explore Knowledge Academy ES',
  'Clark|Expl Knowledge SEC HS': 'Explore Knowledge Academy J-SHS',
  'Clark|Expl Knowledge SEC MS': 'Explore Knowledge Academy J-SHS',
  'Clark|Gibson MS': 'Gibson Robert O MS Leadership Academy',
  'Clark|Johnston MS': 'Johnston Carroll M STEM Academy of Env Studies',
  'Clark|Knudson MS': 'Knudson K O Academy of the Arts',
  'Clark|Las Vegas ACAD HS': 'Las Vegas Academy of the Arts HS',
  'Clark|Mack MS': 'Lyon Mack MS',
  'Clark|NECTA HS': 'Northeast Career and Technical Academy HS',
  'Clark|NV LRN ACAD ES': 'NV Learning Academy ES',
  'Clark|NV LRN Academy HS': 'NV Learning Academy J-SHS',
  'Clark|NV LRN Academy MS': 'NV Learning Academy J-SHS',
  'Clark|NWCTA ES': 'Northwest Career-Technical Academy HS',
  'Clark|NWCTA HS': 'Northwest Career-Technical Academy HS',
  'Clark|OCallaghan i3 ACAD MS': "O'Callaghan Mike MS i3 Learn Academy",
  'Clark|ORoarke ES': 'O Roarke Thomas ES',
  'Clark|Perkins C ES': 'Perkins Dr Claude G ES',
  'Clark|Rainbow Dreams ELA ES': 'Rainbow Dreams Early Learning Academy',
  'Clark|SECTA HS': 'Southeast Career Technical Academy HS',
  'Clark|SWCTA HS': 'Southwest Career & Technical Academy HS',
  'Clark|Thomas ES': 'Thomas Ruby S ES',
  'Clark|Thompson ES': 'Thompson Sandra L ES',
  'Clark|Toland ES': 'Toland Helen Anderson Intl Academy',
  'Clark|VTCTA HS': 'Veterans Tribute CTA HS',
  'Clark|WCTA HS': 'West Career & Technical Academy HS',
  'Clark|West Prep JSHS HS': 'West Preparatory Institute J-SHS',
  // Douglas
  'Douglas|Whittell MS': 'George Whittell High School',
  // Elko
  'Elko|Carlin HS': 'Carlin High School',
  'Elko|Elko Grammar ES': 'Grammar School 2',
  'Elko|Flagview Intermediate ES': 'Flagview Intermediate School',
  'Elko|Jackpot HS': 'Jackpot High School',
  'Elko|Mound Valley MS': 'Mound Valley Elementary School',
  'Elko|Mtn View ES': 'Mountain View ES',
  'Elko|NE NV Virtual ES': 'Northeastern Nevada Virtual Academy',
  'Elko|NE NV Virtual HS': 'Northeastern Nevada Virtual Academy',
  'Elko|NE NV Virtual MS': 'Northeastern Nevada Virtual Academy',
  'Elko|Owyhee HS': 'Owyhee High School',
  'Elko|Ruby Valley MS': 'Ruby Valley Elementary School',
  'Elko|Wells HS': 'Wells High School',
  // Esmeralda
  'Esmeralda|Dyer MS': 'Dyer Elementary School',
  'Esmeralda|Goldfield MS': 'Goldfield Elementary School',
  'Esmeralda|Silver Peak MS': 'Silver Peak Elementary School',
  // Eureka
  'Eureka|Eureka MS': 'Eureka County High School',
  // Humboldt
  'Humboldt|Denio ES': 'Denio',
  'Humboldt|French Ford ES': 'French Ford Middle School',
  'Humboldt|Kings River ES': 'Kings River',
  'Humboldt|Kings River MS': 'Kings River',
  'Humboldt|McDermitt HS': 'McDermitt High School',
  'Humboldt|Orovada ES': 'Orovada School',
  'Humboldt|Orovada MS': 'Orovada School',
  'Humboldt|Paradise Valley ES': 'Paradise Valley School',
  'Humboldt|Paradise Valley MS': 'Paradise Valley School',
  // Lander
  'Lander|Austin Combined ES': 'Austin Combined Schools',
  'Lander|Austin Combined MS': 'Austin Combined Schools',
  // Lyon
  'Lyon|Dayton Intermediate MS': 'Dayton Intermediate School',
  'Lyon|Smith Valley Combined ES': 'Smith Valley Schools',
  'Lyon|Smith Valley Combined HS': 'Smith Valley Schools',
  'Lyon|Smith Valley Combined MS': 'Smith Valley Schools',
  'Lyon|Yerington Intermediate MS': 'Yerington Intermediate School',
  // Washoe
  'Washoe|ACE ACAD HS': 'Academy For Career Education',
  'Washoe|Arts Careers Tech HS': 'ACADEMY OF ARTS CAREERS & TECH',
  'Washoe|Bailey CH ES': 'Bailey Charter School',
  'Washoe|Clayton Academy MS': 'ARCHIE CLAYTON PRE-A.P. ACADEMY',
  'Washoe|Coral Acad ES': 'Coral Academy Elementary',
  'Washoe|Coral Acad-Northwest ES': 'Coral Academy Elementary-Northwest',
  'Washoe|Coral Acad-South ES': 'Coral Academy Elementary-South',
  'Washoe|Dilworth MS': 'GEORGE L. DILWORTH S.T.E.M ACADEMY',
  'Washoe|Duncan ES': 'GLENN DUNCAN S.T.E.M. ACADEMY',
  'Washoe|enCompass CS HS': 'enCompass Academy',
  'Washoe|Gerlach K 12 ES': 'GERLACH K-12 SCHOOL',
  'Washoe|Gerlach K 12 MS': 'GERLACH K-12 SCHOOL',
  'Washoe|High Desert CS ES': 'High Desert Montessori',
  'Washoe|High Desert CS MS': 'High Desert Montessori',
  'Washoe|Mariposa CS ES': 'Mariposa Language and Learning Academy',
  'Washoe|Mount Rose K-8 ES': 'MOUNT ROSE K-8 ACADEMY OF LANGUAGES',
  'Washoe|Mount Rose K-8 MS': 'MOUNT ROSE K-8 ACADEMY OF LANGUAGES',
  'Washoe|Sierra NV Acad CS ES': 'Sierra Nevada Academy Charter',
  'Washoe|Sierra NV Acad CS MS': 'Sierra Nevada Academy Charter',
  'Washoe|Smithridge ES': 'SMITHRIDGE S.T.E.M. ACADEMY',
  'Washoe|TMCC Magnet HS': 'TMCC MAGNET SCHOOL',
  'Washoe|Veterans Memorial STEM ES': 'VETERANS MEMORIAL S.T.E.M. ACADEMY',
  // University
  'University|Davidson Acad MS': 'Davidson Academy',
  'University|Davidson Acad HS': 'Davidson Academy',
  // White Pine
  'White Pine|Lund JSHS MS': 'Lund High School',
  // SPCSA
  'State Public Charter School Authority|Alpine Acad HS': 'Alpine Academy High School',
  'State Public Charter School Authority|Battle Born Charter ES': 'Battle Born Academy',
  'State Public Charter School Authority|Battle Born Charter MS': 'Battle Born Academy',
  'State Public Charter School Authority|Beacon ACAD HS': 'Beacon Academy of Nevada',
  'State Public Charter School Authority|CASLV Cadence ES': 'Coral Academy Cadence',
  'State Public Charter School Authority|CASLV Cadence HS': 'Coral Academy Cadence',
  'State Public Charter School Authority|CASLV Cadence MS': 'Coral Academy Cadence',
  'State Public Charter School Authority|CASLV Centennial ES': 'Coral Academy Centennial Hills',
  'State Public Charter School Authority|CASLV Centennial MS': 'Coral Academy Centennial Hills',
  'State Public Charter School Authority|CASLV Eastgate ES': 'Coral Academy Eastgate',
  'State Public Charter School Authority|CASLV Nellis AFB ES': 'Coral Academy Nellis AFB',
  'State Public Charter School Authority|CASLV Nellis AFB MS': 'Coral Academy Nellis AFB',
  'State Public Charter School Authority|CASLV Sandy Ridge HS': 'Coral Academy Sandy Ridge',
  'State Public Charter School Authority|CASLV Sandy Ridge MS': 'Coral Academy Sandy Ridge',
  'State Public Charter School Authority|CASLV Tamarus ES': 'Coral Academy Tamarus',
  'State Public Charter School Authority|CASLV Windmill ES': 'Coral Academy Windmill',
  'State Public Charter School Authority|CASLV Windmill MS': 'Coral Academy Windmill',
  'State Public Charter School Authority|CIVICA Acad ES': 'CIVICA Academy',
  'State Public Charter School Authority|CIVICA Acad HS': 'CIVICA Academy',
  'State Public Charter School Authority|CIVICA Acad MS': 'CIVICA Academy',
  'State Public Charter School Authority|Discovery Hill Pointe ES': 'Discovery Charter School HillPointe',
  'State Public Charter School Authority|Discovery Hill Pointe MS': 'Discovery Charter School HillPointe',
  'State Public Charter School Authority|Discovery Sandhill ES': 'Discovery Charter School Sandhill',
  'State Public Charter School Authority|Doral Cactus  ES': 'Doral Academy Cactus',
  'State Public Charter School Authority|Doral Cactus  MS': 'Doral Academy Cactus',
  'State Public Charter School Authority|Doral Fire Mesa ES': 'Doral Academy Fire Mesa',
  'State Public Charter School Authority|Doral Fire Mesa MS': 'Doral Academy Fire Mesa',
  'State Public Charter School Authority|Doral Northern NV ES': 'Doral Academy of Northern Nevada',
  'State Public Charter School Authority|Doral Northern NV MS': 'Doral Academy of Northern Nevada',
  'State Public Charter School Authority|Doral Red Rock ES': 'Doral Academy Red Rock',
  'State Public Charter School Authority|Doral Red Rock HS': 'Doral Academy Red Rock',
  'State Public Charter School Authority|Doral Red Rock MS': 'Doral Academy Red Rock',
  'State Public Charter School Authority|Doral Saddle ES': 'Doral Academy Saddle',
  'State Public Charter School Authority|Doral Saddle MS': 'Doral Academy Saddle',
  'State Public Charter School Authority|Doral W Pebble ES': 'Doral Academy West Pebble',
  'State Public Charter School Authority|Doral W Pebble MS': 'Doral Academy West Pebble',
  'State Public Charter School Authority|DP Agassi  HS': 'Democracy Prep at Agassi High',
  'State Public Charter School Authority|DP Agassi ES': 'Democracy Prep at Agassi Elementary',
  'State Public Charter School Authority|DP Agassi MS': 'Democracy Prep at Agassi Middle',
  'State Public Charter School Authority|Elko Institute ES': 'Elko Institute for Academic Achievement',
  'State Public Charter School Authority|Elko Institute MS': 'Elko Institute for Academic Achievement',
  'State Public Charter School Authority|Equipo ACAD HS': 'Equipo Academy',
  'State Public Charter School Authority|Equipo ACAD MS': 'Equipo Academy',
  'State Public Charter School Authority|Explore ACAD HS': 'Explore Academy',
  'State Public Charter School Authority|Explore ACAD MS': 'Explore Academy',
  'State Public Charter School Authority|Founders ACAD ES': 'Founders Academy of Las Vegas',
  'State Public Charter School Authority|Founders ACAD HS': 'Founders Academy of Las Vegas',
  'State Public Charter School Authority|Founders ACAD MS': 'Founders Academy of Las Vegas',
  'State Public Charter School Authority|Freedom Class ACAD ES': 'Freedom Classical Academy K-8',
  'State Public Charter School Authority|Freedom Class ACAD MS': 'Freedom Classical Academy K-8',
  'State Public Charter School Authority|Futuro ACAD ES': 'Futuro Academy Elementary',
  'State Public Charter School Authority|Honors ACAD ES': 'Honors Academy of Literature',
  'State Public Charter School Authority|Honors ACAD MS': 'Honors Academy of Literature',
  'State Public Charter School Authority|Imagine Mtn View ES': 'Imagine School Mountain View',
  'State Public Charter School Authority|Imagine Mtn View MS': 'Imagine School Mountain View',
  'State Public Charter School Authority|Leadership ACAD HS': 'Leadership Academy of Nevada',
  'State Public Charter School Authority|Leadership ACAD MS': 'Leadership Academy of Nevada',
  'State Public Charter School Authority|Legacy Cadence ES': 'Legacy Traditional School Cadence',
  'State Public Charter School Authority|Legacy Cadence MS': 'Legacy Traditional School Cadence',
  'State Public Charter School Authority|Legacy N Valley ES': 'Legacy Traditional School North Valley',
  'State Public Charter School Authority|Legacy N Valley MS': 'Legacy Traditional School North Valley',
  'State Public Charter School Authority|Legacy SW ES': 'Legacy Traditional School Southwest Las Vegas',
  'State Public Charter School Authority|Legacy SW MS': 'Legacy Traditional School Southwest Las Vegas',
  'State Public Charter School Authority|Mater East ES': 'Mater Academy East',
  'State Public Charter School Authority|Mater East HS': 'Mater Academy East',
  'State Public Charter School Authority|Mater East MS': 'Mater Academy East',
  'State Public Charter School Authority|Mater Mtn Vista  ES': 'Mater Mountain Vista',
  'State Public Charter School Authority|Mater Mtn Vista  MS': 'Mater Mountain Vista',
  'State Public Charter School Authority|Mater Northern NV ES': 'Mater Academy of Northern Nevada',
  'State Public Charter School Authority|Mater Northern NV MS': 'Mater Academy of Northern Nevada',
  'State Public Charter School Authority|Nevada Virtual HS': 'Nevada Virtual Charter School',
  'State Public Charter School Authority|Nevada Virtual MS': 'Nevada Virtual Charter School',
  'State Public Charter School Authority|NSHS Downtown HS': 'Nevada State High School Downtown',
  'State Public Charter School Authority|NSHS DownTwn Hend HS': 'Nevada State High School Downtown Henderson',
  'State Public Charter School Authority|NSHS Henderson HS': 'Nevada State High School Henderson',
  'State Public Charter School Authority|NSHS II Meadowwood HS': 'Nevada State High School II Meadowwood',
  'State Public Charter School Authority|NSHS North Las Vegas HS': 'Nevada State High School North Las Vegas',
  'State Public Charter School Authority|NSHS NW HS': 'Nevada State High School Northwest',
  'State Public Charter School Authority|NSHS Summerlin HS': 'Nevada State High School Summerlin',
  'State Public Charter School Authority|NSHS Sunrise HS': 'Nevada State High School Sunrise',
  'State Public Charter School Authority|NSHS SW HS': 'Nevada State High School Southwest',
  'State Public Charter School Authority|NV Connections ACAD HS': 'Nevada Connections Academy',
  'State Public Charter School Authority|NV Prep CS ES': 'Nevada Prep Charter School',
  'State Public Charter School Authority|NV Prep CS MS': 'Nevada Prep Charter School',
  'State Public Charter School Authority|NV Rise CS ES': 'NV Rise Academy Charter School',
  'State Public Charter School Authority|Oasis ACAD ES': 'Oasis Academy',
  'State Public Charter School Authority|Oasis ACAD HS': 'Oasis Academy',
  'State Public Charter School Authority|Oasis ACAD MS': 'Oasis Academy',
  'State Public Charter School Authority|Pinecrest Cadence ES': 'Pinecrest Academy of Nevada Cadence',
  'State Public Charter School Authority|Pinecrest Cadence HS': 'Pinecrest Academy of Nevada Cadence',
  'State Public Charter School Authority|Pinecrest Cadence MS': 'Pinecrest Academy of Nevada Cadence',
  'State Public Charter School Authority|Pinecrest Horizon ES': 'Pinecrest Academy of Nevada Horizon',
  'State Public Charter School Authority|Pinecrest Inspirada ES': 'Pinecrest Academy of Nevada Inspirada',
  'State Public Charter School Authority|Pinecrest Inspirada MS': 'Pinecrest Academy of Nevada Inspirada',
  'State Public Charter School Authority|Pinecrest Northern NV ES': 'Pinecrest Academy of Northern Nevada',
  'State Public Charter School Authority|Pinecrest Northern NV MS': 'Pinecrest Academy of Northern Nevada',
  'State Public Charter School Authority|Pinecrest Sloan ES': 'Pinecrest Academy of Nevada Sloan Canyon',
  'State Public Charter School Authority|Pinecrest Sloan HS': 'Pinecrest Academy of Nevada Sloan Canyon',
  'State Public Charter School Authority|Pinecrest Sloan MS': 'Pinecrest Academy of Nevada Sloan Canyon',
  'State Public Charter School Authority|Pinecrest Springs ES': 'Pinecrest Academy of Nevada Springs',
  'State Public Charter School Authority|Pinecrest St Rose ES': 'Pinecrest Academy of Nevada St Rose',
  'State Public Charter School Authority|Pinecrest St Rose MS': 'Pinecrest Academy of Nevada St Rose',
  'State Public Charter School Authority|Pinecrest Virtual HS': 'Pinecrest Academy of Nevada Virtual',
  'State Public Charter School Authority|Pinecrest Virtual MS': 'Pinecrest Academy of Nevada Virtual',
  'State Public Charter School Authority|Quest Northwest ES': 'Quest Academy Northwest',
  'State Public Charter School Authority|Quest Northwest MS': 'Quest Academy Northwest',
  'State Public Charter School Authority|Sage Collegiate ES': 'Sage Collegiate Public Charter School',
  'State Public Charter School Authority|Sage Collegiate MS': 'Sage Collegiate Public Charter School',
  'State Public Charter School Authority|Signature Prep CS ES': 'Signature Preparatory',
  'State Public Charter School Authority|Signature Prep CS MS': 'Signature Preparatory',
  'State Public Charter School Authority|Silver Sands ES': 'Silver Sands Montessori',
  'State Public Charter School Authority|Silver Sands MS': 'Silver Sands Montessori',
  'State Public Charter School Authority|SLAM ES': 'Sports Leadership and Management Academy',
  'State Public Charter School Authority|SLAM HS': 'Sports Leadership and Management Academy',
  'State Public Charter School Authority|SLAM MS': 'Sports Leadership and Management Academy',
  'State Public Charter School Authority|Somerset Aliante ES': 'Somerset Academy Aliante',
  'State Public Charter School Authority|Somerset Aliante MS': 'Somerset Academy Aliante',
  'State Public Charter School Authority|Somerset Lone Mtn ES': 'Somerset Academy Lone Mountain',
  'State Public Charter School Authority|Somerset Lone Mtn MS': 'Somerset Academy Lone Mountain',
  'State Public Charter School Authority|Somerset Losee ES': 'Somerset Academy Losee',
  'State Public Charter School Authority|Somerset Losee HS': 'Somerset Academy Losee',
  'State Public Charter School Authority|Somerset Losee MS': 'Somerset Academy Losee',
  'State Public Charter School Authority|Somerset NLV ES': 'Somerset Academy North Las Vegas',
  'State Public Charter School Authority|Somerset Sky Pointe ES': 'Somerset Academy Sky Pointe',
  'State Public Charter School Authority|Somerset Sky Pointe HS': 'Somerset Academy Sky Pointe',
  'State Public Charter School Authority|Somerset Sky Pointe MS': 'Somerset Academy Sky Pointe',
  'State Public Charter School Authority|Somerset Skye Canyon ES': 'Somerset Academy Skye Canyon',
  'State Public Charter School Authority|Somerset Skye Canyon MS': 'Somerset Academy Skye Canyon',
  'State Public Charter School Authority|Somerset Stephanie ES': 'Somerset Academy Stephanie',
  'State Public Charter School Authority|Somerset Stephanie MS': 'Somerset Academy Stephanie',
  'State Public Charter School Authority|Southern NV Trades HS': 'Southern Nevada Trades High School',
  'State Public Charter School Authority|Thrive Point Acad HS': 'Thrive Point Academy',
  'State Public Charter School Authority|Vegas Vista Acad ES': 'Vegas Vista Academy',
  'State Public Charter School Authority|YWLA HS': "Young Women's Leadership Academy of Las Vegas",
  'State Public Charter School Authority|YWLA MS': "Young Women's Leadership Academy of Las Vegas",
}

// --- Step D: Auto-match helpers ---

// Returns true if the NCES school name matches the given rating level suffix (ES/MS/HS)
function ncesMatchesLevel(ncesName, suffix) {
  const n = ncesName.toUpperCase()
  if (suffix === 'ES') {
    return (/ ES$/.test(ncesName) || n.includes('ELEMENTARY') || n.includes('GRAMMAR'))
      && !/ HS$/.test(ncesName) && !n.includes('HIGH')
      && !/ MS$/.test(ncesName) && !n.includes('MIDDLE') && !/\bJHS\b/.test(n)
  }
  if (suffix === 'MS') {
    return / MS$/.test(ncesName) || /\bJHS\b/.test(n) || n.includes('MIDDLE')
      || / J-SHS$/.test(ncesName) || n.includes('JR HIGH') || n.includes('JUNIOR HIGH')
  }
  if (suffix === 'HS') {
    return / HS$/.test(ncesName) || n.includes('HIGH SCHOOL') || / J-SHS$/.test(ncesName)
  }
  return true
}

// For regular public schools: match by first meaningful word + county + level.
// If multiple candidates remain, try to narrow down using the second token (initial or full name).
// Returns the location row only when exactly one NCES school matches — otherwise null.
function autoMatch(ratingsName, district) {
  if (!district) return null

  // For SPCSA: strip level suffix and try exact lookup (NCES names typically omit ES/MS/HS)
  if (district === 'State Public Charter School Authority') {
    const suffixMatch = ratingsName.match(/ (ES|MS|HS)$/)
    if (!suffixMatch) return null
    const baseName = ratingsName.slice(0, -suffixMatch[0].length).trim()
    return locationByName[baseName.toLowerCase()] ?? null
  }

  const suffixMatch = ratingsName.match(/ (ES|MS|HS)$/)
  if (!suffixMatch) return null
  const suffix = suffixMatch[1]

  const baseName = ratingsName.slice(0, -suffixMatch[0].length).trim()
  const tokens = baseName.split(/\s+/)
  // Find first token longer than 2 chars — short tokens like "T", "D", "JG" are initials
  const keyWord = tokens.find(t => t.length > 2)
  if (!keyWord) return null

  const countyLocs = locationsByCounty[district] || []
  if (!countyLocs.length) return null

  // Word-boundary match to avoid "Ellis" matching "Nellis", etc.
  const re = new RegExp('\\b' + keyWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
  const candidates = countyLocs.filter(loc => re.test(loc.NAME) && ncesMatchesLevel(loc.NAME, suffix))

  if (candidates.length === 1) return candidates[0]

  // Multiple candidates: try second token to disambiguate
  if (candidates.length > 1) {
    const secondToken = tokens[tokens.indexOf(keyWord) + 1]
    if (!secondToken) return null

    let refined
    if (secondToken.length === 1) {
      // Single-letter initial — find the word immediately after keyWord in the NCES name and check its first letter
      refined = candidates.filter(loc => {
        const afterKey = loc.NAME.slice(loc.NAME.toLowerCase().indexOf(keyWord.toLowerCase()) + keyWord.length).trimStart()
        const nextWord = afterKey.split(/\s+/)[0] || ''
        return nextWord.toUpperCase().startsWith(secondToken.toUpperCase())
      })
    } else {
      // Full word — check if NCES name contains it
      const wordRe = new RegExp('\\b' + secondToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
      refined = candidates.filter(loc => wordRe.test(loc.NAME))
    }

    if (refined.length === 1) return refined[0]
  }

  return null
}

// --- Step E: Process ratings rows ---
const schools = []
let exactMatched = 0, manualMatched = 0, autoMatched = 0, filtered = 0, unmatched = 0

for (const row of ratingsRows) {
  const type = row['School Type'].trim()
  if (EXCLUDED_TYPES.has(type)) { filtered++; continue }

  const district = row['District Name']?.trim()
  if (district === 'University') { filtered++; continue }

  const indexScore = parseNum(row['Total Index Score'])
  if (indexScore === null) { filtered++; continue }

  const name = row['School Name'].trim()
  const id = row['NSPF School Code'].trim()
  const schoolType = MAGNET_IDS.has(id)
    ? 'Magnet'
    : (type === 'District Charter' || type === 'SPCSA' ? 'Charter' : 'District')
  const level = inferLevel(name)

  // 1. Exact name match
  let loc = locationByName[name.toLowerCase()] ?? null
  if (loc) {
    exactMatched++
  } else {
    // 2. Manual map lookup (district-qualified key)
    const mappedName = MANUAL_MAP[`${district}|${name}`]
    if (mappedName) {
      loc = locationByName[mappedName.toLowerCase()] ?? null
      if (loc) manualMatched++
    }
    // 3. Auto-match: first meaningful word + county + level
    if (!loc) {
      loc = autoMatch(name, district)
      if (loc) autoMatched++
    }
  }

  let lat = null, lng = null, address = null, city = null, zip = null, county = null

  if (loc) {
    lat = parseFloat(loc.LAT) || null
    lng = parseFloat(loc.LON) || null
    address = normalizeAddressField(loc.STREET) || null
    city = normalizeCity(loc.CITY) || null
    zip = loc.ZIP?.trim() || null
    county = (loc.NMCNTY?.trim() || '').replace(/ County$/, '') || null
  } else {
    unmatched++
    if (district && district !== 'State Public Charter School Authority') county = district
  }

  schools.push({
    id,
    name,
    type: schoolType,
    level,
    county,
    starRating: parseStarRating(row['Star Rating']),
    indexScore,
    elaProficiency: parseNum(row['% Proficient ELA']),
    mathProficiency: parseNum(row['% Proficient Math']),
    scienceProficiency: parseNum(row['% Proficient Science']),
    elaGrowth: parseNum(row['% Meeting AGP ELA']),
    mathGrowth: parseNum(row['% Meeting AGP Math']),
    ...(growthById[id] ?? NO_GROWTH),
    titleI: parseBool(row['Title I Status']),
    lat,
    lng,
    address,
    city,
    zip,
  })
}

// --- Step F: Output ---
writeFileSync(join(dataDir, 'nv-school-data.json'), JSON.stringify(schools, null, 2))

console.log(`Done. Kept: ${schools.length}, Filtered: ${filtered}`)
console.log(`  Exact match: ${exactMatched}, Manual: ${manualMatched}, Auto-match: ${autoMatched}, Unmatched: ${unmatched}`)
console.log(`  Growth MGP: ${schools.filter(s => s.elaMgp !== null).length} ELA, ${schools.filter(s => s.mathMgp !== null).length} Math`)
