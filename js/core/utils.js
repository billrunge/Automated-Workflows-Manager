"use strict";

/* Generic, dependency-free helpers. */

export const $ = id => document.getElementById(id);

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
