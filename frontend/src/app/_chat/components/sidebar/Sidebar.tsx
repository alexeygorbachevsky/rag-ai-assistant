import { useRef, useCallback } from "react";
import joinClassNames from "classnames";

import { Dropdown } from "components";
import SidebarIcon from "icons/sidebar.svg";

import { ChatMode } from "constants/chat";

import styles from "./styles/styles.module.scss";

interface SidebarProps {
    isOpened: boolean;
    onToggle: () => void;
    onSendRagData?: (files: File[]) => void;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
}

const Sidebar = ({ isOpened, onToggle, chatMode, onChatModeChange }: SidebarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    // const [isDragOver, setIsDragOver] = useState(false);

    // const handleFileSelect = (files: File[]) => {
    //     if (files.length > 0) {
    //         setSelectedFiles(prev => [...prev, ...files]);
    //     }
    // }

    // const handleDragOver = (e: DragEvent) => {
    //     e.preventDefault();
    //     setIsDragOver(true);
    // }
    //
    // const handleDragLeave = (e: DragEvent) => {
    //     e.preventDefault();
    //     setIsDragOver(false);
    // }
    //
    // const handleDrop = (e: DragEvent) => {
    //     e.preventDefault();
    //     setIsDragOver(false);
    //
    //     const items = Array.from(e.dataTransfer.items);
    //     const files: File[] = [];
    //
    //     const processItems = async () => {
    //         for (const item of items) {
    //             if (item.kind === "file") {
    //                 const file = item.getAsFile();
    //                 if (file) {
    //                     files.push(file);
    //                 }
    //             }
    //         }
    //
    //         if (files.length > 0) {
    //             handleFileSelect(files);
    //         }
    //     };
    //
    //     processItems();
    // }
    //
    // const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    //     const files = e.target.files;
    //
    //     if (files?.length) {
    //         const fileArray = Array.from(files);
    //         handleFileSelect(fileArray);
    //     }
    // }
    //
    // const handleRemoveFile = (index: number) => {
    //     setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    //     if (fileInputRef.current) {
    //         fileInputRef.current.value = "";
    //     }
    // }
    //
    // const handleRemoveAllFiles = () => {
    //     setSelectedFiles([]);
    //     if (fileInputRef.current) {
    //         fileInputRef.current.value = "";
    //     }
    // }
    //
    // const handleSend = () => {
    //     if (onSendRagData && selectedFiles.length > 0) {
    //         onSendRagData(selectedFiles);
    //     }
    // }
    //
    // const handleOpenFileDialog = () => {
    //     fileInputRef.current?.click();
    // }

    const handleModeChange = useCallback(
        (mode: ChatMode) => {
            onChatModeChange(mode);
            // if (mode !== "user-collection") {
            // setSelectedFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            // }
        },
        [onChatModeChange],
    );

    return (
        <>
            {isOpened && <div className={styles.overlay} onClick={onToggle} />}
            <aside className={joinClassNames(styles.sidebar, isOpened ? styles.openedSidebar : styles.closedSidebar)}>
                <button className={styles.closedSidebarButton} onClick={onToggle}>
                    <SidebarIcon />
                </button>

                <div className={styles.content}>
                    <div className={styles.chatModeSection}>
                        <label className={styles.sectionLabel}>Chat mode:</label>
                        <Dropdown
                            options={[
                                { value: ChatMode["general-chat"], label: "General Chat" },
                                { value: ChatMode["mia-collection"], label: "MIA collection" },
                                // { value: ChatMode["user-collection"], label: "Your files" },
                            ]}
                            value={chatMode}
                            onChange={handleModeChange}
                        />
                    </div>
                    {/*{chatMode === ChatMode["user-collection"] && (*/}
                    {/*    <div className={styles.fileSection}>*/}
                    {/*        <label className={styles.label}>Upload Files or Folders</label>*/}
                    {/*        <div*/}
                    {/*            className={joinClassNames(styles.dropZone, {*/}
                    {/*                [styles.dragOver]: isDragOver,*/}
                    {/*                [styles.hasFile]: selectedFiles.length > 0,*/}
                    {/*            })}*/}
                    {/*            onDragOver={handleDragOver}*/}
                    {/*            onDragLeave={handleDragLeave}*/}
                    {/*            onDrop={handleDrop}*/}
                    {/*            onClick={handleOpenFileDialog}*/}
                    {/*        >*/}
                    {/*            {selectedFiles.length > 0 ? (*/}
                    {/*                <div className={styles.filesList}>*/}
                    {/*                    {selectedFiles.map((file, index) => (*/}
                    {/*                        <div key={index} className={styles.fileInfo}>*/}
                    {/*                            <span className={styles.fileName}>{file.name}</span>*/}
                    {/*                            <button*/}
                    {/*                                className={styles.removeFileButton}*/}
                    {/*                                onClick={(e) => {*/}
                    {/*                                    e.stopPropagation();*/}
                    {/*                                    handleRemoveFile(index);*/}
                    {/*                                }}*/}
                    {/*                            >*/}
                    {/*                                <CrossIcon />*/}
                    {/*                            </button>*/}
                    {/*                        </div>*/}
                    {/*                    ))}*/}
                    {/*                    {selectedFiles.length > 1 && (*/}
                    {/*                        <button*/}
                    {/*                            className={styles.removeAllButton}*/}
                    {/*                            onClick={(e) => {*/}
                    {/*                                e.stopPropagation();*/}
                    {/*                                handleRemoveAllFiles();*/}
                    {/*                            }}*/}
                    {/*                        >*/}
                    {/*                            Remove All*/}
                    {/*                        </button>*/}
                    {/*                    )}*/}
                    {/*                </div>*/}
                    {/*            ) : (*/}
                    {/*                <div className={styles.dropZoneContent}>*/}
                    {/*                    <span className={styles.dropZoneText}>*/}
                    {/*                        Click to select or drag & drop files/folders*/}
                    {/*                    </span>*/}
                    {/*                </div>*/}
                    {/*            )}*/}
                    {/*        </div>*/}
                    {/*        <input*/}
                    {/*            ref={fileInputRef}*/}
                    {/*            type="file"*/}
                    {/*            className={styles.hiddenFileInput}*/}
                    {/*            onChange={handleFileInputChange}*/}
                    {/*            multiple*/}
                    {/*        />*/}
                    {/*        <button*/}
                    {/*            className={styles.sendButton}*/}
                    {/*            onClick={handleSend}*/}
                    {/*            disabled={selectedFiles.length === 0}*/}
                    {/*        >*/}
                    {/*            Send RAG Data*/}
                    {/*        </button>*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
