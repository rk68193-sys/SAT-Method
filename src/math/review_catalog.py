"""Collect source reviews without changing question keys or official skills."""
import importlib
from pathlib import Path

CASES, SOURCE_NOTES, TYPE_CORRECTIONS, BRIDGES, WORKED = [], {}, {}, {}, {}
for name in ('source_review', 'statistics_review', 'advanced_additions',
             'algebra_review', 'geometry_review', 'rate_review'):
    if not Path(__file__).with_name(name + '.py').exists():
        continue
    module = importlib.import_module(name)
    CASES.extend(getattr(module, 'CASES', []))
    for key, target in [('SOURCE_NOTES', SOURCE_NOTES),
                        ('TYPE_CORRECTIONS', TYPE_CORRECTIONS),
                        ('BRIDGES', BRIDGES), ('WORKED', WORKED)]:
        target.update(getattr(module, key, {}))
