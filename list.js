"use strict";

/* ---------- Load ---------- */
async function loadList(){
  if (!WORKSPACE_ID) return;
  setStatus(`Loading ${currentTab}…`, "info");
  try {
    const json = await apiCall("GET", endpoint());
    const items = Array.isArray(json.Result) ? json.Result : [];
    cache[currentTab] = items;
    renderGrid();
    setStatus(`Loaded ${items.length} ${currentTab}.`, "ok");
  } catch (e){
    cache[currentTab] = [];
    renderGrid();
    setStatus(`Failed to load ${currentTab}: ${e.message}`, "err");
  }
}

/* ---------- Filtering ---------- */
function filteredItems(){
  const term = $("search").value.trim().toLowerCase();
  let items = cache[currentTab] || [];
  if (term){
    items = items.filter(it =>
      [it.Label, it.ID, it.Group].filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term)));
  }
  return items;
}
// Alias kept for clarity where row indices are resolved
function visibleItems(){ return filteredItems(); }

/* ---------- Render ---------- */
function renderGrid(){
  const grid = $("grid");
  const items = filteredItems();
  if (!items.length){
    grid.innerHTML = `<tr><td colspan="5" class="empty">No ${currentTab} found.</td></tr>`;
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

/* ---------- Tabs ---------- */
function switchTab(tab){
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(t =>
    t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".entlabel").forEach(e =>
    e.textContent = tab === "triggers" ? "Trigger" : "Action");
  $("search").value = "";
  renderGrid();
  if (WORKSPACE_ID && !(cache[tab] || []).length) loadList();
}
