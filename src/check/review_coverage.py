"""Validate per-question reading coverage, source identity and preserved keys.

Usage: python3 src/check/review_coverage.py MATH_PDF RW_PDF
Writes source-audit.json; refuses to certify any pending record.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / 'src/build'


def load(name):
    return json.loads((BUILD / name).read_text())


def main():
    subjects = {}
    for subject, files, expected in [
        ('math', ['advanced-complete', 'algebra', 'geometry', 'rates', 'statistics', 'probability'], 1925),
        ('reading_writing', ['grammar-transitions', 'evidence-synthesis', 'language-structure', 'inference-cross'], 1845),
    ]:
        seen = {}
        for filename in files:
            data = load('reviews/' + filename + '.json')
            rows = data.get('reviews', data.get('records', data.get('entries', data.get('questions'))))
            if isinstance(rows, dict):
                rows = [dict(row, id=qid) for qid, row in rows.items()]
            for row in rows:
                qid = row['id']
                assert qid not in seen, ('duplicate review', qid)
                status = row.get('read_status', row.get('status', ''))
                if filename == 'probability':
                    assert row.get('question_read') and row.get('solution_read'), qid
                else:
                    assert status and status not in ['pending', 'unreviewed', 'pending-parent-review'], (qid, status)
                assert row.get('observation') or row.get('note') or row.get('reviewNote') or row.get('evidence'), qid
                seen[qid] = filename
        assert len(seen) == expected, (subject, len(seen), expected)
        subjects[subject] = dict(questions=expected, question_solution_read=expected, review_files=files, ids=sorted(seen))
    current = load('mdata.json')
    audit_path = BUILD / 'source-audit.json'
    previous = json.loads(audit_path.read_text()) if audit_path.exists() else {}
    base_commit = previous.get('base_commit') or subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    original = json.loads(subprocess.check_output(['git', 'show', base_commit + ':src/build/mdata.json'], cwd=ROOT))
    baseline = {row[0]: row for row in original['qs']}
    assert set(baseline) == set(subjects['math']['ids'])
    changed_types = []
    for row in current['qs']:
        before = baseline[row[0]]
        assert row[:1] + row[2:] == before[:1] + before[2:], ('changed question, key or dimensions', row[0])
        if current['order'][row[1]] != original['order'][before[1]]:
            changed_types.append(row[0])
    data = dict(base_commit=base_commit, scope='Every source question and full solution read using OCR/extracted text, with ambiguous notation and targeted figures inspected visually. This is not a certificate of an independent algebraic proof or complete visual reread of every item.', subjects=subjects, source_notes=load('mdata.json')['source_notes'], teaching_type_changes=changed_types, answer_key_changes=[], live_sat_desmos_verified=False)
    for subject, pdf in zip(['math', 'reading_writing'], sys.argv[1:]):
        data['subjects'][subject]['pdf_sha256'] = hashlib.sha256(Path(pdf).read_bytes()).hexdigest()
    (BUILD / 'source-audit.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print('PASS: 3770 unique full-question/solution review records; Math IDs, keys and dimensions preserved;', len(changed_types), 'teaching assignments refined')


if __name__ == '__main__':
    main()
