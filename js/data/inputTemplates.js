"use strict";

/* ============================================================
 * Type-aware Input scaffolds for each UIElementType.
 *
 * Valid UIElementType values (documented enum):
 *   Dropdown, MultiCheckbox, RadioButtons, Email, Switch, Hidden
 *
 * Two schema features are supported at scaffold time:
 *
 *  1) Value-source toggle for choice fields
 *     (Dropdown / MultiCheckbox / RadioButtons):
 *       - "hardcoded" -> InputSources: [{Label,Value}, ...]
 *       - "query"     -> ObjectManagerQueryInputSource, which
 *                        populates choices from a live Object
 *                        Manager query.
 *     The schema allows AT MOST ONE of InputSources /
 *     ObjectManagerQueryInputSource / BooleanInputSource per
 *     input, so applySourceMode() strips the others first.
 *
 *  2) Conditional visibility via Properties.VisibleExpression.
 *     Verified grammar (from the REST "Dynamic Rule" example):
 *       @action.inputs.<other-input-id>.value == 'value'
 *     i.e. the "@action.inputs." prefix + the source input's ID
 *     + ".value", the == operator, and single-quoted literals.
 * ========================================================== */

/* Valid UIElementType values, in the order shown in the picker. */
export const UI_ELEMENT_TYPES = [
  "Dropdown",
  "MultiCheckbox",
  "RadioButtons",
  "Email",
  "Switch",
  "Hidden"
];

/* The choice types that support a value source
   (hardcoded InputSources OR an Object Manager query). */
export const CHOICE_TYPES = new Set(["Dropdown", "MultiCheckbox", "RadioButtons"]);

/* Short human descriptions for the picker's title/help. */
export const UI_ELEMENT_HELP = {
  Dropdown:      "Single-select list. Values from a hardcoded list or an Object Manager query.",
  MultiCheckbox: "Multiple checkboxes; supports nested Children per option.",
  RadioButtons:  "Single-select radio list from a hardcoded list of options.",
  Email:         "Email address(es), semicolon-separated.",
  Switch:        "Boolean toggle backed by a BooleanInputSource.",
  Hidden:        "Not shown to the user; carries a default value only."
};

/* Default hardcoded choices for a choice-type input. */
export function defaultChoicesFor(uiType) {
  const a = uiType === "MultiCheckbox" ? "Choice 1" : "Option 1";
  const b = uiType === "MultiCheckbox" ? "Choice 2" : "Option 2";
  const av = uiType === "MultiCheckbox" ? "choice1" : "option1";
  const bv = uiType === "MultiCheckbox" ? "choice2" : "option2";
  return [
    { Label: a, Value: av },
    { Label: b, Value: bv }
  ];
}

/* A reusable Object Manager query source (dynamic choices).
   ArtifactTypeID 15 = Saved Search (matches the documented
   example). You can instead identify the object type by Guid;
   set one or both, then refine Condition as needed. */
export function makeObjectManagerSource() {
  return {
    LabelFieldName: "Name",
    ValueFieldName: "ArtifactID",
    ArtifactTypeID: 15,        // or use "Guid": "<object-type-guid>"
    Condition: ""              // Object Manager query language condition
  };
}

/* A single hardcoded option for InputSources-backed fields. */
export function makeInputSource(label, value) {
  return { Label: label || "Option", Value: value != null ? value : "option" };
}

/* A single nested child choice for a MultiCheckbox InputSource,
   matching the schema's Children shape. */
export function makeChildChoice() {
  return {
    ID: "child-choices",
    UIElementType: "MultiCheckbox",
    InputSources: [
      { Label: "Child Option", Value: "child-option" }
    ],
    Properties: {}
  };
}

/* Enforce the mutual-exclusivity rule and set the chosen source.
   mode: "hardcoded" | "query". Safe to call repeatedly to flip
   an input between the two without leaving a stale source object. */
export function applySourceMode(input, mode, uiType) {
  delete input.InputSources;
  delete input.ObjectManagerQueryInputSource;
  delete input.BooleanInputSource;

  if (mode === "query") {
    input.ObjectManagerQueryInputSource = makeObjectManagerSource();
  } else {
    input.InputSources = defaultChoicesFor(uiType || input.UIElementType);
  }
  return input;
}

/* Set (or clear) a conditional-visibility rule on an input.
   Passing an empty expression removes the rule. */
export function setVisibleExpression(input, expr) {
  if (!input.Properties || typeof input.Properties !== "object") input.Properties = {};
  const trimmed = String(expr || "").trim();
  if (trimmed) input.Properties.VisibleExpression = trimmed;
  else delete input.Properties.VisibleExpression;
  return input;
}

/* Build a VisibleExpression string in the verified grammar.
   entity is the current tab ("actions" | "triggers"); the
   documented example is for actions (@action.inputs...). */
export function buildVisibleExpression(entity, sourceInputId, value) {
  const scope = entity === "triggers" ? "trigger" : "action";
  const id = sourceInputId || "<other-input-id>";
  const val = value != null ? value : "value";
  return `@${scope}.inputs.${id}.value == '${val}'`;
}

/* Build a fresh Input object for the given UIElementType.
   opts:
     sourceMode        "hardcoded" | "query" (choice types only)
     visibleExpression string to drop into Properties
     entity            "actions" | "triggers" (reserved) */
export function makeInput(uiType, idSuffix, opts) {
  const o = opts || {};
  const sourceMode = o.sourceMode === "query" ? "query" : "hardcoded";
  const visibleExpression = o.visibleExpression || "";

  const suffix = idSuffix != null ? String(idSuffix) : "";
  const base = {
    Label: `New ${uiType}`,
    ID: `new-${uiType.toLowerCase()}${suffix}`,
    UIElementType: uiType,
    Properties: {}    // VisibleExpression may be added below
  };

  let input;
  switch (uiType) {
    case "Dropdown":
      input = { ...base, Placeholder: "Select" };
      applySourceMode(input, sourceMode, uiType);
      break;

    case "RadioButtons":
    case "MultiCheckbox":
      input = { ...base };
      applySourceMode(input, sourceMode, uiType);
      break;

    case "Email":
      input = { ...base, Placeholder: "Enter email addresses separated by a semicolon (;)" };
      break;

    case "Switch":
      // Backed by a BooleanInputSource (NOT InputSources).
      input = {
        ...base,
        DefaultValue: "false",
        BooleanInputSource: {
          TrueLabel: "Yes",
          FalseLabel: "No",
          TrueValue: "true",
          FalseValue: "false"
        }
      };
      break;

    case "Hidden":
      input = { ...base, DefaultValue: "" };
      break;

    default:
      input = base;
  }

  if (visibleExpression) setVisibleExpression(input, visibleExpression);
  return input;
}
