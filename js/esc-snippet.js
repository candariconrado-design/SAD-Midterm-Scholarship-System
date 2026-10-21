function esc(value) {
  var s = String(value == null ? "" : value);
  s = s.replace(/&/g, String.fromCharCode(38) + "amp;");
  s = s.replace(/</g, String.fromCharCode(38) + "lt;");
  s = s.replace(/>/g, String.fromCharCode(38) + "gt;");
  s = s.replace(/"/g, String.fromCharCode(38) + "quot;");
  s = s.replace(/'/g, "&#39;");
  return s;
}
