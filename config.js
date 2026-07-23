"use strict";

/* ---------- Fixed config ---------- */
const API_VERSION = "v2";

/* ---------- Shared state ---------- */
let currentTab = "triggers";   // "triggers" | "actions"
let cache = { triggers: [], actions: [] };
let editingExisting = false;
let WORKSPACE_ID = null;        // resolved once at startup
let HOST = "";                  // resolved once at startup (may be "" => relative)

/* ---------- DOM helper ---------- */
const $ = id => document.getElementById(id);

/* ---------- Context detection (from URL) ---------- */
function getWorkspaceId(){
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

function getHost(){
  // Prefer the parent Relativity instance origin
  try {
    if (window.top && window.top.location && window.top.location.origin){
      return window.top.location.origin;
    }
  } catch (e) { /* cross-origin blocked */ }
  // Fallback: this document's origin (same instance), or "" for relative URLs
  return window.location.origin || "";
}

/* ---------- URL building ---------- */
function baseUrl(){
  const host = (HOST || "").replace(/\/+$/,"");
  return `${host}/Relativity.REST/api/relativity-automated-workflows/${API_VERSION}/workspaces/${WORKSPACE_ID}`;
}
function endpoint(){ return currentTab === "triggers" ? "/triggers" : "/actions"; }