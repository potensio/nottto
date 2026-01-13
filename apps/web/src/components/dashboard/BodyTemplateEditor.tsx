"use client";

interface BodyTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

const DEFAULT_TEMPLATE = `{
  "title": "<title>",
  "description": "<description>",
  "url": "<url>",
  "priority": "<priority>"
}`;

export function BodyTemplateEditor({
  value,
  onChange,
  error,
}: BodyTemplateEditorProps) {
  const handleInsertDefault = () => {
    onChange(DEFAULT_TEMPLATE);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          Body Template (JSON)
        </label>
        <button
          type="button"
          onClick={handleInsertDefault}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          Insert example
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter JSON body template with <variables>...\n\nExample:\n${DEFAULT_TEMPLATE}`}
        rows={12}
        className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-neutral-900 placeholder-neutral-400 font-mono focus:outline-none focus:ring-2 transition-all resize-y ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-neutral-200 focus:ring-accent/20 focus:border-accent"
        }`}
      />

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <iconify-icon
            icon="lucide:alert-circle"
            className="text-base mt-0.5 shrink-0"
          ></iconify-icon>
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Use <code className="bg-neutral-100 px-1 rounded">{"<variable>"}</code>{" "}
        syntax to insert annotation data. See available variables in the panel.
      </p>
    </div>
  );
}

export default BodyTemplateEditor;
