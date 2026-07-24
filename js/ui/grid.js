"use strict";

/* ============================================================
 * Table rendering + client-side filtering.
 * ========================================================== */

import { $, esc } from "../core/utils.js";
import { state } from "../core/state.js";

/** Items for the current tab, filtered by the search box. */
export function filteredItems() {
  const term = $("search").value.trim().toLowerCase();
  let items = state.cache[state.currentTab] || [];
  if (term) {
    items = items.filter(it =>
      [it.Label, it.ID, it.Group].filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term)));
  }
  return items;
}

/** Alias kept for clarity where row indices are resolved. */
export function visibleItems() {
  return filteredItems();
}

/** Render the grid body from the current cache + filter. */
export function renderGrid() {
  const grid = $("grid");
  const items = filteredItems();

  if (!items.length) {
    grid.innerHTML = `<tr><td colspan="5" class="empty">No ${state.currentTab} found.</td></tr>`;
    return;
  }

  grid.innerHTML = items.map((it, i) => {
    const label = esc(it.Label || "(no label)");
    const id    = esc(it.ID || "");
    const group = esc(it.Group || "");
    const ver   = it.Version != null ? it.Version : "";
    return `<tr>
      <td>${label}</td>
      <td class="mono">${id}</td>
      <td>${group ? `<span class="pill">${group}</span>` : ""}</td>
      <td>${ver}</td>
      <td class="rowbtns">
        <button class="sm ghost" data-act="edit" data-i="${i}">Edit</button>
        <button class="sm danger" data-act="del" data-i="${i}">Delete</button>
      </td>
    </tr>`;
  }).join("");
}
