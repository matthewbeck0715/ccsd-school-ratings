import { readFileSync } from 'fs'

const d1 = JSON.parse(readFileSync('/tmp/ccsd_nces.json', 'utf8')).results
const d2 = JSON.parse(readFileSync('/tmp/nv_charters.json', 'utf8')).results
const allNces = [...d1, ...d2].filter(s => s.latitude && s.longitude)

const schools = JSON.parse(readFileSync('public/data/schools.json', 'utf8'))

let checked = 0, mismatches = 0
const issues = []

for (const s of schools) {
  if (s.lat === null) continue

  const level = s.name.match(/ (ES|MS|HS)$/)?.[1]
  if (!level) continue
  const base = s.name.replace(/ (ES|MS|HS)$/, '').trim().toLowerCase()
  const firstWord = base.split(' ')[0]

  const candidates = allNces.filter(n => {
    const nn = n.school_name.toLowerCase()
    if (!nn.includes(firstWord)) return false
    if (level === 'ES') return nn.includes(' es') || nn.includes('elementary')
    if (level === 'MS') return nn.includes(' ms') || nn.includes('middle') || nn.includes('jhs')
    if (level === 'HS') return nn.includes(' hs') || nn.includes('high') || nn.includes('academy')
    return false
  })

  const words = base.split(/\s+/)
  let best = candidates.find(c => {
    const cn = c.school_name.toLowerCase()
    return words.every(w => cn.includes(w))
  })

  if (!best && candidates.length === 1) best = candidates[0]

  if (best) {
    checked++
    const latDiff = Math.abs(s.lat - best.latitude)
    const lngDiff = Math.abs(s.lng - best.longitude)
    if (latDiff > 0.005 || lngDiff > 0.005) {
      mismatches++
      const dist = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111
      issues.push({
        name: s.name,
        ncesName: best.school_name,
        ours: [s.lat, s.lng],
        nces: [best.latitude, best.longitude],
        distKm: dist.toFixed(1),
      })
    }
  }
}

console.log(`Checked: ${checked} | Mismatches (>0.5km): ${mismatches}`)
if (issues.length) {
  console.log('\nMismatched schools:')
  issues.sort((a, b) => parseFloat(b.distKm) - parseFloat(a.distKm))
  issues.forEach(i =>
    console.log(`  ${i.name} → ${i.ncesName} | ours: ${i.ours.map(x => x.toFixed(4))} | nces: ${i.nces.map(x => x.toFixed(4))} | ~${i.distKm}km off`)
  )
}
