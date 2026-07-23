"use strict";

/* ---------- Status banner ---------- */
function setStatus(msg, type){
  const el = $("status");
  el.textContent = msg;
  el.className = "status show " + (type || "info");
}
function clearStatus(){ $("status").className = "status"; }

/* ---------- HTML escape ---------- */
function esc(s){
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
