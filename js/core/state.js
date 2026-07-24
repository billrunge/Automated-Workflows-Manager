"use strict";

/* ============================================================
 * Shared, mutable application state.
 *
 * Exported as a single object so that other modules can both
 * read and mutate it (ES module `let` bindings can't be
 * reassigned from outside their own module, but object
 * properties can).
 * ========================================================== */

export const state = {
  /** "triggers" | "actions" */
  currentTab: "triggers",

  /** In-memory cache of the last loaded list per tab. */
  cache: { triggers: [], actions: [] },

  /** True while the editor modal is editing an existing record. */
  editingExisting: false,

  /** Resolved once at startup. */
  workspaceId: null,

  /** Resolved once at startup (may be "" => relative URLs). */
  host: ""
};
