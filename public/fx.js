/* Minimal, progressive-enhancement motion for the static article pages: a quiet
 * fade-up as sections scroll into view. Content is fully visible without JS and
 * under prefers-reduced-motion, we only ever hide elements that are below the
 * fold, and only once this script runs, so the LCP content is never affected. */
(function () {
  'use strict';
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var main = document.querySelector('.seo-main');
    if (!main) return;

    var targets = Array.prototype.filter.call(main.children, function (el) {
      var tag = el.tagName;
      // Skip the breadcrumb and the H1 (above the fold; never delay the headline).
      return tag !== 'NAV' && tag !== 'H1' && !el.classList.contains('breadcrumb');
    });

    var vh = window.innerHeight || document.documentElement.clientHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) {
      // Leave anything already in (or near) view untouched, no flash, no delay.
      if (el.getBoundingClientRect().top < vh * 0.9) return;
      el.classList.add('seo-reveal');
      io.observe(el);
    });
  } catch (e) { /* never let decoration break the page */ }
})();

/* Correction form. Posts to /api/propose and reports the outcome in place.
 * Without JS the form does nothing and the noscript link to GitHub stands. */
(function () {
  'use strict';
  try {
    var forms = document.querySelectorAll('form[data-propose]');
    if (!forms.length) return;

    Array.prototype.forEach.call(forms, function (form) {
      var status = form.querySelector('[data-propose-status]');
      var button = form.querySelector('button[type="submit"]');

      function say(msg, kind) {
        if (!status) return;
        status.textContent = msg;
        status.className = 'propose-status' + (kind ? ' is-' + kind : '');
      }

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var data = {};
        Array.prototype.forEach.call(form.elements, function (el) {
          if (el.name) data[el.name] = el.value;
        });

        if (!String(data.correction || '').trim()) {
          say('Tell us what it should say instead.', 'error');
          return;
        }

        button.disabled = true;
        say('Sending...');

        fetch('/api/propose', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          return res.json().then(function (body) { return { ok: res.ok, body: body }; });
        }).then(function (r) {
          if (!r.ok) {
            button.disabled = false;
            say(r.body && r.body.error ? r.body.error : 'Could not send that. Please try again.', 'error');
            return;
          }
          form.reset();
          button.disabled = false;
          say('Thank you. It is filed for review.', 'ok');
        }).catch(function () {
          button.disabled = false;
          say('Could not reach the server. Please try again.', 'error');
        });
      });
    });
  } catch (e) { /* a broken form must never break the page */ }
})();
