"use strict";

/* ---------- Open / close ---------- */
function openEditor(existingItem){
  editingExisting = !!existingItem;
  const isTrig = currentTab === "triggers";
  $("modalTitle").textContent =
    (editingExisting ? "Edit " : "New ") + (isTrig ? "Trigger" : "Action");

  const data = existingItem
    ? JSON.parse(JSON.stringify(existingItem))
    : JSON.parse(JSON.stringify(isTrig ? TRIGGER_TPL : ACTION_TPL));

  $("fLabel").value   = data.Label || "";
  $("fId").value      = data.ID || "";
  $("fGroup").value   = data.Group || "";
  $("fVersion").value = data.Version != null ? data.Version : 1;
  $("fId").readOnly   = editingExisting; // ID + version identify the record; keep stable when editing
  $("fJson").value    = JSON.stringify(data, null, 2);

  $("overlay").classList.add("show");
}
function closeEditor(){ $("overlay").classList.remove("show"); }

/* ---------- Sync the quick-fill fields into the JSON body ---------- */
function applyFieldsToJson(){
  let obj;
  try { obj = JSON.parse($("fJson").value || "{}"); }
  catch(e){ setStatus("Body JSON is invalid: " + e.message, "err"); return null; }
  obj.Label   = $("fLabel").value.trim();
  obj.ID      = $("fId").value.trim();
  obj.Group   = $("fGroup").value.trim();
  obj.Version = Number($("fVersion").value) || 1;
  $("fJson").value = JSON.stringify(obj, null, 2);
  return obj;
}

/* ---------- Save (create or update) ---------- */
async function saveItem(){
  const obj = applyFieldsToJson();
  if (!obj) return;
  if (!obj.ID){ setStatus("An ID is required.", "err"); return; }

  setStatus("Saving…", "info");
  try {
    const json = await apiCall("PUT", endpoint(), { body: obj });
    if (json.Success === false){
      setStatus("Server rejected save: " + (messagesFrom(json) || "unknown reason"), "err");
      return;
    }
    setStatus(messagesFrom(json) || "Saved.", "ok");
    closeEditor();
    await loadList();
  } catch (e){
    setStatus("Save failed: " + e.message, "err");
  }
}

/* ---------- Delete ---------- */
async function deleteItem(item){
  const isTrig = currentTab === "triggers";
  const ok = confirm(
    `Delete ${isTrig ? "trigger" : "action"} "${item.ID}" (v${item.Version})?\n\n` +
    `Note: it will NOT be deleted if it is used by a workflow.`);
  if (!ok) return;

  const body = isTrig
    ? { triggerID: item.ID, triggerVersion: item.Version }
    : { actionID:  item.ID, actionVersion:  item.Version };

  setStatus("Deleting…", "info");
  try {
    const json = await apiCall("DELETE", endpoint(), body);
    if (json.Success === false){
      setStatus("Not deleted: " + (messagesFrom(json) || "it may be in use by a workflow."), "err");
      return;
    }
    setStatus(messagesFrom(json) || "Deleted.", "ok");
    await loadList();
  } catch (e){
    setStatus("Delete failed: " + e.message, "err");
  }
}