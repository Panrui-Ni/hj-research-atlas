#!/usr/bin/env python3
"""Small repository consistency validator; runs on every pull request."""
import json
import re
from pathlib import Path
from urllib.parse import urlparse

source = Path(__file__).parent.parent / 'data' / 'atlas.json'
data = json.loads(source.read_text(encoding='utf-8'))
assert isinstance(data.get('branches'), list)
assert isinstance(data.get('references'), list)
ids = [t['id'] for b in data['branches'] for t in b['topics']]
branch_ids = [b['id'] for b in data['branches']]
ref_ids = [ref['id'] for ref in data['references']]
for name, values in [('topic', ids), ('branch', branch_ids), ('reference', ref_ids)]:
    assert len(set(values)) == len(values), f'duplicate {name} identifier'
    for value in values:
        assert re.fullmatch(r'[a-z0-9][a-z0-9-]*', value), f'invalid {name} identifier: {value}'
for paper in data['references']:
    assert urlparse(paper['url']).scheme == 'https', f"invalid URL: {paper['id']}"
    assert paper.get('title') and paper.get('authors') and paper.get('year')
for branch in data['branches']:
    assert branch.get('zh') and branch.get('en')
    for topic in branch['topics']:
        assert topic.get('zh') and topic.get('en') and topic.get('summary')
        assert not (set(topic.get('links',[])) - set(ids)), f"unknown linked topic in {topic['id']}"
        assert not (set(topic.get('refs',[])) - set(ref_ids)), f"unknown paper ref in {topic['id']}"
        for result in topic.get('results',[]):
            assert result.get('ref') in ref_ids, f"unknown result source in {topic['id']}"
print(f'OK: {len(branch_ids)} branches, {len(ids)} topics, {len(ref_ids)} papers')
