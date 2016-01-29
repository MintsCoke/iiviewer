# iiviewer

PDF viewer for Interactive Investor.

## Setup

 1. `make develop`.
 2. Store your target PDF in `src/pdf/view.pdf`
 3. `make pdf`.

## Additional dependencies

Build-time:

 1. `gs`
 2. `mogrify` (part of `imagemagick`)
 3. `pdftotext` (part of `poppler`)
 4. `awk`

Run-time:

 1. `pdftk`
