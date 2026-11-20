(function () {
  var stuck = document.querySelector('body > header.nav:not(.nav--float)');
  if (stuck) {
    var onScroll = function () { stuck.classList.toggle('is-stuck', window.scrollY > 0); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var bar = document.getElementById('topbar');
  var hero = document.querySelector('.hero');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var shown = !entries[0].isIntersecting;
      bar.classList.toggle('is-shown', shown);
      bar.inert = !shown;
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
    bar.inert = true;
  }
})();
