/* Jaipuria · Option 3 (brochure web version) – UI behaviour only.
   Nothing here touches the LeadSquared form or its submission. */
(function () {
  'use strict';

  // ---- mobile menu ----
  var header = document.querySelector('.b-header');
  var menuBtn = document.getElementById('bMenuBtn');
  function closeMenu() { header.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  if (header && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.addEventListener('click', function (e) { if (e.target.closest('.b-drawer a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // ---- generic tabs: [data-tabs] buttons [data-tab] ↔ panels [data-panel] ----
  document.querySelectorAll('[data-tabs]').forEach(function (bar) {
    var btns = bar.querySelectorAll('[data-tab]');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
          var p = document.querySelector('[data-panel="' + b.getAttribute('data-tab') + '"]');
          if (p) p.hidden = !on;
        });
      });
    });
  });

  // ---- recruiter category filter + keep the next tabs discoverable ----
  var logoTrack = document.getElementById('bLogos');
  var recruiterTabs = document.querySelector('[data-filter="rec"]');
  document.querySelectorAll('[data-filter="rec"] [data-cat]').forEach(function (btn, index, all) {
    btn.addEventListener('click', function () {
      all.forEach(function (b) { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
      var c = btn.getAttribute('data-cat');
      logoTrack.querySelectorAll('.b-logo').forEach(function (l) { l.hidden = !(c === 'all' || l.getAttribute('data-cat') === c); });
      logoTrack.scrollLeft = 0;
      window.dispatchEvent(new Event('resize'));

      // If the selected tab is the last one currently visible, slide the row
      // just enough to bring the next category into view.
      var nextTab = all[index + 1];
      if (nextTab && recruiterTabs) {
        var rowRect = recruiterTabs.getBoundingClientRect();
        var nextRect = nextTab.getBoundingClientRect();
        if (nextRect.right > rowRect.right - 8) {
          recruiterTabs.scrollTo({
            left: recruiterTabs.scrollLeft + (nextRect.right - rowRect.right) + 20,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
          });
        }
      }
    });
  });

  // ---- "Know more" toggles ----
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('data-toggle'));
    if (!panel) return;
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', panel.id);
    btn.addEventListener('click', function () {
      var open = panel.hidden; panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Read less' : 'Know more';
    });
  });

  // ---- FAQ "Know more" ----
  var faqBtn = document.querySelector('[data-faq-more]');
  var faqs = document.getElementById('bFaqs');
  if (faqBtn && faqs) faqBtn.addEventListener('click', function () {
    var all = faqs.classList.toggle('is-all');
    faqBtn.textContent = all ? 'Read less' : 'Know more';
  });

  // ---- FAQ accordion: keep only one answer expanded at a time ----
  if (faqs) {
    faqs.querySelectorAll('.b-faq').forEach(function (faq) {
      faq.addEventListener('toggle', function () {
        if (!faq.open) return;
        faqs.querySelectorAll('.b-faq[open]').forEach(function (otherFaq) {
          if (otherFaq !== faq) otherFaq.open = false;
        });
      });
    });
  }

  // ---- carousels (native scroll-snap + arrows + optional autoplay) ----
  document.querySelectorAll('[data-carousel]').forEach(function (car) {
    var track = car.querySelector('.b-car-track');
    var prev = car.querySelector('.b-car-prev');
    var next = car.querySelector('.b-car-next');
    function step() { return Math.max(track.clientWidth * 0.9, 200); }
    function sync() {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
    var delay = parseInt(car.getAttribute('data-autoplay'), 10);
    if (delay && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var paused = false;
      ['mouseenter', 'touchstart', 'focusin'].forEach(function (ev) { car.addEventListener(ev, function () { paused = true; }, { passive: true }); });
      ['mouseleave', 'touchend', 'focusout'].forEach(function (ev) { car.addEventListener(ev, function () { paused = false; }, { passive: true }); });
      setInterval(function () {
        if (paused || document.hidden) return;
        var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
        track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step(), behavior: 'smooth' });
      }, delay);
    }
  });


  // ---- Alumni single-row continuous carousel ----
  document.querySelectorAll('[data-alum-carousel]').forEach(function (root) {
    var viewport = root.querySelector('.b-alum-viewport');
    var track = root.querySelector('.b-alum-track');
    var pagination = root.querySelector('.b-alum-pagination');
    if (!viewport || !track || !pagination) return;
    var originals = Array.from(track.children);
    if (originals.length < 2) return;
    var originalCount = originals.length;
    originals.forEach(function (card) { track.appendChild(card.cloneNode(true)); });
    var index = 0, timer = null, paused = false, dots = [];
    function gap() { return parseFloat(getComputedStyle(track).gap) || 0; }
    function step() { return originals[0].getBoundingClientRect().width + gap(); }
    function visible() { return Math.max(1, Math.floor((viewport.clientWidth + gap()) / step())); }
    function buildDots() {
      pagination.innerHTML = ''; dots = [];
      var pages = Math.ceil(originalCount / visible());
      for (var d = 0; d < pages; d++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show alumni group ' + (d + 1));
        (function (pageIndex, button) {
          button.addEventListener('click', function () {
            index = Math.min(pageIndex * visible(), originalCount - 1);
            update(true); start();
          });
        })(d, dot);
        pagination.appendChild(dot); dots.push(dot);
      }
    }
    function update(animate) {
      track.style.transition = animate === false ? 'none' : '';
      track.style.transform = 'translate3d(' + (-index * step()) + 'px,0,0)';
      var page = Math.floor(index / visible()) % dots.length;
      dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === page); });
      if (animate === false) { track.offsetHeight; track.style.transition = ''; }
    }
    function stop() { if (timer) window.clearInterval(timer); timer = null; }
    function start() {
      stop();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = window.setInterval(function () {
        if (paused || document.hidden) return;
        index++;
        if (index >= originalCount) {
          index = originalCount;
          update(true);
          window.setTimeout(function () { index = 0; update(false); }, 760);
        } else update(true);
      }, 2300);
    }
    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });
    root.addEventListener('focusin', function () { paused = true; });
    root.addEventListener('focusout', function () { paused = false; });
    window.addEventListener('resize', function () {
      index = 0; buildDots(); update(false); start();
    });
    buildDots(); update(false); start();
  });

  // ---- Global Exposure partner logo carousel ----
  var globalRoot = document.getElementById('global');
  if (globalRoot) {
    var globalViewport = globalRoot.querySelector('.b-global-viewport');
    var globalTrack = globalRoot.querySelector('.b-global-track');
    var globalPrev = globalRoot.querySelector('.b-global-prev');
    var globalNext = globalRoot.querySelector('.b-global-next');
    var globalCards = globalTrack ? Array.from(globalTrack.querySelectorAll('.b-global-card')) : [];
    var globalIndex = 0, globalTimer = null, globalPaused = false;
    var globalDelay = 3600;
    function globalStep() {
      if (!globalCards.length) return 0;
      return globalCards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(globalTrack).gap) || 0);
    }
    function globalMax() {
      return Math.max(0, Math.round((globalTrack.scrollWidth - globalViewport.clientWidth) / globalStep()));
    }
    function globalUpdate(animate) {
      if (!globalTrack || !globalCards.length) return;
      globalTrack.style.transition = animate === false ? 'none' : '';
      globalTrack.style.transform = 'translateX(' + (-globalIndex * globalStep()) + 'px)';
      if (animate === false) {
        globalTrack.offsetHeight;
        globalTrack.style.transition = '';
      }
    }
    function globalStop() { if (globalTimer) window.clearInterval(globalTimer); globalTimer = null; }
    function globalStart() {
      globalStop();
      if (globalMax() < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      globalTimer = window.setInterval(function () {
        if (globalPaused || document.hidden) return;
        globalIndex = globalIndex >= globalMax() ? 0 : globalIndex + 1;
        globalUpdate(true);
      }, globalDelay);
    }
    function globalMove(direction) {
      globalIndex = direction > 0 ? (globalIndex >= globalMax() ? 0 : globalIndex + 1) : (globalIndex <= 0 ? globalMax() : globalIndex - 1);
      globalUpdate(true);
      globalStart();
    }
    if (globalViewport && globalTrack && globalCards.length) {
      if (globalPrev) globalPrev.addEventListener('click', function () { globalMove(-1); });
      if (globalNext) globalNext.addEventListener('click', function () { globalMove(1); });
      globalRoot.addEventListener('mouseenter', function () { globalPaused = true; });
      globalRoot.addEventListener('mouseleave', function () { globalPaused = false; });
      globalRoot.addEventListener('focusin', function () { globalPaused = true; });
      globalRoot.addEventListener('focusout', function () { globalPaused = false; });
      globalViewport.addEventListener('touchstart', function () { globalPaused = true; }, { passive: true });
      globalViewport.addEventListener('touchend', function () { globalPaused = false; }, { passive: true });
      window.addEventListener('resize', function () {
        globalIndex = Math.min(globalIndex, globalMax());
        globalUpdate(false);
        globalStart();
      });
      globalUpdate(false);
      globalStart();
    }
  }

  // ---- sticky Download Brochure: reveal only after the complete hero leaves view ----
  var stickyCta = document.querySelector('.b-sticky');
  var hero = document.querySelector('.b-hero');
  if (stickyCta && hero && 'IntersectionObserver' in window) {
    var heroVisible = true;
    var updateSticky = function () {
      stickyCta.classList.toggle('is-visible', !heroVisible);
    };
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      updateSticky();
    }, { threshold: 0 }).observe(hero);
    updateSticky();
  }

  // ---- floating "Apply Now": visible after scrolling, hidden while the form is on screen ----
  var floatBtn = document.getElementById('bFloat');
  var form = document.getElementById('apply-now');
  if (floatBtn && form && 'IntersectionObserver' in window) {
    var formInView = true;
    var update = function () { floatBtn.classList.toggle('is-visible', window.scrollY > 300 && !formInView); };
    new IntersectionObserver(function (en) { formInView = en[0].isIntersecting; update(); }, { threshold: 0.15 }).observe(form);
    window.addEventListener('scroll', update, { passive: true });
  }
})();
