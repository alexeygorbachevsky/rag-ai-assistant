import SidebarIcon from "icons/sidebar.svg";

import styles from "./styles/styles.module.scss";

interface Props {
    isSidebarOpened: boolean;
    onToggleSidebar: () => void;
}

const Header = ({ isSidebarOpened, onToggleSidebar }: Props) => (
    <header className={styles.header}>
        {!isSidebarOpened && (
            <button className={styles.sidebarButton} onClick={onToggleSidebar}>
                <SidebarIcon />
            </button>
        )}
        <h1 className={styles.headerTitle}>RAG AI Assistant</h1>
    </header>
);

export default Header;
