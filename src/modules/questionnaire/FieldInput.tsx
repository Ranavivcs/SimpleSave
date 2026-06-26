"use client";

/**
 * Renders a single questionnaire field by type — driven entirely by the field
 * definition from the 3A engine. Scalar inputs and table rows share one
 * `ScalarControl`. Labels/options/errors resolve via the passed i18n `t`
 * (keys only; no hardcoded strings).
 */

import type {
  Field,
  ScalarField,
  ValidationError,
  AnswerValue,
  ScalarAnswer,
  TableRow,
} from "@/lib/questionnaire";

export type TFn = (key: string, values?: Record<string, string | number>) => string;

const inputCls = (err?: boolean) =>
  "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-600 focus:outline-none " +
  (err ? "border-red-400" : "border-slate-300");

/** One scalar input (text/number/date/yesno/choice/range). Reused in table cells. */
function ScalarControl({
  field,
  value,
  onChange,
  t,
  err,
}: {
  field: ScalarField;
  value: unknown;
  onChange: (v: ScalarAnswer) => void;
  t: TFn;
  err?: boolean;
}) {
  switch (field.type) {
    case "number":
    case "range":
      return (
        <input
          type="number"
          className={inputCls(err)}
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
          className={inputCls(err)}
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
          className={inputCls(err)}
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
              {t(b ? "wizard.yes" : "wizard.no")}
            </button>
          ))}
        </div>
      );
    case "choice":
      return (
        <select
          className={inputCls(err)}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">{t("wizard.choose")}</option>
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

/** Repeating-row table: add/remove rows; each cell is a ScalarControl. */
function TableControl({
  field,
  value,
  onChange,
  t,
}: {
  field: Extract<Field, { type: "table" }>;
  value: unknown;
  onChange: (v: TableRow[]) => void;
  t: TFn;
}) {
  const rows: TableRow[] = Array.isArray(value) ? (value as TableRow[]) : [];
  const setCell = (i: number, col: string, v: ScalarAnswer) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [col]: v } : r)));

  return (
    <div className="mt-1 space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {field.columns.map((col) => (
              <label key={col.id} className="text-xs font-medium text-slate-600">
                {t(col.labelKey)}
                <ScalarControl
                  field={col}
                  value={row[col.id]}
                  onChange={(v) => setCell(i, col.id, v)}
                  t={t}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="mt-2 text-xs font-medium text-red-600 hover:underline"
          >
            {t("wizard.removeRow")}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, {}])}
        className="rounded-lg border border-dashed border-brand-400 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
      >
        + {field.addRowLabelKey ? t(field.addRowLabelKey) : t("wizard.addRow")}
      </button>
    </div>
  );
}

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

      {field.type === "table" ? (
        <TableControl field={field} value={value} onChange={onChange} t={t} />
      ) : (
        <ScalarControl field={field} value={value} onChange={onChange} t={t} err={!!error} />
      )}

      {errText && <p className="mt-1 text-xs text-red-600">{errText}</p>}
    </div>
  );
}
