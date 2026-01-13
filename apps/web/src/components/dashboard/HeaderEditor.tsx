"use client";

import { type HeaderEntry } from "@/lib/types/integration";

interface HeaderEditorProps {
  headers: HeaderEntry[];
  onChange: (headers: HeaderEntry[]) => void;
}

export function HeaderEditor({ headers, onChange }: HeaderEditorProps) {
  const addHeader = () => {
    const newHeader: HeaderEntry = {
      id: crypto.randomUUID(),
      key: "",
      value: "",
    };
    onChange([...headers, newHeader]);
  };

  const updateHeader = (id: string, field: "key" | "value", value: string) => {
    onChange(
      headers.map((header) =>
        header.id === id ? { ...header, [field]: value } : header
      )
    );
  };

  const removeHeader = (id: string) => {
    onChange(headers.filter((header) => header.id !== id));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        HTTP Headers
      </label>

      {headers.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">
          No custom headers configured. Content-Type: application/json will be
          sent by default.
        </p>
      ) : (
        <div className="space-y-2">
          {headers.map((header) => (
            <div key={header.id} className="flex items-center gap-2">
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(header.id, "key", e.target.value)}
                placeholder="Header name"
                className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) =>
                  updateHeader(header.id, "value", e.target.value)
                }
                placeholder="Header value"
                className="flex-[2] px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <button
                type="button"
                onClick={() => removeHeader(header.id)}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove header"
              >
                <iconify-icon
                  icon="lucide:x"
                  className="text-lg"
                ></iconify-icon>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addHeader}
        className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
      >
        <iconify-icon icon="lucide:plus" className="text-base"></iconify-icon>
        Add Header
      </button>
    </div>
  );
}

export default HeaderEditor;
