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

## Workbook (November 2026)

- `guides/pdf/Master-Your-Motherhood-Workbook.pdf`: Master Your Motherhood, the general Modern Mom HQ workbook (Letter size), rebuilt from the 2020 Master Your workbooks and the audience research. It is fillable: every writing space, table cell, blank and checkbox can be filled in on a device, and it prints exactly the same when empty.
- `guides/pdf/Master-Your-Motherhood-Worksheet-Pack.pdf`: every worksheet from the workbook, plus the Effort Bucks and Your First 30 Days, with its own cover and contents. Also fillable.
- `guides/master-your-motherhood.html` and `guides/guide.css`: the source. Edit these, then run `node guides/build.js` (needs Playwright with Chromium, Python 3 with pypdf, and Poppler's `pdftotext`). One build makes both PDFs. It fills in the contents page numbers, adds bookmarks, and adds the fillable fields: it renders the pages once more with tiny invisible markers at the corners of each writing space, reads where they landed, and places real PDF form fields there (`guides/pdf_tools.py`).
- `guides/fonts/`: Instrument Serif and Work Sans (SIL Open Font License, license files included). The script font, Awesome Ways, is licensed and not committed: put `AwesomeWays.otf` in `guides/fonts/` before building, or the build falls back to Faustine.
- `guides/EDIT-LOG.md`: every copyedit made to Jaime's original 2020 text, before and after.
- `guides/drafts/`: holding files for the companion resources (The Woman Beyond Mom, the Real-Life Wellness Guide, the Personal Planning Guide). They hold, word for word, every section that moved out of Master Your Motherhood in its November 2026 restructure, with their sources. They are not built yet.
- The build also checks the layout: it fails if any text spills outside its box or past the page edge, or if any line holds a single word that ends a sentence or paragraph.
