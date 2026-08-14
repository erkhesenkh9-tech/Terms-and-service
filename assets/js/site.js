/* ==========================================================================
   Vezo — thevezo.com
   Progressive enhancement only. Every section is readable with this file
   blocked; what follows adds the sticky header state, the mobile menu and the
   scroll choreography. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- Sticky header -----------------------------------------------------
     Toggles the glass treatment once the page has left the very top. */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var stuck = false;
    var onScroll = function () {
      var next = window.scrollY > 12;
      if (next !== stuck) {
        stuck = next;
        nav.classList.toggle('is-stuck', stuck);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Mobile menu -------------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var panel = document.querySelector('[data-nav-panel]');
  if (toggle && panel && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Following a link inside the panel should put it away again.
    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Leaving the mobile breakpoint with the panel open would otherwise strand
    // the desktop nav in the open state.
    window.matchMedia('(min-width: 781px)').addEventListener('change', function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* --- Stagger ------------------------------------------------------------
     Anything inside [data-stagger] gets its delay from its position, so the
     markup does not carry a hand-written --d on every line. The step can be
     tuned per container with data-stagger="0.09". Delays already set by hand
     win, so one-off timings still work. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-stagger]'), function (group) {
    var step = parseFloat(group.getAttribute('data-stagger')) || 0.07;
    var kids = group.querySelectorAll('[data-reveal]');
    Array.prototype.forEach.call(kids, function (el, i) {
      if (!el.style.getPropertyValue('--d')) {
        el.style.setProperty('--d', (i * step).toFixed(3) + 's');
      }
    });
  });

  /* --- Reveal on entry ----------------------------------------------------
     One observer for everything that animates in, including the map pins and
     the memory cards. Elements are unobserved once shown so nothing
     re-animates on the way back up. */
  var revealables = document.querySelectorAll('[data-reveal], [data-pin], [data-memory]');

  if (!('IntersectionObserver' in window)) {
    // Old browser: show everything rather than leaving the page blank.
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(revealables, function (el) { revealObserver.observe(el); });

    /* --- Product loop -----------------------------------------------------
       Highlights whichever step is nearest the middle of the viewport. A tall
       band centred on the screen keeps exactly one step active at a time. */
    var steps = document.querySelectorAll('[data-step]');
    if (steps.length) {
      var stepObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-active', entry.isIntersecting);
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

      Array.prototype.forEach.call(steps, function (el) { stepObserver.observe(el); });
    }
  }

  /* --- Hero parallax ------------------------------------------------------
     The device drifts a little slower than the page. Written against rAF and
     a passive listener so it never competes with the scroll itself, and it is
     skipped outright when motion is reduced or the viewport is small (where
     the travel is not worth the work). */
  var heroPhone = document.querySelector('[data-parallax]');
  if (heroPhone && !reduced.matches && window.matchMedia('(min-width: 781px)').matches) {
    var ticking = false;

    var apply = function () {
      ticking = false;
      var rect = heroPhone.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      var shift = Math.max(-40, Math.min(40, window.scrollY * 0.06));
      heroPhone.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }, { passive: true });

    apply();
  }
})();
