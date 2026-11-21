document.addEventListener("error", function (e) {
  var img = e.target;
  if (!img || img.tagName !== "IMG") return;
  var pic = img.parentNode;
  if (!pic || pic.tagName !== "PICTURE") return;
  var sources = pic.getElementsByTagName("source");
  if (!sources.length) return;
  while (sources.length) pic.removeChild(sources[0]);
  img.src = img.getAttribute("src");
}, true);
