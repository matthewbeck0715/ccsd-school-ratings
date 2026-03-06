import { readFileSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'public', 'data')

const EXCLUDED_TYPES = new Set(['Alternative', 'Correctional', 'Juvenile Correctional', 'Special Education'])

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

// --- Step B: Build location lookup by lowercase NAME ---
const byName = {}
for (const row of locationRows) {
  if (row.NAME) {
    byName[row.NAME.toLowerCase()] = row
  }
}

// --- Manual overrides: ratings school name → NCES location name ---
const MANUAL = {
  'CTTA HS': 'Central Technical Training Academy',
  'ECTA HS': 'East Career Technical Academy',
  'NWCTA HS': 'Northwest Career-Technical Academy HS',
  'SECTA HS': 'Southeast Career Technical Academy HS',
  'SWCTA HS': 'Southwest Career & Technical Academy HS',
  'WCTA HS': 'West Career & Technical Academy HS',
  'VTCTA HS': 'Veterans Tribute CTA HS',
  'Adv Tech ACAD HS': 'Advanced Technologies Academy HS',
  'Basic ACAD HS': "Basic Academy of Int'l Studies HS",
  'Del Sol ACAD HS': 'Del Sol Academy HS',
  'Las Vegas ACAD HS': 'Las Vegas Academy of the Arts HS',
  'Beacon ACAD HS': 'Beacon Academy of Nevada',
  'Leadership ACAD HS': 'Leadership Academy of Nevada',
  'Leadership ACAD MS': 'Leadership Academy of Nevada',
  'SLAM ES': 'Sports Leadership and Management Academy',
  'SLAM MS': 'Sports Leadership and Management Academy',
  'SLAM HS': 'Sports Leadership and Management Academy',
  'Amplus Durango ES': 'Amplus Durango',
  'Amplus Durango MS': 'Amplus Durango',
  'Amplus Durango HS': 'Amplus Durango',
  'Amplus Rainbow ES': 'Amplus Rainbow',
  'Battle Born Charter ES': 'Battle Born Academy',
  'Battle Born Charter MS': 'Battle Born Academy',
  'Delta Charter MS': 'The Delta Academy J-SHS',
  'Delta Charter HS': 'The Delta Academy J-SHS',
  'NV Rise CS ES': 'NV Rise Academy Charter School',
  'Strong Start Academy ES': 'Strong Start Academy',
  'pilotED Cactus Park ES': 'pilotED Cactus Park',
  'CIVICA Acad ES': 'CIVICA Academy',
  'CIVICA Acad MS': 'CIVICA Academy',
  'CIVICA Acad HS': 'CIVICA Academy',
  'Founders ACAD ES': 'Founders Academy of Las Vegas',
  'Founders ACAD MS': 'Founders Academy of Las Vegas',
  'Founders ACAD HS': 'Founders Academy of Las Vegas',
  'Freedom Class ACAD ES': 'Freedom Classical Academy K-8',
  'Freedom Class ACAD MS': 'Freedom Classical Academy K-8',
  'Sage Collegiate ES': 'Sage Collegiate Public Charter School',
  'Sage Collegiate MS': 'Sage Collegiate Public Charter School',
  'Signature Prep CS ES': 'Signature Preparatory',
  'Signature Prep CS MS': 'Signature Preparatory',
  'Silver Sands ES': 'Silver Sands Montessori',
  'Silver Sands MS': 'Silver Sands Montessori',
  'Quest Northwest ES': 'Quest Academy Northwest',
  'Quest Northwest MS': 'Quest Academy Northwest',
  'Equipo ACAD MS': 'Equipo Academy',
  'Equipo ACAD HS': 'Equipo Academy',
  'Honors ACAD ES': 'Honors Academy of Literature',
  'Honors ACAD MS': 'Honors Academy of Literature',
  'Learning Bridge ES': 'Learning Bridge',
  'Learning Bridge MS': 'Learning Bridge',
  'Explore ACAD MS': 'Explore Academy',
  'Explore ACAD HS': 'Explore Academy',
  'Imagine Mtn View ES': 'Imagine School Mountain View',
  'Imagine Mtn View MS': 'Imagine School Mountain View',
  'Mater Mtn Vista  ES': 'Mater Mountain Vista',
  'Mater Mtn Vista  MS': 'Mater Mountain Vista',
  'Mater East ES': 'Mater Academy East',
  'Mater East MS': 'Mater Academy East',
  'Mater East HS': 'Mater Academy East',
  'Mater Bonanza ES': 'Mater Bonanza',
  'Mater Bonanza MS': 'Mater Bonanza',
  'Discovery Hill Pointe ES': 'Discovery Charter School HillPointe',
  'Discovery Hill Pointe MS': 'Discovery Charter School HillPointe',
  'Discovery Sandhill ES': 'Discovery Charter School Sandhill',
  'Expl Knowledge ES': 'Explore Knowledge Academy ES',
  'Expl Knowledge SEC MS': 'Explore Knowledge Academy J-SHS',
  'Expl Knowledge SEC HS': 'Explore Knowledge Academy J-SHS',
  'Innovations ES': "Innovations Int'l Charter ES",
  'Innovations SEC MS': "Innovations Int'l Charter J-SHS",
  'Innovations SEC HS': "Innovations Int'l Charter J-SHS",
  'West Prep ES': 'West Prep ES',
  'West Prep JSHS MS': 'West Preparatory Institute J-SHS',
  'West Prep JSHS HS': 'West Preparatory Institute J-SHS',
  'OCallaghan i3 ACAD MS': "O'Callaghan Mike MS i3 Learn Academy",
  'YWLA MS': 'Young Women\'s Leadership Academy of Las Vegas',
  'YWLA HS': 'Young Women\'s Leadership Academy of Las Vegas',
  'Nevada Virtual MS': 'Nevada Virtual Charter School',
  'Nevada Virtual HS': 'Nevada Virtual Charter School',
  'NV Connections ACAD HS': 'Nevada Connections Academy',
  'Pinecrest Virtual MS': 'Pinecrest Academy Virtual',
  'Pinecrest Virtual HS': 'Pinecrest Academy Virtual',
  'Doral W Pebble MS': 'Doral Academy West Pebble',
  'Doral W Pebble ES': 'Doral Academy West Pebble',
  'Sandy Valley JSHS MS': 'Sandy Valley J-SHS',
  'Sandy Valley JSHS HS': 'Sandy Valley J-SHS',
  'Sandy Valley ES': 'Sandy Valley ES',
  'Thompson T ES': 'Thompson Tyrone ES',
  'Cox D ES': 'Cox David M ES',
  'Snyder D ES': 'Snyder Don & Dee ES',
  'Snyder W ES': 'Snyder William E ES',
  'Earl I ES': 'Earl Ira J ES',
  'Earl M ES': 'Earl Marion B ES',
  'Taylor R ES': 'Taylor Robert L ES',
  'Taylor G ES': 'Taylor Glen C ES',
  'Williams T ES': 'Williams Tom ES',
  'Williams W ES': 'Williams Wendell ES',
  'Toland ES': 'Toland Helen Anderson Intl Academy',
  'Perkins U ES': 'Perkins Ute ES',
  'Legacy N Valley ES': 'Legacy Traditional School North Valley',
  'Legacy N Valley MS': 'Legacy Traditional School North Valley',
  'Legacy SW ES': 'Legacy Traditional School Southwest Las Vegas',
  'Legacy SW MS': 'Legacy Traditional School Southwest Las Vegas',
  'Legacy Cadence ES': 'Legacy Traditional School Cadence',
  'Legacy Cadence MS': 'Legacy Traditional School Cadence',
  'Somerset Lone Mtn ES': 'Somerset Academy Lone Mountain',
  'Somerset Lone Mtn MS': 'Somerset Academy Lone Mountain',
  'Somerset NLV ES': 'Somerset Academy North Las Vegas',
  'Laughlin JSHS MS': 'Laughlin J-SHS',
  'Laughlin JSHS HS': 'Laughlin J-SHS',
  'Brown H M ES': 'Brown Hannah Marie ES',
  'Brown JHS MS': 'Brown B Mahlon JHS',
  'Doral Cactus  ES': 'Doral Academy Cactus',
  'Doral Cactus  MS': 'Doral Academy Cactus',
  'Gehring ACAD ES': 'Gehring Roger D Acad of Science & Technology ES',
  'Gene Ward ES': 'Ward Gene ES',
  'ORoarke ES': 'O Roarke Thomas ES',
  'Perkins C ES': 'Perkins Dr Claude G ES',
  'Silvestri JHS MS': 'Silvestri Charles JHS',
  'CSN East HS': 'College of So NV HS East',
  'CSN South HS': 'College of So NV HS South',
  'CSN West HS': 'College of So NV HS West',
  'NSHS DownTwn Hend HS': 'Nevada State High School Downtown Henderson',
  'NSHS NW HS': 'Nevada State High School Northwest',
  'NSHS SW HS': 'Nevada State High School Southwest',
  'NV Prep CS ES': 'Nevada Prep Charter School',
  'NV Prep CS MS': 'Nevada Prep Charter School',
  'NSHS Henderson HS': 'Nevada State High School Henderson',
  // CCSD JHS (full names)
  'King Martin ES': 'King Jr  Martin Luther ES',
  'Cannon JHS MS': 'Cannon Helen C JHS',
  'Johnson JHS MS': "Johnson Walter JHS Academy of Int'l Studies",
  'Greenspun JHS MS': 'Greenspun Barbara & Hank JHS',
  'Molasky JHS MS': 'Molasky Irwin & Susan JHS',
  'Cortney JHS MS': 'Cortney Francis H JHS',
  'Lawrence JHS MS': 'Lawrence Clifford J JHS',
  'Cimarron Mem HS': 'Cimarron-Memorial HS',
  // Washoe County
  'Mtn View ES': 'Mountain View ES',
  'Spanish Spgs ES': 'SPANISH SPRINGS ELEMENTARY',
  'Smith Kate ES': 'KATE SMITH ELEMENTARY',
  'Smith Alice ES': 'ALICE SMITH ELEMENTARY',
  'Lemelson STEM ES': 'DOROTHY LEMELSON S.T.E.M. ACADEMY ES',
  'Veterans Memorial STEM ES': 'VETERANS MEMORIAL S.T.E.M. ACADEMY',
  'Bordewich Bray ES': 'Bordewich/Bray Elementary',
  // Rural districts
  'W Wendover ES': 'West Wendover Elementary School',
  'W Wendover MS': 'West Wendover Middle School',
  'W Wendover HS': 'West Wendover High School',
  'Carlin JHS MS': 'Carlin Jr High School',
  'Wells JHS MS': 'Wells Jr High School',
  'Jackpot JHS MS': 'Jackpot Jr High School',
  'Owyhee JHS MS': 'Owyhee Jr High School',
  'NE NV Virtual MS': 'Northeastern Nevada Virtual Academy',
  'NE NV Virtual HS': 'Northeastern Nevada Virtual Academy',
  'Winnemucca GS ES': 'Winnemucca Grammar School',
  'Winnemucca JHS MS': 'Winnemucca Junior High School',
  'McDermitt JHS MS': 'McDermitt Junior High School',
  'Battle Mtn ES': 'Battle Mountain Elementary School',
  'Battle Mtn HS': 'Battle Mountain High School',
  'Lemaire JHS MS': 'Eleanor Lemaire Junior High School',
  'Smith Valley Combined ES': 'Smith Valley Schools',
  'Smith Valley Combined MS': 'Smith Valley Schools',
  'Smith Valley Combined HS': 'Smith Valley Schools',
  'Hawthorne JHS MS': 'Hawthorne Junior High',
  'Round Mtn ES': 'Round Mountain Elementary School',
  'Round Mtn MS': 'Round Mountain Middle School',
  'Round Mtn HS': 'Round Mountain High School',
  'JG Johnson ES': 'J G Johnson Elementary School',
  'Lund JSHS MS': 'Lund High School',
  'Lund JSHS HS': 'Lund High School',
  // Northern NV charters
  'Coral Acad-South ES': 'Coral Academy Elementary-South',
  'Coral Acad-Northwest ES': 'Coral Academy Elementary-Northwest',
  'Mariposa CS ES': 'Mariposa Language and Learning Academy',
  'Sierra NV Acad CS ES': 'Sierra Nevada Academy Charter',
  'Sierra NV Acad CS MS': 'Sierra Nevada Academy Charter',
  'Clayton Academy MS': 'ARCHIE CLAYTON PRE-A.P. ACADEMY',
  'ACE ACAD HS': 'Academy For Career Education',
  'enCompass CS HS': 'enCompass Academy',
  'Arts Careers Tech HS': 'ACADEMY OF ARTS CAREERS & TECH',
  'Pinecrest Northern NV ES': 'Pinecrest Academy of Northern Nevada',
  'Pinecrest Northern NV MS': 'Pinecrest Academy of Northern Nevada',
  'Mater Northern NV ES': 'Mater Academy of Northern Nevada',
  'Mater Northern NV MS': 'Mater Academy of Northern Nevada',
  'Doral Northern NV ES': 'Doral Academy of Northern Nevada',
  'Doral Northern NV MS': 'Doral Academy of Northern Nevada',
  'NWCTA ES': 'Northwest Career-Technical Academy HS',
  'Rainbow Dreams ELA ES': 'Rainbow Dreams Early Learning Academy',
  'NECTA HS': 'Northeast Career and Technical Academy HS',
  'Independence Vly ES': 'Independence Valley Elementary School',
  'NE NV Virtual ES': 'Northeastern Nevada Virtual Academy',
  'Gerlach K 12 ES': 'GERLACH K-12 SCHOOL',
  'Gerlach K 12 MS': 'GERLACH K-12 SCHOOL',
  'Southern NV Trades HS': 'Southern Nevada Trades High School',
  'NV LRN ACAD ES': 'NV Learning Academy ES',
  'NV LRN Academy MS': 'NV Learning Academy J-SHS',
  'NV LRN Academy HS': 'NV Learning Academy J-SHS',
  'Elko Grammar ES': 'Grammar School 2',
  'High Desert CS ES': 'High Desert Montessori',
  'High Desert CS MS': 'High Desert Montessori',
}

// Pattern-based transforms: ratings name → likely NCES name fragment
const PATTERNS = [
  [/^CASLV (.+?)( ES| MS| HS)$/, (m) => 'Coral Academy ' + m[1]],
  [/^NSHS (.+?)( HS)$/, (m) => 'Nevada State High School ' + m[1]],
  [/^Somerset (.+?)( ES| MS| HS)$/, (m) => 'Somerset Academy ' + m[1]],
  [/^Doral (.+?)( ES| MS| HS)$/, (m) => 'Doral Academy ' + m[1]],
  [/^Pinecrest (.+?)( ES| MS| HS)$/, (m) => 'Pinecrest Academy of Nevada ' + m[1].replace('Sloan', 'Sloan Canyon')],
  [/^DP Agassi.*?( ES| MS| HS)$/, () => 'Democracy Prep at Agassi'],
  // Generic: strip suffix and try substring match
  [/^(.+?)( ES| MS| HS)$/, (m) => m[1]],
]

// --- Step C: Name matching ---
function findLocation(name) {
  // 1. Manual override
  if (MANUAL[name]) {
    const target = MANUAL[name].toLowerCase()
    if (byName[target]) return byName[target]
    // Partial match
    const partial = Object.values(byName).find(
      row => row.NAME.toLowerCase().includes(target) || target.includes(row.NAME.toLowerCase())
    )
    if (partial) return partial
  }

  // 2. Exact lowercase match
  if (byName[name.toLowerCase()]) return byName[name.toLowerCase()]

  // 3. Pattern-based matching
  for (const [re, fn] of PATTERNS) {
    const m = name.match(re)
    if (m) {
      const searchTerm = fn(m).toLowerCase()
      // Exact match first
      if (byName[searchTerm]) return byName[searchTerm]
      // Substring match
      const found = Object.values(byName).find(row => row.NAME.toLowerCase().includes(searchTerm))
      if (found) return found
    }
  }

  // 4. Substring match on full name as fallback
  const lower = name.toLowerCase()
  const fallback = Object.values(byName).find(row => {
    const loc = row.NAME.toLowerCase()
    return loc.includes(lower) || lower.includes(loc)
  })
  return fallback || null
}

// --- Step D: Process each ratings row ---
const schools = []
let kept = 0, filtered = 0, matched = 0
const unmatched = []

for (const row of ratingsRows) {
  const type = row['School Type'].trim()
  if (EXCLUDED_TYPES.has(type)) { filtered++; continue }

  const starRating = parseStarRating(row['Star Rating'])
  const indexScore = parseNum(row['Total Index Score'])
  if (indexScore === null) { filtered++; continue }

  const name = row['School Name'].trim()
  const schoolType = type === 'District Charter' || type === 'SPCSA' ? 'Charter' : 'Regular'
  const level = inferLevel(name)

  const loc = findLocation(name)
  let lat = null, lng = null, address = null, city = null, zip = null, county = null

  if (loc) {
    lat = parseFloat(loc.LAT) || null
    lng = parseFloat(loc.LON) || null
    address = loc.STREET?.trim() || null
    city = loc.CITY?.trim() || null
    zip = loc.ZIP?.trim() || null
    // NMCNTY is e.g. "Clark County" or "Carson City" — strip " County" suffix
    county = (loc.NMCNTY?.trim() || '').replace(/ County$/, '') || null
    matched++
  } else {
    unmatched.push(name)
    // Fallback: use District Name (already county name for regular schools)
    const districtName = row['District Name']?.trim()
    if (districtName && districtName !== 'State Public Charter School Authority') {
      county = districtName
    }
  }

  schools.push({
    id: row['NSPF School Code'].trim(),
    name,
    type: schoolType,
    level,
    county,
    starRating,
    indexScore,
    elaProficiency: parseNum(row['% Proficient ELA']),
    mathProficiency: parseNum(row['% Proficient Math']),
    scienceProficiency: parseNum(row['% Proficient Science']),
    elaGrowth: parseNum(row['% Meeting AGP ELA']),
    mathGrowth: parseNum(row['% Meeting AGP Math']),
    titleI: parseBool(row['Title I Status']),
    lat,
    lng,
    address,
    city,
    zip,
  })
  kept++
}

// --- Step E: Output ---
writeFileSync(join(dataDir, 'nv-schools.json'), JSON.stringify(schools, null, 2))

console.log(`Done. Kept: ${kept}, Filtered: ${filtered}, Matched: ${matched}, Unmatched: ${unmatched.length}`)
if (unmatched.length > 0) {
  console.log('\nUnmatched schools:')
  unmatched.forEach(n => console.log(`  ${n}`))
}
