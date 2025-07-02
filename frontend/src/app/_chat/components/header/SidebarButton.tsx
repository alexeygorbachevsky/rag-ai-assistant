"use client";

import SidebarIcon from "icons/sidebar.svg";

import { useAppContext } from "contexts/AppContext";

import styles from "./styles/styles.module.scss";

const SidebarButton = () => {
    const { isSidebarOpened, toggleSidebar } = useAppContext();

    if (isSidebarOpened) {
        return null;
    }

    return (
        <button className={styles.sidebarButton} onClick={toggleSidebar}>
            <SidebarIcon />
        </button>
    );
};

export default SidebarButton;
