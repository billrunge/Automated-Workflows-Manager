"use strict";

/* ============================================================
 * Type-aware Input scaffolds for each UIElementType.
 * ========================================================== */

export const UI_ELEMENT_TYPES = ["Text", "Number", "Email", "Dropdown", "MultiCheckbox", "Switch"];

export const UI_ELEMENT_HELP = {
  Text:          "Single-line text entry.",
  Number:        "Numeric entry.",
  Email:         "Email address(es), semicolon-separated.",
  Dropdown:      "Choice list populated by an Object Manager query.",
  MultiCheckbox: "Multiple checkboxes; supports nested Children.",
  Switch:        "Boolean toggle backed by a BooleanInputSource."
};

export function makeInput(uiType, idSuffix) {
  const suffix = idSuffix != null ? String(idSuffix) : "";
  const base = {
    Label: `New ${uiType}`,
    ID: `new-${uiType.toLowerCase()}${suffix}`,
    UIElementType: uiType,
    Properties: {}
  };

  switch (uiType) {
    case "Text":
      return { ...base, Placeholder: "", DefaultValue: "" };
    case "Number":
      return { ...base, Placeholder: "", DefaultValue: "0" };
    case "Email":
      return { ...base, Placeholder: "Enter email addresses separated by a semicolon (;)", DefaultValue: "" };
    case "Dropdown":
      return {
        ...base, Placeholder: "Select",
        ObjectManagerQueryInputSource: {
          LabelFieldName: "Name", ValueFieldName: "ArtifactID",
          Guid: "00000000-0000-0000-0000-000000000000", ArtifactTypeID: 15
        }
      };
    case "MultiCheckbox":
      return {
        ...base, DefaultValue: "",
        InputSources: [
          { Label: "Option One", Value: "option-1" },
          { Label: "Option Two", Value: "option-2" }
        ]
      };
    case "Switch":
      return {
        ...base, DefaultValue: "true",
        BooleanInputSource: { TrueValue: "true", FalseValue: "false", TrueLabel: "Yes", FalseLabel: "No" }
      };
    default:
      return { ...base, DefaultValue: "" };
  }
}

export function makeChildChoice() {
  return {
    ID: "child-choices",
    UIElementType: "MultiCheckbox",
    InputSources: [{ Label: "Child Option", Value: "child-option" }],
    Properties: {}
  };
}
