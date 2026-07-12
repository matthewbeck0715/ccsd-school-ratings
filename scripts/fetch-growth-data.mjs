import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'public', 'data')

// --- Nevada Growth Model (NGM) config ---

const NGM_API = 'https://ngma.bighorn.doe.nv.gov/nvgrowthmodel/api'

// Year 2025 = the 2024-25 school year (matches the site's data-defaultyear).
const YEAR = '2025'

// District IDs from /api/accountinfo. 20 (Correctional) and 99 (Demo) are omitted:
// build-school-data.mjs excludes those schools anyway.
const DISTRICT_IDS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '21',
]

// NGM encodes missing/suppressed data as negative sentinels rather than null.
// Per the site's own recodeRows(): -999/-998 = N/A, -997 = suppressed (small N),
// -996 = blank, -995 = "<5", -994 = ">95". A raw -999 would render as a growth
// score of -999, so every sentinel has to be decoded away here.
const SENTINELS = new Set([-994, -995, -996, -997, -998, -999])

function decodeSentinel(val) {
  if (typeof val !== 'number' || SENTINELS.has(val)) return null
  return val
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 500 * attempt))
    }
  }
}

// --- Fetch ---

const growth = {}
let rowCount = 0

for (const id of DISTRICT_IDS) {
  const rows = await fetchWithRetry(`${NGM_API}/scatterplot?id=${id}&year=${YEAR}&username=`)
  rowCount += rows.length

  for (const row of rows) {
    // RD_* is ELA (not Reading) and EL_* is ELPA (English learners only) --
    // the prefixes do not mean what they look like. Verified against /api/columns.
    growth[row.NSPF_School] = {
      elaMgp: decodeSentinel(row.RD_MED_SGP),
      mathMgp: decodeSentinel(row.MA_MED_SGP),
      elaMgpN: decodeSentinel(row.RD_N_SGP),
      mathMgpN: decodeSentinel(row.MA_N_SGP),
    }
  }

  console.log(`  District ${id}: ${rows.length} schools`)
}

// --- Output ---

const sorted = Object.fromEntries(Object.entries(growth).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(join(dataDir, `nv-growth-${YEAR}.json`), JSON.stringify(sorted, null, 2))

const withEla = Object.values(growth).filter(g => g.elaMgp !== null).length
const withMath = Object.values(growth).filter(g => g.mathMgp !== null).length

console.log(`\nDone. ${rowCount} rows -> ${Object.keys(growth).length} schools`)
console.log(`  ELA MGP: ${withEla}, Math MGP: ${withMath}`)
