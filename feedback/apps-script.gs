/**
 * Karim Catering reviews backend (Google Sheets + Apps Script, free).
 *
 * Setup (5 minutes, once):
 * 1. Create a new Google Sheet (any name). Leave it empty: the script adds the headers itself.
 * 2. Extensions → Apps Script. Delete what's there, paste this whole file, Save.
 * 3. Deploy → New deployment → type "Web app".
 *    Execute as: Me.  Who has access: Anyone.  → Deploy, allow permissions.
 * 4. Copy the Web app URL (ends with /exec) and paste it in feedback/index.html:
 *    const API = 'https://script.google.com/macros/s/XXXX/exec';
 *
 * To hide a spam or insulting review: type x in its "hide" column. It disappears from the site.
 */

function sheet_() {
  const sh = SpreadsheetApp.getActive().getSheets()[0];
  if (String(sh.getRange('A1').getValue()).trim() !== 'time' || String(sh.getRange('B1').getValue()).trim() !== 'rating') {
    sh.getRange('A1:F1').setValues([['time', 'rating', 'topic', 'msg', 'name', 'hide']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function doGet(e) {
  const sh = sheet_();
  const rows = sh.getDataRange().getValues().slice(1);
  const out = rows
    .filter(r => r[0] && !String(r[5]).trim())
    .map(r => ({ time: Number(r[0]), rating: Number(r[1]), topic: String(r[2]), msg: String(r[3]), name: String(r[4]) }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 300);
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const rating = Math.round(Number(d.rating));
    if (!(rating >= 1 && rating <= 5)) throw new Error('bad rating');
    const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
    const t = Number(d.time), now = Date.now();
    const time = (t > now - 864e5 && t < now + 6e4) ? t : now;
    const lock = LockService.getScriptLock(); lock.waitLock(5000);
    sheet_()
      .appendRow([time, rating, clean(d.topic, 30), clean(d.msg, 400), clean(d.name, 30), '']);
    lock.releaseLock();
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  }
}
