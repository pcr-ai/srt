# Event Flyers — How to Add a New Flyer

This folder holds the **event flyer images** that pop up ("flash") on the
homepage and are used for sharing on Google / Facebook / WhatsApp.

## 1. Save your flyer here

Drop the flyer image into this folder:

```
assets/img/events/
```

Recommended:
- **Format:** `.jpg` (smaller) or `.png`
- **Size:** portrait, about **768 × 1152 px** (the flyers you already have are this shape)
- **File size:** keep under ~400 KB so it loads fast
- **Name:** lowercase, words separated by hyphens, e.g.
  - `nirjala-ekadashi-2026.jpg`
  - `devasnana-purnima-2026.jpg`
  - `ratha-yatra-2026.jpg`

## 2. Tell the website to show it

Open **`index.html`**, find the block that starts with:

```html
<!-- ====== EVENT FLYERS — EDIT THIS LIST ====== -->
```

Add one entry per flyer (newest first). Example:

```js
window.SRT_EVENTS = [
  { img: 'assets/img/events/ratha-yatra-2026.jpg',     alt: 'Ratha Yatra — 16 July 2026', link: 'ratha-yatra-2026.html' },
  { img: 'assets/img/events/nirjala-ekadashi-2026.jpg', alt: 'Nirjala Ekadashi — 25 June 2026', link: 'events.html' },
];
```

- `img`  = path to the image you just saved
- `alt`  = short text describing the flyer (good for Google + accessibility)
- `link` = page that opens when someone clicks the flyer (`events.html` is fine)

That's it — save the file. The popup automatically:
- shows the flyers when someone opens the homepage (once per visit),
- skips any image that isn't uploaded yet (no broken pictures),
- rotates between multiple flyers,
- adds a floating **📣 Events** button so visitors can re-open it.

## 3. (Optional) Help it show in Google search

In `index.html`, also update the **`<!-- EVENT STRUCTURED DATA -->`** block
with the event name, date and image. Google uses this to show your event as a
rich result when people search for the temple. See the notes in that block.

## Current flyers expected here
- `bhajan-sandhya-children-2026.jpg` — Bhajan Sandhya by Children, 11 July 2026
- `khatu-shyam-kirtan-2026.jpg`      — Khatu Shyam Baba Kirtan, 12 July 2026
- `netra-utsav-2026.jpg`             — Netra Utsav / Naba Jaubana, 14 July 2026
- `ratha-yatra-2026.jpg`             — Shree Jagannatha Rath Yatra, 16 July 2026
- `hera-panchami-2026.jpg`           — Hera Panchami Puja, 20 July 2026

## Archived flyers
Past event flyers are moved into the **`archive/`** subfolder once the event is
over, and are linked from `past-events.html`:
- `archive/nirjala-ekadashi-2026.jpg`   — Nirjala Ekadashi, 25 June 2026
- `archive/devasnana-purnima-2026.jpg`  — Devasnana Purnima / Snana Yatra, 29 June 2026
