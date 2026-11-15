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
