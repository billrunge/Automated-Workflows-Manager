"use strict";

/* ---------- Startup ---------- */
function initContext(){
  WORKSPACE_ID = getWorkspaceId();
  HOST = getHost();
  const info = $("connInfo");

  if (!WORKSPACE_ID){
    info.className = "conn-info err";
    info.textContent = "Could not detect a Workspace ID (AppID) from the page URL. Open this page from within a workspace.";
    $("grid").innerHTML = `<tr><td colspan="5" class="empty">No workspace context.</td></tr>`;
    $("newBtn").disabled = true;
    $("refreshBtn").disabled = true;
    return false;
  }

  info.className = "conn-info";
  const hostLabel = HOST || "current instance";
  info.innerHTML =
    `Connected to <span class="badge">${esc(hostLabel)}</span>` +
    ` · Workspace <span class="badge">${esc(WORKSPACE_ID)}</span>` +
    ` · API <span class="badge">${API_VERSION}</span>`;
  return true;
}

/* ---------- Event wiring ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const ready = initContext();

  $("refreshBtn").onclick = loadList;
  $("search").oninput = renderGrid;

  document.querySelectorAll(".tab").forEach(t =>
    t.onclick = () => switchTab(t.dataset.tab));

  $("newBtn").onclick = () => { if (WORKSPACE_ID) openEditor(null); };

  $("grid").addEventListener("click", e => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const item = visibleItems()[Number(btn.dataset.i)];
    if (!item) return;
    if (btn.dataset.act === "edit") openEditor(item);
    else deleteItem(item);
  });

  // modal buttons
  $("modalClose").onclick = closeEditor;
  $("modalCancel").onclick = closeEditor;
  $("saveBtn").onclick = saveItem;
  $("syncFields").onclick = applyFieldsToJson;
  $("formatJson").onclick = () => {
    try { $("fJson").value = JSON.stringify(JSON.parse($("fJson").value), null, 2); }
    catch(e){ setStatus("Invalid JSON: " + e.message, "err"); }
  };
  $("loadTpl").onclick = () => {
    const tpl = currentTab === "triggers" ? TRIGGER_TPL : ACTION_TPL;
    $("fJson").value = JSON.stringify(tpl, null, 2);
    $("fLabel").value = tpl.Label; $("fId").value = tpl.ID;
    $("fGroup").value = tpl.Group || ""; $("fVersion").value = tpl.Version;
  };
  $("overlay").addEventListener("click", e => { if (e.target === $("overlay")) closeEditor(); });

  // Auto-load once context is known
  if (ready) loadList();
});