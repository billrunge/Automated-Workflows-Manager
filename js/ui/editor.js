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
 * the chosen UIElementType. For choice types (Dropdown,
 * MultiCheckbox, RadioButtons) a Source selector chooses between
 * hardcoded InputSources and an Object Manager query. An optional
 * "Visible when" expression is dropped into Properties as a
 * VisibleExpression conditional-visibility rule.
 *
 * Before every save, validateBody() checks the working object
 * against the Automated Workflows schema so the server isn't
 * handed a body it will reject.
 *
 * workingObj is the single source of truth.
 * ========================================================== */

import { $, clone } from "../core/utils.js";
import { state } from "../core/state.js";
import { ENTITY } from "../config/settings.js";
import { messagesFrom } from "../core/api.js";
import { saveEntity, deleteEntity } from "../services/entityService.js";
import { templateFor } from "../data/templates.js";
import {
  UI_ELEMENT_TYPES, UI_ELEMENT_HELP, CHOICE_TYPES,
  makeInput, buildVisibleExpression
} from "../data/inputTemplates.js";
import { setStatus } from "./status.js";
import { loadList } from "../features/list.js";
import { createTreeEditor } from "./treeEditor.js";

const QUICK_FIELDS = ["fLabel", "fId", "fGroup", "fVersion"];

/* The only element types the server accepts, as a Set for O(1)
   validation, derived from the shared picker list so the two
   never drift apart. */
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

/* ---------- Enable/disable the Source selector by type ---------- */
/* The value source only applies to choice fields. For non-choice
   types (Email/Switch/Hidden) the selector is disabled and reset. */
function updateAdderControls() {
  const uiType = $("inputType").value;
  const isChoice = CHOICE_TYPES.has(uiType);
  const src = $("inputSource");
  if (src) {
    src.disabled = !isChoice;
    if (!isChoice) src.value = "hardcoded";
    src.title = isChoice
      ? "Where the choices come from"
      : "Only applies to choice fields (Dropdown, MultiCheckbox, RadioButtons)";
  }
}

/* ---------- Add a type-aware Input to workingObj.Inputs ---------- */
function addInput() {
  const uiType = $("inputType").value || "Dropdown";
  const sourceMode = ($("inputSource") && !$("inputSource").disabled)
    ? $("inputSource").value
    : "hardcoded";
  const visibleExpr = $("visibleExpr") ? $("visibleExpr").value.trim() : "";

  if (!Array.isArray(workingObj.Inputs)) workingObj.Inputs = [];
  // Suffix helps keep default IDs distinct when adding several quickly.
  const suffix = workingObj.Inputs.length ? "-" + (workingObj.Inputs.length + 1) : "";

  workingObj.Inputs.push(makeInput(uiType, suffix, {
    sourceMode,
    visibleExpression: visibleExpr,
    entity: state.currentTab
  }));

  // One-shot: clear the expression field so it doesn't silently
  // attach to the next input the user adds.
  if ($("visibleExpr")) $("visibleExpr").value = "";

  tree.render();

  const bits = [`Added a ${uiType} input`];
  if (CHOICE_TYPES.has(uiType)) {
    bits.push(sourceMode === "query" ? "with an Object Manager query source" : "with hardcoded values");
  }
  if (visibleExpr) bits.push("and a visibility rule");
  setStatus(bits.join(" ") + ". Edit its fields below.", "info");
}

/* Insert a starter VisibleExpression into the "Visible when" field,
   referencing the first other input if one exists. */
function insertVisibleExprTemplate() {
  const el = $("visibleExpr");
  if (!el) return;
  let sourceId = "";
  if (Array.isArray(workingObj.Inputs) && workingObj.Inputs.length) {
    sourceId = workingObj.Inputs[0].ID || "";
  }
  el.value = buildVisibleExpression(state.currentTab, sourceId, "value");
  el.focus();
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
  updateAdderControls();
  $("inputType").addEventListener("change", updateAdderControls);
  $("addInput").addEventListener("click", addInput);
  if ($("visibleExprTpl")) $("visibleExprTpl").addEventListener("click", insertVisibleExprTemplate);
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
  updateAdderControls();
  if ($("visibleExpr")) $("visibleExpr").value = "";
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
      if (!inp.Label && inp.UIElementType !== "Hidden") {
        problems.push(`${where}: a Label is required.`);
      }

      // UIElementType must be one of the documented enum values.
      const uiType = inp.UIElementType;
      if (!uiType) {
        problems.push(`${where}: UIElementType is required.`);
      } else if (!VALID_UI_TYPES.has(uiType)) {
        problems.push(
          `${where}: "${uiType}" is not a valid UIElementType. ` +
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

      // Source-key placement rules.
      const isChoice = CHOICE_TYPES.has(uiType);
      if (inp.InputSources != null) {
        if (!isChoice) {
          problems.push(`${where}: InputSources only applies to a choice field (Dropdown, MultiCheckbox, RadioButtons).`);
        } else if (!Array.isArray(inp.InputSources) || inp.InputSources.length === 0) {
          problems.push(`${where}: InputSources must be a non-empty array.`);
        }
      }
      if (inp.ObjectManagerQueryInputSource != null) {
        if (!isChoice) {
          problems.push(`${where}: ObjectManagerQueryInputSource only applies to a choice field.`);
        } else {
          const q = inp.ObjectManagerQueryInputSource;
          if (!q.LabelFieldName) problems.push(`${where}: query source needs a LabelFieldName.`);
          if (!q.ValueFieldName) problems.push(`${where}: query source needs a ValueFieldName.`);
          if (q.ArtifactTypeID == null && !q.Guid) {
            problems.push(`${where}: query source needs an ArtifactTypeID or a Guid.`);
          }
        }
      }
      if (inp.BooleanInputSource != null && uiType !== "Switch") {
        problems.push(`${where}: BooleanInputSource only applies to a Switch.`);
      }

      // A Switch should be backed by a BooleanInputSource.
      if (uiType === "Switch" && inp.BooleanInputSource == null) {
        problems.push(`${where}: a Switch needs a BooleanInputSource.`);
      }

      // VisibleExpression, if present, must be a non-empty string.
      if (inp.Properties && inp.Properties.VisibleExpression != null) {
        const ve = inp.Properties.VisibleExpression;
        if (typeof ve !== "string" || !ve.trim()) {
          problems.push(`${where}: VisibleExpression must be a non-empty string.`);
        }
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
