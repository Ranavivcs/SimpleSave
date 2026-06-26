"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that reflects the enclosing <form>'s pending state. Lives in its
 * own client component so the surrounding admin pages can stay server components.
 */
export function SubmitButton({
  children,
  className,
  formAction,
  noValidate,
}: {
  children: React.ReactNode;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  noValidate?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      formNoValidate={noValidate}
      disabled={pending}
      className={className}
    >
      {children}
    </button>
  );
}
