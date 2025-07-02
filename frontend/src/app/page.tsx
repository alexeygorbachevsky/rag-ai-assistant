import { redirect } from "next/navigation";

import { ChatProvider } from "contexts/ChatContext";

import { ChatMode } from "constants/chat";
import { LanguageModels } from "constants/models";

import MainArea from "./_chat/components/main-area/MainArea";
import Header from "./_chat/components/header";
import Sidebar from "./_chat/components/sidebar";
import Chat from "./_chat/components/chat";

import styles from "./_chat/components/chat/styles/styles.module.scss";

interface PageProps {
    searchParams: Promise<{
        mode?: string;
        model?: string;
    }>;
}

const ChatPage = async ({ searchParams }: PageProps) => {
    const { mode, model } = await searchParams;

    const currentMode = ChatMode[mode as keyof typeof ChatMode];
    const currentModel = LanguageModels[model as keyof typeof LanguageModels];

    if (!currentMode || !currentModel) {
        const chatMode = currentMode || ChatMode["mia-collection"];
        const languageModel = currentModel || LanguageModels["deepseek-chat-v3-0324"];

        redirect(`?mode=${chatMode}&model=${languageModel}`);
    }

    return (
        <ChatProvider>
            <div className={styles.wrapper}>
                <Sidebar />
                <MainArea>
                    <Header />
                    <Chat />
                </MainArea>
            </div>
        </ChatProvider>
    );
};

export default ChatPage;
