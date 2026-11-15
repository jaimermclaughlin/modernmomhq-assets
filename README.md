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

- `guides/pdf/Master-Your-Motherhood-Workbook.pdf`: Master Your Motherhood, the general Modern Mom HQ workbook (Letter size, printable), rebuilt from the 2020 Master Your workbooks and the audience research.
- `guides/master-your-motherhood.html` and `guides/guide.css`: the source. Edit these, then run `node guides/build.js` (needs Playwright with Chromium and Python 3 with pypdf). The build fills in the contents page numbers and adds chapter bookmarks.
- `guides/fonts/`: Instrument Serif and Work Sans (SIL Open Font License, license files included).
- `guides/EDIT-LOG.md`: every copyedit made to Jaime's original 2020 text, before and after.
- The build also checks the layout: it fails if any text spills outside its box or past the page edge, or if any line holds a single word that ends a sentence or paragraph.
