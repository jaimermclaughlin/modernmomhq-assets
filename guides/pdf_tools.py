"""Helpers for guides/build.js.

find  BODY.pdf MARKERS.json   -> prints {"id": page_number} for each marker, searching pages after the contents page
merge COVER.pdf BODY.pdf OUT.pdf META.json -> cover + body, with title metadata and chapter bookmarks
"""
import json
import re
import sys

from pypdf import PdfReader, PdfWriter


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


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'find':
        find(sys.argv[2], sys.argv[3])
    elif cmd == 'merge':
        merge(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
    else:
        sys.exit('unknown command')
