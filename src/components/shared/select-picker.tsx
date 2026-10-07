"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type PickerOption<Value extends string> = {
  value: Value;
  label: string;
};

type Props<Value extends string> = {
  accessibilityLabel: string;
  className?: string;
  icon?: ReactNode;
  label?: string;
  onChange: (value: Value) => void;
  options: readonly PickerOption<Value>[];
  value: Value;
};

export function SelectPicker<Value extends string>({
  accessibilityLabel,
  className = "",
  icon,
  label,
  onChange,
  options,
  value,
}: Props<Value>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !pickerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function toggleOptions() {
    if (!open) setActiveIndex(Math.max(0, selectedIndex));
    setOpen((previous) => !previous);
  }

  function chooseOption(option: PickerOption<Value>) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleOptionsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      setActiveIndex((current) => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return options.length - 1;
        return (
          (current +
            (event.key === "ArrowDown" ? 1 : -1) +
            options.length) %
          options.length
        );
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) chooseOption(option);
    }
  }

  return (
    <div
      className={`select-picker ${className}`.trim()}
      ref={pickerRef}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setOpen(false);
        }
      }}
    >
      {label && <span className="select-picker-label">{label}</span>}
      <button
        className="select-picker-trigger"
        type="button"
        aria-label={accessibilityLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        ref={triggerRef}
        onClick={toggleOptions}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setActiveIndex(Math.max(0, selectedIndex));
            setOpen(true);
          }
        }}
      >
        {icon}
        <span className="select-picker-value">
          {selectedOption?.label ?? ""}
        </span>
        <svg
          className={`select-picker-chevron ${open ? "select-picker-chevron-open" : ""}`}
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div
          className="select-picker-options"
          id={listboxId}
          role="listbox"
          aria-label={accessibilityLabel}
          onKeyDown={handleOptionsKeyDown}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              className={`select-picker-option ${value === option.value ? "select-picker-option-active" : ""}`}
              type="button"
              role="option"
              aria-selected={value === option.value}
              tabIndex={activeIndex === index ? 0 : -1}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              onFocus={() => setActiveIndex(index)}
              onClick={() => chooseOption(option)}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <svg
                  className="select-picker-check"
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path d="m3 8 3.2 3.2L13 4.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
