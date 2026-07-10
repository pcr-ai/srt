#!/usr/bin/env node
// ============================================================
// Auto-archive past event flyers.
//
// What it does (all automatic, no manual editing):
//   1. Reads window.SRT_EVENTS from index.html.
//   2. For every flyer whose date has passed:
//        - moves the image  assets/img/events/<file>
//                     into  assets/img/events/archive/<file>
//        - removes it from the homepage popup list (index.html)
//        - removes its row from events.html (Upcoming Special Events)
//        - adds a row to past-events.html under the right year
//   3. Leaves everything else untouched.
//
// If nothing has expired, it makes no changes.
// Run by .github/workflows/archive-events.yml every 2 days.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const p = (f) => path.join(ROOT, f);

const indexPath   = p('index.html');
const eventsPath  = p('events.html');
const pastPath    = p('past-events.html');
const imgDir      = p('assets/img/events');
const archiveDir  = path.join(imgDir, 'archive');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const today = new Date();
today.setHours(0, 0, 0, 0);

// ---- 1. Extract the SRT_EVENTS array from index.html --------
let indexHtml = fs.readFileSync(indexPath, 'utf8');
const arrMatch = indexHtml.match(/window\.SRT_EVENTS\s*=\s*(\[[\s\S]*?\]);/);
if (!arrMatch) {
  console.log('SRT_EVENTS array not found in index.html — nothing to do.');
  process.exit(0);
}

let events;
try {
  // The array literal is our own trusted content in this repo.
  events = eval('(' + arrMatch[1] + ')');
} catch (err) {
  console.error('Could not parse SRT_EVENTS:', err.message);
  process.exit(1);
}

// ---- 2. Split into "keep" (upcoming) and "past" -------------
const keep = [];
const past = [];
for (const ev of events) {
  const end = ev.until || ev.date;
  if (!end) { keep.push(ev); continue; }
  const d = new Date(end + 'T23:59:59');
  if (isNaN(d) || d >= today) keep.push(ev);
  else past.push(ev);
}

if (past.length === 0) {
  console.log('No past events to archive.');
  process.exit(0);
}

// Process oldest first so newest ends up on top of the archive.
past.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

let eventsHtml = fs.readFileSync(eventsPath, 'utf8');
let pastHtml   = fs.readFileSync(pastPath, 'utf8');

const rowRe = /[ \t]*<div class="event-row">[\s\S]*?<\/a>\s*<\/div>\n?/g;

for (const ev of past) {
  const file = path.basename(ev.img);
  const archiveImg = `assets/img/events/archive/${file}`;

  // 2a. Move the image file into the archive folder.
  const src = path.join(imgDir, file);
  const dest = path.join(archiveDir, file);
  if (fs.existsSync(src)) {
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.renameSync(src, dest);
    console.log(`Moved ${file} -> archive/`);
  }

  // 2b. Find the matching row in events.html.
  let matchedRow = null;
  const rows = eventsHtml.match(rowRe) || [];
  for (const row of rows) {
    if (row.includes(file) || (ev.link && ev.link !== 'events.html' && row.includes(ev.link))) {
      matchedRow = row;
      break;
    }
  }

  // 2c. Build the archive row (Flyer link -> archived image).
  let archiveRow;
  if (matchedRow) {
    archiveRow = matchedRow
      .trim()
      .replace(/<a [^>]*>[\s\S]*?<\/a>/,
        `<a href="${archiveImg}" target="_blank" rel="noopener" class="btn btn-ghost">Flyer</a>`);
    // Remove it from the upcoming list.
    eventsHtml = eventsHtml.replace(matchedRow, '');
  } else {
    // No events.html row — build one from the flyer data.
    const d = new Date((ev.date || '') + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const mon = MONTHS[d.getMonth()] || '';
    const parts = (ev.alt || '').split('\u2014'); // em dash
    const name = (parts[0] || 'Event').trim();
    const when = (parts[1] || '').trim();
    archiveRow =
      `<div class="event-row">\n` +
      `      <div class="event-date"><div class="d">${day}</div><div class="m">${mon}</div></div>\n` +
      `      <div class="event-info"><h3>${name}</h3><small>${when}</small></div>\n` +
      `      <a href="${archiveImg}" target="_blank" rel="noopener" class="btn btn-ghost">Flyer</a>\n` +
      `    </div>`;
  }

  // 2d. Insert the row at the top of the matching year in past-events.html.
  const year = (ev.date || '').slice(0, 4) || String(new Date().getFullYear());
  const headingRe = new RegExp(`(<h3[^>]*>\\s*${year}\\s*</h3>)`);
  if (headingRe.test(pastHtml)) {
    pastHtml = pastHtml.replace(headingRe, `$1\n\n    ${archiveRow}`);
  } else {
    // Create a new year heading before the first existing year heading.
    const anyHeading = /<h3 style="font-family:var\(--font-head\)[^>]*>\s*\d{4}\s*<\/h3>/;
    const block =
      `<h3 style="font-family:var(--font-head);color:var(--maroon-dark);margin:28px 0 14px;font-size:1.5rem">${year}</h3>\n\n` +
      `    ${archiveRow}\n\n    `;
    if (anyHeading.test(pastHtml)) {
      pastHtml = pastHtml.replace(anyHeading, (h) => block + h);
    } else {
      // Fallback: insert before the closing of the first <section>.
      pastHtml = pastHtml.replace(/(\n  <\/div>\n<\/section>)/, `\n    ${block}$1`);
    }
  }

  console.log(`Archived: ${ev.alt || file}`);
}

// ---- 3. Rebuild the SRT_EVENTS array with only upcoming -----
function toEntry(ev) {
  const parts = [`img: '${ev.img}'`, `alt: '${ev.alt}'`, `link: '${ev.link || 'events.html'}'`];
  if (ev.date)  parts.push(`date: '${ev.date}'`);
  if (ev.until) parts.push(`until: '${ev.until}'`);
  return `    { ${parts.join(', ')} }`;
}
const newArray =
  'window.SRT_EVENTS = [\n' +
  (keep.length ? keep.map(toEntry).join(',\n') + '\n' : '') +
  "    // Add a `date: 'YYYY-MM-DD'` to each flyer. It auto-hides after that day.\n" +
  "    // Past flyers are archived in past-events.html.\n" +
  '  ];';

indexHtml = indexHtml.replace(/window\.SRT_EVENTS\s*=\s*\[[\s\S]*?\];/, newArray);

// Tidy any triple blank lines left by removed rows.
eventsHtml = eventsHtml.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(indexPath, indexHtml);
fs.writeFileSync(eventsPath, eventsHtml);
fs.writeFileSync(pastPath, pastHtml);

console.log(`Done. Archived ${past.length} event(s).`);
