// Landing-page screenshot for the outreach email. ALWAYS off the LIVE deployed
// URL, never localhost: the shot has to be what the owner will actually see.
import puppeteer from 'puppeteer-core'
const URL = process.argv[2] || 'https://sindrimar02.github.io/bru-preview/'
const OUT = process.argv[3] || `${process.env.HOME}/Downloads/frumgerd-bru.png`
const sleep = ms => new Promise(r => setTimeout(r, ms))

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb']
})
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
await p.goto(URL, { waitUntil: 'networkidle0' })
// the opening reveal must be FINISHED, or the shot is a black field with an
// outlined wordmark — the one thing the email must not show
await p.waitForFunction(() => !document.body.classList.contains('is-loading'), { timeout: 30000 })
await sleep(1600)
const state = await p.evaluate(() => ({
  loading: document.body.classList.contains('is-loading'),
  wmOpacity: getComputedStyle(document.querySelector('.bru-hero__wm')).opacity,
  heroImg: document.querySelector('.bru-hero__media img').currentSrc.split('/').pop(),
  heroDecoded: document.querySelector('.bru-hero__media img').complete
}))
if (state.loading || Number(state.wmOpacity) < 0.9 || !state.heroDecoded) {
  console.error('REFUSING to shoot, hero not settled:', JSON.stringify(state)); process.exit(1)
}
await p.screenshot({ path: OUT })
console.log('shot:', OUT, JSON.stringify(state))
await b.close()
