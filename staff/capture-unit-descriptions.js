/* Unit-description CAPTURE — CTLS staff tool (not for faculty distribution).
 *
 * Brightspace's Common Cartridge export DROPS unit descriptions (the intro text +
 * images designers put on a unit in the new content experience). This script saves
 * them to a JSON file so restore-unit-descriptions.js can write them into the
 * destination course after an import.
 *
 * HOW TO RUN
 *   1. In Brightspace, open the SOURCE course (any page inside it).
 *   2. Open the browser DevTools console (Cmd+Option+J / F12).
 *   3. Paste this whole file and press Enter.
 *   4. Confirm the course id it detected. A file
 *      unit-descriptions-<ou>.json lands in your Downloads.
 *
 * Reads only. Makes no changes to any course.
 */
(async () => {
  const detect = location.pathname.match(/\/d2l\/(?:home|le\/[^/]+)\/(\d+)/);
  const ou = Number(prompt('SOURCE course org unit id (the number in the URL):', detect ? detect[1] : ''));
  if (!ou) return alert('No course id — stopped.');
  const api = p => fetch(`/d2l/api/le/1.74/${ou}${p}`, { credentials: 'include' }).then(r => {
    if (!r.ok) throw new Error(`GET ${p} -> ${r.status}`);
    return r.json();
  });
  const toc = await api('/content/toc');
  const units = []; const walk = m => { units.push(m); (m.Modules || []).forEach(walk); };
  toc.Modules.forEach(walk);
  const out = { version: 1, sourceOu: ou, captured: new Date().toISOString(), units: [] };
  for (const u of units) {
    const mod = await api(`/content/modules/${u.ModuleId}`);
    let html = (mod.Description && mod.Description.Html) || '';
    if (!html.trim()) continue;
    // Inline same-course images as data: URIs so the JSON is self-contained — an
    // enforced-path URL from THIS course would be unreadable to students of another.
    const srcs = [...new Set([...html.matchAll(/<img[^>]*src="([^"]+)"/gi)].map(m => m[1].replace(/&amp;/g, '&')))];
    const images = [];
    for (const s of srcs) {
      if (/^data:/i.test(s)) continue;
      const sameCourse = s.startsWith('/') || s.startsWith(location.origin);
      if (!sameCourse) { images.push({ src: s, note: 'external URL — left as-is' }); continue; }
      try {
        const b = await fetch(s, { credentials: 'include' }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); });
        const dataUri = await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); });
        html = html.split(s.replace(/&/g, '&amp;')).join(dataUri).split(s).join(dataUri);
        images.push({ src: s, inlinedKB: Math.round(b.size / 1024) });
      } catch (e) {
        images.push({ src: s, note: 'FAILED to inline (' + e.message + ') — left as-is, will only render for users enrolled in the source course' });
      }
    }
    out.units.push({ title: mod.Title, descriptionHtml: html, images });
  }
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `unit-descriptions-${ou}.json` });
  a.click();
  const withImgs = out.units.filter(u => u.images.some(i => i.inlinedKB !== undefined)).length;
  alert(`Captured ${out.units.length} unit description(s) (${withImgs} with inlined images).\nSaved as unit-descriptions-${ou}.json in your Downloads.`);
})();
