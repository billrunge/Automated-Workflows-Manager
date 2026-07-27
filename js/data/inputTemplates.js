"use strict";

/* ============================================================
 * Type-aware Input scaffolds for each UIElementType.
 *
 * Picking a UIElementType inserts an Input object pre-shaped
 * with exactly the sub-fields that element type needs, based on
 * the Automated Workflows REST schema (UIElementType enum):
 *
 *   Dropdown       single-select list; backed by InputSources OR
 *                  ObjectManagerQueryInputSource (mutually exclusive)
 *   MultiCheckbox  multiple checkboxes; backed by InputSources,
 *                  each option may nest Children
 *   RadioButtons   single-select radio list; backed by InputSources
 *   Email          email entry, multiple addresses separated by ";"
 *   Switch         Boolean toggle; backed by a BooleanInputSource
 *   Hidden         not shown to the user; carries a default value
 *
 * NOTE: "Text" and "Number" are NOT valid UIElementType values in
 * the documented schema and have been removed. Free text is entered
 * through the schema's supported element types above.
 *
 * The schema also requires that an input carry AT MOST ONE of:
 *   InputSources | ObjectManagerQueryInputSource | BooleanInputSource
 * Each scaffold below respects that rule.
 *
 * Every scaffold carries the common Input fields (Label, ID,
 * UIElementType) and a Properties object so a dynamic-rule
 * VisibleExpression can be added later. The tree editor then
 * lets the user fine-tune any value or nest further.
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

/* Short human descriptions for the picker's title/help. */
export const UI_ELEMENT_HELP = {
  Dropdown:      "Single-select list. Values from a hardcoded list or an Object Manager query.",
  MultiCheckbox: "Multiple checkboxes; supports nested Children per option.",
  RadioButtons:  "Single-select radio list from a hardcoded list of options.",
  Email:         "Email address(es), semicolon-separated.",
  Switch:        "Boolean toggle backed by a BooleanInputSource.",
  Hidden:        "Not shown to the user; carries a default value only."
};

/* A reusable Object Manager query source (for dynamic dropdowns).
   Exported so the editor can swap a Dropdown's source on demand. */
export function makeObjectManagerSource() {
  return {
    LabelFieldName: "Name",
    ValueFieldName: "ArtifactID",
    ArtifactTypeID: 10,          // set to the target object type; or use Guid instead
    Condition: ""                // Object Manager query language condition
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

/* Build a fresh Input object for the given UIElementType.
   idSuffix (optional) is appended to the default ID to help
   keep IDs unique when several are added quickly. */
export function makeInput(uiType, idSuffix) {
  const suffix = idSuffix != null ? String(idSuffix) : "";
  const base = {
    Label: `New ${uiType}`,
    ID: `new-${uiType.toLowerCase()}${suffix}`,
    UIElementType: uiType,
    Properties: {}    // add "VisibleExpression": "..." here for dynamic rules
  };

  switch (uiType) {
    case "Dropdown":
      // Hardcoded values by default; swap InputSources for
      // ObjectManagerQueryInputSource for a dynamic, query-backed list.
      return {
        ...base,
        Placeholder: "",
        InputSources: [
          makeInputSource("Option 1", "option1"),
          makeInputSource("Option 2", "option2")
        ]
      };

    case "RadioButtons":
      return {
        ...base,
        InputSources: [
          makeInputSource("Option 1", "option1"),
          makeInputSource("Option 2", "option2")
        ]
      };

    case "MultiCheckbox":
      return {
        ...base,
        InputSources: [
          makeInputSource("Choice 1", "choice1"),
          makeInputSource("Choice 2", "choice2")
        ]
      };

    case "Email":
      return {
        ...base,
        Placeholder: "Enter email addresses separated by a semicolon (;)"
      };

    case "Switch":
      // Backed by a BooleanInputSource (NOT InputSources).
      return {
        ...base,
        BooleanInputSource: {
          TrueLabel: "Yes",
          FalseLabel: "No",
          TrueValue: "true",
          FalseValue: "false"
        }
      };

    case "Hidden":
      // No source object; just a default value carried silently.
      return {
        ...base,
        DefaultValue: ""
      };

    default:
      // Unknown type: return the common base so the tree editor
      // can still expose it; validation will flag it on save.
      return base;
  }
}
