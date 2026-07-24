"use strict";

/* Relativity platform context detection + URL building. */

import { API_VERSION, API_ROOT } from "../config/settings.js";
import { state } from "./state.js";

export function getWorkspaceId() {
  try {
    const p = new URLSearchParams(window.top.location.search);
    const id = p.get("AppID");
    if (id) return id;
  } catch (e) { /* cross-origin top access blocked; fall through */ }

  const p2 = new URLSearchParams(window.location.search);
  return p2.get("AppID") || p2.get("workspaceId") || p2.get("WorkspaceID") || null;
}

export function getHost() {
  try {
    if (window.top && window.top.location && window.top.location.origin) {
      return window.top.location.origin;
    }
  } catch (e) { /* cross-origin blocked */ }
  return window.location.origin || "";
}

export function resolveContext() {
  state.workspaceId = getWorkspaceId();
  state.host = getHost();
  return !!state.workspaceId;
}

export function baseUrl() {
  const host = (state.host || "").replace(/\/+$/, "");
  return `${host}${API_ROOT}/${API_VERSION}/workspaces/${state.workspaceId}`;
}
