import { ReactNode, useState, useRef, useEffect } from "react";
import joinClassNames from "classnames";

import styles from "./styles/styles.module.scss";

interface DropdownOption<T> {
    value: T;
    label: string;
    icon?: ReactNode;
    description?: string;
}

interface DropdownProps<T> {
    options: DropdownOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

const Dropdown = <T,>({ options, value, onChange, className }: DropdownProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(option => option.value === value);
    const selectedIndex = options.findIndex(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        if (!isOpen) {
            setIsOpen(true);
            setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        } else {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'Tab':
                if (isOpen) {
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                }
                break;
            case 'Escape':
                if (isOpen) {
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                }
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (isOpen) {
                    if (highlightedIndex >= 0) {
                        onChange(options[highlightedIndex].value);
                        setIsOpen(false);
                        setHighlightedIndex(-1);
                    }
                } else {
                    handleToggle();
                }
                break;
            case "ArrowDown":
                event.preventDefault();
                if (!isOpen) {
                    handleToggle();
                } else {
                    setHighlightedIndex(prev => 
                        prev < options.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen) {
                    handleToggle();
                } else {
                    setHighlightedIndex(prev => 
                        prev > 0 ? prev - 1 : options.length - 1
                    );
                }
                break;
        }
    };

    const handleOptionClick = (optionValue: T) => {
        onChange(optionValue);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleOptionMouseEnter = (index: number) => {
        setHighlightedIndex(index);
    };

    return (
        <div 
            ref={dropdownRef}
            className={joinClassNames(styles.dropdown, className)}
        >
            <button
                type="button"
                className={joinClassNames(styles.trigger, { [styles.open]: isOpen })}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
            >
                <span className={styles.selectedText}>
                    {selectedOption?.label || 'Select option'}
                </span>
                <svg
                    className={joinClassNames(styles.arrow, { [styles.rotated]: isOpen })}
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className={styles.options}>
                    {options.map((option, index) => (
                        <button
                            key={String(option.value)}
                            type="button"
                            className={joinClassNames(styles.option, {
                                [styles.highlighted]: index === highlightedIndex
                            })}
                            onClick={() => handleOptionClick(option.value)}
                            onMouseEnter={() => handleOptionMouseEnter(index)}
                        >
                            <span className={styles.optionText}>{option.label}</span>
                            {option.value === value && (
                                <svg
                                    className={styles.checkmark}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M13.5 4.5L6 12L2.5 8.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown; 