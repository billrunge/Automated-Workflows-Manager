"use strict";

/* Status banner rendering.
 *
 * Success is silent — we clear the banner rather than show a
 * green toast. Only errors (red) and brief info (blue) render. */

import { $ } from "../core/utils.js";

export function setStatus(msg, type) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status show " + (type || "info");
}

export function clearStatus() {
  const el = $("status");
  el.textContent = "";
  el.className = "status";
}
