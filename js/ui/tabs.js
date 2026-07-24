"use strict";

/* ============================================================
 * Tab switching between Triggers and Actions.
 * ========================================================== */

import { $ } from "../core/utils.js";
import { state } from "../core/state.js";
import { ENTITY } from "../config/settings.js";
import { renderGrid } from "./grid.js";
import { loadList } from "../features/list.js";

/** Switch the active tab, refresh labels, and load if needed. */
export function switchTab(tab) {
  state.currentTab = tab;

  document.querySelectorAll(".tab").forEach(t =>
    t.classList.toggle("active", t.dataset.tab === tab));

  document.querySelectorAll(".entlabel").forEach(e =>
    e.textContent = ENTITY[tab].singular);

  $("search").value = "";
  renderGrid();

  if (state.workspaceId && !(state.cache[tab] || []).length) loadList();
}
