"use strict";

/* Business logic for reading/writing triggers & actions. */

import { apiCall } from "../core/api.js";
import { ENTITY } from "../config/settings.js";

export async function listEntities(tabKey) {
  const json = await apiCall("GET", ENTITY[tabKey].path);
  return Array.isArray(json.Result) ? json.Result : [];
}

export async function saveEntity(tabKey, body) {
  return apiCall("PUT", ENTITY[tabKey].path, { body });
}

export async function deleteEntity(tabKey, item) {
  const body = tabKey === "triggers"
    ? { triggerID: item.ID, triggerVersion: item.Version }
    : { actionID: item.ID, actionVersion: item.Version };
  return apiCall("DELETE", ENTITY[tabKey].path, body);
}
