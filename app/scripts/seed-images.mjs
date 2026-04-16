/**
 * seed-images.mjs — upload Wikimedia images for seeded spots
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/seed-images.mjs
 *
 * SUPABASE_URL defaults to the dev project URL.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://lcjmnxivqndygeepbqwi.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY env var required.')
  console.error('Get it from: Supabase dashboard → project lcjmnxivqndygeepbqwi → Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Spots with image slots.
 * queries[i] = search term for image slot i+1.
 * Spots 18 (Maroon Bells) and 19 (Painted Hills) intentionally have 0 images.
 */
const SPOTS = [
  { id: 'c1000000-0000-0000-0000-000000000001', queries: ['Half Dome'] },
  { id: 'c1000000-0000-0000-0000-000000000002', queries: ['Grand Canyon', 'Colorado River Grand Canyon'] },
  { id: 'c1000000-0000-0000-0000-000000000003', queries: ['Glacier National Park', 'Logan Pass', 'Hidden Lake Glacier'] },
  { id: 'c1000000-0000-0000-0000-000000000004', queries: ['Angels Landing'] },
  { id: 'c1000000-0000-0000-0000-000000000005', queries: ['Grand Prismatic Spring', 'Midway Geyser Basin'] },
  { id: 'c1000000-0000-0000-0000-000000000006', queries: ['Delicate Arch'] },
  { id: 'c1000000-0000-0000-0000-000000000007', queries: ['Cadillac Mountain', 'Acadia National Park'] },
  { id: 'c1000000-0000-0000-0000-000000000008', queries: ['Clingmans Dome'] },
  { id: 'c1000000-0000-0000-0000-000000000009', queries: ['Hoh Rain Forest', 'Olympic National Park', 'Hoh River'] },
  { id: 'c1000000-0000-0000-0000-000000000010', queries: ['Bryce Canyon National Park', 'Bryce Canyon hoodoo'] },
  { id: 'c1000000-0000-0000-0000-000000000011', queries: ['Bear Lake Rocky Mountain', 'Rocky Mountain National Park'] },
  { id: 'c1000000-0000-0000-0000-000000000012', queries: ['Crater Lake'] },
  { id: 'c1000000-0000-0000-0000-000000000013', queries: ['Denali', 'Wonder Lake Denali', 'Denali National Park'] },
  { id: 'c1000000-0000-0000-0000-000000000014', queries: ['McWay Falls', 'Julia Pfeiffer Burns State Park'] },
  { id: 'c1000000-0000-0000-0000-000000000015', queries: ['Antelope Canyon'] },
  { id: 'c1000000-0000-0000-0000-000000000016', queries: ['Havasu Falls'] },
  { id: 'c1000000-0000-0000-0000-000000000017', queries: ['Multnomah Falls'] },
  { id: 'c1000000-0000-0000-0000-000000000020', queries: ['Mesa Arch'] },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Search Wikipedia using the opensearch generator — finds best-matching article
 * then returns its page image thumbnail. More robust than exact title lookup.
 */
async function searchWikimedia(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '3',
    prop: 'pageimages',
    pithumbsize: '1200',
    format: 'json',
    origin: '*',
  })
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`)
  const data = await res.json()
  const pages = Object.values(data.query?.pages ?? {})
  // Pick first page that has a thumbnail
  for (const page of pages) {
    if (page.thumbnail?.source) return page.thumbnail.source
  }
  return null
}

/** Download image URL → Buffer, with retry on 429. */
async function downloadImage(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'the-spot-seed/1.0 (seed script; contact vilnisdev@gmail.com)' },
    })
    if (res.status === 429) {
      const wait = attempt * 3000
      process.stdout.write(`[429 rate-limit, waiting ${wait / 1000}s] `)
      await sleep(wait)
      continue
    }
    if (!res.ok) throw new Error(`Download ${res.status}: ${url}`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error(`Download failed after ${retries} retries (429): ${url}`)
}

/** Upload buffer to Supabase Storage. Upserts so re-runs are safe. */
async function uploadToStorage(spotId, n, buffer) {
  const path = `${spotId}/${n}.jpg`
  const { error } = await supabase.storage.from('media').upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) throw new Error(`Storage upload failed for ${path}: ${error.message}`)
  return path
}

async function main() {
  let uploaded = 0
  let failed = 0

  for (const spot of SPOTS) {
    for (let i = 0; i < spot.queries.length; i++) {
      const n = i + 1
      const query = spot.queries[i]
      process.stdout.write(`  ${spot.id.slice(-3)} [${n}/${spot.queries.length}] "${query}"... `)
      try {
        const imgUrl = await searchWikimedia(query)
        if (!imgUrl) {
          console.log('no image found, skipping')
          failed++
          await sleep(300)
          continue
        }
        await sleep(500) // be polite between search and download
        const buffer = await downloadImage(imgUrl)
        const path = await uploadToStorage(spot.id, n, buffer)
        console.log(`✓ ${path} (${(buffer.length / 1024).toFixed(0)} KB)`)
        uploaded++
      } catch (err) {
        console.log(`✗ ${err.message}`)
        failed++
      }
      await sleep(600) // 600ms between requests to stay under rate limit
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
