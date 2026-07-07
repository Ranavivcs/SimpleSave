"use client";

/**
 * Upload control for one document requirement in the personal-area מסמכים tab.
 * Sends the file to Supabase Storage via the server action; the row's review
 * status comes back through the server component after revalidation.
 */

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { uploadDocumentAction } from "./actions";

export function UploadRow({
  clientId,
  requirementId,
  type,
  hasFile,
}: {
  clientId: string;
  requirementId: string;
  type: string;
  hasFile: boolean;
}) {
  const t = useTranslations("documents");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setErrorKey(null);
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("requirementId", requirementId);
    formData.set("type", type);
    formData.set("file", file);
    startTransition(async () => {
      try {
        const res = await uploadDocumentAction(formData);
        if (!res.ok) setErrorKey(res.errorKey);
      } catch {
        // transport-level failure (e.g. body over the server-action limit)
        setErrorKey("upload");
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <label
        className={
          "cursor-pointer rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 " +
          (pending ? "pointer-events-none opacity-50" : "")
        }
      >
        {pending ? t("uploading") : t(hasFile ? "replaceFile" : "uploadFile")}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={pending}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {errorKey && <p className="text-xs text-red-600">{t(`uploadErrors.${errorKey}`)}</p>}
    </div>
  );
}
