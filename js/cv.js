/* About, Experience: the relevant roles show first; the button unfolds the other roles in place (and folds them back).
   Without JavaScript every role is shown and the button stays hidden. */
(function () {
  var list = document.getElementById("cv-experience");
  var btn = document.querySelector(".cv__more");
  if (!list || !btn) return;
  var extras = list.querySelectorAll(".entry--extra");
  function set(open) {
    list.classList.toggle("is-folded", !open);
    btn.setAttribute("aria-expanded", String(open));
    extras.forEach(function (li) { li.inert = !open; });
  }
  list.classList.add("no-anim");
  set(false);
  btn.hidden = false;
  requestAnimationFrame(function () { requestAnimationFrame(function () { list.classList.remove("no-anim"); }); });
  btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
})();
