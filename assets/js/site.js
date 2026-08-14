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

  /* --- Word split ---------------------------------------------------------
     Headings rise a word at a time out of a clipped line, which is the single
     biggest difference between a heading that appears and a heading that
     arrives. Done here rather than in the markup so the HTML stays readable
     and the text is still one string for search engines and copy-paste.

     Only text nodes are touched — a <br> inside a heading survives — and each
     word keeps a real space after it, so selecting the heading still yields
     normal text rather than wordsruntogether. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-split]'), function (host) {
    var index = 0;

    Array.prototype.slice.call(host.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;                 // element (e.g. <br>): leave alone
      if (!node.nodeValue.trim()) return;

      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); return; }
        var mask = document.createElement('span');
        mask.className = 'word';
        var inner = document.createElement('span');
        inner.className = 'word__i';
        inner.style.setProperty('--wi', index++);
        inner.textContent = chunk;
        mask.appendChild(inner);
        frag.appendChild(mask);
      });
      host.replaceChild(frag, node);
    });

    if (index) host.classList.add('is-split');
  });

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
      // Fires close to the edge of the viewport rather than a long way into
      // it. Waiting until something is 12% up the screen meant you could be
      // looking straight at a blank block before it decided to arrive — which
      // is the opposite of a reveal helping you read.
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.04 });

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

  /* --- Marker proximity ---------------------------------------------------
     The category markers answer to how close the pointer is, not to whether
     it is on top of them. Each one gets a --near from 0 to 1 based on distance
     and the CSS interpolates everything else off that, so approaching the map
     wakes the nearby categories before you ever reach one.

     The value is eased in JS rather than by a CSS transition: --near is
     rewritten every frame, and a transition on top of that would always be
     chasing a value that had already moved. Lerping here also means the decay
     when the pointer leaves is free. */
  var scene = document.querySelector('[data-proximity]');
  if (scene && !reduced.matches && window.matchMedia('(hover: hover)').matches) {
    var marks = Array.prototype.slice.call(scene.querySelectorAll('.pin'));
    var RADIUS = 260;      // px at which a marker starts to notice the pointer
    var pointer = null;    // null when the pointer is outside the scene
    var running = false;

    var frame = function () {
      var settled = true;

      marks.forEach(function (el) {
        var target = 0;

        if (pointer) {
          var r = el.getBoundingClientRect();
          var dx = pointer.x - (r.left + r.width / 2);
          var dy = pointer.y - (r.top + r.height / 2);
          var d = Math.sqrt(dx * dx + dy * dy);
          // Smoothstep so the falloff eases at both ends instead of ramping
          // linearly, which reads as mechanical.
          var t = Math.max(0, Math.min(1, 1 - d / RADIUS));
          target = t * t * (3 - 2 * t);
        }

        var current = parseFloat(el.style.getPropertyValue('--near')) || 0;
        var next = current + (target - current) * 0.18;
        if (Math.abs(next - target) < 0.002) next = target;
        if (next !== current) settled = false;
        el.style.setProperty('--near', next.toFixed(3));
      });

      if (settled && !pointer) { running = false; return; }
      window.requestAnimationFrame(frame);
    };

    var start = function () {
      if (running) return;
      running = true;
      window.requestAnimationFrame(frame);
    };

    scene.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      scene.classList.add('is-pointer');
      start();
    }, { passive: true });

    scene.addEventListener('pointerleave', function () {
      pointer = null;
      scene.classList.remove('is-pointer');
      start();
    }, { passive: true });
  }

  /* --- Product loop progress ----------------------------------------------
     A line that fills as you move through Discover → Join → Experience →
     Remember. The steps already highlight one at a time; this is what tells
     you how many are left. */
  var steps = document.querySelector('[data-progress]');
  if (steps) {
    var pTick = false;

    var measure = function () {
      pTick = false;
      var r = steps.getBoundingClientRect();
      var mid = window.innerHeight * 0.55;
      // 0 when the top of the list reaches the read line, 1 when the bottom does.
      var p = (mid - r.top) / Math.max(1, r.height);
      steps.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    };

    window.addEventListener('scroll', function () {
      if (pTick) return;
      pTick = true;
      window.requestAnimationFrame(measure);
    }, { passive: true });

    window.addEventListener('resize', measure, { passive: true });
    measure();
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
