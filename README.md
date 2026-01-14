# AI OCR

## About this repository

This monorepo contains a collection of AI OCR tools. 

It is a playground to investigate and learn and should be viewed as such.

## Tools

### mistral-ocr
A Python tool that leverages Mistral AI to scan PDF files, extract content, and translate to target languages with automatic post-processing.

**Key Features:**
- 🔍 **Intelligent OCR**: Extracts text and images from PDF files using Mistral OCR
- 🤖 **LLM Post-Processing**: Improves Markdown compliance using Mistral Large Language Model
- 🌐 **Multi-Language Translation**: Supports multiple source and target languages with IETF BCP 47 codes
- ⚡ **Smart Caching**: Automatically skips completed steps to minimize token usage
- 🎯 **Selective Processing**: Force specific steps or process individual pages for testing
- 📂 **Structured Output**: Compatible with web-viewer tool for side-by-side comparison
- 🔄 **Multi-Language Documents**: Handles documents with mixed languages (e.g., `en,fr`)

**Quick Start:**

```bash
cd apps/mistral-ocr
uv sync
cp .example.env .env
# Edit .env with your Mistral API key
uv run main.py --input document.pdf --source en --target es
```

**Requirements:**
- Python 3.13+
- [uv](https://docs.astral.sh/uv/) for package management
- Mistral API key (get one at [console.mistral.ai](https://console.mistral.ai/api-keys))

**Workflow:**

```
PDF Input → OCR Scan → Post-Process → Translate → Structured Output
           (raw.en-US)  (en-US)        (raw.es-ES & es-ES)
```

**Output Structure:**

```
document.pdf
document/
├── raw.en-US/                 # Raw OCR output
│   ├── document.raw.en-US.json
│   ├── document.raw.en-US.md
│   ├── document.raw.en-US_page_1.md
│   └── img-0.jpeg
├── en-US/                     # Post-processed OCR
│   ├── document.en-US.json
│   ├── document.en-US.md
│   ├── document.en-US_page_1.md
│   └── img-0.jpeg
├── raw.es-ES/                 # Raw translation
│   └── document.raw.es-ES_page_1.md
└── es-ES/                     # Final translation
    └── document.es-ES_page_1.md
```

**Usage Examples:**

```bash
# Basic translation
uv run main.py --input doc.pdf --source en --target es

# Multi-language source document
uv run main.py --input doc.pdf --source en,fr --target es

# Force re-processing specific pages (useful for prompt tuning)
uv run main.py --input doc.pdf --source en --target es \
  --force_ocr_post_process --limit_to_pages 1,2

# Force all steps
uv run main.py --input doc.pdf --source en --target es \
  --force_ocr --force_ocr_post_process --force-translate
```

**Tech Stack:**
- Python 3.13+
- Mistral AI (OCR + LLM)
- uv (package manager)
- argparse, datauri, python-dotenv

For detailed documentation, see [apps/mistral-ocr/README.md](apps/mistral-ocr/README.md).

### web-viewer
A Next.js web application for comparing original PDF documents with their OCR-extracted and translated markdown outputs side-by-side.

**Key Features:**
- 🔄 **Multi-Pane Viewing**: Compare documents in 2-pane (PDF + OCR) or 3-pane (PDF + OCR + Translation) modes
- 🔗 **Synchronized Navigation**: All panes stay in sync as you navigate through pages
- 🌍 **Language Support**: View multiple language versions with per-pane language selection
- ⌨️ **Keyboard Navigation**: Full keyboard support with arrow keys, Page Up/Down
- 📱 **Responsive Design**: Optimized for desktop (768px+) with tablet/mobile warnings
- ♿ **Accessibility**: WCAG 2.1 AA compliant with screen reader support
- ⚡ **Performance**: Supports documents up to 200 pages with progressive loading

**Quick Start:**

```bash
cd apps/web-viewer
npm install
cp .env.example .env.local
# Edit .env.local with your data folder path
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Tech Stack:**
- Next.js 16 (App Router) + React 19
- TypeScript 5.3+
- ShadCN UI + Tailwind CSS
- React-PDF (PDF.js) + react-markdown
- Vitest + Playwright for testing

**Data Folder Structure:**

Documents must follow this structure:

```
data/
├── document-name.pdf
├── document-name/
│   ├── en-US/                    # Processed OCR
│   │   ├── document-name.en-US_page_1.md
│   │   ├── document-name.en-US_page_2.md
│   │   └── ...
│   ├── raw.en-US/                # Raw OCR (optional)
│   │   └── document-name.raw.en-US_page_1.md
│   └── es-ES/                    # Translation (optional)
│       └── document-name.es-ES_page_1.md
```

Language codes must follow IETF BCP 47 format (e.g., `en-US`, `es-ES`, `fr-CA`).

**Testing & Quality:**
- 375+ unit tests passing
- 179 E2E tests (100% pass rate)
- All tests run in Chrome (Chromium)
- TypeScript strict mode + ESLint (Airbnb config)
- CI/CD pipeline with automated checks

For detailed documentation, see [apps/web-viewer/README.md](apps/web-viewer/README.md).
