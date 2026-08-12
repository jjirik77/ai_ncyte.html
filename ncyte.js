/* ============================================================================
   NCyTE / EPNC — AI Fundamentals for Educators
   Unified behaviour layer  ·  v1.0  ·  2026-08-07
   ----------------------------------------------------------------------------
   Replaces per-page script blocks across 38 files. Everything here is
   DECLARATIVE: markup opts in via data-* attributes, no inline onclick.

   Widgets:
     data-theme-toggle        theme switch (one storage key, cross-tab sync)
     data-card / data-panel   lesson card -> detail panel accordion
     data-flip                flip card
     data-check               knowledge check
     data-copy="#sel"         copy to clipboard + toast
     data-lightbox            image lightbox
     data-reveal              scroll reveal
     data-count-to="1234"     count-up stat
     data-progress            checklist progress bar
     .scroll-progress         reading progress
     .back-to-top             back to top

   Loads with `defer`. Safe to include on a page that uses none of it.
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     THEME
     One key for the whole corpus. Previously three (`ai-theme`, `theme`,
     `sands-ai-theme`), so a choice made on one page was lost on the next.
     Migrates the old keys on first run. Storage is guarded — unguarded
     localStorage throws in Safari private mode and in sandboxed iframes,
     which is exactly how the module pages embed these resources.
     ====================================================================== */

  var THEME_KEY  = 'ncyte-theme';
  var LEGACY_KEYS = ['ai-theme', 'theme', 'sands-ai-theme'];

  function storage(action, key, value) {
    try {
      if (action === 'get') return window.localStorage.getItem(key);
      if (action === 'set') return window.localStorage.setItem(key, value);
      if (action === 'del') return window.localStorage.removeItem(key);
    } catch (e) { return null; }
  }

  function storedTheme() {
    var v = storage('get', THEME_KEY);
    if (v) return v;
    for (var i = 0; i < LEGACY_KEYS.length; i++) {
      var legacy = storage('get', LEGACY_KEYS[i]);
      if (legacy === 'dark' || legacy === 'light') {
        storage('set', THEME_KEY, legacy);
        return legacy;
      }
    }
    return null;
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) storage('set', THEME_KEY, theme);

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      var dark = theme === 'dark';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      var icon  = btn.querySelector('[data-theme-icon]');
      var label = btn.querySelector('[data-theme-label]');
      if (icon)  icon.textContent  = dark ? '☀️' : '🌙';
      if (label) label.textContent = dark ? 'Light' : 'Dark';
    });

    // Keep any embedded resource iframes in step with the module shell.
    document.querySelectorAll('iframe').forEach(function (frame) {
      try { frame.contentWindow.postMessage({ ncyteTheme: theme }, '*'); } catch (e) {}
    });
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function initTheme() {
    var saved = storedTheme();
    applyTheme(saved || (systemPrefersDark() ? 'dark' : 'light'), false);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });

    // Another tab changed the theme.
    window.addEventListener('storage', function (e) {
      if (e.key === THEME_KEY && e.newValue) applyTheme(e.newValue, false);
    });

    // Parent module shell told us its theme (we are in its iframe).
    window.addEventListener('message', function (e) {
      if (e.data && (e.data.ncyteTheme === 'dark' || e.data.ncyteTheme === 'light')) {
        applyTheme(e.data.ncyteTheme, false);
      }
    });

    // Follow the OS only while the user has expressed no preference.
    if (!saved && window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) {
        if (!storage('get', THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light', false);
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ==========================================================================
     LESSON CARD -> DETAIL PANEL
     Was three incompatible implementations (.lesson-card/.detail-panel,
     .lcard/.dpanel, .topic-card/.panel). One accordion now.
     Markup:
       <button class="lesson-card" data-card="tokens" aria-expanded="false"
               aria-controls="panel-tokens"> ... </button>
       <div class="detail-panel" id="panel-tokens" data-panel="tokens"> ... </div>
     ====================================================================== */

  function closeAllPanels(except) {
    document.querySelectorAll('[data-panel].is-open').forEach(function (panel) {
      if (panel === except) return;
      panel.classList.remove('is-open');
      var owner = document.querySelector('[data-card="' + panel.dataset.panel + '"]');
      if (owner) owner.setAttribute('aria-expanded', 'false');
    });
  }

  function initCards() {
    document.addEventListener('click', function (e) {
      var card = e.target.closest('[data-card]');
      if (card) {
        var panel = document.querySelector('[data-panel="' + card.dataset.card + '"]');
        if (!panel) return;
        var isOpen = panel.classList.contains('is-open');
        closeAllPanels(panel);
        panel.classList.toggle('is-open', !isOpen);
        card.setAttribute('aria-expanded', String(!isOpen));
        if (!isOpen) {
          requestAnimationFrame(function () {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Move focus into the panel so keyboard and SR users land there.
            var target = panel.querySelector('.detail-title') || panel;
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          });
        }
        return;
      }

      var close = e.target.closest('[data-panel-close]');
      if (close) {
        var owning = close.closest('[data-panel]');
        if (!owning) return;
        owning.classList.remove('is-open');
        var opener = document.querySelector('[data-card="' + owning.dataset.panel + '"]');
        if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = document.querySelector('[data-panel].is-open');
      if (!open) return;
      open.classList.remove('is-open');
      var opener = document.querySelector('[data-card="' + open.dataset.panel + '"]');
      if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
    });
  }

  /* ==========================================================================
     FLIP CARD
     Click and Enter/Space only. The previous workshop-page implementation
     also flipped on :hover, which is unusable on touch and fails WCAG 1.4.13.
     ====================================================================== */

  function toggleFlip(card) {
    var flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
  }

  function initFlips() {
    document.querySelectorAll('[data-flip]').forEach(function (card) {
      if (card.tagName !== 'BUTTON') {
        card.setAttribute('role', 'button');
        if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      }
      if (!card.hasAttribute('aria-pressed')) card.setAttribute('aria-pressed', 'false');
    });

    document.addEventListener('click', function (e) {
      var card = e.target.closest('[data-flip]');
      if (card) toggleFlip(card);
    });

    document.addEventListener('keydown', function (e) {
      var card = e.target.closest && e.target.closest('[data-flip]');
      if (card && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) {
        e.preventDefault();
        toggleFlip(card);
        return;
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('[data-flip].is-flipped').forEach(function (c) {
          c.classList.remove('is-flipped');
          c.setAttribute('aria-pressed', 'false');
        });
      }
    });
  }

  /* ==========================================================================
     KNOWLEDGE CHECK
     Declarative. Feedback prose lives in the DOM, not in an onclick string.
     Markup:
       <div class="check" data-check>
         <p class="check__question">…</p>
         <div class="check__options">
           <button class="check-option" data-correct>A) …</button>
           <button class="check-option">B) …</button>
         </div>
         <div class="check__feedback" data-feedback-ok  hidden>Right because…</div>
         <div class="check__feedback" data-feedback-no  hidden>Not quite — …</div>
       </div>
     ====================================================================== */

  function initChecks() {
    document.querySelectorAll('[data-check]').forEach(function (block) {
      var live = document.createElement('div');
      live.className = 'sr-only';
      live.setAttribute('aria-live', 'polite');
      block.appendChild(live);

      block.addEventListener('click', function (e) {
        var opt = e.target.closest('.check-option');
        if (!opt || block.dataset.answered === 'true') return;

        block.dataset.answered = 'true';
        var correct = opt.hasAttribute('data-correct');

        block.querySelectorAll('.check-option').forEach(function (b) {
          b.disabled = true;
          if (b.hasAttribute('data-correct')) b.classList.add('is-correct');
        });
        if (!correct) opt.classList.add('is-wrong');

        var fb = block.querySelector(correct ? '[data-feedback-ok]' : '[data-feedback-no]');
        if (fb) {
          fb.hidden = false;
          fb.classList.add('is-shown', correct ? 'is-ok' : 'is-no');
          live.textContent = (correct ? 'Correct. ' : 'Incorrect. ') + fb.textContent;
        } else {
          live.textContent = correct ? 'Correct.' : 'Incorrect.';
        }
      });
    });
  }

  /* ==========================================================================
     COPY TO CLIPBOARD  —  <button data-copy="#promptText">Copy</button>
     ====================================================================== */

  var toastEl = null;
  var toastTimer = null;

  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-shown'); }, 2200);
  }

  function initCopy() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]');
      if (!btn) return;

      var src = document.querySelector(btn.dataset.copy);
      if (!src) return;
      var text = ('value' in src) ? src.value : src.textContent;

      var done    = function () { toast('Copied to clipboard'); };
      var failed  = function () { toast('Copy failed — select the text and press Ctrl/Cmd+C'); };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(failed);
      } else {
        // http:// and older browsers have no async clipboard.
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy') ? done() : failed(); } catch (err) { failed(); }
        document.body.removeChild(ta);
      }
    });
  }

  /* ==========================================================================
     LIGHTBOX  —  <button data-lightbox data-src="…" data-title="…">
     ====================================================================== */

  function initLightbox() {
    var triggers = document.querySelectorAll('[data-lightbox]');
    if (!triggers.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close image viewer">✕</button>' +
      '<div><img alt=""><p class="lightbox__title"></p></div>';
    document.body.appendChild(box);

    var img    = box.querySelector('img');
    var title  = box.querySelector('.lightbox__title');
    var closeB = box.querySelector('.lightbox__close');
    var lastFocus = null;

    function open(trigger) {
      lastFocus = trigger;
      img.src = trigger.dataset.src;
      img.alt = trigger.dataset.title || '';
      title.textContent = trigger.dataset.title || '';
      box.classList.add('is-open');
      closeB.focus();
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-lightbox]');
      if (t) { open(t); return; }
      if (e.target === box || e.target.closest('.lightbox__close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
      // Trap focus on the only focusable control in the dialog.
      if (e.key === 'Tab' && box.classList.contains('is-open')) { e.preventDefault(); closeB.focus(); }
    });
  }

  /* ==========================================================================
     SCROLL REVEAL + COUNT-UP
     ====================================================================== */

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal], .reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  function initCountUp() {
    var nodes = document.querySelectorAll('[data-count-to]');
    if (!nodes.length) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.textContent = n.dataset.countTo; });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el     = entry.target;
        var raw    = el.dataset.countTo;
        var target = parseFloat(raw.replace(/[^0-9.]/g, ''));
        var suffix = raw.replace(/[0-9.,]/g, '');
        var start  = null;

        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = raw;
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ==========================================================================
     CHECKLIST PROGRESS  —  <div data-progress="capabilities">
     ====================================================================== */

  function initProgress() {
    document.querySelectorAll('[data-progress]').forEach(function (group) {
      var boxes = group.querySelectorAll('input[type="checkbox"]');
      var fill  = group.querySelector('.progress-bar__fill');
      var count = group.querySelector('[data-progress-count]');
      if (!boxes.length) return;

      function update() {
        var done = 0;
        boxes.forEach(function (b) { if (b.checked) done++; });
        var pct = Math.round((done / boxes.length) * 100);
        if (fill) {
          fill.style.width = pct + '%';
          var bar = fill.parentElement;
          bar.setAttribute('role', 'progressbar');
          bar.setAttribute('aria-valuenow', String(pct));
          bar.setAttribute('aria-valuemin', '0');
          bar.setAttribute('aria-valuemax', '100');
          bar.setAttribute('aria-label', done + ' of ' + boxes.length + ' complete');
        }
        if (count) count.textContent = done + ' of ' + boxes.length;
      }
      boxes.forEach(function (b) { b.addEventListener('change', update); });
      update();
    });
  }

  /* ==========================================================================
     SCROLL PROGRESS + BACK TO TOP
     ====================================================================== */

  function initScrollChrome() {
    var bar = document.querySelector('.scroll-progress');
    var btt = document.querySelector('.back-to-top');
    if (!bar && !btt) return;

    if (bar) {
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', 'Reading progress');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
    }
    if (btt) {
      btt.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
        if (bar) { bar.style.width = pct + '%'; bar.setAttribute('aria-valuenow', String(Math.round(pct))); }
        if (btt) btt.classList.toggle('is-visible', doc.scrollTop > 500);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================================================
     SIDEBAR (module shell)
     ====================================================================== */

  function initSidebar() {
    var toggle  = document.querySelector('[data-sidebar-toggle]');
    var sidebar = document.querySelector('.module-sidebar');
    if (!toggle || !sidebar) return;

    function setOpen(open) {
      sidebar.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        var first = sidebar.querySelector('a, button');
        if (first) first.focus();
      }
    }
    toggle.addEventListener('click', function () {
      setOpen(!sidebar.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!sidebar.classList.contains('is-open')) return;
      if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
      if (window.matchMedia('(max-width: 1024px)').matches) setOpen(false);
    });
  }

  /* ==========================================================================
     BOOT
     ====================================================================== */

  function boot() {
    initTheme();
    initCards();
    initFlips();
    initChecks();
    initCopy();
    initLightbox();
    initReveal();
    initCountUp();
    initProgress();
    initScrollChrome();
    initSidebar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Small public surface for the bespoke pages (animation, aiconcepts,
  // gh_setup, ai_tokens) that keep their own app logic.
  window.NCyTE = {
    toast: toast,
    applyTheme: function (t) { applyTheme(t, true); },
    currentTheme: currentTheme,
    closeAllPanels: closeAllPanels
  };
})();
