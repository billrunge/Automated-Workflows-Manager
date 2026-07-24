"use strict";

/* ============================================================
 * Status banner rendering.
 * ========================================================== */

import { $ } from "../core/utils.js";

/** Show a message in the status banner. type: "ok" | "err" | "info". */
export function setStatus(msg, type) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status show " + (type || "info");
}

/** Hide the status banner. */
export function clearStatus() {
  $("status").className = "status";
}
