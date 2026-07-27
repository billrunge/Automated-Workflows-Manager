"use strict";

/* ============================================================
 * Editor modal.
 *
 * Two synchronized ways to edit a trigger/action body:
 *   "Form" view : quick fields (Label/ID/Group/Version), a
 *                 type-aware Input picker, and a tree editor.
 *   "JSON" view : the raw textarea escape hatch.
 *
 * The "Add Input" picker scaffolds a correctly-shaped Input for
 * the chosen UIElementType (Dropdown, MultiCheckbox, RadioButtons,
 * Email, Switch, Hidden) and drops it into the Inputs array;
 * the tree editor then handles fine-tuning and nesting.
 *
 * Before every save, validateBody() checks the working object
 * against the Automated Workflows schema so the server isn't
 * handed a body it will reject:
 *   - required top-level fields (ID, Group; Steps for actions)
 *   - every Input has a valid UIElementType
 *   - every Input carries AT MOST ONE of InputSources /
 *     ObjectManagerQueryInputSource / BooleanInputSource
 *
 * workingObj is the single source of truth.
 * ========================================================== */

import { $, clone } from "../core/utils.js";
import { state } from "../core/state.js";
import { ENTITY } from "../config/settings.js";
import { messagesFrom } from "../core/api.js";
import { saveEntity, deleteEntity } from "../services/entityService.js";
import { templateFor } from "../data/templates.js";
import { UI_ELEMENT_TYPES, UI_ELEMENT_HELP, makeInput } from "../data/inputTemplates.js";
import { setStatus } from "./status.js";
import { loadList } from "../features/list.js";
import { createTreeEditor } from "./treeEditor.js";

const QUICK_FIELDS = ["fLabel", "fId", "fGroup", "fVersion"];

/* The only element types the server accepts. Kept as a Set for
   O(1) validation and derived from the shared picker list so the
   two never drift apart. */
const VALID_UI_TYPES = new Set(UI_ELEMENT_TYPES);

/* The three mutually-exclusive value-source keys for an Input. */
const SOURCE_KEYS = [
  "InputSources",
  "ObjectManagerQueryInputSource",
  "BooleanInputSource"
];

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
  if (sel.options.length) return; // already filled
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
  const uiType = $("inputType").value || "Dropdown";
  if (!Array.isArray(workingObj.Inputs)) workingObj.Inputs = [];
  // Suffix helps keep default IDs distinct when adding several quickly.
  const suffix = workingObj.Inputs.length ? "-" + (workingObj.Inputs.length + 1) : "";
  workingObj.Inputs.push(makeInput(uiType, suffix));
  tree.render();
  setStatus(`Added a ${uiType} input. Edit its fields below.`, "info");
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

/* ---------- Schema validation (runs before every save) ---------- */
/* Returns an array of human-readable problems. Empty array = OK. */
export function validateBody(obj, tabKey) {
  const problems = [];
  const isTrigger = tabKey === "triggers";
  const singular = isTrigger ? "Trigger" : "Action";

  if (!obj || typeof obj !== "object") {
    return [`${singular} body must be a JSON object.`];
  }

  // ----- Required top-level fields -----
  if (!obj.ID || !String(obj.ID).trim()) {
    problems.push("An ID is required.");
  }
  if (!obj.Group || !String(obj.Group).trim()) {
    problems.push("A Group is required.");
  }
  if (obj.Version == null || Number.isNaN(Number(obj.Version))) {
    problems.push("A numeric Version is required.");
  }

  // Actions must define at least one Step.
  if (!isTrigger) {
    if (!Array.isArray(obj.Steps) || obj.Steps.length === 0) {
      problems.push("Actions require at least one entry in Steps.");
    }
  }

  // ----- Per-input validation -----
  if (obj.Inputs != null && !Array.isArray(obj.Inputs)) {
    problems.push("Inputs must be an array.");
  } else if (Array.isArray(obj.Inputs)) {
    obj.Inputs.forEach((inp, i) => {
      const where = `Input #${i + 1}` + (inp && inp.ID ? ` ("${inp.ID}")` : "");

      if (!inp || typeof inp !== "object") {
        problems.push(`${where}: must be an object.`);
        return;
      }
      if (!inp.ID || !String(inp.ID).trim()) {
        problems.push(`${where}: an ID is required.`);
      }
      if (!inp.Label || !String(inp.Label).trim()) {
        problems.push(`${where}: a Label is required.`);
      }

      // UIElementType must be one of the documented enum values.
      if (!inp.UIElementType) {
        problems.push(`${where}: UIElementType is required.`);
      } else if (!VALID_UI_TYPES.has(inp.UIElementType)) {
        problems.push(
          `${where}: "${inp.UIElementType}" is not a valid UIElementType. ` +
          `Use one of: ${UI_ELEMENT_TYPES.join(", ")}.`
        );
      }

      // Mutual exclusivity: at most one value-source key allowed.
      const present = SOURCE_KEYS.filter(k => inp[k] != null);
      if (present.length > 1) {
        problems.push(
          `${where}: only one of ${SOURCE_KEYS.join(", ")} may be set ` +
          `(found ${present.join(" + ")}).`
        );
      }

      // A Switch should be backed by a BooleanInputSource.
      if (inp.UIElementType === "Switch" && inp.BooleanInputSource == null) {
        problems.push(`${where}: a Switch needs a BooleanInputSource.`);
      }
    });
  }

  return problems;
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

  // Local schema validation before hitting the server.
  const problems = validateBody(workingObj, state.currentTab);
  if (problems.length) {
    setStatus("Cannot save — " + problems.join(" "), "err");
    return;
  }

  setStatus("Saving…", "info");
  try {
    const json = await saveEntity(state.currentTab, workingObj);
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
