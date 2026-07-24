"use strict";

/* ============================================================
 * Fixed application configuration.
 * ========================================================== */

export const API_VERSION = "v2";

export const API_ROOT = "/Relativity.REST/api/relativity-automated-workflows";

export const ENTITY = {
  triggers: {
    key: "triggers",
    path: "/triggers",
    singular: "Trigger",
    lowerSingular: "trigger"
  },
  actions: {
    key: "actions",
    path: "/actions",
    singular: "Action",
    lowerSingular: "action"
  }
};
