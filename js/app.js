"use strict";

/* ============================================================
 * Application entry point.
 *
 * Loaded as a module (deferred), so the DOM is already parsed
 * when this runs. Responsible for: resolving context, wiring
 * events, and kicking off the first load.
 * ========================================================== */

import { $ } from "./core/utils.js";
import { state } from "./core/state.js";
import { resolveContext } from "./core/context.js";
import { renderGrid } from "./ui/grid.js";
import { visibleItems } from "./ui/grid.js";
import { switchTab } from "./ui/tabs.js";
import { loadList } from "./features/list.js";
import { setStatus } from "./ui/status.js";
import {
  openEditor, closeEditor, saveItem, deleteItem,
  applyFieldsToJson, formatJson, loadTemplate
} from "./ui/editor.js";

/* ---------- Startup ---------- */
function initContext() {
  const ready = resolveContext();

  if (!ready) {
    setStatus("Could not detect a Workspace ID (AppID) from the page URL. Open this page from within a workspace.", "err");
    $("grid").innerHTML = `<tr><td colspan="5" class="empty">No workspace context.</td></tr>`;
    $("newBtn").disabled = true;
    $("refreshBtn").disabled = true;
    return false;
  }

  return true;
}

/* ---------- Event wiring ---------- */
function wireEvents() {
  $("refreshBtn").onclick = loadList;
  $("search").oninput = renderGrid;

  document.querySelectorAll(".tab").forEach(t =>
    t.onclick = () => switchTab(t.dataset.tab));

  $("newBtn").onclick = () => { if (state.workspaceId) openEditor(null); };

  $("grid").addEventListener("click", e => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const item = visibleItems()[Number(btn.dataset.i)];
    if (!item) return;
    if (btn.dataset.act === "edit") openEditor(item);
    else deleteItem(item);
  });

  // modal buttons
  $("modalClose").onclick  = closeEditor;
  $("modalCancel").onclick = closeEditor;
  $("saveBtn").onclick     = saveItem;
  $("syncFields").onclick  = applyFieldsToJson;
  $("formatJson").onclick  = formatJson;
  $("loadTpl").onclick     = loadTemplate;

  $("overlay").addEventListener("click", e => {
    if (e.target === $("overlay")) closeEditor();
  });
}

/* ---------- Boot ---------- */
function main() {
  const ready = initContext();
  wireEvents();
  if (ready) loadList();
}

main();
