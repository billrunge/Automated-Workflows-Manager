"use strict";

/* ============================================================
 * Status banner rendering.
 *
 * Messages normally show in the page-level banner (#status).
 * BUT that banner lives in the main layout, behind the editor
 * modal's overlay — so while the modal is open the user can't
 * read it without closing the modal (and losing their edits).
 *
 * To fix that, setStatus() is context-aware:
 *   - Modal open  -> route the message to the in-modal banner
 *                    (#modalStatus, in the modal footer).
 *   - Modal closed -> use the page-level banner (#status).
 *
 * Both banners share the same .status styling, so ok/err/info
 * colors are identical in either location.
 * ========================================================== */

import { $ } from "../core/utils.js";

/* Is the editor modal currently visible? */
function modalOpen() {
  const ov = $("overlay");
  return !!(ov && ov.classList.contains("show"));
}

export function setStatus(msg, type) {
  const cls = "status modalstatus show " + (type || "info");
  const pageCls = "status show " + (type || "info");

  // Prefer the in-modal banner whenever the modal is open.
  if (modalOpen()) {
    const mel = document.getElementById("modalStatus");
    if (mel) {
      mel.textContent = msg;
      mel.className = cls;
      // Keep the page banner clean so nothing stale shows behind the modal.
      const page = $("status");
      if (page) page.className = "status";
      return;
    }
  }

  // Default: page-level banner.
  const el = $("status");
  el.textContent = msg;
  el.className = pageCls;
}

export function clearStatus() {
  const page = $("status");
  if (page) page.className = "status";

  const mel = document.getElementById("modalStatus");
  if (mel) {
    mel.textContent = "";
    mel.className = "status modalstatus";
  }
}
