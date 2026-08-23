"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
	triggerId?: string;
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
	triggerId,
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
			const target = event.target as Node;
			if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
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
				position: "fixed",
				top: openUp ? "auto" : triggerRect.bottom + 4,
				bottom: openUp ? window.innerHeight - triggerRect.top + 4 : "auto",
				left: alignRight ? "auto" : triggerRect.left,
				right: alignRight ? window.innerWidth - triggerRect.right : "auto",
				minWidth: triggerRect.width,
				width: fullWidth ? triggerRect.width : "auto",
				zIndex: 9999,
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
	}, [open, fullWidth]);

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
				id={triggerId}
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
			{open && typeof document !== "undefined" && createPortal(
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
							onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(option.value);
                            }}
						>
							<span>{option.label}</span>
						</button>
					))}
				</div>,
				document.body
			)}
		</div>
	);
}
