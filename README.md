# Course Template Converter

Applies the RDP style to a Brightspace (D2L) course. Your wording, links, files and pictures stay
exactly as they are — it only styles what's already there.

# ▶ [Open the tool](https://rdp-ctls.github.io/brightspace-rebrand/)

**All the instructions are on that page**, step by step. You don't need anything from this page —
this one is just where the code lives.

Nothing is uploaded anywhere. The whole thing runs inside your own browser, and your real
Brightspace course is never touched — it only makes a new file from the copy you export.

---

<details>
<summary><b>Notes for maintainers</b></summary>

### The one rule

`index.html` is **the whole tool** — no build step, no dependencies, no CDN. It is also **the newest
copy**. `Course-Rebranding/rebrand-tool/web/rebrand.html` in the working vault is a mirror of it.

**Sync direction: `index.html` → `web/rebrand.html`.** (This used to be documented backwards, which
would have quietly reverted improvements made here. If you change one, copy it to the other in that
direction and check `git diff` before you push.)

The Python CLI (`rebrand.py` / `preflight.py`, sharing `engine.py`) lives alongside that mirror and
implements the same restyle independently — so a change to the styling has to be made **twice**:
here, and in `engine.py`. The generated link/heading colour is `#003129` in both; keep it that way.

### Screenshots

The walkthrough shows the six Brightspace export screens from `shots/`. If a file is missing, a
labelled placeholder appears instead of a broken image, so the page is never broken — it just looks
unfinished. To add or refresh one, drop a PNG in with the exact name the placeholder tells you:

| File | Screen to capture |
|---|---|
| `shots/1-course-admin.png` | The **Course Admin** link in the course navbar |
| `shots/2-import-export.png` | **Import / Export / Copy Components** on the Course Admin page |
| `shots/3-common-cartridge.png` | **Export as Common Cartridge** selected |
| `shots/4-select-all.png` | The **Select All Components** tick box |
| `shots/5-confirm-export.png` | **Confirm Components to Export**, with the **Export** button |
| `shots/6-download-zip.png` | **Export Summary** — "successful", with the download link |
| `shots/bell-notification.png` | The navbar **bell (🔔)** with its orange dot |
| `shots/bell-export-finished.png` | The bell list showing **Export finished** |

The last two live inside the "If something looks different" panel, as the recovery route for anyone who
clicked **Done** before downloading.

Crop tight to the relevant control. Keep them under ~200 KB each.

Use a **sandbox course**, not a live one — these are published to a public site, so check each image
for learner names, enrolment counts and unpublished titles before committing.

### Testing

`test.imscc` is a tiny synthetic cartridge (not a real course). Drop it into the tool and run it:
expect **two `RESULT: PASS`** lines and two download buttons.

`validate.py` (next to the CLI) lints a *rebranded* `.imscc` for residue the reskin leaves behind —
unconverted marker icons and mangled `%20` / `_20` / `#data-ally` URLs. Worth running on the output
after any change to the HTML rewriting.

### Hosting

`.nojekyll` tells GitHub Pages to serve the files as-is. Pages serves `main` at
<https://rdp-ctls.github.io/brightspace-rebrand/>.

</details>
