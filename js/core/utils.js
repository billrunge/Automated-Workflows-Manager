"use strict";

/* ============================================================
 * Generic, dependency-free helpers.
 * ========================================================== */

/** Short getElementById helper. */
export const $ = id => document.getElementById(id);

/** Escape a value for safe insertion into HTML. */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Deep clone via JSON (safe for the plain-data payloads used here). */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
