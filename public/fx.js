/* Minimal, progressive-enhancement motion for the static article pages: a quiet
 * fade-up as sections scroll into view. Content is fully visible without JS and
 * under prefers-reduced-motion — we only ever hide elements that are below the
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
      // Leave anything already in (or near) view untouched — no flash, no delay.
      if (el.getBoundingClientRect().top < vh * 0.9) return;
      el.classList.add('seo-reveal');
      io.observe(el);
    });
  } catch (e) { /* never let decoration break the page */ }
})();
