"use client";

import joinClassNames from "classnames";

import SidebarIcon from "icons/sidebar.svg";

import { Dropdown } from "components";

import { ChatMode } from "constants/chat";

import { CHAT_MODE_OPTIONS, LANGUAGE_MODEL_OPTIONS } from "./duck/constants";

import { useAppContext } from "contexts/AppContext";
import { useChatContext } from "contexts/ChatContext";

import styles from "./styles/styles.module.scss";

const Sidebar = () => {
    const { isSidebarOpened, toggleSidebar } = useAppContext();
    const { onChatModeChange, onDeleteChats, onModelChange, selectedModel, chatMode } = useChatContext();

    const handleModeChange = (mode: ChatMode) => {
        onChatModeChange(mode);
    };

    const handleDeleteChats = () => {
        onDeleteChats();
    };

    return (
        <>
            {isSidebarOpened && <div className={styles.overlay} onClick={toggleSidebar} />}
            <aside
                className={joinClassNames(
                    styles.sidebar,
                    isSidebarOpened ? styles.openedSidebar : styles.closedSidebar,
                )}
            >
                <button className={styles.closedSidebarButton} onClick={toggleSidebar}>
                    <SidebarIcon />
                </button>

                <div className={styles.content}>
                    <div className={styles.chatModeSection}>
                        <label className={styles.sectionLabel}>Language model:</label>
                        <Dropdown options={LANGUAGE_MODEL_OPTIONS} value={selectedModel} onChange={onModelChange} />
                    </div>
                    <div className={styles.chatModeSection}>
                        <label className={styles.sectionLabel}>Chat mode:</label>
                        <Dropdown options={CHAT_MODE_OPTIONS} value={chatMode} onChange={handleModeChange} />
                    </div>

                    {chatMode === ChatMode["mia-collection"] && (
                        <div className={styles.miaInfoSection}>
                            <div className={styles.miaInfoContent}>
                                <div className={styles.miaInfoHeader}>
                                    <h4 className={styles.miaInfoTitle}>MIA Collection Mode</h4>
                                </div>
                                <p className={styles.miaInfoText}>
                                    You&apos;re now in collection mode! Ask questions about artworks from the
                                    Minneapolis Institute of Art collection.
                                </p>
                                <a
                                    href="https://github.com/artsmia/collection/tree/main"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.miaRepoLink}
                                >
                                    View Collection Data →
                                </a>
                            </div>
                        </div>
                    )}

                    <button className={styles.deleteChatButton} onClick={handleDeleteChats}>
                        Delete chat
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
