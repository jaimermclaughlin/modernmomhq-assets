# Modern Mom HQ assets

Shared styles for Modern Mom HQ Kajabi lessons and pages.

- `mmhq.css`: lesson stylesheet. Wrap lesson HTML in `<div id="mmhq-root" class="mmhq">`.
- `templates/`: example lesson markup.

## Audience research (October 2026)

- `audience-intelligence-dashboard.html`: self-contained, interactive market intelligence dashboard on millennial women, women with ADHD or executive function challenges, and mothers. Open it in any browser. Saved items and your own observations are kept in that browser only; use Export in My Research Log to keep a copy.
- `reports/Millennial women ADHD audience research.md`: the written research report behind the dashboard.
- `research_notes/Millennial women ADHD audience research/`: the raw evidence notes, with every source URL, quote fidelity label and search log.
- Content Resources tab (added November 2026): the three 2020 workbooks (Master Your Family Meetings, Master Your Kids Reward System, Master Your Motherhood Mindset) checked against the research, with every piece flagged as create new, edit and rebrand, or use what I have. Its data lives in `dashboard-src/data_resources.js`.
- `dashboard-src/`: the dashboard's data and code. Edit the `data_*.js` files, run `node check.js` (checks that every cited source exists and that no em dashes slipped in), then `python3 build.py` to regenerate the HTML.

## Workbooks (November 2026)

- `guides/pdf/Master-Your-Motherhood-Workbook.pdf`: Master Your Motherhood, the general Modern Mom HQ workbook (Letter size), rebuilt from the 2020 Master Your workbooks and the audience research. It is fillable: every writing space, table cell, blank and checkbox can be filled in on a device, and it prints exactly the same when empty.
- `guides/pdf/Master-Your-Motherhood-Worksheet-Pack.pdf`: every worksheet from the workbook, plus the Effort Bucks and Your First 30 Days, with its own cover and contents. Also fillable.
- `guides/pdf/The-Woman-Beyond-Mom-Workbook.pdf`: The Woman Beyond Mom, the second core workbook (Letter size, fillable), built from the Healthy Happy Mom course (Modules 1 to 4) and the sections that moved out of Master Your Motherhood. It ends with a 30-day plan and a troubleshooting page (no chapter summary pages, by choice).
- `guides/pdf/The-Woman-Beyond-Mom-Worksheet-Pack.pdf`: every worksheet from The Woman Beyond Mom, plus Your First 30 Days, with its own cover and contents. Also fillable.
- `guides/pdf/The-Ultimate-Beauty-Guide-2027.pdf`: The Ultimate Beauty Guide 2027 (Letter size), rebuilt in the same style from Jaime's design canvas, with her full 2019 guide text restored, and new sections from the Healthy Happy Mom course (getting ready, where to spend and save, the everyday face, and a hair chapter). Photos live in `guides/img/beauty/`. No fillable worksheets.
- `guides/master-your-motherhood.html`, `guides/the-woman-beyond-mom.html`, `guides/the-ultimate-beauty-guide.html` and `guides/guide.css`: the sources. Edit these, then run `node guides/build.js` for Master Your Motherhood (both PDFs) `node guides/build.js the-woman-beyond-mom` for The Woman Beyond Mom, or `node guides/build.js the-ultimate-beauty-guide` for the beauty guide (needs Playwright with Chromium, Python 3 with pypdf, and Poppler's `pdftotext`). A book gets a worksheet pack when its source has a pack cover section. It fills in the contents page numbers, adds bookmarks, and adds the fillable fields: it renders the pages once more with tiny invisible markers at the corners of each writing space, reads where they landed, and places real PDF form fields there (`guides/pdf_tools.py`).
- `guides/fonts/`: Instrument Serif and Work Sans (SIL Open Font License, license files included). The script font, Awesome Ways, is licensed and not committed: put `AwesomeWays.otf` in `guides/fonts/` before building, or the build falls back to Faustine.
- `guides/EDIT-LOG.md`: every copyedit made to Jaime's original 2020 text in Master Your Motherhood, before and after.
- `guides/EDIT-LOG-beauty-guide.md`: every change from the beauty guide canvas, the 2019 guide and the Healthy Happy Mom pages it uses, what was left out and why, the facts checked, and open questions.
- `guides/EDIT-LOG-woman-beyond-mom.md`: the same for The Woman Beyond Mom: decisions applied, open questions, every accuracy, tone and faith change, every change to the moved sections, and the original Healthy Happy Mom text page by page.
- `guides/drafts/`: holding files for the two companion guides that are not built yet (the Real-Life Wellness Guide and the Personal Planning Guide). They hold, word for word, the sections that moved out of Master Your Motherhood in its November 2026 restructure, with their sources. The Woman Beyond Mom's holding file was removed once every section in it was confirmed in the new book or listed in its edit log.
- The build also checks the layout: it fails if any text spills outside its box or past the page edge, or if any line holds a single word that ends a sentence or paragraph.
