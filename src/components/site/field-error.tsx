// Small red message shown under a form field. role="alert" makes screen readers
// announce it. The matching input should set aria-invalid and aria-describedby.
export function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
