"use client";

import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type KeyValueRow = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export function emptyRow(): KeyValueRow {
  return { id: crypto.randomUUID(), key: "", value: "", enabled: true };
}

export function rowsToRecord(rows: KeyValueRow[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (row.enabled && key) {
      record[key] = row.value;
    }
  }
  return record;
}

/**
 * Editable list of key/value pairs, used for both headers and query
 * parameters.
 *
 * Rows carry an `enabled` flag rather than being deleted outright, so a header
 * can be toggled off to test without it and switched back on again — which is
 * most of what anyone does in a request editor.
 */
export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
  label,
}: {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
  label: string;
}) {
  function update(id: string, patch: Partial<KeyValueRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function remove(id: string) {
    const next = rows.filter((row) => row.id !== id);
    onChange(next.length > 0 ? next : [emptyRow()]);
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {rows.map((row, index) => (
          <li key={row.id} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(event) => update(row.id, { enabled: event.target.checked })}
              aria-label={`Include ${row.key || `${label} ${index + 1}`}`}
              className="accent-brand-500 size-3.5 shrink-0"
            />
            <Input
              value={row.key}
              onChange={(event) => update(row.id, { key: event.target.value })}
              placeholder={keyPlaceholder}
              aria-label={`${label} ${index + 1} name`}
              className="h-8 flex-1 font-mono text-xs"
            />
            <Input
              value={row.value}
              onChange={(event) => update(row.id, { value: event.target.value })}
              placeholder={valuePlaceholder}
              aria-label={`${label} ${index + 1} value`}
              className="h-8 flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(row.id)}
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => onChange([...rows, emptyRow()])}
      >
        <PlusIcon aria-hidden="true" />
        Add {label.toLowerCase()}
      </Button>
    </div>
  );
}
