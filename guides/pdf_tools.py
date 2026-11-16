"""Helpers for guides/build.js.

find   BODY.pdf MARKERS.json   -> prints {"id": page_number} for each marker, searching pages after the contents page
merge  COVER.pdf BODY.pdf OUT.pdf META.json -> cover + body, with title metadata and chapter bookmarks
single BODY.pdf OUT.pdf META.json -> one PDF (no separate cover), with title metadata and bookmarks
pages  PDF -> prints the page count
locate MARKED.pdf FIELDS.json OUT.json -> reads where the invisible field markers landed (pdftotext -bbox)
         and writes each field's page and rectangle in PDF points
fields IN.pdf FIELDS.json OFFSET OUT.pdf -> adds fillable form fields (text boxes and checkboxes);
         OFFSET is how many pages come before body page 1 (1 when a cover was merged in front)
"""
import json
import re
import subprocess
import sys

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, BooleanObject, DecodedStreamObject, DictionaryObject,
                           FloatObject, NameObject, NumberObject, TextStringObject)


def squash(text):
    return re.sub(r'\s+', '', text or '').upper()


def find(body_path, markers_path):
    with open(markers_path, encoding='utf-8') as f:
        spec = json.load(f)
    pages = [squash(p.extract_text()) for p in PdfReader(body_path).pages]
    toc_marker = squash(spec['toc'])
    toc_index = next(i for i, t in enumerate(pages) if toc_marker in t)
    found = {}
    for m in spec['markers']:
        key = squash(m['text'])
        hit = next((i for i, t in enumerate(pages) if i > toc_index and key in t), None)
        if hit is None:
            sys.exit('marker not found: ' + m['text'])
        found[m['id']] = hit + 1
    print(json.dumps(found))


def merge(cover_path, body_path, out_path, meta_path):
    with open(meta_path, encoding='utf-8') as f:
        meta = json.load(f)
    writer = PdfWriter()
    writer.append(cover_path)
    writer.append(body_path)
    writer.add_metadata({'/Title': meta['title'], '/Author': meta['author'], '/Subject': meta['subject']})
    writer.add_outline_item('Cover', 0)
    for item in meta['outline']:
        # body page N sits at index N in the merged file because the cover is index 0
        writer.add_outline_item(item['title'], item['page'])
    with open(out_path, 'wb') as f:
        writer.write(f)
    print('pages', len(writer.pages))


def single(body_path, out_path, meta_path):
    with open(meta_path, encoding='utf-8') as f:
        meta = json.load(f)
    writer = PdfWriter()
    writer.append(body_path)
    writer.add_metadata({'/Title': meta['title'], '/Author': meta['author'], '/Subject': meta['subject']})
    for item in meta['outline']:
        writer.add_outline_item(item['title'], item['page'] - 1)
    with open(out_path, 'wb') as f:
        writer.write(f)
    print('pages', len(writer.pages))


def pages(pdf_path):
    print(len(PdfReader(pdf_path).pages))


WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>')
TOKEN = re.compile(r'^QZ([AB])(\d+)Q$')


def locate(marked_path, fields_path, out_path):
    """Find each field's two corner markers. The markers are tiny white words that the build
    placed at the top-left (A) and bottom-right (B) corner of every writing space."""
    with open(fields_path, encoding='utf-8') as f:
        fields = json.load(f)
    xml = subprocess.run(['pdftotext', '-bbox', marked_path, '-'], capture_output=True, text=True, check=True).stdout
    found, merged = {}, []
    for index, chunk in enumerate(xml.split('<page ')[1:]):
        height = float(re.search(r'height="([\d.]+)"', chunk).group(1))
        for m in WORD.finditer(chunk):
            x0, y0, x1, y1, text = float(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4)), m.group(5)
            t = TOKEN.match(text)
            if t:
                found[(t.group(1), int(t.group(2)))] = (index, x0, y0, x1, y1, height)
            elif 'QZA' in text or 'QZB' in text:
                merged.append(text)
    placed, skipped = [], []
    for f in fields:
        a, b = found.get(('A', f['i'])), found.get(('B', f['i']))
        if not a or not b or a[0] != b[0]:
            skipped.append(f['i'])
            continue
        index, height = a[0], a[5]
        left, top, right, bottom = a[1], a[2], b[3], b[4]
        pad = 0.5 if f['kind'] == 'check' else 1.2
        rect = [round(left + pad, 2), round(height - bottom + pad, 2), round(right - pad, 2), round(height - top - pad, 2)]
        if rect[2] - rect[0] < 4 or rect[3] - rect[1] < 4:
            skipped.append(f['i'])
            continue
        placed.append({'i': f['i'], 'kind': f['kind'], 'multi': f['multi'], 'page': index, 'rect': rect})
    with open(out_path, 'w', encoding='utf-8') as fh:
        json.dump(placed, fh)
    print(json.dumps({'placed': len(placed), 'skipped': skipped, 'merged': merged[:5]}))


def _font(writer, base):
    return writer._add_object(DictionaryObject({
        NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'),
        NameObject('/BaseFont'): NameObject(base),
        **({NameObject('/Encoding'): NameObject('/WinAnsiEncoding')} if base == '/Helvetica' else {})}))


def _form_xobject(writer, width, height, content, resources=None):
    stream = DecodedStreamObject()
    stream.set_data(content.encode('latin-1'))
    stream.update({NameObject('/Type'): NameObject('/XObject'), NameObject('/Subtype'): NameObject('/Form'),
                   NameObject('/BBox'): ArrayObject([FloatObject(0), FloatObject(0), FloatObject(width), FloatObject(height)])})
    if resources is not None:
        stream[NameObject('/Resources')] = resources
    return writer._add_object(stream)


def add_fields(in_path, fields_path, offset, out_path):
    with open(fields_path, encoding='utf-8') as f:
        fields = json.load(f)
    writer = PdfWriter(clone_from=in_path)
    helv, zadb = _font(writer, '/Helvetica'), _font(writer, '/ZapfDingbats')
    fonts = DictionaryObject({NameObject('/Helv'): helv, NameObject('/ZaDb'): zadb})
    all_fields = ArrayObject()
    counts = {}
    for n, f in enumerate(sorted(fields, key=lambda x: (x['page'], x['i'])), start=1):
        page = writer.pages[f['page'] + offset]
        x0, y0, x1, y1 = f['rect']
        w = DictionaryObject({
            NameObject('/Type'): NameObject('/Annot'), NameObject('/Subtype'): NameObject('/Widget'),
            NameObject('/Rect'): ArrayObject([FloatObject(v) for v in f['rect']]),
            NameObject('/F'): NumberObject(4), NameObject('/P'): page.indirect_reference,
            NameObject('/T'): TextStringObject('field_%03d' % n)})
        if f['kind'] == 'check':
            size = min(x1 - x0, y1 - y0)
            bw, bh = x1 - x0, y1 - y0
            # the check mark is drawn as lines, so it looks the same in every PDF app (no font needed)
            on = _form_xobject(writer, bw, bh,
                               'q 0.29 0.12 0.12 RG %.2f w 1 J 1 j %.2f %.2f m %.2f %.2f l %.2f %.2f l S Q'
                               % (max(1.0, size * 0.16), bw * 0.2, bh * 0.52, bw * 0.42, bh * 0.24, bw * 0.84, bh * 0.82))
            off = _form_xobject(writer, x1 - x0, y1 - y0, '')
            w.update({NameObject('/FT'): NameObject('/Btn'), NameObject('/V'): NameObject('/Off'), NameObject('/AS'): NameObject('/Off'),
                      NameObject('/DA'): TextStringObject('/ZaDb 0 Tf 0.29 0.12 0.12 rg'),
                      NameObject('/MK'): DictionaryObject({NameObject('/CA'): TextStringObject('4')}),
                      NameObject('/AP'): DictionaryObject({NameObject('/N'): DictionaryObject({NameObject('/Yes'): on, NameObject('/Off'): off})})})
        else:
            multi = f['multi']
            # 10pt for writing areas and table cells; 7pt for the short inline blanks (about 8 to 10pt tall)
            size = 10 if multi or (y1 - y0) >= 18 else 7
            w.update({NameObject('/FT'): NameObject('/Tx'),
                      NameObject('/DA'): TextStringObject('/Helv %d Tf 0.06 0.06 0.06 rg' % size),
                      NameObject('/Ff'): NumberObject(4096 if multi else 0)})
        ref = writer._add_object(w)
        if '/Annots' not in page:
            page[NameObject('/Annots')] = ArrayObject()
        page['/Annots'].get_object().append(ref)
        all_fields.append(ref)
        counts[f['page'] + offset + 1] = counts.get(f['page'] + offset + 1, 0) + 1
    writer._root_object[NameObject('/AcroForm')] = DictionaryObject({
        NameObject('/Fields'): all_fields,
        NameObject('/DA'): TextStringObject('/Helv 0 Tf 0 g'),
        NameObject('/DR'): DictionaryObject({NameObject('/Font'): fonts})})
    with open(out_path, 'wb') as fh:
        writer.write(fh)
    print(json.dumps({'fields': len(all_fields), 'pages_with_fields': len(counts)}))


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'find':
        find(sys.argv[2], sys.argv[3])
    elif cmd == 'merge':
        merge(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
    elif cmd == 'single':
        single(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == 'pages':
        pages(sys.argv[2])
    elif cmd == 'locate':
        locate(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == 'fields':
        add_fields(sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5])
    else:
        sys.exit('unknown command')
