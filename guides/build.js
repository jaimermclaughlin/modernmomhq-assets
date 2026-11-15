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
  // Number citations in reading order and sort the Sources list to match
  const src = await page.evaluate(() => {
    const list = document.querySelector('ol.sources');
    const items = {}; [...list.children].forEach(li => { items[li.id] = li; });
    const order = [], missing = [];
    document.querySelectorAll('a[href^="#src-"]').forEach(a => {
      if (a.closest('ol.sources')) return;
      const id = a.getAttribute('href').slice(1);
      if (!items[id]) { missing.push(id); return; }
      if (!order.includes(id)) order.push(id);
      a.textContent = order.indexOf(id) + 1;
    });
    const unused = Object.keys(items).filter(id => !order.includes(id));
    order.forEach(id => list.appendChild(items[id]));
    return { count: order.length, missing, unused };
  });
  if (src.missing.length || src.unused.length) throw new Error('Source problems: ' + JSON.stringify(src));
  console.log('sources', src.count);
  // Typography: keep the last two words of every sentence and block together, and let long URLs break only at / . - characters
  await page.evaluate(() => {
    document.querySelectorAll('ol.sources a').forEach(a => {
      const parts = a.textContent.split(/(?<=[\/.\-_?=&])/);
      a.textContent = '';
      parts.forEach((p, i) => { a.appendChild(document.createTextNode(p)); if (i < parts.length - 1) a.appendChild(document.createElement('wbr')); });
    });
    const SEL = window.__TEXT_SEL = 'p, li, td, th, h1, h2, h3, h4, dd, .d, .lead, .anchor span, .flow b, .flow div > span, .buck .for, .buck .fam, .note, .pill';
    const els = [...document.querySelectorAll(SEL)].filter(el => !el.querySelector(SEL) && !el.closest('ol.sources'));
    const WS = /[ \t\n\r]/;
    els.forEach(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('sup') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
      const map = []; nodes.forEach(node => { for (let i = 0; i < node.data.length; i++) map.push([node, i]); });
      const text = nodes.map(x => x.data).join('');
      const tokens = []; const re = /[^ \t\n\r]+/g; let m;
      while ((m = re.exec(text))) tokens.push([m.index, m.index + m[0].length, m[0]]);
      const edits = new Map();
      const join = (k) => {
        if (k < 1) return;
        let s0 = tokens[k - 1][1], s1 = tokens[k][0];
        if (s1 <= s0) return;
        for (let i = s0; i < s1; i++) {
          const [node, off] = map[i];
          if (!edits.has(node)) edits.set(node, []);
          edits.get(node).push([off, i === s0 ? '\u00a0' : '']);
        }
      };
      tokens.forEach((t, k) => { if (/[.!?](["\u201d\u2019)\]]*)$/.test(t[2])) join(k); });
      if (tokens.length > 1) join(tokens.length - 1);
      edits.forEach((list, node) => {
        const chars = node.data.split('');
        list.forEach(([off, ch]) => { chars[off] = ch; });
        node.data = chars.join('');
      });
    });
  });

  // Layout checks in print layout at the real text width (7in): clipped or overflowing text, and lines holding a single sentence-ending word
  await page.emulateMedia({ media: 'print' });
  await page.setViewportSize({ width: 672, height: 1000 });
  await page.evaluate(() => { document.documentElement.className = 'no-cover'; });
  const layout = await page.evaluate(() => {
    const out = { overflow: [], oneWord: [] };
    const W = document.documentElement.clientWidth;
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!n.data.trim()) continue;
      const el = n.parentElement;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const rect of r.getClientRects()) {
        if (rect.width === 0) continue;
        if (rect.right > W + 0.5 || rect.left < -0.5) { out.overflow.push('past page edge: ' + n.data.trim().slice(0, 70)); break; }
        let a = el, bad = null;
        while (a && a !== document.body) {
          const cs = getComputedStyle(a);
          const boxed = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0 || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || a.tagName === 'TD' || a.tagName === 'TH';
          if (boxed) { const b = a.getBoundingClientRect(); if (rect.right > b.right + 1 || rect.left < b.left - 1 || rect.bottom > b.bottom + 1 || rect.top < b.top - 2) { bad = (a.className || a.tagName); } break; }
          a = a.parentElement;
        }
        if (bad) { out.overflow.push('outside its box (' + bad + '): ' + n.data.trim().slice(0, 70)); break; }
      }
    }
    const SEL = window.__TEXT_SEL;
    const els = [...document.querySelectorAll(SEL)].filter(el => !el.querySelector(SEL) && !el.closest('ol.sources'));
    els.forEach(el => {
      const words = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: x => x.parentElement.closest('sup') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      let t;
      while ((t = walker.nextNode())) {
        const re = /[^ \t\n\r\u00a0]+/g; let m;
        while ((m = re.exec(t.data))) {
          const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
          const rc = r.getClientRects()[0]; if (rc) words.push({ w: m[0], top: rc.top, h: rc.height });
        }
      }
      if (!words.length) return;
      const lines = []; let cur = [words[0]];
      for (let i = 1; i < words.length; i++) { if (words[i].top > cur[0].top + cur[0].h * 0.6) { lines.push(cur); cur = [words[i]]; } else cur.push(words[i]); }
      lines.push(cur);
      if (lines.length < 2) return;
      lines.forEach((ln, i) => {
        const single = ln.length === 1;
        const ends = /[.!?](["\u201d\u2019)\]]*)$/.test(ln[0].w);
        if (single && (i === lines.length - 1 || ends)) out.oneWord.push(ln[0].w + '  <=  ' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 70));
      });
    });
    return out;
  });
  console.log('layout check: overflow', layout.overflow.length, '| one-word lines', layout.oneWord.length);
  if (layout.overflow.length || layout.oneWord.length) {
    [...layout.overflow, ...layout.oneWord].forEach(x => console.log('  ' + x));
    if (!process.env.ALLOW_LAYOUT_ISSUES) throw new Error('Layout problems found');
  }

  const fontsOk = await page.evaluate(() => ['Instrument Serif', 'Work Sans', 'Faustine', 'Awesome Ways'].map(f => [f, document.fonts.check('16px "' + f + '"')]));
  console.log('fonts', JSON.stringify(fontsOk));
  if (!fontsOk.find(f => f[0] === 'Awesome Ways')[1]) console.log('NOTE: Awesome Ways font file not found in guides/fonts/, using Faustine for script text');
  const placeholders = await page.evaluate(() => document.querySelectorAll('a[href="#SHOPMY-LINK"]').length);
  if (placeholders) console.log('NOTE: ' + placeholders + ' ShopMy link placeholder(s) still need a real link');

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
