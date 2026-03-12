import { useEffect, useRef } from "react";
import styles from "./ColumnSelector.module.css";

export interface ColumnSelectorProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  "aria-label": string;
}

export function ColumnSelector({
  label,
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: ColumnSelectorProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Default to first option when options change and current value is not in list
  useEffect(() => {
    if (options.length > 0 && (!value || !options.includes(value))) {
      onChange(options[0]);
    }
  }, [options, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" && index < options.length - 1) {
      e.preventDefault();
      onChange(options[index + 1]);
      const next = listRef.current?.children[index + 1] as HTMLElement | undefined;
      next?.focus();
    } else if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      onChange(options[index - 1]);
      const prev = listRef.current?.children[index - 1] as HTMLElement | undefined;
      prev?.focus();
    }
  };

  if (options.length === 0) {
    return (
      <div className={styles.root}>
        <span className={styles.label}>{label}</span>
        <div className={styles.empty}>No columns available</div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <span className={styles.label} id={`${label}-heading`}>
        {label}
      </span>
      <ul
        ref={listRef}
        className={styles.list}
        role="listbox"
        aria-label={ariaLabel}
        aria-labelledby={`${label}-heading`}
        tabIndex={-1}
      >
        {options.map((opt, index) => (
          <li
            key={opt}
            role="option"
            aria-selected={value === opt}
            tabIndex={value === opt ? 0 : -1}
            className={value === opt ? styles.itemSelected : styles.item}
            onClick={() => onChange(opt)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {opt}
          </li>
        ))}
      </ul>
    </div>
  );
}
