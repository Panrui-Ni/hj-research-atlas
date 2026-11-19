#!/usr/bin/env python3
"""Check the data schema and internal links; does not verify mathematical claims."""
import json,re,sys
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'data'/'atlas.json'
d=json.loads(p.read_text())
bs={b['id']:set(b['topics']) for b in d['branches']}
assert len(bs)==len(d['branches'])
ids=set()
for paper in d['papers']:
    pid=paper['id']
    assert pid not in ids, f'Duplicate ID: {pid}'
    ids.add(pid)
    assert paper['branch'] in bs, f'Unknown branch: {pid}'
    assert paper['topic'] in bs[paper['branch']], f'Unknown topic: {pid}'
    assert re.fullmatch(r'(\d{4}\.\d{4,5}|[a-z.-]+/\d{7})',paper['arxiv'],re.I),f'Bad arXiv id: {pid}'
    assert 2000 <= paper['year'] <= 2100
    for field in ('title','authors','contribution','context','scope'):
        assert isinstance(paper[field],str) and paper[field].strip(),f'Missing {field}: {pid}'
for paper in d['papers']:
    for related in paper.get('related',[]):
        assert related in ids and related != paper['id'],f'Bad related: {paper["id"]} → {related}'
print(f'OK: {len(d["papers"])} papers, {len(bs)} branches, valid IDs and related references.')
