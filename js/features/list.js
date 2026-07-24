"use strict";

/* Loads the current tab's data and drives the grid. */

import { state } from "../core/state.js";
import { listEntities } from "../services/entityService.js";
import { renderGrid } from "../ui/grid.js";
import { setStatus } from "../ui/status.js";

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
