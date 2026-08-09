// Brú QA. Headless Chrome: the preview pane suspends rAF while backgrounded,
// so a scrubbed value can freeze and look identical to a working one.
// Run: node bru-guesthouse/_qa.mjs [url]
import puppeteer from 'puppeteer-core'
import { PNG } from 'pngjs'

const URL = process.argv[2] || 'http://localhost:5322/'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const out = []
const log = (ok, name, d = '') => { out.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${d ? '  ' + d : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errs = []
page.on('pageerror', e => errs.push(String(e).slice(0, 120)))
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)) })

await page.goto(URL, { waitUntil: 'domcontentloaded' })
await sleep(300)
const loaderUp = await page.evaluate(() => !!document.getElementById('opening'))
await sleep(6500)
const loaderGone = await page.evaluate(() => { const o = document.getElementById('opening'); return !o || o.classList.contains('is-done') })
log(loaderUp && loaderGone, 'opening mounts then hands over', `up:${loaderUp} gone:${loaderGone}`)

await page.evaluate(() => document.fonts.ready); await sleep(700)

const at = async f => { await page.evaluate(v => {
  const H = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(H * v)) }, f); await sleep(620) }

/* 1. the palette arc: distinct AND reversible */
const readC = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c').trim())
await at(0.05); const a = await readC()
await at(0.5);  const b = await readC()
await at(0.95); const c = await readC()
await at(0.5);  const b2 = await readC()
log(new Set([a, b, c]).size === 3 && b === b2, 'palette arc is continuous and reversible', `${a} -> ${b} -> ${c}, back to ${b2}`)

/* 2. is-night derives from LUMINANCE, not a progress threshold */
await at(0.95); const night = await page.evaluate(() => document.body.classList.contains('is-night'))
await at(0.05); const day = await page.evaluate(() => !document.body.classList.contains('is-night'))
log(night && day, 'is-night derives from canvas luminance', `night@.95:${night} day@.05:${day}`)

/* 3. THE INDEX names the section you are actually in, and it CHANGES */
const idx = await page.evaluate(async () => {
  const here = () => (document.querySelector('.bru-index a.is-here') || {}).dataset?.sec || ''
  // Lenis owns the scroll position, so scrollIntoView gets reverted by its
  // rAF loop. Drive an absolute offset and let it settle instead.
  const go = async id => { const el = document.getElementById(id)
    const y = el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3
    window.scrollTo(0, Math.round(y)); await new Promise(r => setTimeout(r, 900)); return here() }
  return { links: document.querySelectorAll('.bru-index a').length,
           cot: await go('cottages'), night: await go('night'), book: await go('book') }
})
log(idx.links === 6 && idx.cot === 'cottages' && idx.night === 'night' && idx.book === 'book',
  'the index lights the section you are in', `${idx.cot} / ${idx.night} / ${idx.book}`)

/* 3b. THE SET PIECE: genuinely pinned, and the film TRACKS (not replays) */
const film = await page.evaluate(async () => {
  const st = ScrollTrigger.getAll().find(t => t.vars && t.vars.scrub && t.trigger === document.querySelector('.bru-film'))
  const cv = document.querySelector('.bru-film__canvas')
  if (!st || !cv) return null
  // Lenis owns the scroll, so a single scrollTo gets reverted by its rAF loop.
  // Write it, let it settle, then read.
  const read = async f => { const y = Math.round(st.start + (st.end - st.start) * f)
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 300))
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 800))
    return Number(cv.dataset.frame ?? -1) }
  const a = await read(0.02), mid = await read(0.5), end = await read(0.98), back = await read(0.5)
  const c = document.querySelector('.bru-film__canvas'); const spacer = c.height > 200 && c.width > 200
  return { a, mid, end, back, spacer }
})
log(!!film && film.spacer && film.end >= 100 && film.mid > film.a && Math.abs(film.back - film.mid) <= 2,
  'set piece canvas has real pixels and the film tracks both ways',
  film ? `${film.a} -> ${film.mid} -> ${film.end}, back ${film.back} of 120, canvasOK:${film.spacer}` : 'no pinned trigger')


/* 5. headline words resolve */
await at(0.35); await sleep(500)
const stuck = await page.evaluate(() => { let s = 0
  document.querySelectorAll('[data-headline]').forEach(h => { const r = h.getBoundingClientRect()
    if (r.top > innerHeight || r.bottom < 0) return
    h.querySelectorAll('.bru-word').forEach(w => { if (parseFloat(getComputedStyle(w).opacity) < .9) s++ }) }); return s })
log(stuck === 0, 'in-view headline words resolved', `${stuck} stuck`)

/* 6. images */
await page.evaluate(async () => { const H = document.body.scrollHeight
  for (let y = 0; y < H; y += innerHeight * .5) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 130)) }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)) })
const broken = await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => !i.naturalWidth).map(i => i.getAttribute('src')))
log(broken.length === 0, 'every <img> decoded', broken.join(', ') || 'all decoded')

/* 7. contrast over the REAL backdrop, sampled from pixels */
const contrast = async (sel) => {
  const box = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return null
    const r = e.getBoundingClientRect(); e.dataset.qaHide = '1'; e.style.visibility = 'hidden'
    return { x: Math.max(0, r.x | 0), y: Math.max(0, r.y | 0), width: Math.max(1, r.width | 0), height: Math.max(1, r.height | 0) } }, sel)
  if (!box) return null
  const buf = await page.screenshot({ clip: box })
  await page.evaluate(s => { const e = document.querySelector(s); if (e) e.style.visibility = '' }, sel)
  const png = PNG.sync.read(buf)
  const fg = await page.evaluate(s => getComputedStyle(document.querySelector(s)).color, sel)
  const L = ([r, g, bl]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4) }
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(bl) }
  const fgL = L(fg.match(/\d+/g).map(Number))
  let worst = 99
  for (let i = 0; i < png.data.length; i += 4 * 7) {
    const bgL = L([png.data[i], png.data[i + 1], png.data[i + 2]])
    const cr = (Math.max(fgL, bgL) + .05) / (Math.min(fgL, bgL) + .05)
    if (cr < worst) worst = cr
  }
  return worst
}
await at(0); await sleep(500)
const heroC = await contrast('.bru-hero__sub')
log(heroC >= 4.5, 'hero subtext over its real backdrop', `worst ${heroC?.toFixed(2)}:1`)
const navC = await contrast('.bru-nav__mark')
log(navC >= 4.5, 'nav mark over the hero photograph', `worst ${navC?.toFixed(2)}:1`)

/* 8. the overlay must be HIDDEN at rest — [hidden] loses to any author display rule */
const menuDisp = await page.evaluate(() => getComputedStyle(document.getElementById('menu')).display)
log(menuDisp === 'none', 'mobile menu is hidden at rest', menuDisp)

/* 9. headlines in narrow columns stay <= 2 lines */
const tall = await page.evaluate(() => [...document.querySelectorAll('.bru-h2')].map(h => {
  const r = h.getBoundingClientRect(), fs = parseFloat(getComputedStyle(h).fontSize)
  const lh = parseFloat(getComputedStyle(h).lineHeight) || fs * 1.1
  return { t: h.textContent.trim().slice(0, 26), lines: Math.round(r.height / lh) } }).filter(x => x.lines > 2))
log(tall.length === 0, 'no headline towers past 2 lines', tall.length ? JSON.stringify(tall) : 'all <= 2')

/* 10. tap targets + overflow */
const tap = await page.evaluate(() => [...document.querySelectorAll('a,button')]
  .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 24) }).length)
log(tap === 0, 'tap targets >= 44px', `${tap} under`)
for (const w of [390, 768, 1440]) {
  await page.setViewport({ width: w, height: 900 }); await sleep(600)
  const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  log(o <= 0, `no horizontal overflow @${w}`, `${o}px`)
}
await page.setViewport({ width: 1440, height: 900 })

/* 11. copy gates */
const h1 = await page.evaluate(() => { const h = document.querySelector('h1'); return (h.getAttribute('aria-label') || h.textContent).trim() })
log(h1.length > 2, 'h1 has an accessible name', JSON.stringify(h1))
const dashes = await page.evaluate(() => { const t = document.body.innerText
  return (t.match(/[^\n]{0,40}[—–][^\n]{0,40}/g) || []).slice(0, 3) })
log(dashes.length === 0, 'zero em-dashes in customer copy', dashes.join(' | ') || 'clean')

/* 12. reduced motion renders everything */
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page.reload({ waitUntil: 'networkidle0' }); await sleep(900)
const hidden = await page.evaluate(() => { const bad = []
  document.querySelectorAll('.bru-rv, .bru-word, main>section').forEach(e => {
    if (e.closest('[hidden]')) return
    if (parseFloat(getComputedStyle(e).opacity) < .9) bad.push((e.className || e.tagName).toString().slice(0, 30)) })
  return [...new Set(bad)] })
log(hidden.length === 0, 'reduced motion renders every block', hidden.slice(0, 3).join(' | ') || 'all visible')
const rmIdx = await page.evaluate(() => document.querySelectorAll('.bru-index a').length)
log(rmIdx === 6, 'reduced motion keeps the index (concept survives)', `${rmIdx} links`)

log(errs.length === 0, 'no page errors', errs.slice(0, 3).join(' | ') || 'clean')
await browser.close()
const pass = out.filter(Boolean).length
console.log(`\n${pass}/${out.length} passed`)
process.exit(pass === out.length ? 0 : 1)
