"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type FieldType = "string" | "int32" | "bool";

interface Field {
  tag: number;
  name: string;
  type: FieldType;
  required: boolean;
}

const ORIGINAL: Field[] = [
  { tag: 1, name: "user_id", type: "int32", required: true },
  { tag: 2, name: "name", type: "string", required: true },
  { tag: 3, name: "email", type: "string", required: false },
];

type Op =
  | { kind: "add"; field: Field }
  | { kind: "remove"; tag: number }
  | { kind: "rename"; tag: number; newName: string }
  | { kind: "retype"; tag: number; newType: FieldType }
  | { kind: "require"; tag: number };

function apply(schema: Field[], op: Op): Field[] {
  switch (op.kind) {
    case "add":
      return [...schema, op.field];
    case "remove":
      return schema.filter((f) => f.tag !== op.tag);
    case "rename":
      return schema.map((f) => (f.tag === op.tag ? { ...f, name: op.newName } : f));
    case "retype":
      return schema.map((f) => (f.tag === op.tag ? { ...f, type: op.newType } : f));
    case "require":
      return schema.map((f) => (f.tag === op.tag ? { ...f, required: true } : f));
  }
}

interface Verdict {
  backward: boolean;
  forward: boolean;
  note: string;
}

function judge(op: Op, schema: Field[]): Verdict {
  switch (op.kind) {
    case "add": {
      if (op.field.required)
        return {
          backward: false,
          forward: true,
          note: "Adding a required field breaks old writers — they don't know to set it.",
        };
      return {
        backward: true,
        forward: true,
        note: "Adding an optional field is safe — old readers ignore unknown tags; old writers omit it and new readers tolerate the absence.",
      };
    }
    case "remove": {
      const f = schema.find((x) => x.tag === op.tag);
      if (f?.required)
        return {
          backward: false,
          forward: false,
          note: "Removing a required field breaks both directions. Don't.",
        };
      return {
        backward: true,
        forward: true,
        note: "Removing an optional field is mostly safe — but never reuse the tag number, or old data will be misinterpreted.",
      };
    }
    case "rename":
      return {
        backward: true,
        forward: true,
        note: "Binary formats (Protobuf, Thrift) identify fields by tag number, not name. Renaming the symbol is fine — wire format is unchanged.",
      };
    case "retype":
      return {
        backward: false,
        forward: false,
        note: "Changing the wire type silently corrupts data. Old readers will misparse the bytes. Add a new field with a new tag instead.",
      };
    case "require":
      return {
        backward: false,
        forward: true,
        note: "Promoting optional → required breaks old writers that didn't set it. Permanent compatibility breakage.",
      };
  }
}

export function SDSchemaEvolution() {
  const [history, setHistory] = useState<{ op: Op; verdict: Verdict }[]>([]);
  const [schema, setSchema] = useState<Field[]>(ORIGINAL);

  const [newName, setNewName] = useState("phone");
  const [newType, setNewType] = useState<FieldType>("string");
  const [newRequired, setNewRequired] = useState(false);
  const [targetTag, setTargetTag] = useState(3);
  const [renameTo, setRenameTo] = useState("email_address");
  const [retypeTo, setRetypeTo] = useState<FieldType>("string");

  const run = (op: Op) => {
    const verdict = judge(op, schema);
    setSchema((s) => apply(s, op));
    setHistory((h) => [...h, { op, verdict }]);
  };

  const reset = () => {
    setSchema(ORIGINAL);
    setHistory([]);
  };

  const maxTag = Math.max(0, ...schema.map((f) => f.tag));

  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-md">
        <div className="border-b border-border-subtle bg-subtle px-5 py-3 text-overline uppercase text-text-secondary">
          Schema Evolution Challenge · Protobuf-style
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Current schema</div>
            <pre className="rounded-sm border border-border-subtle bg-subtle p-3 font-mono text-caption">
              {`message UserProfile {
${schema
  .map((f) => `  ${f.required ? "required" : "optional"} ${f.type} ${f.name} = ${f.tag};`)
  .join("\n")}
}`}
            </pre>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-overline uppercase text-text-muted">Add field</div>
                <div className="flex flex-wrap gap-2 text-body-sm">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-28 rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FieldType)}
                    className="rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono"
                  >
                    <option value="string">string</option>
                    <option value="int32">int32</option>
                    <option value="bool">bool</option>
                  </select>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={newRequired}
                      onChange={(e) => setNewRequired(e.target.checked)}
                    />
                    required
                  </label>
                  <button
                    onClick={() =>
                      run({
                        kind: "add",
                        field: {
                          tag: maxTag + 1,
                          name: newName,
                          type: newType,
                          required: newRequired,
                        },
                      })
                    }
                    className="rounded-sm border border-accent-500 bg-accent-500 px-2 py-1 text-white hover:bg-accent-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <div className="text-overline uppercase text-text-muted">Modify field (by tag)</div>
                <div className="flex flex-wrap gap-2 text-body-sm">
                  <select
                    value={targetTag}
                    onChange={(e) => setTargetTag(Number(e.target.value))}
                    className="rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono"
                  >
                    {schema.map((f) => (
                      <option key={f.tag} value={f.tag}>
                        {f.tag} · {f.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => run({ kind: "remove", tag: targetTag })}
                    className="rounded-sm border border-border-strong bg-surface px-2 py-1 hover:bg-subtle"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => run({ kind: "require", tag: targetTag })}
                    className="rounded-sm border border-border-strong bg-surface px-2 py-1 hover:bg-subtle"
                  >
                    Make required
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-body-sm">
                  <input
                    value={renameTo}
                    onChange={(e) => setRenameTo(e.target.value)}
                    className="w-36 rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono"
                  />
                  <button
                    onClick={() => run({ kind: "rename", tag: targetTag, newName: renameTo })}
                    className="rounded-sm border border-border-strong bg-surface px-2 py-1 hover:bg-subtle"
                  >
                    Rename to →
                  </button>
                  <select
                    value={retypeTo}
                    onChange={(e) => setRetypeTo(e.target.value as FieldType)}
                    className="rounded-sm border border-border-strong bg-surface px-2 py-1 font-mono"
                  >
                    <option value="string">string</option>
                    <option value="int32">int32</option>
                    <option value="bool">bool</option>
                  </select>
                  <button
                    onClick={() => run({ kind: "retype", tag: targetTag, newType: retypeTo })}
                    className="rounded-sm border border-border-strong bg-surface px-2 py-1 hover:bg-subtle"
                  >
                    Change type to →
                  </button>
                </div>
              </div>

              <button
                onClick={reset}
                className="rounded-sm border border-border-subtle bg-surface px-3 py-1 text-body-sm text-text-muted hover:bg-subtle"
              >
                Reset schema
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-overline uppercase text-text-muted">Compatibility log</div>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {history.length === 0 && (
                <p className="text-body-sm text-text-muted">No changes yet. Try adding a field.</p>
              )}
              {history.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-sm border p-3 text-body-sm",
                    h.verdict.backward && h.verdict.forward
                      ? "border-success/40 bg-success/5"
                      : "border-danger/40 bg-danger/5"
                  )}
                >
                  <div className="font-mono text-caption text-text-muted">{describe(h.op)}</div>
                  <div className="mt-1 flex gap-3 text-caption">
                    <Badge ok={h.verdict.backward}>Backward</Badge>
                    <Badge ok={h.verdict.forward}>Forward</Badge>
                  </div>
                  <p className="mt-1 text-text-secondary">{h.verdict.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-prose text-caption text-text-muted">
        <strong>Backward compatibility</strong> = new code reads old data.{" "}
        <strong>Forward compatibility</strong> = old code reads new data. You want both — that's
        what lets you deploy gradually without coordinating every service at once.
      </figcaption>
    </figure>
  );
}

function describe(op: Op): string {
  switch (op.kind) {
    case "add":
      return `+ add ${op.field.required ? "required " : ""}${op.field.type} ${op.field.name} = ${op.field.tag}`;
    case "remove":
      return `- remove tag ${op.tag}`;
    case "rename":
      return `~ rename tag ${op.tag} → "${op.newName}"`;
    case "retype":
      return `! retype tag ${op.tag} → ${op.newType}`;
    case "require":
      return `! tag ${op.tag} → required`;
  }
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-sm px-1.5 py-0.5 text-overline uppercase",
        ok ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
      )}
    >
      {children} {ok ? "✓" : "✗"}
    </span>
  );
}
