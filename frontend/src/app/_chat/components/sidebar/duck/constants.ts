import { ChatMode } from "constants/chat";
import { LanguageModels } from "constants/models";

export const CHAT_MODE_OPTIONS = [
    { value: ChatMode["general-chat"], label: "General Chat" },
    { value: ChatMode["mia-collection"], label: "MIA collection" },
];

export const LANGUAGE_MODEL_OPTIONS = Object.values(LanguageModels).map(model => ({
    value: model,
    label: model.replace(/[-:]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
}));
