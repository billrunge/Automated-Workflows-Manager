"use strict";

/* ============================================================
 * Application entry point (loaded as a module, so deferred).
 * Resolves context, wires events, kicks off the first load.
 * ========================================================== */

import { $ } from "./core/utils.js";
import { state } from "./core/state.js";
import { resolveContext } from "./core/context.js";
import { renderGrid, visibleItems } from "./ui/grid.js";
import { switchTab } from "./ui/tabs.js";
import { loadList } from "./features/list.js";
import { setStatus } from "./ui/status.js";
import {
  openEditor, closeEditor, saveItem, deleteItem,
  setView, formatJson, loadTemplate
} from "./ui/editor.js";

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

  $("modalClose").onclick  = closeEditor;
  $("modalCancel").onclick = closeEditor;
  $("saveBtn").onclick     = saveItem;
  $("viewForm").onclick    = () => setView("form");
  $("viewJson").onclick    = () => setView("json");
  $("formatJson").onclick  = formatJson;
  $("loadTpl").onclick     = loadTemplate;

  $("overlay").addEventListener("click", e => {
    if (e.target === $("overlay")) closeEditor();
  });
}

function main() {
  const ready = initContext();
  wireEvents();
  if (ready) loadList();
}

main();
