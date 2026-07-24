"use strict";

/* Core REST transport. */

import { baseUrl } from "./context.js";

export async function apiCall(method, path, bodyObj) {
  const opts = {
    method,
    headers: { "X-CSRF-Header": "-", "Content-Type": "application/json" },
    credentials: "include"
  };
  if (bodyObj !== undefined && method !== "GET") opts.body = JSON.stringify(bodyObj);

  const res  = await fetch(baseUrl() + path, opts);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; }
  catch (e) { json = { _raw: text }; }

  if (!res.ok) {
    const m = messagesFrom(json) || `${res.status} ${res.statusText}`;
    const err = new Error(m);
    err.payload = json;
    err.status = res.status;
    throw err;
  }
  return json;
}

export function messagesFrom(json) {
  if (!json) return "";
  if (Array.isArray(json.Messages) && json.Messages.length) return json.Messages.join(" | ");
  if (typeof json.Message === "string" && json.Message) return json.Message;
  if (Array.isArray(json.Result) && json.Result.every(x => typeof x === "string")) return json.Result.join(" | ");
  if (json._raw) return json._raw;
  return "";
}
