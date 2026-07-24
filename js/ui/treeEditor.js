"use strict";

/* ============================================================
 * Recursive JSON tree editor.
 *
 * Renders an editable, type-aware, infinitely-nestable view of
 * a plain JS object/array. Supports editing primitives, changing
 * a node's type, renaming keys, adding/removing fields & items,
 * and collapsing branches. Mutates the supplied object IN PLACE
 * so the caller always holds the live value via getData().
 * ========================================================== */

const TYPES = ["string", "number", "boolean", "object", "array", "null"];

export function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

export function defaultFor(type) {
  switch (type) {
    case "number":  return 0;
    case "boolean": return false;
    case "object":  return {};
    case "array":   return [];
    case "null":    return null;
    default:        return "";
  }
}

export function uniqueKey(obj, base) {
  let k = base, n = 2;
  while (Object.prototype.hasOwnProperty.call(obj, k)) k = base + n++;
  return k;
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null) continue;
      if (k === "class") node.className = v;
      else if (k === "value") node.value = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else {
        node.setAttribute(k, v);
      }
    }
  }
  (children || []).forEach(c => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

export function createTreeEditor(container, initial, onChange) {
  let root = (initial && typeof initial === "object") ? initial : {};
  const collapsed = new Set();

  function commit() { if (onChange) onChange(root); }
  function pathKey(path) { return path.join("\u0000"); }

  function getParent(path) {
    let node = root;
    for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
    return node;
  }
  function getValue(path) {
    let node = root;
    for (let i = 0; i < path.length; i++) node = node[path[i]];
    return node;
  }

  function setAt(path, value) {
    if (path.length === 0) { root = value; return; }
    getParent(path)[path[path.length - 1]] = value;
  }

  function removeAt(path) {
    const parent = getParent(path);
    const key = path[path.length - 1];
    if (Array.isArray(parent)) parent.splice(key, 1);
    else delete parent[key];
    rerender(); commit();
  }

  function addChild(path) {
    const node = path.length === 0 ? root : getValue(path);
    if (Array.isArray(node)) node.push("");
    else node[uniqueKey(node, "newField")] = "";
    collapsed.delete(pathKey(path));
    rerender(); commit();
  }

  function changeType(path, newType) {
    setAt(path, defaultFor(newType));
    rerender(); commit();
  }

  function renameKey(path, newName) {
    const parent = getParent(path);
    const oldKey = path[path.length - 1];
    const trimmed = String(newName).trim();
    if (!trimmed || trimmed === oldKey) { rerender(); return; }
    const rebuilt = {};
    for (const k in parent) {
      if (k === oldKey) rebuilt[uniqueKey(rebuilt, trimmed)] = parent[k];
      else rebuilt[k] = parent[k];
    }
    for (const k in parent) delete parent[k];
    Object.assign(parent, rebuilt);
    rerender(); commit();
  }

  function renderRow(value, path, keyName, inArray) {
    const t = typeOf(value);
    const isBranch = (t === "object" || t === "array");
    const pk = pathKey(path);
    const isCollapsed = collapsed.has(pk);

    const row = el("div", { class: "tnode" });
    const head = el("div", { class: "trow" });

    if (isBranch) {
      head.appendChild(el("button", {
        class: "tbtn ttoggle", type: "button",
        onclick: () => { isCollapsed ? collapsed.delete(pk) : collapsed.add(pk); rerender(); }
      }, [isCollapsed ? "\u25B8" : "\u25BE"]));
    } else {
      head.appendChild(el("span", { class: "tspacer" }));
    }

    if (inArray) {
      head.appendChild(el("span", { class: "tindex" }, ["[" + keyName + "]"]));
    } else {
      head.appendChild(el("input", {
        class: "tkey", value: String(keyName), title: "Property name",
        onchange: e => renameKey(path, e.target.value)
      }));
    }

    head.appendChild(el("select", {
      class: "ttype", title: "Field type",
      onchange: e => changeType(path, e.target.value)
    }, TYPES.map(tp => {
      const o = el("option", { value: tp }, [tp]);
      if (tp === t) o.selected = true;
      return o;
    })));

    if (t === "string") {
      head.appendChild(el("input", {
        class: "tval", value: value,
        oninput: e => { setAt(path, e.target.value); commit(); }
      }));
    } else if (t === "number") {
      head.appendChild(el("input", {
        class: "tval", type: "number", value: String(value),
        oninput: e => { setAt(path, e.target.value === "" ? 0 : Number(e.target.value)); commit(); }
      }));
    } else if (t === "boolean") {
      const cb = el("input", { class: "tcheck", type: "checkbox" });
      cb.checked = !!value;
      cb.addEventListener("change", e => { setAt(path, e.target.checked); commit(); });
      head.appendChild(cb);
    } else if (t === "null") {
      head.appendChild(el("span", { class: "tnull" }, ["null"]));
    } else {
      const count = t === "array" ? value.length : Object.keys(value).length;
      head.appendChild(el("span", { class: "tsummary" },
        [t === "array" ? `${count} item(s)` : `${count} field(s)`]));
      head.appendChild(el("button", {
        class: "tbtn tadd", type: "button",
        onclick: () => addChild(path)
      }, [t === "array" ? "+ item" : "+ field"]));
    }

    head.appendChild(el("button", {
      class: "tbtn tdel", type: "button", title: "Remove",
      onclick: () => removeAt(path)
    }, ["\u2715"]));

    row.appendChild(head);

    if (isBranch && !isCollapsed) {
      const kids = el("div", { class: "tkids" });
      if (t === "array") {
        value.forEach((item, i) => kids.appendChild(renderRow(item, path.concat(i), i, true)));
      } else {
        Object.keys(value).forEach(k => kids.appendChild(renderRow(value[k], path.concat(k), k, false)));
      }
      row.appendChild(kids);
    }

    return row;
  }

  function rerender() {
    container.innerHTML = "";
    const t = typeOf(root);
    if (t === "object") {
      Object.keys(root).forEach(k => container.appendChild(renderRow(root[k], [k], k, false)));
    } else if (t === "array") {
      root.forEach((item, i) => container.appendChild(renderRow(item, [i], i, true)));
    }
    container.appendChild(el("button", {
      class: "tbtn tadd troot", type: "button",
      onclick: () => addChild([])
    }, [t === "array" ? "+ item" : "+ field"]));
  }

  rerender();
  return {
    getData: () => root,
    setData: obj => {
      root = (obj && typeof obj === "object") ? obj : {};
      collapsed.clear();
      rerender();
    },
    render: rerender
  };
}
