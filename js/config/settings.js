"use strict";

/* ============================================================
 * Fixed application configuration.
 * Values here do not change at runtime.
 * ========================================================== */

export const API_VERSION = "v2";

/* The REST route template. {host} and {workspaceId} are filled at runtime. */
export const API_ROOT = "/Relativity.REST/api/relativity-automated-workflows";

/* The two entity types the app manages. */
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
