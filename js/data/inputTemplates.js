"use strict";

/* ============================================================
 * Type-aware Input scaffolds for each UIElementType.
 *
 * Picking a UIElementType inserts an Input object pre-shaped
 * with exactly the sub-fields that element type needs, based on
 * the Automated Workflows REST schema:
 *
 *   - Text            plain string entry
 *   - Number          numeric entry
 *   - Email           email entry (semicolon-separated)
 *   - Dropdown        backed by an ObjectManagerQueryInputSource
 *   - MultiCheckbox   backed by InputSources (each optionally
 *                     nesting Children for sub-choices)
 *   - Switch          backed by a BooleanInputSource
 *
 * Every scaffold carries the common Input fields (Label, ID,
 * UIElementType) and a Properties object so a dynamic-rule
 * VisibleExpression can be added later. The tree editor then
 * lets the user fine-tune any value or nest further.
 * ========================================================== */

/* Order shown in the picker. */
export const UI_ELEMENT_TYPES = [
  "Text",
  "Number",
  "Email",
  "Dropdown",
  "MultiCheckbox",
  "Switch"
];

/* Short human descriptions for the picker's title/help. */
export const UI_ELEMENT_HELP = {
  Text:          "Single-line text entry.",
  Number:        "Numeric entry.",
  Email:         "Email address(es), semicolon-separated.",
  Dropdown:      "Choice list populated by an Object Manager query.",
  MultiCheckbox: "Multiple checkboxes; supports nested Children.",
  Switch:        "Boolean toggle backed by a BooleanInputSource."
};

/* Build a fresh Input object for the given UIElementType.
   `idSuffix` (optional) is appended to the default ID to help
   keep IDs unique when several are added quickly. */
export function makeInput(uiType, idSuffix) {
  const suffix = idSuffix != null ? String(idSuffix) : "";
  const base = {
    Label: `New ${uiType}`,
    ID: `new-${uiType.toLowerCase()}${suffix}`,
    UIElementType: uiType,
    Properties: {}          // add "VisibleExpression": "..." here for dynamic rules
  };

  switch (uiType) {
    case "Text":
      return { ...base, Placeholder: "", DefaultValue: "" };

    case "Number":
      return { ...base, Placeholder: "", DefaultValue: "0" };

    case "Email":
      return {
        ...base,
        Placeholder: "Enter email addresses separated by a semicolon (;)",
        DefaultValue: ""
      };

    case "Dropdown":
      return {
        ...base,
        Placeholder: "Select",
        ObjectManagerQueryInputSource: {
          LabelFieldName: "Name",
          ValueFieldName: "ArtifactID",
          Guid: "00000000-0000-0000-0000-000000000000",
          ArtifactTypeID: 15
        }
      };

    case "MultiCheckbox":
      return {
        ...base,
        DefaultValue: "",
        InputSources: [
          { Label: "Option One", Value: "option-1" },
          { Label: "Option Two", Value: "option-2" }
        ]
      };

    case "Switch":
      return {
        ...base,
        DefaultValue: "true",
        BooleanInputSource: {
          TrueValue: "true",
          FalseValue: "false",
          TrueLabel: "Yes",
          FalseLabel: "No"
        }
      };

    default:
      return { ...base, DefaultValue: "" };
  }
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
