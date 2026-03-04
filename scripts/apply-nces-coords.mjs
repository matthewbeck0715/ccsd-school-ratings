import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schoolsPath = join(__dirname, '..', 'public', 'data', 'schools.json')

const d1 = JSON.parse(readFileSync('/tmp/ccsd_nces.json', 'utf8')).results
const d2 = JSON.parse(readFileSync('/tmp/nv_charters.json', 'utf8')).results
const allNces = [...d1, ...d2].filter(s => s.latitude && s.longitude)

// Build lookup keyed by lowercase name
const byName = {}
allNces.forEach(s => { byName[s.school_name.toLowerCase()] = s })

// Manual overrides for names we can't pattern-match
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
}

// Pattern-based matching for remaining schools
const PATTERNS = [
  [/^CASLV (.+?)( ES| MS| HS)$/, (m) => 'Coral Academy ' + m[1]],
  [/^NSHS (.+?)( HS)$/, (m) => 'Nevada State High School ' + m[1]],
  [/^Somerset (.+?)( ES| MS| HS)$/, (m) => 'Somerset Academy ' + m[1].replace('Skye Canyon','Skye Canyon').replace('Sky Pointe','Sky Pointe')],
  [/^Doral (.+?)( ES| MS| HS)$/, (m) => 'Doral Academy ' + m[1].replace('Cactus','Cactus').replace('Fire Mesa','Fire Mesa').replace('Red Rock','Red Rock').replace('Saddle','Saddle')],
  [/^Pinecrest (.+?)( ES| MS| HS)$/, (m) => 'Pinecrest Academy of Nevada ' + m[1].replace('Sloan','Sloan Canyon').replace('Cadence','Cadence').replace('Horizon','Horizon').replace('Inspirada','Inspirada').replace('St Rose','St Rose').replace('Springs','Springs')],
  [/^DP Agassi.*?( ES| MS| HS)$/, () => 'Democracy Prep at Agassi'],
  // Generic: strip suffix and try
  [/^(.+?)( ES| MS| HS)$/, (m) => m[1]],
]

function findNces(name) {
  // Manual override
  if (MANUAL[name]) {
    const target = MANUAL[name].toLowerCase()
    const found = allNces.find(s => s.school_name.toLowerCase() === target)
    if (found) return found
    // Partial match
    const partial = allNces.find(s => s.school_name.toLowerCase().includes(target) || target.includes(s.school_name.toLowerCase()))
    if (partial) return partial
  }

  // Pattern matching
  for (const [re, fn] of PATTERNS) {
    const m = name.match(re)
    if (m) {
      const searchTerm = fn(m).toLowerCase()
      const found = allNces.find(s => s.school_name.toLowerCase().includes(searchTerm))
      if (found) return found
    }
  }

  return null
}

const schools = JSON.parse(readFileSync(schoolsPath, 'utf8'))
const missing = schools.filter(s => s.lat === null)
let matched = 0
const unmatched = []

for (const school of missing) {
  const nRec = findNces(school.name)
  if (nRec) {
    school.lat = nRec.latitude
    school.lng = nRec.longitude
    matched++
  } else {
    unmatched.push(school.name)
  }
}

writeFileSync(schoolsPath, JSON.stringify(schools, null, 2))
console.log(`Applied ${matched} coordinates from NCES. Still missing: ${unmatched.length}`)
if (unmatched.length > 0) {
  console.log('\nStill unmatched:')
  unmatched.forEach(n => console.log(`  ${n}`))
}
