"use client";

/**
 * Renders a single questionnaire field by type. Generic — driven entirely by
 * the field definition from the 3A engine. Labels/options/errors resolve via
 * the passed i18n `t` (keys only; no hardcoded strings here).
 */

import type { Field, ValidationError, AnswerValue } from "@/lib/questionnaire";

export type TFn = (key: string, values?: Record<string, string | number>) => string;

export function FieldInput({
  field,
  value,
  onChange,
  error,
  t,
}: {
  field: Field;
  value: unknown;
  onChange: (v: AnswerValue) => void;
  error?: ValidationError;
  t: TFn;
}) {
  const errText = error ? t(error.messageKey, error.params) : undefined;
  const base =
    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-600 focus:outline-none " +
    (error ? "border-red-400" : "border-slate-300");

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-slate-800">
          {t(field.labelKey)}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        {field.helpKey && (
          <span className="group relative inline-flex">
            <span
              tabIndex={0}
              aria-label={t(field.helpKey)}
              className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-white"
            >
              ?
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute top-6 start-0 z-10 hidden w-60 rounded-lg bg-slate-800 px-3 py-2 text-xs leading-relaxed text-white shadow-lg group-hover:block group-focus-within:block"
            >
              {t(field.helpKey)}
            </span>
          </span>
        )}
      </div>
      {control()}
      {errText && <p className="mt-1 text-xs text-red-600">{errText}</p>}
    </div>
  );

  function control() {
    switch (field.type) {
      case "number":
      case "range":
        return (
          <input
            type="number"
            className={base}
            value={typeof value === "number" ? value : ""}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
        );
      case "date":
        return (
          <input
            type="date"
            className={base}
            value={typeof value === "string" ? value : ""}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(e.target.value || null)}
          />
        );
      case "text":
        return (
          <input
            type="text"
            className={base}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "yesno":
        return (
          <div className="mt-1 flex gap-2">
            {[true, false].map((b) => (
              <button
                key={String(b)}
                type="button"
                onClick={() => onChange(b)}
                className={
                  "rounded-lg border px-4 py-1.5 text-sm " +
                  (value === b
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-brand-500")
                }
              >
                {t(b ? "demo.yes" : "demo.no")}
              </button>
            ))}
          </div>
        );
      case "choice":
        return (
          <select
            className={base}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">{t("demo.choose")}</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  }
}
