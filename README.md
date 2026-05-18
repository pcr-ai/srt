# Shree Raghunath Temple — Website

Static HTML/CSS/JS website for Shree Raghunath Temple (Plano, TX), with a layout inspired by the
DFW Hindu Temple site and content adapted from the existing shreeraghunathtemple.org.

## Project structure

```
srt/
├── index.html          # Home
├── about.html          # About / History / Mission
├── deities.html        # Deities gallery
├── events.html         # Events & Calendar
├── services.html       # Pujas, hall rental, classes, volunteer
├── donate.html         # Donation funds + form
├── contact.html        # Contact + newsletter subscribe
├── news.html           # Announcements
├── assets/
│   ├── css/styles.css  # All styling
│   └── js/main.js      # Mobile nav, active link, demo form handler
└── partials/_notes.md  # Reminder that header/footer are duplicated per page
```

## Run locally

It's plain static HTML, so just open `index.html` in a browser. For a dev server:

```powershell
# Option 1: Python (already installed on most machines)
python -m http.server 8080

# Option 2: Node (if installed)
npx serve .
```

Then open http://localhost:8080

## Things to customize before going live

1. **Real images** — replace the colored placeholder tiles (`.thumb` divs) with actual deity / temple
   photos from your existing site. Place files in `assets/img/` and use `<img>` tags inside `.thumb`.
2. **Hero background** — `index.html` hero uses an Unsplash placeholder URL. Replace with your own
   temple photo (edit the `background` rule in the hero `<section>` or move it into `styles.css`).
3. **Address** — `contact.html` has a placeholder for the full street address.
4. **Donation/Puja forms** — currently demo forms that just show a thank-you message. Wire them up to:
   - Your existing Google Form (you already have `1vyLMful0VM_v4x7VckGKxVd4Cbnau8ctlXWaS-XXrl4`), or
   - PayPal / Stripe / Zelle payment links, or
   - A form backend like Formspree, Netlify Forms, etc.
5. **Event dates** — `events.html` currently lists sample dates. Replace with your live calendar or
   embed the existing temple calendar iframe.
6. **Google Map** — embed an actual map iframe in the "Find Us" section of `contact.html`.
7. **Social links** — update Facebook / YouTube URLs in the topbar of every page.
8. **Header/Footer** — these are duplicated across pages. If you change the nav or footer, update
   all 8 HTML files (or migrate to a static site generator like Eleventy/Astro later).

## Hosting

Static site — works on any host:

- **GitHub Pages** — push to a repo, enable Pages on `main` branch.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder, or connect the repo.
- **Traditional shared hosting** — upload the folder via FTP.

## Notes on design

- Layout/section flow (topbar → hero → upcoming events → mission strip → what-we-do → deities →
  donate CTA → footer) is inspired by dfwhindutemple.org's structure, but all styling, colors,
  typography and copy are original/adapted from your existing site to avoid copying their assets.
- Color palette: saffron `#f29100`, maroon `#7a1f1f`, gold `#d4a017`, cream `#fff8ec`.
- Fonts: Cinzel (display) + Inter (body), loaded from Google Fonts.
- Fully responsive with a mobile hamburger menu.
