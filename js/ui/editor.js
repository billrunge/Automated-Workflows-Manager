"use strict";

/* ============================================================
 * Editor modal.
 *
 * Two synchronized views: "Form" (quick fields + type-aware
 * Add Input picker + recursive tree editor) and "JSON" (raw
 * escape hatch). `workingObj` is the single source of truth.
 *
 * Success is silent: on save/delete we clear the banner and
 * refresh the list rather than showing a green toast. Only
 * errors are surfaced.
 * ========================================================== */

import { $, clone } from "../core/utils.js";
import { state } from "../core/state.js";
import { ENTITY } from "../config/settings.js";
import { messagesFrom } from "../core/api.js";
import { saveEntity, deleteEntity } from "../services/entityService.js";
import { templateFor } from "../data/templates.js";
import { UI_ELEMENT_TYPES, UI_ELEMENT_HELP, makeInput } from "../data/inputTemplates.js";
import { setStatus, clearStatus } from "./status.js";
import { loadList } from "../features/list.js";
import { createTreeEditor } from "./treeEditor.js";

const QUICK_FIELDS = ["fLabel", "fId", "fGroup", "fVersion"];

let workingObj = {};
let tree = null;
let view = "form"; // "form" | "json"
let wired = false;

/* ---------- Quick fields <-> workingObj ---------- */
function populateQuickFields() {
  $("fLabel").value   = workingObj.Label || "";
  $("fId").value      = workingObj.ID || "";
  $("fGroup").value   = workingObj.Group || "";
  $("fVersion").value = workingObj.Version != null ? workingObj.Version : 1;
  $("fId").readOnly   = state.editingExisting;
}

function applyQuickFieldsToObj() {
  workingObj.Label   = $("fLabel").value.trim();
  workingObj.ID      = $("fId").value.trim();
  workingObj.Group   = $("fGroup").value.trim();
  workingObj.Version = Number($("fVersion").value) || 1;
}

/* ---------- Populate the UIElementType picker once ---------- */
function populateInputTypePicker() {
  const sel = $("inputType");
  if (sel.options.length) return;
  UI_ELEMENT_TYPES.forEach(tp => {
    const o = document.createElement("option");
    o.value = tp;
    o.textContent = tp;
    o.title = UI_ELEMENT_HELP[tp] || "";
    sel.appendChild(o);
  });
}

/* ---------- Add a type-aware Input to workingObj.Inputs ---------- */
function addInput() {
  const uiType = $("inputType").value || "Text";
  if (!Array.isArray(workingObj.Inputs)) workingObj.Inputs = [];
  const suffix = workingObj.Inputs.length ? "-" + (workingObj.Inputs.length + 1) : "";
  workingObj.Inputs.push(makeInput(uiType, suffix));
  tree.render();
}

/* ---------- One-time wiring of tree + listeners ---------- */
function ensureWired() {
  if (wired) return;
  tree = createTreeEditor($("treeWrap"), workingObj, () => {
    populateQuickFields();
  });
  QUICK_FIELDS.forEach(id => {
    $(id).addEventListener("input", () => {
      applyQuickFieldsToObj();
      if (view === "form") tree.render();
    });
  });
  populateInputTypePicker();
  $("addInput").addEventListener("click", addInput);
  wired = true;
}

/* ---------- Open / close ---------- */
export function openEditor(existingItem) {
  state.editingExisting = !!existingItem;
  const ent = ENTITY[state.currentTab];
  $("modalTitle").textContent = (state.editingExisting ? "Edit " : "New ") + ent.singular;

  workingObj = existingItem ? clone(existingItem) : clone(templateFor(state.currentTab));

  ensureWired();
  tree.setData(workingObj);
  populateQuickFields();
  setView("form");

  $("overlay").classList.add("show");
}

export function closeEditor() {
  $("overlay").classList.remove("show");
}

/* ---------- View toggle ---------- */
export function setView(next) {
  if (next === "json") {
    applyQuickFieldsToObj();
    $("fJson").value = JSON.stringify(workingObj, null, 2);
    $("treeWrap").style.display   = "none";
    $("quickGrid").style.display  = "none";
    $("inputAdder").style.display = "none";
    $("fJson").style.display      = "";
    $("formatJson").style.display = "";
  } else {
    if (view === "json") {
      let obj;
      try { obj = JSON.parse($("fJson").value || "{}"); }
      catch (e) { setStatus("Body JSON is invalid: " + e.message, "err"); return; }
      workingObj = obj;
      tree.setData(workingObj);
      populateQuickFields();
    }
    $("treeWrap").style.display   = "";
    $("quickGrid").style.display  = "";
    $("inputAdder").style.display = "";
    $("fJson").style.display      = "none";
    $("formatJson").style.display = "none";
  }

  view = next;
  $("viewForm").classList.toggle("primary", next === "form");
  $("viewForm").classList.toggle("ghost",   next !== "form");
  $("viewJson").classList.toggle("primary", next === "json");
  $("viewJson").classList.toggle("ghost",   next !== "json");
}

/* ---------- JSON view helpers ---------- */
export function formatJson() {
  try { $("fJson").value = JSON.stringify(JSON.parse($("fJson").value), null, 2); }
  catch (e) { setStatus("Invalid JSON: " + e.message, "err"); }
}

/* ---------- Insert the starter template ---------- */
export function loadTemplate() {
  workingObj = clone(templateFor(state.currentTab));
  if (view === "json") {
    $("fJson").value = JSON.stringify(workingObj, null, 2);
  } else {
    tree.setData(workingObj);
  }
  populateQuickFields();
}

/* ---------- Save (create or update) ---------- */
export async function saveItem() {
  if (view === "json") {
    let obj;
    try { obj = JSON.parse($("fJson").value || "{}"); }
    catch (e) { setStatus("Body JSON is invalid: " + e.message, "err"); return; }
    workingObj = obj;
  } else {
    applyQuickFieldsToObj();
  }

  if (!workingObj.ID) { setStatus("An ID is required.", "err"); return; }

  setStatus("Saving…", "info");
  try {
    const json = await saveEntity(state.currentTab, workingObj);
    if (json.Success === false) {
      setStatus("Server rejected save: " + (messagesFrom(json) || "unknown reason"), "err");
      return;
    }
    clearStatus();          // success is silent
    closeEditor();
    await loadList();       // auto-refresh the grid
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
    clearStatus();          // success is silent
    await loadList();       // auto-refresh the grid
  } catch (e) {
    setStatus("Delete failed: " + e.message, "err");
  }
}
