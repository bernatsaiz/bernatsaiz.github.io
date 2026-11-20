/* Click to play: a .b-video__link with data-youtube="<video id>" swaps its poster for the YouTube player
   (youtube-nocookie.com, loaded only on click). Without the attribute the link just opens its href. */
document.querySelectorAll(".b-video__link[data-youtube]").forEach(function (link) {
  var id = link.getAttribute("data-youtube");
  if (!/^[\w-]{11}$/.test(id)) return;
  link.addEventListener("click", function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    frame.title = link.getAttribute("aria-label") || "Video";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.className = "b-video__frame";
    link.replaceWith(frame);
    frame.focus();
  });
});
