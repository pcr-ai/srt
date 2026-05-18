// Mobile nav toggle + active link highlight
document.addEventListener('DOMContentLoaded', () => {
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
