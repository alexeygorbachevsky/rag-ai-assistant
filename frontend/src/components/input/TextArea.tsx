import { ComponentProps, ReactNode, RefObject, useLayoutEffect, useRef } from "react";
import joinClassNames from "classnames";

import styles from "./styles/styles.module.scss";

interface Props extends ComponentProps<"textarea"> {
    textareaId: string;
    label?: string;
    error?: string;
    className?: string;
    classNames?: Partial<{ label?: string; textarea?: string; container?: string }>;
    after?: ReactNode;
    ref: RefObject<HTMLTextAreaElement | null>;
}

const TextArea = ({ label, error, className, textareaId, after, classNames = {}, ref, ...props }: Props) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = (ref || localRef) as RefObject<HTMLTextAreaElement>;

    useLayoutEffect(() => {
        const textarea = inputRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 144;

            if (scrollHeight <= maxHeight) {
                textarea.style.height = `${scrollHeight}px`;
                textarea.style.overflowY = "hidden";
            } else {
                textarea.style.height = `${maxHeight}px`;
                textarea.style.overflowY = "auto";
            }
        }
    }, [props.value, inputRef]);

    return (
        <div className={className}>
            {label && (
                <label className={joinClassNames(styles.label, classNames.label)} htmlFor={textareaId}>
                    {label}
                </label>
            )}
            <div className={classNames.container}>
                <textarea
                    className={joinClassNames(styles.textarea, classNames.textarea)}
                    data-error={Boolean(error)}
                    id={textareaId}
                    ref={inputRef}
                    {...props}
                />
                {after}
            </div>
            {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
    );
};

export default TextArea;
