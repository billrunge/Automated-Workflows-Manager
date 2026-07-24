"use strict";

/* Tab switching between Triggers and Actions.
 *
 * Renders instantly from cache, then always re-fetches so the
 * grid is live without a manual Refresh button. */

import { $ } from "../core/utils.js";
import { state } from "../core/state.js";
import { ENTITY } from "../config/settings.js";
import { renderGrid } from "./grid.js";
import { loadList } from "../features/list.js";

export function switchTab(tab) {
  state.currentTab = tab;

  document.querySelectorAll(".tab").forEach(t =>
    t.classList.toggle("active", t.dataset.tab === tab));

  document.querySelectorAll(".entlabel").forEach(e =>
    e.textContent = ENTITY[tab].singular);

  $("search").value = "";
  renderGrid();                    // instant paint from cache

  if (state.workspaceId) loadList(); // always refresh from server
}
