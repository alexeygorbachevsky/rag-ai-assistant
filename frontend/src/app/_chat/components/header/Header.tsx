import styles from "./styles/styles.module.scss";

import SidebarButton from "./SidebarButton";

const Header = () => (
    <header className={styles.header}>
        <SidebarButton />
        <h1 className={styles.headerTitle}>RAG AI Assistant</h1>
    </header>
);

export default Header;
