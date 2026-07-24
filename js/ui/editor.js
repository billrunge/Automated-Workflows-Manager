"use strict";

/* ============================================================
 * Editor modal: open/close, field<->JSON sync, save, delete.
 *
 * Talks to the service layer for persistence and to the list
 * feature to refresh after a change.
 * ========================================================== */

import { $, clone } from "../core/utils.js";
import { state } from "../core/state.js";
import { ENTITY } from "../config/settings.js";
import { messagesFrom } from "../core/api.js";
import { saveEntity, deleteEntity } from "../services/entityService.js";
import { templateFor, TRIGGER_TPL, ACTION_TPL } from "../data/templates.js";
import { setStatus } from "./status.js";
import { loadList } from "../features/list.js";

/* ---------- Open / close ---------- */
export function openEditor(existingItem) {
  state.editingExisting = !!existingItem;
  const ent = ENTITY[state.currentTab];

  $("modalTitle").textContent =
    (state.editingExisting ? "Edit " : "New ") + ent.singular;

  const data = existingItem
    ? clone(existingItem)
    : clone(templateFor(state.currentTab));

  $("fLabel").value   = data.Label || "";
  $("fId").value      = data.ID || "";
  $("fGroup").value   = data.Group || "";
  $("fVersion").value = data.Version != null ? data.Version : 1;
  $("fId").readOnly   = state.editingExisting; // ID + version identify the record; keep stable when editing
  $("fJson").value    = JSON.stringify(data, null, 2);

  $("overlay").classList.add("show");
}

export function closeEditor() {
  $("overlay").classList.remove("show");
}

/* ---------- Sync the quick-fill fields into the JSON body ---------- */
export function applyFieldsToJson() {
  let obj;
  try { obj = JSON.parse($("fJson").value || "{}"); }
  catch (e) { setStatus("Body JSON is invalid: " + e.message, "err"); return null; }

  obj.Label   = $("fLabel").value.trim();
  obj.ID      = $("fId").value.trim();
  obj.Group   = $("fGroup").value.trim();
  obj.Version = Number($("fVersion").value) || 1;
  $("fJson").value = JSON.stringify(obj, null, 2);
  return obj;
}

/* ---------- Format the JSON textarea ---------- */
export function formatJson() {
  try { $("fJson").value = JSON.stringify(JSON.parse($("fJson").value), null, 2); }
  catch (e) { setStatus("Invalid JSON: " + e.message, "err"); }
}

/* ---------- Insert the starter template ---------- */
export function loadTemplate() {
  const tpl = templateFor(state.currentTab);
  $("fJson").value  = JSON.stringify(tpl, null, 2);
  $("fLabel").value = tpl.Label;
  $("fId").value    = tpl.ID;
  $("fGroup").value = tpl.Group || "";
  $("fVersion").value = tpl.Version;
}

/* ---------- Save (create or update) ---------- */
export async function saveItem() {
  const obj = applyFieldsToJson();
  if (!obj) return;
  if (!obj.ID) { setStatus("An ID is required.", "err"); return; }

  setStatus("Saving…", "info");
  try {
    const json = await saveEntity(state.currentTab, obj);
    if (json.Success === false) {
      setStatus("Server rejected save: " + (messagesFrom(json) || "unknown reason"), "err");
      return;
    }
    setStatus(messagesFrom(json) || "Saved.", "ok");
    closeEditor();
    await loadList();
  } catch (e) {
    setStatus("Save failed: " + e.message, "err");
  }
}

/* ---------- Delete ---------- */
export async function deleteItem(item) {
  const ent = ENTITY[state.currentTab];
  const ok = confirm(
    `Delete ${ent.lowerSingular} "${item.ID}" (v${item.Version})?\n\n` +
    `Note: it will NOT be deleted if it is used by a workflow.`);
  if (!ok) return;

  setStatus("Deleting…", "info");
  try {
    const json = await deleteEntity(state.currentTab, item);
    if (json.Success === false) {
      setStatus("Not deleted: " + (messagesFrom(json) || "it may be in use by a workflow."), "err");
      return;
    }
    setStatus(messagesFrom(json) || "Deleted.", "ok");
    await loadList();
  } catch (e) {
    setStatus("Delete failed: " + e.message, "err");
  }
}

/* Re-export templates so callers that only import the editor
   still have access if needed. */
export { TRIGGER_TPL, ACTION_TPL };
