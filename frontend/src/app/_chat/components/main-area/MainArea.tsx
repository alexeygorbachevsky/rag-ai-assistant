"use client";

import { PropsWithChildren } from "react";
import joinClassNames from "classnames";

import { useAppContext } from "contexts/AppContext";

import styles from "./styles/styles.module.scss";

const MainArea = ({ children }: PropsWithChildren) => {
    const { isSidebarOpened } = useAppContext();

    return (
        <main className={joinClassNames(styles.mainArea, { [styles.mainAreaExpended]: !isSidebarOpened })}>
            {children}
        </main>
    );
};

export default MainArea;
