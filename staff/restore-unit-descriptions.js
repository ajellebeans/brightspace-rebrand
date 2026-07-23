/* Unit-description RESTORE — CTLS staff tool (not for faculty distribution).
 *
 * Companion to capture-unit-descriptions.js. After importing a converted course
 * into its destination shell, this writes the captured unit descriptions (text +
 * inlined images) onto the matching units there.
 *
 * HOW TO RUN
 *   1. In Brightspace, open the DESTINATION course (after the import finished).
 *   2. Open the browser DevTools console (Cmd+Option+J / F12).
 *   3. Paste this whole file and press Enter.
 *   4. Confirm the course id, pick the unit-descriptions-<ou>.json file.
 *   5. Read the report it prints: OK / SKIP / FAIL per unit, and whether any
 *      images were stripped by Brightspace on save (the ⚠ marker).
 *
 * Safety: matches units by EXACT title and skips when a title appears more than
 * once; asks before overwriting a description that already has content; verifies
 * every write by reading it back.
 */
(async () => {
  const detect = location.pathname.match(/\/d2l\/(?:home|le\/[^/]+)\/(\d+)/);
  const ou = Number(prompt('DESTINATION course org unit id (the number in the URL):', detect ? detect[1] : ''));
  if (!ou) return alert('No course id — stopped.');
  const pick = () => new Promise(res => {
    const i = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
    i.onchange = () => res(i.files[0]); i.click();
  });
  const file = await pick(); if (!file) return alert('No file picked — stopped.');
  const data = JSON.parse(await file.text());
  if (data.version !== 1 || !Array.isArray(data.units)) return alert('That is not a capture file — stopped.');
  if (data.sourceOu === ou && !confirm(`This file was captured FROM course ${ou}. Restore into the SAME course?`)) return;

  const xsrf = localStorage.getItem('XSRF.Token') || '';
  const GET = p => fetch(`/d2l/api/le/1.74/${ou}${p}`, { credentials: 'include' }).then(r => {
    if (!r.ok) throw new Error(`GET ${p} -> ${r.status}`);
    return r.json();
  });
  const toc = await GET('/content/toc');
  const units = []; const walk = m => { units.push(m); (m.Modules || []).forEach(walk); };
  toc.Modules.forEach(walk);

  const report = [];
  for (const u of data.units) {
    try {
      const matches = units.filter(m => (m.Title || '').trim() === u.title.trim());
      if (matches.length !== 1) { report.push(`SKIP  "${u.title}" — ${matches.length} unit(s) with this exact title here`); continue; }
      const id = matches[0].ModuleId;
      const g = await GET(`/content/modules/${id}`);
      const existing = (g.Description && g.Description.Html) || '';
      if (existing.trim() && !confirm(`"${u.title}" already has a description in this course. Overwrite it?`)) {
        report.push(`SKIP  "${u.title}" — kept the existing description`); continue;
      }
      const body = {
        Title: g.Title, ShortTitle: g.ShortTitle || '', Type: g.Type ?? 0,
        ModuleStartDate: g.ModuleStartDate ?? null, ModuleEndDate: g.ModuleEndDate ?? null,
        ModuleDueDate: g.ModuleDueDate ?? null, IsHidden: g.IsHidden ?? false, IsLocked: g.IsLocked ?? false,
        Description: { Content: u.descriptionHtml, Type: 'Html' },
      };
      const put = await fetch(`/d2l/api/le/1.74/${ou}/content/modules/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Csrf-Token': xsrf },
        body: JSON.stringify(body),
      });
      if (!put.ok) { report.push(`FAIL  "${u.title}" — PUT ${put.status}${put.status === 403 ? ' (session token issue — reload the page and rerun)' : ''}`); continue; }
      // verify by reading back: did the text and the images survive the save?
      const after = await GET(`/content/modules/${id}`);
      const ah = (after.Description && after.Description.Html) || '';
      const want = (u.descriptionHtml.match(/<img/gi) || []).length;
      const got = (ah.match(/<img/gi) || []).length;
      report.push(`OK    "${u.title}" — ${ah.length} chars saved, images ${got}/${want}${got < want ? '  ⚠ Brightspace stripped some images on save' : ''}`);
    } catch (e) {
      report.push(`FAIL  "${u.title}" — ${String(e).slice(0, 80)}`);
    }
  }
  console.log('restore-unit-descriptions report:\n' + report.join('\n'));
  alert('Done:\n\n' + report.join('\n'));
})();
