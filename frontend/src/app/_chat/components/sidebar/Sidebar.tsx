import joinClassNames from "classnames";

import SidebarIcon from "icons/sidebar.svg";

import { Dropdown } from "components";

import { ChatMode } from "constants/chat";
import { LanguageModels } from "constants/models";

import { CHAT_MODE_OPTIONS, LANGUAGE_MODEL_OPTIONS } from "./duck/constants";

import styles from "./styles/styles.module.scss";

interface Props {
    isOpened: boolean;
    onToggle: () => void;
    onSendRagData?: (files: File[]) => void;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
    selectedModel: LanguageModels;
    onModelChange: (model: LanguageModels) => void;
    onDeleteChats: () => void;
}

const Sidebar = ({
    isOpened,
    onToggle,
    chatMode,
    onChatModeChange,
    selectedModel,
    onModelChange,
    onDeleteChats,
}: Props) => {
    const handleModeChange = (mode: ChatMode) => {
        onChatModeChange(mode);
    };

    const handleDeleteChats = () => {
        onDeleteChats();
    };

    return (
        <>
            {isOpened && <div className={styles.overlay} onClick={onToggle} />}
            <aside className={joinClassNames(styles.sidebar, isOpened ? styles.openedSidebar : styles.closedSidebar)}>
                <button className={styles.closedSidebarButton} onClick={onToggle}>
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
