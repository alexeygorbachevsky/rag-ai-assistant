import { ComponentProps, FC, ReactNode, RefObject } from "react";
import joinClassNames from "classnames";

import { Sizes } from "./duck/types";

import styles from "./styles/styles.module.scss";

interface Props extends Omit<ComponentProps<"input">, "size"> {
    ref?: RefObject<HTMLInputElement>;
    error?: string | null;
    label?: string;
    classNames?: Partial<{ wrapper?: string; inputWrapper?: string; input?: string }>;
    before?: ReactNode;
    after?: ReactNode;
    size?: Sizes;
    isErrorText?: boolean;
}

const Input: FC<Props> = ({
    ref,
    error,
    className,
    classNames = {},
    label,
    after,
    before,
    size = "md",
    isErrorText = true,
    ...props
}) => (
    <div data-size={size} className={joinClassNames(classNames.wrapper, styles.sizePresets, className)}>
        {label && <p className={styles.label}>{label}</p>}
        <label
            data-disabled={props.disabled}
            data-error={Boolean(error)}
            className={joinClassNames(styles.inputWrapper, classNames.inputWrapper)}
        >
            {before}
            <input className={joinClassNames(styles.input, classNames.input)} ref={ref} {...props} />
            {after}
        </label>
        {isErrorText && Boolean(error) && <p className={styles.errorMessage}>{error}</p>}
    </div>
);

export default Input;
