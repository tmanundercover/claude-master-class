# Course slide authoring and export

`course.mjs` is the readable content source: agenda, lesson teaching, review gates,
checks, notes and ordering. It loads full exploration prompt blocks from the
canonical exercises. Personalization's extraction block is presented first;
long blocks span numbered continuation slides in complete paste order. Copy the
whole block from the exercise when teaching, including its no-edit wrapper.
`retained-slides.html` keeps the original poll, instructor, rationale and closing
program/advisor material. Program figures are retained course content, not a
new promise of employment or independently refreshed program data.

The original embedded Inter/JetBrains fonts, brand palette, logo and reveal.js
5.2.0 library are extracted into local source assets. `course.css` adds layouts;
`presenter.js` builds current/next previews, notes and selectable thumbnails from
the current deck DOM. Reveal retains its MIT notice. No application dependency
or standalone HTTP server is added.

With the repository dependencies installed, from the project root run:

```text
node docs/slides/export.mjs
```

This writes the stable `portfolio-career-workspace.html` and
`portfolio-career-workspace.pdf` together using the existing Playwright dependency
and local Google Chrome. Set `CHROME_PATH` to your installed Chromium executable
if needed. Use `--html-only` for text/layout iteration; final review requires both
outputs. Export opens a local `file:` URL and starts no server. It has no provider,
Firebase, environment-file, or publication step.

Open the downloaded HTML locally. Use arrows, Space or Page Down/Up to navigate,
Esc for overview, S (or Presenter) for speaker view, and the lesson rail to jump.
Allow the local file's presenter popup. Presenter thumbnails and current/next
previews follow the audience deck; clicking a thumbnail updates the audience.
The final slide has no next preview. Each slide has generated totals and notes.
The PDF uses the same sections in the same order and omits the private presenter
controls. Do not distribute the authoring assets instead of the self-contained HTML.

The optional automated PDF inspection uses PyMuPDF outside application dependencies.
For example, create an isolated tool environment and select it explicitly (macOS/Linux):

```text
python3 -m venv /tmp/course-pdf-review
/tmp/course-pdf-review/bin/python -m pip install pymupdf
PDF_REVIEW_PYTHON=/tmp/course-pdf-review/bin/python node docs/slides/review.mjs
```

On Windows, use an equivalent private virtual environment and set
`PDF_REVIEW_PYTHON` to its Python executable. If that environment is already selected,
run:

```text
node docs/slides/review.mjs
```

A missing PDF inspector leaves review unperformed and exits nonzero. It checks all slide bounds/assets, navigation, speaker previews/thumbnails and PDF
page count/text order, then writes a review report and local contact sheets under
a temporary directory. Inspect the sheets and PDF renders before declaring visual
review complete. See [curriculum review](../curriculum-review.md) for actual results.
