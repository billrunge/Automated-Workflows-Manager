"use strict";

/* Shared, mutable application state. */
export const state = {
  currentTab: "triggers",
  cache: { triggers: [], actions: [] },
  editingExisting: false,
  workspaceId: null,
  host: ""
};
