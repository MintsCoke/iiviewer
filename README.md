# iiviewer

PDF viewer for Interactive Investor.

## Setup

 1. `make develop`.
 2. Store your target PDF in `src/pdf/view.pdf`
 3. `make pdf`.

## Additional dependencies

Build-time:

 1. `imagemagick` (specifically `convert` and `mogrify`)
 2. `pdftotext` (part of `poppler`)
 3. `awk`

Run-time:

 1. `pdftk`
