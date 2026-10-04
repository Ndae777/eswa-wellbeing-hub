import { useRef } from "react";

import { FieldError } from "@/components/site/field-error";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  label: string;
  max: number;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Words under the first and last circle, for example "Very calm" and "Overwhelmed". */
  lowLabel?: string;
  highLabel?: string;
  /** One short word under each circle (only for short scales such as 1 to 5). */
  stepLabels?: string[];
  /** Larger circles for the main question. */
  large?: boolean;
  error?: string | undefined;
};

// A row of circles. Pick one; pick it again to clear it. It works with a mouse,
// a finger and the keyboard (arrow keys move, Space or Enter picks).
export function ScaleInput({
  id,
  label,
  max,
  value,
  onChange,
  lowLabel,
  highLabel,
  stepLabels,
  large = false,
  error,
}: Props) {
  const group = useRef<HTMLDivElement>(null);
  const options = Array.from({ length: max }, (_, index) => index + 1);
  const size = large ? "h-14 w-14 text-lg" : "h-11 w-11 text-base";
  const columns = max > 5 ? "grid-cols-5 sm:grid-cols-10" : "grid-cols-5";

  function move(from: number, step: number) {
    const next = Math.min(max, Math.max(1, from + step));
    onChange(next);
    const buttons = group.current?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[next - 1]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, option: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      move(option, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      move(option, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      move(1, 0);
    } else if (event.key === "End") {
      event.preventDefault();
      move(max, 0);
    }
  }

  return (
    <div className="space-y-3" id={id} tabIndex={-1}>
      <Label id={`${id}-label`}>{label}</Label>
      <div
        ref={group}
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`grid gap-x-2 gap-y-3 ${columns} ${large ? "max-w-md" : "max-w-xl"}`}
      >
        {options.map((option) => {
          const selected = value === option;
          // Circles get a little stronger from left to right, so the row reads as a scale.
          const tint = 6 + Math.round(((option - 1) / Math.max(max - 1, 1)) * 26);
          return (
            <div key={option} className="flex flex-col items-center gap-1">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={
                  stepLabels?.[option - 1] ? `${option}, ${stepLabels[option - 1]}` : String(option)
                }
                tabIndex={selected || (value === null && option === 1) ? 0 : -1}
                onClick={() => onChange(selected ? null : option)}
                onKeyDown={(event) => onKeyDown(event, option)}
                style={
                  selected
                    ? undefined
                    : {
                        backgroundColor: `color-mix(in oklab, var(--primary) ${tint}%, var(--card))`,
                      }
                }
                className={`${size} rounded-full border-2 font-display font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  selected
                    ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lift"
                    : "border-primary/25 text-foreground hover:scale-105 hover:border-primary/60"
                }`}
              >
                {option}
              </button>
              {stepLabels?.[option - 1] && (
                <span
                  className={`hidden text-center text-xs sm:block ${
                    selected ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stepLabels[option - 1]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div
          className={`flex justify-between text-xs text-muted-foreground ${large ? "max-w-md" : "max-w-xl"}`}
        >
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {value === null ? "Nothing chosen" : `You chose ${value} out of ${max}`}
      </p>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
