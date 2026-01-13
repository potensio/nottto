"use client";

import { useState, useEffect } from "react";
import { HeaderEditor } from "./HeaderEditor";
import { BodyTemplateEditor } from "./BodyTemplateEditor";
import { VariableReferencePanel } from "./VariableReferencePanel";
import { validateWebhookUrl, validateJsonTemplate } from "@/lib/validation";
import type {
  WebhookIntegration,
  WebhookIntegrationInput,
  HeaderEntry,
  TestResult,
} from "@/lib/types/integration";

interface IntegrationFormProps {
  projectId: string;
  initialData?: (WebhookIntegrationInput & { locked?: boolean }) | null;
  onSave: (
    data: WebhookIntegrationInput & { locked?: boolean }
  ) => Promise<void>;
  onTest: (
    data: WebhookIntegrationInput & { locked?: boolean }
  ) => Promise<TestResult>;
}

export function IntegrationForm({
  projectId,
  initialData,
  onSave,
  onTest,
}: IntegrationFormProps) {
  // Form state
  const [enabled, setEnabled] = useState(initialData?.enabled ?? false);
  const [locked, setLocked] = useState(initialData?.locked ?? false);
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [headers, setHeaders] = useState<HeaderEntry[]>(() => {
    if (initialData?.headers) {
      return Object.entries(initialData.headers).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value,
      }));
    }
    return [];
  });
  const [bodyTemplate, setBodyTemplate] = useState(
    initialData?.bodyTemplate ?? ""
  );

  // Validation state
  const [urlError, setUrlError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Update form state when initialData changes
  useEffect(() => {
    if (initialData) {
      setEnabled(initialData.enabled ?? false);
      setLocked(initialData.locked ?? false);
      setUrl(initialData.url ?? "");
      setBodyTemplate(initialData.bodyTemplate ?? "");
      if (initialData.headers) {
        setHeaders(
          Object.entries(initialData.headers).map(([key, value]) => ({
            id: crypto.randomUUID(),
            key,
            value,
          }))
        );
      } else {
        setHeaders([]);
      }
    }
  }, [initialData]);

  // Clear test result after 5 seconds
  useEffect(() => {
    if (testResult) {
      const timer = setTimeout(() => setTestResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [testResult]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate URL
    const urlValidation = validateWebhookUrl(url);
    if (!urlValidation.isValid) {
      setUrlError(urlValidation.error || "Invalid URL");
      isValid = false;
    } else {
      setUrlError(null);
    }

    // Validate body template
    const bodyValidation = validateJsonTemplate(bodyTemplate);
    if (!bodyValidation.isValid) {
      setBodyError(bodyValidation.error || "Invalid JSON");
      isValid = false;
    } else {
      setBodyError(null);
    }

    return isValid;
  };

  const getFormData = (): WebhookIntegrationInput & { locked: boolean } => {
    // Convert headers array to Record
    const headersRecord: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key.trim()) {
        headersRecord[h.key.trim()] = h.value;
      }
    });

    return {
      url: url.trim(),
      headers: headersRecord,
      bodyTemplate: bodyTemplate,
      enabled,
      locked,
    };
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(getFormData());
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to save integration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!validateForm()) return;

    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(getFormData());
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <iconify-icon
            icon="lucide:check-circle"
            className="text-green-600 text-xl"
          ></iconify-icon>
          <span className="text-green-800">
            Integration saved successfully!
          </span>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div
          className={`p-4 border rounded-lg flex items-center gap-3 ${
            testResult.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <iconify-icon
            icon={
              testResult.success ? "lucide:check-circle" : "lucide:alert-circle"
            }
            className={`text-xl ${
              testResult.success ? "text-green-600" : "text-red-600"
            }`}
          ></iconify-icon>
          <div>
            <span
              className={testResult.success ? "text-green-800" : "text-red-800"}
            >
              {testResult.message}
            </span>
            {testResult.statusCode && (
              <span className="ml-2 text-sm opacity-75">
                (Status: {testResult.statusCode})
              </span>
            )}
          </div>
        </div>
      )}

      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Endpoint URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          disabled={locked}
          placeholder="https://api.example.com/webhook"
          className={`w-full px-4 py-3 bg-white border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all ${
            urlError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-200 focus:ring-accent/20 focus:border-accent"
          } ${locked ? "bg-neutral-100 cursor-not-allowed opacity-60" : ""}`}
        />
        {urlError && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <iconify-icon
              icon="lucide:alert-circle"
              className="text-base"
            ></iconify-icon>
            {urlError}
          </p>
        )}
        <p className="mt-2 text-xs text-neutral-500">
          Must be a valid HTTPS URL
        </p>
      </div>

      {/* Headers */}
      <div className={locked ? "opacity-60 pointer-events-none" : ""}>
        <HeaderEditor headers={headers} onChange={setHeaders} />
      </div>

      {/* Body Template and Variables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`lg:col-span-2 ${
            locked ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <BodyTemplateEditor
            value={bodyTemplate}
            onChange={(value) => {
              setBodyTemplate(value);
              if (bodyError) setBodyError(null);
            }}
            error={bodyError}
          />
        </div>
        <div>
          <VariableReferencePanel />
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-neutral-200" />

      {/* Toggle Controls - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between md:pr-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-900">
              Webhook Integration
            </h3>
            <p className="text-sm text-neutral-500">
              Send annotation events to an external endpoint
            </p>
          </div>
          <button
            type="button"
            onClick={() => !locked && setEnabled(!enabled)}
            disabled={locked}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
              enabled ? "bg-accent" : "bg-neutral-300"
            } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Lock Toggle */}
        <div className="flex items-center justify-between md:pl-6 md:border-l md:border-neutral-200">
          <div>
            <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <iconify-icon
                icon={locked ? "lucide:lock" : "lucide:unlock"}
                className={locked ? "text-amber-600" : "text-neutral-400"}
              ></iconify-icon>
              Lock Configuration
            </h3>
            <p className="text-sm text-neutral-500">
              {locked ? "Configuration is locked" : "Lock to prevent changes"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLocked(!locked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
              locked ? "bg-amber-500" : "bg-neutral-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                locked ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-neutral-200 justify-end">
        <button
          type="button"
          onClick={handleTest}
          disabled={isTesting || !url || locked}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isTesting ? (
            <>
              <iconify-icon
                icon="lucide:loader"
                className="animate-spin"
              ></iconify-icon>
              Testing...
            </>
          ) : (
            <>
              <iconify-icon icon="ph:test-tube" height={16}></iconify-icon>
              Test Integration
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || locked}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <iconify-icon icon="ph:floppy-disk" height={16}></iconify-icon>
              Save Config
            </>
          )}
        </button>

        {locked && (
          <span className="text-sm text-amber-600 flex items-center gap-1">
            <iconify-icon icon="lucide:lock"></iconify-icon>
            Unlock to make changes
          </span>
        )}
      </div>
    </div>
  );
}

export default IntegrationForm;
