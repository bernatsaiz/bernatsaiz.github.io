(function () {
  var hintText = (window.matchMedia("(hover: none)").matches ? "Tap" : "Click") + " to copy";
  [].forEach.call(document.querySelectorAll("a[data-copy]"), function (a, i) {
    var hint = document.createElement("span"), status = document.createElement("span"), timer;
    hint.className = "copy__hint"; hint.id = "copy-hint-" + i; hint.textContent = hintText;
    status.className = "sr-only"; status.setAttribute("role", "status");
    a.setAttribute("aria-describedby", hint.id);
    a.parentNode.appendChild(hint); a.parentNode.appendChild(status);
    function done(ok) {
      hint.textContent = status.textContent = ok ? "Copied" : "Press Ctrl or Cmd + C to copy";
      clearTimeout(timer);
      timer = setTimeout(function () { hint.textContent = hintText; status.textContent = ""; }, 2000);
    }
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(a);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      if (ok) s.removeAllRanges();
      done(ok);
    }
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(a.getAttribute("data-copy")).then(function () { done(true); }, fallback);
      else fallback();
    });
  });
})();
