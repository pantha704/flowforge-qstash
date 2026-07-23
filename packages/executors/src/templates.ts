/**
 * Safe template resolution for action metadata.
 *
 * Supports:
 *   {{field}}           → trigger payload field (top-level)
 *   {{trigger.field}}   → same, explicit
 *   {{user.email}}      → nested paths via dot notation
 *
 * Missing paths resolve to empty string (never throw).
 * Non-string values are left unchanged; objects in paths stringify as JSON.
 */

export type TemplateContext = {
  trigger?: unknown;
  run?: unknown;
};

function getByPath(root: unknown, path: string): unknown {
  if (!path) return root;
  if (root === null || root === undefined) return undefined;

  const parts = path.split(".").filter(Boolean);
  let current: unknown = root;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function valueToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/**
 * Resolve a single `{{ ... }}` expression against context.
 */
function resolveExpression(expr: string, context: TemplateContext): string {
  const path = expr.trim();
  if (!path) return "";

  let root: unknown = context.trigger;
  let relative = path;

  if (path.startsWith("trigger.")) {
    root = context.trigger;
    relative = path.slice("trigger.".length);
  } else if (path.startsWith("run.")) {
    root = context.run;
    relative = path.slice("run.".length);
  } else if (path.startsWith("vars.")) {
    // Shortcut for run.vars.*
    root =
      context.run && typeof context.run === "object"
        ? (context.run as Record<string, unknown>).vars
        : undefined;
    relative = path.slice("vars.".length);
  }

  // Bare path (no prefix) → trigger payload
  return valueToString(getByPath(root, relative));
}

const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

/**
 * Deep-resolve templates in strings / arrays / plain objects.
 * Keys starting with `_` (internal, e.g. OAuth tokens) are never templated.
 */
export function resolveTemplates<T>(value: T, context: TemplateContext): T {
  if (typeof value === "string") {
    if (!value.includes("{{")) return value;
    return value.replace(TEMPLATE_RE, (_match, expr: string) =>
      resolveExpression(expr, context)
    ) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplates(item, context)) as T;
  }

  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(input)) {
      if (key.startsWith("_")) {
        out[key] = child;
      } else {
        out[key] = resolveTemplates(child, context);
      }
    }
    return out as T;
  }

  return value;
}
