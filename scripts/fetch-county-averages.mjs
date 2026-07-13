import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'public', 'data')

// --- Nevada Report Card (NDE Data Interaction portal) config ---

const API = 'https://nevadareportcard.nv.gov/DIWAPI-NVReportCard/api'

const YEAR = '2025'

// Statewide figures, used as the fallback when no county is selected.
// orgId 64825 is the 'State' org (type 'S') from /api/Organizations?year=2025.
const STATE_SCOPE = 'State'
const STATE_ORG_ID = 64825

// Each Nevada county is a single school district, so NDE's district-level figures
// are the official county averages. orgIds come from /api/Organizations?year=2025
// (type 'D'); districts 18-20 (charter authority, university, correctional) are not
// counties and are skipped.
const COUNTY_ORG_IDS = {
  Churchill: 64826,
  Clark: 64827,
  Douglas: 64828,
  Elko: 64829,
  Esmeralda: 64830,
  Eureka: 64831,
  Humboldt: 64832,
  Lander: 64833,
  Lincoln: 64834,
  Lyon: 64835,
  Mineral: 64836,
  Nye: 64837,
  'Carson City': 64838,
  Pershing: 64839,
  Storey: 64840,
  Washoe: 64841,
  'White Pine': 64842,
}

// The dashboard names ELA "reading". Values arrive as strings, and may be a
// suppression marker ("<5", ">95") or a sentinel ("-999") rather than a number.
const LEVEL_FIELDS = {
  Elementary: { ela: 'reading_elem', math: 'math_elem' },
  Middle: { ela: 'reading_middle', math: 'math_middle' },
  High: { ela: 'reading_high', math: 'math_high' },
}

function parseValue(val) {
  if (val == null) return null
  const s = String(val).trim()
  if (s === '' || s === 'N/A' || s === '-') return null
  const n = parseFloat(s)
  if (isNaN(n) || n < 0) return null
  return n
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

const averages = {}

const SCOPES = { ...COUNTY_ORG_IDS, [STATE_SCOPE]: STATE_ORG_ID }

for (const [scope, orgId] of Object.entries(SCOPES)) {
  const rows = await fetchWithRetry(`${API}/Dashboard?year=${YEAR}&orgId=${orgId}`)
  const row = rows[0]
  if (!row) {
    console.warn(`  ${scope}: no data returned`)
    continue
  }

  for (const [level, fields] of Object.entries(LEVEL_FIELDS)) {
    const elaProficiency = parseValue(row[fields.ela])
    const mathProficiency = parseValue(row[fields.math])
    if (elaProficiency === null && mathProficiency === null) continue
    averages[`${scope}:${level}`] = { county: scope, level, elaProficiency, mathProficiency }
  }

  console.log(`  ${scope}: ELA ${row.reading_elem}/${row.reading_middle}/${row.reading_high}, Math ${row.math_elem}/${row.math_middle}/${row.math_high} (elem/middle/high)`)
}

// --- Output ---

writeFileSync(join(dataDir, `nv-county-averages-${YEAR}.json`), JSON.stringify(averages, null, 2))

console.log(`\nDone. ${Object.keys(averages).length} county+level averages`)
