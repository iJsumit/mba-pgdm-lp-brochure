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

  // ---- Recruiter logos: responsive two-row paginated carousel ----
  var logoTrack = document.getElementById('bLogos');
  var recruiterTabs = document.querySelector('[data-filter="rec"]');
  if (logoTrack) {
    var allRecruiterLogos = Array.prototype.slice.call(logoTrack.querySelectorAll('.b-logo'));
    var recruiterCarousel = logoTrack.closest('.b-carousel');
    var recruiterPrev = recruiterCarousel && recruiterCarousel.querySelector('.b-car-prev');
    var recruiterNext = recruiterCarousel && recruiterCarousel.querySelector('.b-car-next');
    var recruiterCategory = 'all';
    var recruiterPages = [];
    var recruiterPageIndex = 0;
    var recruiterTimer = null;
    var recruiterPaused = false;
    var recruiterResizeTimer = null;

    function recruiterPageSize() {
      return window.matchMedia('(max-width: 640px)').matches ? 4 : 14;
    }
    function syncRecruiterArrows() {
      var hasMultiple = recruiterPages.length > 1;
      if (recruiterPrev) recruiterPrev.disabled = !hasMultiple || recruiterPageIndex <= 0;
      if (recruiterNext) recruiterNext.disabled = !hasMultiple || recruiterPageIndex >= recruiterPages.length - 1;
    }
    function goToRecruiterPage(index, smooth) {
      if (!recruiterPages.length) return;
      recruiterPageIndex = Math.max(0, Math.min(index, recruiterPages.length - 1));
      var targetPage = recruiterPages[recruiterPageIndex];
      if (targetPage) {
        var left = targetPage.getBoundingClientRect().left - logoTrack.getBoundingClientRect().left + logoTrack.scrollLeft;
        logoTrack.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
      }
      syncRecruiterArrows();
    }
    function stopRecruiterAutoplay() {
      if (recruiterTimer) window.clearInterval(recruiterTimer);
      recruiterTimer = null;
    }
    function startRecruiterAutoplay() {
      stopRecruiterAutoplay();
      if (recruiterPages.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      recruiterTimer = window.setInterval(function () {
        if (recruiterPaused || document.hidden) return;
        var nextIndex = recruiterPageIndex >= recruiterPages.length - 1 ? 0 : recruiterPageIndex + 1;
        goToRecruiterPage(nextIndex, true);
      }, 3800);
    }
    function buildRecruiterPages() {
      var visibleLogos = allRecruiterLogos.filter(function (logo) {
        return recruiterCategory === 'all' || logo.getAttribute('data-cat') === recruiterCategory;
      });
      var perPage = recruiterPageSize();
      recruiterPages.forEach(function (page) { page.remove(); });
      recruiterPages = [];
      for (var offset = 0; offset < visibleLogos.length; offset += perPage) {
        var page = document.createElement('div');
        page.className = 'b-logo-page';
        visibleLogos.slice(offset, offset + perPage).forEach(function (logo) {
          logo.hidden = false;
          page.appendChild(logo);
        });
        logoTrack.appendChild(page);
        recruiterPages.push(page);
      }
      recruiterPageIndex = 0;
      logoTrack.scrollLeft = 0;
      syncRecruiterArrows();
      startRecruiterAutoplay();
    }
    if (recruiterPrev) recruiterPrev.addEventListener('click', function () {
      goToRecruiterPage(recruiterPageIndex - 1, true);
      startRecruiterAutoplay();
    });
    if (recruiterNext) recruiterNext.addEventListener('click', function () {
      goToRecruiterPage(recruiterPageIndex + 1, true);
      startRecruiterAutoplay();
    });
    logoTrack.addEventListener('scroll', function () {
      window.requestAnimationFrame(function () {
        if (!logoTrack.clientWidth || !recruiterPages.length) return;
        recruiterPageIndex = Math.max(0, Math.min(
          Math.round(logoTrack.scrollLeft / logoTrack.clientWidth),
          recruiterPages.length - 1
        ));
        syncRecruiterArrows();
      });
    }, { passive: true });
    if (recruiterCarousel) {
      recruiterCarousel.addEventListener('mouseenter', function () { recruiterPaused = true; });
      recruiterCarousel.addEventListener('mouseleave', function () { recruiterPaused = false; });
      recruiterCarousel.addEventListener('focusin', function () { recruiterPaused = true; });
      recruiterCarousel.addEventListener('focusout', function () { recruiterPaused = false; });
      recruiterCarousel.addEventListener('touchstart', function () { recruiterPaused = true; }, { passive: true });
      recruiterCarousel.addEventListener('touchend', function () { recruiterPaused = false; }, { passive: true });
    }
    window.addEventListener('resize', function () {
      window.clearTimeout(recruiterResizeTimer);
      recruiterResizeTimer = window.setTimeout(buildRecruiterPages, 180);
    });
    document.querySelectorAll('[data-filter="rec"] [data-cat]').forEach(function (btn, index, all) {
      btn.addEventListener('click', function () {
        all.forEach(function (item) {
          var active = item === btn;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        recruiterCategory = btn.getAttribute('data-cat');
        buildRecruiterPages();
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
    buildRecruiterPages();
  }

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
    // Recruiter logos use their own continuous marquee instead of page-step autoplay.
    if (car.classList.contains('b-carousel--logos')) return;
    var track = car.querySelector('.b-car-track');
    var prev = car.querySelector('.b-car-prev');
    var next = car.querySelector('.b-car-next');
    function step() {
      return Math.max(track.clientWidth * 0.9, 200);
    }
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


  // ---- Alumni cards: continuous animated carousel based on supplied reference video ----
  document.querySelectorAll('[data-alum-carousel]').forEach(function (root) {
    var viewport = root.querySelector('.b-alum-viewport');
    var track = root.querySelector('.b-alum-track');
    var pagination = root.querySelector('.b-alum-pagination');
    if (!viewport || !track || !pagination) return;

    var cards = Array.from(track.querySelectorAll('.b-alum-card')).map(function (card) {
      return card.cloneNode(true);
    });
    if (!cards.length) return;

    var index = 0, timer = null, startX = 0, deltaX = 0, visible = 4, step = 0;
    var INTERVAL = 3600;

    function visibleCount() {
      if (window.matchMedia('(max-width: 600px)').matches) return 1;
      if (window.matchMedia('(max-width: 900px)').matches) return 2;
      return 4;
    }
    function measure() {
      visible = visibleCount();
      var first = track.querySelector('.b-alum-card');
      if (!first) return;
      var gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap) || 18;
      step = first.getBoundingClientRect().width + gap;
    }
    function move(animate) {
      measure();
      track.style.transition = animate === false ? 'none' : 'transform .65s cubic-bezier(.22,.61,.36,1)';
      track.style.transform = 'translate3d(' + (-index * step) + 'px,0,0)';
    }
    function next() {
      index = index >= cards.length - 1 ? 0 : index + 1;
      move(true);
    }
    function previous() {
      index = index <= 0 ? cards.length - 1 : index - 1;
      move(true);
    }
    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }
    function start() {
      stop();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = window.setInterval(function () {
        if (!document.hidden) next();
      }, INTERVAL);
    }
    function restart() { stop(); start(); }

    track.innerHTML = '';
    cards.forEach(function (card) { track.appendChild(card.cloneNode(true)); });
    cards.slice(0, visibleCount()).forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    pagination.innerHTML = '';
    move(false);
    start();

    var controls = document.createElement('div');
    controls.className = 'b-alum-arrows';
    controls.innerHTML = '<button class="b-alum-arrow" type="button" aria-label="Previous alumni">←</button><button class="b-alum-arrow" type="button" aria-label="Next alumni">→</button>';
    pagination.appendChild(controls);
    var arrowButtons = controls.querySelectorAll('button');
    arrowButtons[0].addEventListener('click', function () { previous(); restart(); });
    arrowButtons[1].addEventListener('click', function () { next(); restart(); });

    viewport.addEventListener('touchstart', function (event) {
      stop();
      startX = event.touches[0].clientX;
      deltaX = 0;
    }, { passive: true });
    viewport.addEventListener('touchmove', function (event) {
      deltaX = event.touches[0].clientX - startX;
    }, { passive: true });
    viewport.addEventListener('touchend', function () {
      if (Math.abs(deltaX) > 40) {
        index = (index + (deltaX < 0 ? 1 : -1) + cards.length) % cards.length;
        move(true);
      }
      restart();
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    window.addEventListener('resize', function () {
      var nextVisible = visibleCount();
      if (nextVisible !== visible) {
        stop();
        measure();
        track.innerHTML = '';
        cards.forEach(function (card) { track.appendChild(card.cloneNode(true)); });
        cards.slice(0, nextVisible).forEach(function (card) {
          var clone = card.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        });
        index = 0;
        pagination.appendChild(controls);
        move(false);
        start();
      } else {
        move(false);
      }
    });
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
