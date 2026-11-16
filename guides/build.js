// Builds one workbook as a fillable PDF, plus its worksheet pack when the book has a pack cover.
// Usage: node guides/build.js [book]   (needs Playwright with Chromium, Python 3 with pypdf, and Poppler's pdftotext)
//   node guides/build.js                        Master Your Motherhood (workbook + worksheet pack)
//   node guides/build.js the-woman-beyond-mom   The Woman Beyond Mom
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const BOOKS = {
  'master-your-motherhood': {
    name: 'Master Your Motherhood', out: 'Master-Your-Motherhood-Workbook.pdf', pack: 'Master-Your-Motherhood-Worksheet-Pack.pdf',
    subject: 'Systems for your mental load, family meetings, kids and routines that still work on a bad day. ADHD-friendly.'
  },
  'the-woman-beyond-mom': {
    name: 'The Woman Beyond Mom', out: 'The-Woman-Beyond-Mom-Workbook.pdf', pack: 'The-Woman-Beyond-Mom-Worksheet-Pack.pdf',
    subject: 'Get to know yourself again: your patterns, your emotions, your health, real self-care and what you want next. ADHD-friendly.'
  }
};
const BOOK_ID = process.argv[2] || 'master-your-motherhood';
const BOOK = BOOKS[BOOK_ID];
if (!BOOK) { console.error('Unknown book: ' + BOOK_ID + '. Choose one of: ' + Object.keys(BOOKS).join(', ')); process.exit(1); }

const HERE = __dirname;
const SRC = path.join(HERE, BOOK_ID + '.html');
const OUT_DIR = path.join(HERE, 'pdf');
const OUT = path.join(OUT_DIR, BOOK.out);
const OUT_PACK = path.join(OUT_DIR, BOOK.pack);
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'mmhq-'));
const t = (n) => path.join(TMP, n);
const py = (args) => execFileSync('python3', ['-I', path.join(HERE, 'pdf_tools.py'), ...args]).toString();

const FOOT = '<div style="width:100%;padding:0 0.75in;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;font-size:7px;letter-spacing:1.2px;text-transform:uppercase;color:#A89A87">' +
  '<span>' + BOOK.name + ' · Modern Mom HQ</span><span class="pageNumber"></span></div>';
const FOOT_PACK = FOOT.replace(BOOK.name + ' · Modern Mom HQ', BOOK.name + ' · Worksheet Pack');

// Fillable fields. Every writing space gets two tiny white marker words, at its top-left (A) and
// bottom-right (B) corner. They are absolutely positioned, so the layout does not move. pdf_tools.py
// reads where they landed and adds a real PDF form field there. Example cells, filled-in text and
// the cut-out Effort Bucks are skipped.
const MARK = () => {
  const out = []; let i = 0;
  const style = 'position:absolute;font:2px/1 Helvetica,Arial,sans-serif;color:#fff;white-space:nowrap;letter-spacing:0;';
  const add = (host, kind, multi) => {
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const a = document.createElement('span'); a.className = 'fm'; a.setAttribute('style', style + 'left:0;top:0'); a.textContent = 'QZA' + i + 'Q';
    const b = document.createElement('span'); b.className = 'fm'; b.setAttribute('style', style + 'right:0;bottom:0'); b.textContent = 'QZB' + i + 'Q';
    host.appendChild(a); host.appendChild(b);
    out.push({ i, kind, multi }); i++;
  };
  const blank = el => el.textContent.replace(/[\s\u00a0\u2003]/g, '') === '' && !el.querySelector('*');
  document.querySelectorAll('section.ws .lines, section.ws td, section.ws u, section.ws .sq, ul.cb li').forEach(el => {
    if (el.closest('.buck, .example, .cover') || !el.getClientRects().length) return;
    if (el.matches('ul.cb li')) {
      const box = document.createElement('span'); box.className = 'fm';
      box.setAttribute('style', 'position:absolute;left:0;top:2.5pt;width:9pt;height:9pt');
      el.appendChild(box); add(box, 'check', false); return;
    }
    if (el.matches('.sq')) { add(el, 'check', false); return; }
    if (el.tagName === 'TD') { if (blank(el)) add(el, 'text', el.getBoundingClientRect().height > 40); return; }
    if (el.tagName === 'U') { if (blank(el)) add(el, 'text', false); return; }
    add(el, 'text', true);
  });
  return out;
};
const UNMARK = () => { document.querySelectorAll('.fm').forEach(e => e.remove()); };
const samePages = (a, b) => { const x = py(['pages', a]).trim(), y = py(['pages', b]).trim(); if (x !== y) throw new Error('Field markers changed the page count: ' + x + ' vs ' + y); };

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

  // 3b. Fillable fields for the workbook: one more render with the corner markers
  const fieldsMain = await page.evaluate(MARK);
  await page.pdf({ ...BODY_OPTS, path: t('body-marked.pdf') });
  await page.evaluate(UNMARK);
  samePages(t('body.pdf'), t('body-marked.pdf'));
  fs.writeFileSync(t('fields-main.json'), JSON.stringify(fieldsMain));
  console.log('fields (workbook)', py(['locate', t('body-marked.pdf'), t('fields-main.json'), t('rects-main.json')]).trim());

  // 3c. Worksheet pack (only for books that have a pack cover): only the worksheets, the first 30 days
  // and a pack cover with its own contents
  const hasPack = await page.evaluate(() => !!document.querySelector('.pack-cover'));
  let packSpec, packPages;
  if (hasPack) {
    packSpec = await page.evaluate(() => {
      document.documentElement.className = 'pack';
      const list = document.querySelector('.pack-toc'); list.innerHTML = '';
      let chapter = '';
      const markers = [];
      [...document.body.children].forEach(sec => {
        const ch = sec.querySelector('[data-toc^="c"]');
        if (ch) chapter = 'Ch. ' + ch.getAttribute('data-toc').slice(1);
        if (!(sec.matches('section.ws') || sec.matches('section.pack-keep'))) return;
        const id = 'pk' + markers.length;
        let text, title, label;
        if (sec.matches('section.ws')) {
          text = sec.querySelector('.ws-head').textContent.trim();
          title = sec.querySelector('.ws-head h3').textContent.trim();
          label = chapter;
        } else {
          const eb = sec.querySelector('[data-toc]');
          text = eb.textContent.trim(); title = eb.getAttribute('data-title'); label = 'Plan';
        }
        markers.push({ id, text, title: (label + ' \u00b7 ' + title).replace(/\u00a0/g, ' ') });
        const li = document.createElement('li');
        li.innerHTML = '<span class="n"></span><span class="t"></span><span class="p" data-p="' + id + '">00</span>';
        li.querySelector('.n').textContent = label; li.querySelector('.t').textContent = title;
        list.appendChild(li);
      });
      return { toc: document.querySelector('[data-pack-toc-page]').textContent.trim(), markers };
    });
    const PACK_OPTS = { ...BODY_OPTS, footerTemplate: FOOT_PACK };
    await page.pdf({ ...PACK_OPTS, path: t('pack.pdf') });
    fs.writeFileSync(t('pack-markers.json'), JSON.stringify(packSpec));
    packPages = JSON.parse(py(['find', t('pack.pdf'), t('pack-markers.json')]));
    await page.evaluate((p) => { Object.keys(p).forEach(id => { const el = document.querySelector('.pack-toc [data-p="' + id + '"]'); if (el) el.textContent = p[id]; }); }, packPages);
    await page.pdf({ ...PACK_OPTS, path: t('pack.pdf') });
    const packCheck = JSON.parse(py(['find', t('pack.pdf'), t('pack-markers.json')]));
    if (JSON.stringify(packCheck) !== JSON.stringify(packPages)) throw new Error('Pack page numbers moved after filling its contents');
    const fieldsPack = await page.evaluate(MARK);
    await page.pdf({ ...PACK_OPTS, path: t('pack-marked.pdf') });
    await page.evaluate(UNMARK);
    samePages(t('pack.pdf'), t('pack-marked.pdf'));
    fs.writeFileSync(t('fields-pack.json'), JSON.stringify(fieldsPack));
    console.log('fields (pack)', py(['locate', t('pack-marked.pdf'), t('fields-pack.json'), t('rects-pack.json')]).trim());
  }
  await browser.close();

  // 4. Merge with bookmarks
  const meta = {
    title: BOOK.name + ': The Workbook', author: 'Jaime McLaughlin, Modern Mom HQ',
    subject: BOOK.subject,
    outline: spec.markers.map(m => ({ title: m.title, page: pages[m.id] }))
  };
  fs.writeFileSync(t('meta.json'), JSON.stringify(meta));
  console.log(py(['merge', t('cover.pdf'), t('body.pdf'), t('merged.pdf'), t('meta.json')]).trim());
  console.log('workbook form', py(['fields', t('merged.pdf'), t('rects-main.json'), '1', OUT]).trim());
  console.log('chapter pages', JSON.stringify(pages));
  console.log('wrote', OUT);

  // 5. Worksheet pack with bookmarks, then its fillable fields
  if (!hasPack) { console.log('no worksheet pack for this book (no .pack-cover section)'); return; }
  const packMeta = {
    title: BOOK.name + ': The Worksheet Pack', author: 'Jaime McLaughlin, Modern Mom HQ',
    subject: 'Every worksheet from ' + BOOK.name + ', printable and fillable.',
    outline: packSpec.markers.map(m => ({ title: m.title, page: packPages[m.id] }))
  };
  fs.writeFileSync(t('pack-meta.json'), JSON.stringify(packMeta));
  console.log(py(['single', t('pack.pdf'), t('pack-merged.pdf'), t('pack-meta.json')]).trim());
  console.log('pack form', py(['fields', t('pack-merged.pdf'), t('rects-pack.json'), '0', OUT_PACK]).trim());
  console.log('wrote', OUT_PACK);
})().catch(e => { console.error(e); process.exit(1); });
