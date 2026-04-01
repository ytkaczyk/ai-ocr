# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
uv sync                    # Install dependencies
cp .example.env .env       # Then add MISTRAL_API_KEY to .env

# Run full pipeline (source and target are IETF BCP 47 codes, e.g. en-US, es-ES, vi-VN)
uv run main.py --input <pdf> --source <lang> [--target <lang>]

# Force re-run individual steps
uv run main.py --input <pdf> --source <lang> --force_ocr
uv run main.py --input <pdf> --source <lang> --force_ocr_post_process
uv run main.py --input <pdf> --source <lang> --force_translate

# Process only specific pages (1-indexed, comma-separated)
uv run main.py --input <pdf> --source <lang> --limit_to_pages 1,2,3
```

There is no lint, type-check, or test command.

## Architecture

Everything lives in `main.py` (~343 lines). No modules, no packages.

### Pipeline

The pipeline runs three sequential steps with page-level caching (safe to interrupt and resume):

```
PDF
 │
 ▼ Step 1: OCR (mistral-ocr-latest)
raw.<src>/       ← per-page .md + images + full JSON
 │
 ▼ Step 2: Post-process (mistral-medium-latest)
<src>/           ← LLM-cleaned markdown (fixes headers, tables, LaTeX)
 │
 ▼ Step 3: Translate (mistral-medium-latest)
raw.<target>/    ← translated markdown (sections wrapped in <section source_language_code="...">)
```

**Note**: The pipeline ends after writing `raw.<target>/`. There is no step that copies `raw.<target>/` to `<target>/`. The web-viewer reads from `<target>/`, so if translation is needed, this copy must be done manually (or this gap in `main.py` must be filled).

### Output directory structure

All output is written as a sibling folder to the input PDF:

```
document.pdf
document/
  raw.<src_lang>/
    document.raw.<src>.json          # Full OCRResponse (used for caching)
    document.raw.<src>.md            # All pages concatenated
    document.raw.<src>_page_N.md     # Per-page markdown
    img-<n>.jpeg                     # Extracted images
  <src_lang>/
    document.<src>.json
    document.<src>.md
    document.<src>_page_N.md
    img-<n>.jpeg
  raw.<target_lang>/
    (same structure)
```

### Caching logic

- **Step 1**: Skipped if `raw.<src>/<file>.json` exists (bypass: `--force_ocr`)
- **Step 2**: Per-page — skipped if raw markdown ≠ src markdown (already transformed) AND per-page `.md` exists (bypass: `--force_ocr_post_process`)
- **Step 3**: Per-page — skipped if src markdown ≠ raw_target markdown (already translated) (bypass: `--force_translate`)
- JSON is saved after each page in steps 2 and 3, so a crash mid-run can be resumed without reprocessing completed pages

### Models

| Step         | Model                   | Config                                       |
| ------------ | ----------------------- | -------------------------------------------- |
| OCR          | `mistral-ocr-latest`    | `include_image_base64=True`, bbox annotation |
| Post-process | `mistral-medium-latest` | temperature=0, structured output             |
| Translate    | `mistral-medium-latest` | temperature=0, structured output             |

### Key quirks

- `--source` accepts comma-separated language codes for multi-language documents (e.g. `en-US,fr-FR`)
- Language codes must use IETF BCP 47 format (`en-US`, not `en`) — the web-viewer breaks otherwise
- `transform()` and `translate()` return `None` on any API exception; the page is skipped with a warning (no retry logic)
- 600 DPI scans work best; 1200 DPI scans have been observed to silently fail in OCR

## Environment

```
MISTRAL_API_KEY=   # Required — get from console.mistral.ai
```
