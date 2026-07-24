"use strict";

/* Status banner rendering. */

import { $ } from "../core/utils.js";

export function setStatus(msg, type) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status show " + (type || "info");
}

export function clearStatus() {
  $("status").className = "status";
}
