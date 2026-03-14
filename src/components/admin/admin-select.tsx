"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface AdminSelectOption<T extends string | number = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface AdminSelectProps<T extends string | number = string> {
  value: T;
  options: AdminSelectOption<T>[];
  onChange: (value: T) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  header?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
}

export default function AdminSelect<T extends string | number = string>({
  value,
  options,
  onChange,
  name,
  placeholder,
  disabled = false,
  fullWidth = false,
  header,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  ariaLabel,
}: AdminSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const updatePlacement = () => {
      const trigger = buttonRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const margin = 12;

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const openUp = spaceBelow < menuRect.height && spaceAbove > spaceBelow;

      const spaceRight = window.innerWidth - triggerRect.left;
      const spaceLeft = triggerRect.right;
      const alignRight = spaceRight < menuRect.width && spaceLeft > spaceRight;

      setMenuStyle({
        top: openUp ? "auto" : "calc(100% + 0.35rem)",
        bottom: openUp ? "calc(100% + 0.35rem)" : "auto",
        right: alignRight ? 0 : "auto",
        left: alignRight ? "auto" : 0,
        maxHeight: `min(50vh, ${Math.max(180, window.innerHeight - margin * 2)}px)`,
      });
    };

    const raf = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSelect = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const label = selected?.label ?? placeholder ?? "Select";

  return (
    <div
      ref={rootRef}
      className={`admin-select ${className}`}
      data-open={open ? "true" : "false"}
      style={fullWidth ? { width: "100%" } : undefined}
    >
      {name && <input type="hidden" name={name} value={String(value)} />}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        className={`admin-select-trigger ${buttonClassName}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="truncate">{label}</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className={`admin-select-menu ${menuClassName}`}
          role="listbox"
          style={menuStyle}
        >
          {header && (
            <div className="admin-select-header">
              <span>{header}</span>
            </div>
          )}
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className="admin-select-item"
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
