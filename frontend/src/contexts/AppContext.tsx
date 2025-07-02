"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
    isSidebarOpened: boolean;
    toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
    const [isSidebarOpened, setIsSidebarOpened] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpened(prev => !prev);
    };

    const value: AppContextType = {
        isSidebarOpened,
        toggleSidebar,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);

    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }

    return context;
};
