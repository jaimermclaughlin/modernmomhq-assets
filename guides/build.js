// Builds guides/pdf/Master-Your-Motherhood-Workbook.pdf from master-your-motherhood.html.
// Usage: node guides/build.js   (needs Playwright with Chromium, Python 3 with pypdf)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const SRC = path.join(HERE, 'master-your-motherhood.html');
const OUT_DIR = path.join(HERE, 'pdf');
const OUT = path.join(OUT_DIR, 'Master-Your-Motherhood-Workbook.pdf');
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'mym-'));
const t = (n) => path.join(TMP, n);
const py = (args) => execFileSync('python3', ['-I', path.join(HERE, 'pdf_tools.py'), ...args]).toString();

const FOOT = '<div style="width:100%;padding:0 0.75in;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;font-size:7px;letter-spacing:1.2px;text-transform:uppercase;color:#A89A87">' +
  '<span>Master Your Motherhood · Modern Mom HQ</span><span class="pageNumber"></span></div>';
const BODY_OPTS = {
  format: 'Letter', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>', footerTemplate: FOOT,
  margin: { top: '0.6in', bottom: '0.72in', left: '0.75in', right: '0.75in' }
};

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + SRC);
  await page.evaluate(() => document.fonts.ready);
  const fontsOk = await page.evaluate(() => ['Instrument Serif', 'Work Sans', 'Faustine'].map(f => [f, document.fonts.check('16px "' + f + '"')]));
  console.log('fonts', JSON.stringify(fontsOk));

  // 1. Cover, edge to edge, no footer
  await page.evaluate(() => { document.documentElement.className = 'only-cover'; });
  await page.pdf({ path: t('cover.pdf'), width: '8.5in', height: '11in', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, pageRanges: '1' });

  // 2. Body, first pass to find where each chapter starts
  await page.evaluate(() => { document.documentElement.className = 'no-cover'; });
  await page.pdf({ ...BODY_OPTS, path: t('body.pdf') });
  const spec = await page.evaluate(() => ({
    toc: document.querySelector('[data-toc-page]').textContent.trim(),
    markers: [...document.querySelectorAll('[data-toc]')].map(e => ({ id: e.getAttribute('data-toc'), text: e.textContent.trim(), title: e.getAttribute('data-title') }))
  }));
  fs.writeFileSync(t('markers.json'), JSON.stringify(spec));
  const pages = JSON.parse(py(['find', t('body.pdf'), t('markers.json')]));

  // 3. Fill the contents page and render again
  await page.evaluate((p) => { Object.keys(p).forEach(id => { const el = document.querySelector('.toc [data-p="' + id + '"]'); if (el) el.textContent = p[id]; }); }, pages);
  await page.pdf({ ...BODY_OPTS, path: t('body.pdf') });
  const check = JSON.parse(py(['find', t('body.pdf'), t('markers.json')]));
  if (JSON.stringify(check) !== JSON.stringify(pages)) throw new Error('Page numbers moved after filling the contents page');
  await browser.close();

  // 4. Merge with bookmarks
  const meta = {
    title: 'Master Your Motherhood: The Workbook', author: 'Jaime McLaughlin, Modern Mom HQ',
    subject: 'Systems for your mindset, mental load, family, kids and self-care that still work on a bad day. ADHD-friendly.',
    outline: spec.markers.map(m => ({ title: m.title, page: pages[m.id] }))
  };
  fs.writeFileSync(t('meta.json'), JSON.stringify(meta));
  console.log(py(['merge', t('cover.pdf'), t('body.pdf'), OUT, t('meta.json')]).trim());
  console.log('chapter pages', JSON.stringify(pages));
  console.log('wrote', OUT);
})().catch(e => { console.error(e); process.exit(1); });
