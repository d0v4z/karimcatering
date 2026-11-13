/**
 * Karim Catering backend (Google Sheets + Apps Script, free).
 * - Reviews from the QR feedback page (first sheet).
 * - Offers + TikTok videos edited from /admin (sheet "settings", saved as one JSON cell).
 *
 * First setup (once):
 * 1. Create a Google Sheet. Extensions → Apps Script. Paste this whole file, Save.
 * 2. Deploy → New deployment → "Web app". Execute as: Me. Who has access: Anyone. Deploy.
 * 3. Copy the Web app URL (ends with /exec) into the site (const API = '...').
 *
 * UPDATING this file later (keeps the same URL):
 *   Paste the new code → Save → Deploy → Manage deployments → ✏️ Edit → Version: "New version" → Deploy.
 *
 * Admin password: change ADMIN_PASS below before deploying.
 * To hide a spam review: type x in its "hide" column.
 */
const ADMIN_PASS = 'karim2026';

function sheet_() {
  const sh = SpreadsheetApp.getActive().getSheets()[0];
  if (String(sh.getRange('A1').getValue()).trim() !== 'time' || String(sh.getRange('B1').getValue()).trim() !== 'rating') {
    sh.getRange('A1:F1').setValues([['time', 'rating', 'topic', 'msg', 'name', 'hide']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function settings_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('settings');
  if (!sh) { sh = ss.insertSheet('settings'); sh.getRange('A1').setValue('offers'); sh.getRange('B1').setValue(''); }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (e && e.parameter && e.parameter.offers) {
    const raw = String(settings_().getRange('B1').getValue() || '');
    let data = null; try { data = raw ? JSON.parse(raw) : null; } catch (err) {}
    return json_(data || {});
  }
  const rows = sheet_().getDataRange().getValues().slice(1);
  const out = rows
    .filter(r => r[0] && !String(r[5]).trim())
    .map(r => ({ time: Number(r[0]), rating: Number(r[1]), topic: String(r[2]), msg: String(r[3]), name: String(r[4]) }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 300);
  return json_(out);
}

function cleanOffers_(d) {
  const s = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, n);
  const num = v => { const x = Number(v); return isFinite(x) && x >= 0 ? Math.round(x * 100) / 100 : 0; };
  const list = a => (Array.isArray(a) ? a : []).slice(0, 40).map(o => ({ name: s(o.name, 60), unit: s(o.unit, 40), price: num(o.price), old: num(o.old), tag: s(o.tag, 24) })).filter(o => o.name);
  const vids = (Array.isArray(d.videos) ? d.videos : []).slice(0, 20).map(v => s(v, 200)).filter(v => /tiktok\.com|^\d{10,}$/.test(v));
  return { until: s(d.until, 80), market: list(d.market), chicken: list(d.chicken), videos: vids, updated: Date.now() };
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'check') return json_({ ok: d.pass === ADMIN_PASS });
    if (d.action === 'saveOffers') {
      if (d.pass !== ADMIN_PASS) return json_({ ok: false, error: 'pass' });
      const clean = cleanOffers_(d.data || {});
      const lock = LockService.getScriptLock(); lock.waitLock(5000);
      settings_().getRange('B1').setValue(JSON.stringify(clean));
      lock.releaseLock();
      return json_({ ok: true, updated: clean.updated });
    }
    /* a review from the feedback page */
    const rating = Math.round(Number(d.rating));
    if (!(rating >= 1 && rating <= 5)) throw new Error('bad rating');
    const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
    const t = Number(d.time), now = Date.now();
    const time = (t > now - 864e5 && t < now + 6e4) ? t : now;
    const lock = LockService.getScriptLock(); lock.waitLock(5000);
    sheet_().appendRow([time, rating, clean(d.topic, 30), clean(d.msg, 400), clean(d.name, 30), '']);
    lock.releaseLock();
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  }
}
