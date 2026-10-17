"""Build student-facing findings from the source review notes."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REVIEWS = ROOT / 'src/build/reviews'


def main():
    items = []
    for filename, keys, group in [
        ('inference-cross-findings.json', ['patterns', 'sourceCaveats'], 'Inference and two texts'),
        ('grammar-transitions-findings.json', ['findings'], 'Grammar and transitions'),
        ('evidence-synthesis-findings.json', ['findings'], 'Evidence and synthesis'),
        ('language-structure-findings.json', ['findings', 'sourceRationaleCautions'], 'Words and structure'),
    ]:
        source = json.loads((REVIEWS / filename).read_text())
        for key in keys:
            for entry in source.get(key, []):
                ids = entry.get('sourceIds', [entry.get('id', '')])
                ids = [qid for qid in ids if re.fullmatch('[0-9a-f]{8}', qid)]
                assert ids, (filename, entry)
                body = [entry[field] for field in ['premises', 'choiceCheck', 'finding', 'observation', 'note']
                        if isinstance(entry.get(field), str)]
                assert body, (filename, entry)
                title = entry.get('title') or entry.get('pattern') or (
                    'Check the source explanation' if key in ['sourceCaveats', 'sourceRationaleCautions']
                    else entry.get('type', 'Further distinction').replace('-', ' ').capitalize())
                items.append(dict(title=title, group=group, ids=ids, paragraphs=body,
                                  transfer=entry.get('transfer') or entry.get('suggestion', '')))
    (ROOT / 'src/build/review-findings.json').write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')))
    print('Exported', len(items), 'source-backed English findings')


if __name__ == '__main__':
    main()
