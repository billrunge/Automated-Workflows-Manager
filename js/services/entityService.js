"use strict";

/* ============================================================
 * Business logic for reading/writing triggers & actions.
 *
 * These functions know how to talk to the API for a given
 * entity type. They know nothing about buttons, modals, or
 * tables — the UI layer calls into here.
 * ========================================================== */

import { apiCall } from "../core/api.js";
import { ENTITY } from "../config/settings.js";

/** Fetch the full list for an entity type. Returns an array. */
export async function listEntities(tabKey) {
  const json = await apiCall("GET", ENTITY[tabKey].path);
  return Array.isArray(json.Result) ? json.Result : [];
}

/** Create or update a record. Returns the raw API response. */
export async function saveEntity(tabKey, body) {
  return apiCall("PUT", ENTITY[tabKey].path, { body });
}

/** Delete a record. Returns the raw API response. */
export async function deleteEntity(tabKey, item) {
  const body = tabKey === "triggers"
    ? { triggerID: item.ID, triggerVersion: item.Version }
    : { actionID: item.ID, actionVersion: item.Version };
  return apiCall("DELETE", ENTITY[tabKey].path, body);
}
