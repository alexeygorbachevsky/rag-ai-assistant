import { ComponentProps, FC } from "react";
import joinClassNames from "classnames";

import styles from "./styles/styles.module.scss";

interface Props extends Omit<ComponentProps<"input">, "type" | "onChange"> {
    label: string;
    name: string;
    value: string;
    checked: boolean;
    onChange: (value: string) => void;
    classNames?: Partial<{ wrapper?: string; input?: string; label?: string }>;
}

const RadioButton: FC<Props> = ({
    label,
    name,
    value,
    checked,
    onChange,
    className,
    classNames = {},
    ...props
}) => (
    <label className={joinClassNames(styles.radioLabel, classNames.wrapper, className)}>
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={() => onChange(value)}
            className={joinClassNames(styles.radioInput, classNames.input)}
            {...props}
        />
        <span className={joinClassNames(styles.radioText, classNames.label)}>{label}</span>
    </label>
);

export default RadioButton; 