/**
 * Regenerates the PDF fixtures that exercise non-standard page geometry.
 *
 * These back the FR-029a-d E2E tests. They are committed to the repo, so this
 * script exists to document how they were produced and to let them be rebuilt
 * deterministically rather than being opaque binaries.
 *
 * Usage: node scripts/generate-edge-case-fixtures.mjs
 *
 * Page counts must match the markdown page files already present under
 * data/<id>/en-US/, otherwise the document reports missing pages.
 */
import { writeFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

const DATA_FOLDER = path.resolve(import.meta.dirname, '..', 'data');

// A3 is 842x1191pt; FR-029c is about pages larger than that. A0 is comfortably
// past it without producing a file so big it slows the E2E run.
const A0 = { width: 2384, height: 3370 };

// A5 is 420x595pt; FR-029d is about pages smaller than that.
const TINY = { width: 220, height: 160 };

const LANDSCAPE = { width: 792, height: 612 };
const PORTRAIT = { width: 612, height: 792 };

/**
 * Draw a label so each page is visually distinct in the viewer and in traces.
 */
async function addPage(doc, font, { width, height }, label, rotation = 0) {
  const page = doc.addPage([width, height]);

  if (rotation) {
    page.setRotation(degrees(rotation));
  }

  const fontSize = Math.max(24, Math.min(width, height) / 12);
  page.drawText(label, {
    x: fontSize,
    y: height - fontSize * 2,
    size: fontSize,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Border makes the page bounds obvious when checking scaling behaviour
  page.drawRectangle({
    x: 4,
    y: 4,
    width: width - 8,
    height: height - 8,
    borderColor: rgb(0.4, 0.4, 0.4),
    borderWidth: 2,
  });

  return page;
}

async function build(id, pages) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const { size, label, rotation } of pages) {
    await addPage(doc, font, size, label, rotation);
  }

  const target = path.join(DATA_FOLDER, `${id}.pdf`);
  await writeFile(target, await doc.save());

  const summary = doc
    .getPages()
    .map((p) => `${Math.round(p.getWidth())}x${Math.round(p.getHeight())}@${p.getRotation().angle}deg`)
    .join(', ');
  console.log(`${id}.pdf: ${doc.getPageCount()} pages [${summary}]`);
}

// 3 pages, matching the 3 markdown page files. Covers landscape (FR-029a),
// rotation (FR-029b) and undersized pages (FR-029d) in one document, which
// also makes it the mixed-page-size fixture.
await build('test-edge-cases', [
  { size: LANDSCAPE, label: 'Page 1 - landscape', rotation: 0 },
  { size: PORTRAIT, label: 'Page 2 - rotated 90', rotation: 90 },
  { size: TINY, label: 'Page 3 - tiny', rotation: 0 },
]);

// 2 pages, matching the 2 markdown page files. Both far larger than A3.
await build('very-large-pages', [
  { size: A0, label: 'Page 1 - A0', rotation: 0 },
  { size: A0, label: 'Page 2 - A0 rotated 270', rotation: 270 },
]);
