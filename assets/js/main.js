// Mobile nav toggle + active link highlight
document.addEventListener('DOMContentLoaded', () => {
  /* ============================================================
   * COPY / CONTENT PROTECTION  (configurable)
   * Set any flag to false to disable that restriction.
   * NOTE: Client-side protection is a deterrent only — anyone
   * who disables JavaScript or views the page source can still
   * see the content. For real protection use server-side controls.
   * ============================================================ */
  const PROTECT = {
    enabled:           true,   // master switch — set to false to turn everything off
    disableRightClick: true,   // block right-click context menu
    disableSelection:  true,   // block mouse text selection
    disableCopy:       true,   // block Ctrl+C / Cmd+C and copy event
    disableCut:        true,   // block cut
    disablePaste:      false,  // keep paste enabled so forms still work
    disableDrag:       true,   // block image drag-out
    disableDevKeys:    true,   // block F12, Ctrl+U (view source), Ctrl+Shift+I/J/C, Ctrl+S
    disablePrint:      true,   // block Ctrl+P and print preview
    disableImageSave:  true,   // overlay images so "save image as" grabs a blank pixel
    disableScreenshot: true,   // best-effort: blur page when window loses focus / PrintScreen
    showToast:         true,   // briefly show "Content is protected" message
    // Selectors allowed to bypass (e.g. form fields must stay usable)
    allowSelectors:    'input, textarea, select, [contenteditable="true"]'
  };

  if (PROTECT.enabled) {
    const allowed = (el) => el && el.closest && el.closest(PROTECT.allowSelectors);

    let toastEl;
    const toast = (msg) => {
      if (!PROTECT.showToast) return;
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.style.cssText =
          'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);' +
          'background:rgba(122,31,31,.95);color:#fff;padding:10px 18px;' +
          'border-radius:8px;font:600 14px/1.2 Inter,sans-serif;z-index:9999;' +
          'box-shadow:0 6px 20px rgba(0,0,0,.25);opacity:0;transition:opacity .25s ease;' +
          'pointer-events:none';
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg || 'Content is protected.';
      toastEl.style.opacity = '1';
      clearTimeout(toastEl._t);
      toastEl._t = setTimeout(() => { toastEl.style.opacity = '0'; }, 1600);
    };

    if (PROTECT.disableSelection) {
      const css = document.createElement('style');
      css.textContent =
        'body{-webkit-user-select:none;-ms-user-select:none;user-select:none;' +
        '-webkit-touch-callout:none}' +
        PROTECT.allowSelectors +
        '{-webkit-user-select:text;-ms-user-select:text;user-select:text}';
      document.head.appendChild(css);
      document.addEventListener('selectstart', (e) => {
        if (!allowed(e.target)) e.preventDefault();
      });
    }

    if (PROTECT.disableRightClick) {
      document.addEventListener('contextmenu', (e) => {
        if (!allowed(e.target)) { e.preventDefault(); toast('Right-click is disabled.'); }
      });
    }

    if (PROTECT.disableCopy) {
      document.addEventListener('copy', (e) => {
        if (!allowed(e.target)) { e.preventDefault(); toast('Copying is disabled.'); }
      });
    }
    if (PROTECT.disableCut) {
      document.addEventListener('cut', (e) => {
        if (!allowed(e.target)) { e.preventDefault(); toast('Cut is disabled.'); }
      });
    }
    if (PROTECT.disablePaste) {
      document.addEventListener('paste', (e) => {
        if (!allowed(e.target)) e.preventDefault();
      });
    }

    if (PROTECT.disableDrag) {
      document.addEventListener('dragstart', (e) => {
        if (!allowed(e.target)) e.preventDefault();
      });
    }

    if (PROTECT.disablePrint) {
      window.addEventListener('beforeprint', (e) => { toast('Printing is disabled.'); });
      const printCss = document.createElement('style');
      printCss.textContent = '@media print { body * { display:none !important; } body::after { content:"Printing is disabled."; display:block !important; font:18px sans-serif; padding:40px; } }';
      document.head.appendChild(printCss);
    }

    if (PROTECT.disableDevKeys) {
      document.addEventListener('keydown', (e) => {
        const k = e.key ? e.key.toLowerCase() : '';
        // F12
        if (e.key === 'F12') { e.preventDefault(); toast(); return; }
        // Ctrl/Cmd + U (view source), S (save), P (print)
        if ((e.ctrlKey || e.metaKey) && ['u','s','p'].includes(k)) {
          if (k === 'p' && !PROTECT.disablePrint) return;
          e.preventDefault(); toast(); return;
        }
        // Ctrl/Cmd + Shift + I / J / C  (dev tools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i','j','c'].includes(k)) {
          e.preventDefault(); toast(); return;
        }
        // Ctrl/Cmd + C / X on non-form elements
        if ((e.ctrlKey || e.metaKey) && ['c','x'].includes(k) && !allowed(e.target)) {
          e.preventDefault(); toast(k === 'c' ? 'Copying is disabled.' : 'Cut is disabled.');
        }
        // PrintScreen (best-effort — Windows/Mac may capture before JS sees it)
        if (PROTECT.disableScreenshot && (e.key === 'PrintScreen' || k === 'printscreen')) {
          // Wipe clipboard as a deterrent
          try { navigator.clipboard && navigator.clipboard.writeText(' '); } catch(_) {}
          toast('Screenshots are restricted.');
        }
      });
    }

    if (PROTECT.disableImageSave) {
      // CSS: prevent saving via background, disable pointer events on raw <img>
      const imgCss = document.createElement('style');
      imgCss.textContent =
        'img{-webkit-user-drag:none;user-drag:none;pointer-events:none}' +
        '.img-shield{position:relative;display:inline-block;line-height:0}' +
        '.img-shield::after{content:"";position:absolute;inset:0;background:transparent;cursor:default}';
      document.head.appendChild(imgCss);

      // Wrap every <img> with a transparent overlay so right-click → "save image" grabs nothing
      const shield = () => {
        document.querySelectorAll('img:not([data-shielded])').forEach((img) => {
          img.setAttribute('data-shielded', '1');
          img.setAttribute('draggable', 'false');
          img.addEventListener('contextmenu', (e) => { e.preventDefault(); toast('Image download is disabled.'); });
          const w = document.createElement('span');
          w.className = 'img-shield';
          img.parentNode.insertBefore(w, img);
          w.appendChild(img);
        });
        // Also block context menu on CSS-background slides
        document.querySelectorAll('.slide, [style*="background-image"]').forEach((el) => {
          el.addEventListener('contextmenu', (e) => { e.preventDefault(); toast('Image download is disabled.'); });
        });
      };
      shield();
      // Re-shield any images added later (e.g. dynamic calendar, slider)
      new MutationObserver(shield).observe(document.body, { childList:true, subtree:true });
    }

    if (PROTECT.disableScreenshot) {
      // Blur the page when it loses focus (common when a snipping tool activates)
      const blurCss = document.createElement('style');
      blurCss.textContent = 'body.protect-blur{filter:blur(14px) !important;transition:filter .15s ease}';
      document.head.appendChild(blurCss);
      window.addEventListener('blur',  () => document.body.classList.add('protect-blur'));
      window.addEventListener('focus', () => document.body.classList.remove('protect-blur'));
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) document.body.classList.add('protect-blur');
        else document.body.classList.remove('protect-blur');
      });
    }
  }

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // Mobile dropdown: tap parent to expand on small screens
  document.querySelectorAll('.nav .has-dropdown > a').forEach(a => {
    a.addEventListener('click', e => {
      if (window.matchMedia('(max-width: 880px)').matches) {
        e.preventDefault();
        a.parentElement.classList.toggle('open');
      }
    });
  });

  // Highlight active nav item based on file name
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Year in footer
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Hero slider
  const slider = document.querySelector('.slider');
  if (slider) {
    const slides = slider.querySelectorAll('.slide');
    const dotsWrap = slider.querySelector('.dots');
    let current = 0;
    let timer;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll('.dot');

    function go(i, manual) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
      if (manual) restart();
    }
    function next() { go(current + 1); }
    function prev() { go(current - 1); }
    function restart() { clearInterval(timer); timer = setInterval(next, 6000); }

    slider.querySelector('.arrow.next').addEventListener('click', () => { next(); restart(); });
    slider.querySelector('.arrow.prev').addEventListener('click', () => { prev(); restart(); });
    restart();
  }

  // Simple form handler (no backend) — shows confirmation
  document.querySelectorAll('form[data-demo]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const msg = form.querySelector('.form-msg');
      if (msg) {
        msg.textContent = 'Thank you! Your submission has been received. We will contact you shortly.';
        msg.style.color = '#1f7a1f';
      }
      form.reset();
    });
  });
});
