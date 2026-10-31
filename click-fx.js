/* ── CLICK FX ──
   Hover already eases colour, underlines and lifts; a click answers with
   something physical: the element presses in and springs back, and a thin
   accent ring pulses out from the exact point you clicked.
   Uses the standalone `scale` property via the Web Animations API, so it
   stacks on top of each element's own transform / transition rules instead
   of overriding them. */
(function () {
  // big surfaces only dip a little; small controls press in properly
  const CARDS = '.portfolio-item, .artwork-card, .gallery-img-slot, .featured-img-col, ' +
                '.cs-process-img.is-zoomable, .cs-process-video.is-zoomable, .cs-process-img-link, ' +
                '.cs-board-hit, .about-photo-link';
  const CONTROLS = 'a[href], button, [role="button"], .filter-btn, .t-btn, .marquee-btn, ' +
                   '.slideshow-btn, .lightbox-arrow, .lightbox-nav, .gallery-nav-btn';
  const LIGHTBOX = '.artwork-lightbox-trigger, .artwork-card, .slideshow-card, ' +
                   '.cs-process-img.is-zoomable, .cs-process-video.is-zoomable, .cs-board-hit';
  const SKIP ='.page-scroll, input, textarea, select, label, [disabled]';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const style = document.createElement('style');
  style.textContent =
    '.click-ring{position:fixed;left:0;top:0;width:var(--d);height:var(--d);margin:calc(var(--d)/-2) 0 0 calc(var(--d)/-2);' +
    'border-radius:50%;border:1px solid var(--accent,#c8b89a);background:radial-gradient(circle,rgba(200,184,154,.18) 0,rgba(200,184,154,0) 70%);' +
    'pointer-events:none;z-index:9996;}' +
    // images that open in the lightbox: an open hand, closing into a fist while pressed
    LIGHTBOX.split(', ').map(s => s + ',' + s + ' *').join(',') + '{cursor:grab}' +
    LIGHTBOX.split(', ').map(s => s + ':active,' + s + ':active *').join(',') + '{cursor:grabbing}' +
    '.slideshow-card .slideshow-btn{cursor:pointer}';
  document.head.appendChild(style);

  function targetFor(node) {
    if (!(node instanceof Element) || node.closest(SKIP)) return null;
    const card = node.closest(CARDS);
    if (card) return { el: card, depth: 0.985 };
    const ctl = node.closest(CONTROLS);
    if (ctl) return { el: ctl, depth: 0.94 };
    return null;
  }

  function ring(x, y, el) {
    const r = el.getBoundingClientRect();
    // sized to the thing clicked: a nav link gets a small pulse, a card a wider one
    const d = Math.round(Math.min(Math.max(Math.max(r.width, r.height) * 0.9, 56), 220));
    const dot = document.createElement('div');
    dot.className = 'click-ring';
    dot.style.setProperty('--d', d + 'px');
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    document.body.appendChild(dot);
    dot.animate(
      [{ transform: 'scale(0.15)', opacity: 0.9 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    ).onfinish = () => dot.remove();
  }

  let pressed = null;
  let lastType = 'mouse';

  function press(t) {
    if (reduced.matches) return;
    pressed = t;
    t.anim = t.el.animate([{ scale: 1 }, { scale: t.depth }],
      { duration: 110, easing: 'cubic-bezier(0.3, 0, 0.5, 1)', fill: 'forwards' });
  }

  function release() {
    if (!pressed) return;
    const t = pressed;
    pressed = null;
    const from = getComputedStyle(t.el).scale;
    if (t.anim) t.anim.cancel();
    // springs back past 1 a touch before settling, the opposite of hover's slow ease
    t.el.animate([{ scale: from === 'none' ? t.depth : from }, { scale: 1.015, offset: 0.55 }, { scale: 1 }],
      { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' });
  }

  // mouse / pen: react the instant the button goes down
  document.addEventListener('pointerdown', e => {
    lastType = e.pointerType;
    if (e.pointerType === 'touch' || e.button !== 0) return;
    const t = targetFor(e.target);
    if (!t) return;
    press(t);
    if (!reduced.matches) ring(e.clientX, e.clientY, t.el);
  }, true);
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);
  window.addEventListener('blur', release);

  // touch: wait for a real tap, so scrolling past a card doesn't set it off
  document.addEventListener('click', e => {
    const keyboard = e.detail === 0;
    if (!keyboard && lastType !== 'touch') return;
    const t = targetFor(e.target);
    if (!t || reduced.matches) return;
    const r = t.el.getBoundingClientRect();
    const x = keyboard ? r.left + r.width / 2 : e.clientX;   // keyboard: pulse from the centre
    const y = keyboard ? r.top + r.height / 2 : e.clientY;
    press(t);
    setTimeout(release, 110);
    ring(x, y, t.el);
  }, true);
})();
