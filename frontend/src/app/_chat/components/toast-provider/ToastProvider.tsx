"use client";

import { ToastContainer } from "react-toastify";

const ToastProvider = () => (
    <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
    />
);

export default ToastProvider;
