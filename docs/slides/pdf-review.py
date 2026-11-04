"""Optional independent PDF check. Install PyMuPDF in an isolated tool environment."""
import json
import sys
from pathlib import Path
import pymupdf

source, output = sys.argv[1:3]
output = Path(output)
output.mkdir(parents=True, exist_ok=True)
with pymupdf.open(source) as document:
    pages = []
    for index, page in enumerate(document):
        pages.append(page.get_text())
        page.get_pixmap(matrix=pymupdf.Matrix(0.5, 0.5)).save(output / f"pdf-{index + 1}.png")
    (output / "pdf-text.json").write_text(json.dumps({"count": len(document), "pages": pages, "extractor": f"PyMuPDF {pymupdf.__version__}"}, indent=2))
