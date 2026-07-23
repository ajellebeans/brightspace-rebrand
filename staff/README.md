# Staff tools — unit-description porter

**For CTLS staff only. Do not hand these to faculty** — the workflow involves pasting
script into the browser console, a habit we do not want to teach (it is exactly what
phishing asks people to do). Faculty-facing conversion stays on the main page.

## The problem this solves

In the new Brightspace content experience, designers put intro text and hand-made
images on the **unit itself** (the unit's description). Brightspace's **Common
Cartridge export silently drops unit descriptions** — the converted course imports
with bare unit headings. Diagnosed 2026-07-23 on PSTC 1000 A → aubury_sandbox:
every unit description (504–2,530 chars, most with an image) arrived as 0 chars.

Everything *inside* the units (pages, files, images) survives the normal
export → convert → import path. Only the unit descriptions need this extra ride.

## Workflow

1. Export the course and convert it on the main page, as usual.
2. **Capture** — open the SOURCE course in Brightspace, paste
   `capture-unit-descriptions.js` into the DevTools console (Cmd+Option+J).
   It downloads `unit-descriptions-<ou>.json` (text + images inlined). Read-only.
3. Import the converted `.imscc` into the destination course.
4. **Restore** — open the DESTINATION course, paste
   `restore-unit-descriptions.js` into the console, pick the JSON.
   It writes each description onto the unit with the same title, verifies every
   write by reading it back, and prints an OK / SKIP / FAIL report.

## Safety properties

- Capture makes no changes anywhere.
- Restore matches units by exact title and **skips** ambiguous titles (duplicates).
- Restore **asks** before overwriting a description that already has content.
- Every write is verified by re-reading; the report flags any image Brightspace
  stripped on save (⚠).
- Images are carried as self-contained data: URIs — no cross-course file
  references that would 404 for students.

## First-run notes (status: not yet field-tested)

The write path has not been exercised end-to-end yet; the first restore run is the
test, and the script reports everything it does. Two things to watch:

- **PUT 403** — the session CSRF token wasn't found where expected
  (`localStorage['XSRF.Token']`). Reload the course page and rerun; if it
  persists, report back and we'll adjust the token lookup.
- **⚠ images stripped** — Brightspace's HTML processor may reject data: URI
  images in descriptions. If that happens, the fallback is uploading the images
  to the destination course files and re-pointing the srcs (planned, not built —
  report back and it gets built).

Recommended first test: capture from the source course, restore into
**aubury_sandbox (ou 23533)**, and eyeball the units in Lessons.
