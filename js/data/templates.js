"use strict";

/* ============================================================
 * Starter payloads for new items.
 * ========================================================== */

export const TRIGGER_TPL = {
  Group: "Other",
  Label: "Example Added",
  ID: "my-company/on-example-added",
  Version: 1,
  Inputs: [
    {
      Label: "Type(s)", ID: "type", DefaultValue: "", UIElementType: "MultiCheckbox",
      InputSources: [
        { Label: "Processing Set", Value: "processing" },
        { Label: "Integration Points (RIP)", Value: "rip" }
      ],
      Properties: {}
    }
  ],
  States: ["complete", "complete-with-errors", "error", "canceled"],
  SelectableAsInitialTrigger: true
};

export const ACTION_TPL = {
  Label: "Send Email",
  ID: "my-company/send-email",
  Group: "Notifications",
  Version: 1,
  Inputs: [
    {
      Label: "Recipient", ID: "recipient-list-id",
      Placeholder: "Enter email addresses separated by a semicolon (;)", UIElementType: "Email"
    }
  ],
  Steps: [
    {
      Type: "RPC",
      Http: {
        Url: "@{variables('RelativityInstanceURL')}/MyCompany.REST/API/v1/notification/workspace/@{variables('WorkspaceID')}/email/send",
        Headers: { "x-csrf-header": "-", "content-type": "application/json" },
        Body: {
          body: {
            WorkflowArtifactId: "@variables('WorkflowArtifactId')",
            WorkflowRunId: "@workflow().run.id",
            ActionDefinitionId: "@variables('ActionDefinitionId')",
            ActionIndex: "@variables('ActionIndex')",
            SequenceId: "@variables('SequenceId')"
          }
        },
        Method: "Post"
      },
      NotifiesCompletion: true
    }
  ]
};

/** Return the correct template for a given tab key. */
export function templateFor(tabKey) {
  return tabKey === "triggers" ? TRIGGER_TPL : ACTION_TPL;
}
