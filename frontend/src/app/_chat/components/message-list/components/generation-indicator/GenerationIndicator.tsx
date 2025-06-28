import joinClassNames from "classnames";

import styles from "../message/styles/styles.module.scss";

const TypingIndicator = () => (
    <div className={joinClassNames(styles.message, styles.assistant)}>
        <div className={joinClassNames(styles.bubble, styles.assistantBubble)}>
            <div className={styles.typingIndicator}>
                <div className={styles.pulseDot}></div>
            </div>
        </div>
    </div>
);

export default TypingIndicator;
