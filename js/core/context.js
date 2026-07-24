"use strict";

/* ============================================================
 * Relativity platform context detection + URL building.
 *
 * Responsible only for figuring out WHERE we are (workspace,
 * host) and how to build a REST base URL. Knows nothing about
 * the DOM or the UI.
 * ========================================================== */

import { API_VERSION, API_ROOT } from "../config/settings.js";
import { state } from "./state.js";

/* ---------- Context detection (from URL) ---------- */

/** Resolve the current Workspace ID (AppID) from the page URL. */
export function getWorkspaceId() {
  // Primary: AppID on the top window (standard Relativity custom-page context)
  try {
    const p = new URLSearchParams(window.top.location.search);
    const id = p.get("AppID");
    if (id) return id;
  } catch (e) { /* cross-origin top access blocked; fall through */ }

  // Fallback: query string on this iframe's own URL
  const p2 = new URLSearchParams(window.location.search);
  return p2.get("AppID") || p2.get("workspaceId") || p2.get("WorkspaceID") || null;
}

/** Resolve the Relativity instance origin. */
export function getHost() {
  // Prefer the parent Relativity instance origin
  try {
    if (window.top && window.top.location && window.top.location.origin) {
      return window.top.location.origin;
    }
  } catch (e) { /* cross-origin blocked */ }

  // Fallback: this document's origin (same instance), or "" for relative URLs
  return window.location.origin || "";
}

/**
 * Resolve context once and store it on shared state.
 * Returns true when a workspace was found.
 */
export function resolveContext() {
  state.workspaceId = getWorkspaceId();
  state.host = getHost();
  return !!state.workspaceId;
}

/* ---------- URL building ---------- */

/** Base REST URL for the current host + workspace. */
export function baseUrl() {
  const host = (state.host || "").replace(/\/+$/, "");
  return `${host}${API_ROOT}/${API_VERSION}/workspaces/${state.workspaceId}`;
}
