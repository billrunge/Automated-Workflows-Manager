"use strict";

/* ============================================================
 * Loads the current tab's data and drives the grid.
 *
 * Bridges the service layer (data) and the UI layer (grid +
 * status). This is the one place that knows both.
 * ========================================================== */

import { state } from "../core/state.js";
import { listEntities } from "../services/entityService.js";
import { renderGrid } from "../ui/grid.js";
import { setStatus } from "../ui/status.js";

/** Load the current tab's list from the API into the cache. */
export async function loadList() {
  if (!state.workspaceId) return;
  const tab = state.currentTab;
  setStatus(`Loading ${tab}…`, "info");
  try {
    const items = await listEntities(tab);
    state.cache[tab] = items;
    renderGrid();
    setStatus(`Loaded ${items.length} ${tab}.`, "ok");
  } catch (e) {
    state.cache[tab] = [];
    renderGrid();
    setStatus(`Failed to load ${tab}: ${e.message}`, "err");
  }
}
