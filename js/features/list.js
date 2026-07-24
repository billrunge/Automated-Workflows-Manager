"use strict";

/* Loads the current tab's data and drives the grid. */

import { state } from "../core/state.js";
import { listEntities } from "../services/entityService.js";
import { renderGrid } from "../ui/grid.js";
import { setStatus, clearStatus } from "../ui/status.js";

export async function loadList() {
  if (!state.workspaceId) return;
  const tab = state.currentTab;
  try {
    const items = await listEntities(tab);
    state.cache[tab] = items;
    renderGrid();
    clearStatus();                 // success is silent (no green toast)
  } catch (e) {
    state.cache[tab] = [];
    renderGrid();
    setStatus(`Failed to load ${tab}: ${e.message}`, "err");
  }
}
